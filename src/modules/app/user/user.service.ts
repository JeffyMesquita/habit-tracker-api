import { PrismaService } from '@/database/prisma.service';
import { ResendEmailService } from '@/libs/resend/resend.service';
import API_CODES from '@/misc/API/codes';
import { ROLES } from '@/misc/enums/roles';
import { generateCode } from '@/misc/utils/generateCode';
import { generateTempPassword } from '@/misc/utils/generateTempPassword';
import {
	BadRequestException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import dayjs from 'dayjs';
import * as jwt from 'jsonwebtoken';
import { CreateAccountDTO } from './dtos/CreateAccount.dto';
import { JwtPayload } from '@/@types/JwtPayload';
import { FilterEmailDTO } from './dtos/FilterEmail.dto';
import { UpdateProfileDTO } from './dtos/UpdateProfile.dto';

@Injectable()
export class UserService {
	constructor(
		private prisma: PrismaService,
		private config: ConfigService,
		private resend: ResendEmailService,
	) {}

	async create({ email, password, firstName }: CreateAccountDTO) {
		const userExists = await this.prisma.user.findFirst({
			where: {
				email,
			},
		});

		const res = await this.prisma.$transaction(
			async (ctx) => {
				if (userExists) {
					throw new BadRequestException({
						message: 'Uma conta com este email já existe!',
						code: API_CODES.error.ACCOUNT_ALREADY_EXISTS,
					});
				}

				console.log(ROLES.USER);

				const hashedPassword = bcrypt.hashSync(password, 10);
				const role = await ctx.role.findUnique({
					where: {
						name: ROLES.USER,
					},
				});

				console.log(role);

				if (!role) {
					throw new BadRequestException({
						message: 'Role não encontrada!',
						code: API_CODES.error.ROLE_NOT_FOUND,
					});
				}

				const newUser = await ctx.user.create({
					data: {
						email,
						password: hashedPassword,
						role: {
							connect: {
								id: role.id,
							},
						},
					},
				});

				const today = dayjs().startOf('day').toDate();
				const onMonthAfter = dayjs().add(1, 'month').startOf('day').toDate();

				await ctx.premiumSubscription.create({
					data: {
						userId: newUser?.id,
						renewalDate: onMonthAfter,
						lastRenewal: today,
					},
				});

				await ctx.profile.create({
					data: {
						firstName,
						userId: newUser.id,
					},
				});

				const token = jwt.sign(
					{ userId: newUser.id },
					this.config.get('JWT_SEND_EMAIL_CODE'),
					{ expiresIn: '30m' },
				);

				const code = generateCode();
				const thirtyMinutes = dayjs().add(30, 'minutes').toDate();

				const confirmEmail = await ctx.confirmEmail.create({
					data: {
						userId: newUser.id,
						token,
						code,
						expiresAt: thirtyMinutes,
					},
				});

				await this.resend.sendEmailConfirmation({
					userEmail: newUser.email,
					code: confirmEmail.code,
				});

				return {
					message:
						'Conta criada com sucesso! Enviamos um email de confirmação para você!',
					code: API_CODES.success.ACCOUNT_CREATED_SUCCESSFULY,
					data: {
						token: confirmEmail.token,
					},
				};
			},
			{
				timeout: 30000,
			},
		);
		return res;
	}

	async confirmEmail(req: Request, code: string) {
		const token = req.headers['authorization'] as string;

		if (!token || !token.startsWith('Bearer ')) {
			throw new UnauthorizedException({
				message: 'Token não informado ou mal formatado!',
				code: API_CODES.error.INVALID_TOKEN,
			});
		}

		const userToken = token.split(' ')[1];

		let decoded: JwtPayload;
		try {
			decoded = jwt.verify(
				userToken,
				this.config.get('JWT_SEND_EMAIL_CODE'),
			) as JwtPayload;
		} catch (error: any) {
			console.error('Erro ao verificar JWT:', error?.name, error?.message);
			if (error?.name === 'TokenExpiredError') {
				throw new UnauthorizedException({
					message: 'Token expirado!',
					code: API_CODES.error.INVALID_TOKEN,
				});
			}
			throw new UnauthorizedException({
				message: 'Token inválido!',
				code: API_CODES.error.INVALID_TOKEN,
			});
		}

		const now = dayjs().toDate();

		const userConfirmEmail = await this.prisma.confirmEmail.findFirst({
			where: {
				userId: decoded.userId as string,
				expiresAt: {
					gte: now,
				},
			},
		});

		if (!userConfirmEmail) {
			throw new BadRequestException({
				message: 'Token inválido ou expirado!',
				code: API_CODES.error.INVALID_TOKEN,
			});
		}

		if (userConfirmEmail.code !== code) {
			const updatedUserConfirmEmail = await this.prisma.confirmEmail.update({
				where: {
					id: userConfirmEmail.id,
				},
				data: {
					attempts: {
						increment: 1,
					},
				},
			});

			if (updatedUserConfirmEmail.attempts > 3) {
				const token = jwt.sign(
					{ userId: userConfirmEmail.userId },
					this.config.get('JWT_SEND_EMAIL_CODE'),
					{ expiresIn: '30m' },
				);

				const code = generateCode();
				const thirtyMinutes = dayjs().add(30, 'minutes').toDate();

				await this.prisma.confirmEmail.update({
					where: {
						id: userConfirmEmail.id,
					},
					data: {
						token,
						code,
						expiresAt: thirtyMinutes,
						attempts: 0,
					},
				});

				const userInfo = await this.prisma.user.findFirst({
					where: {
						id: userConfirmEmail.userId,
					},
				});

				await this.resend.sendEmailConfirmation({
					userEmail: userInfo.email,
					code,
				});

				return {
					message: 'Código inválido! Enviamos um novo código para seu email!',
					code: API_CODES.error.WRONG_CODE,
					data: {
						token,
					},
				};
			}

			return {
				message: 'Código inválido!',
				code: API_CODES.error.WRONG_CODE,
				data: {
					attempts: updatedUserConfirmEmail.attempts,
				},
			};
		}

		await this.prisma.confirmEmail.delete({
			where: {
				id: userConfirmEmail.id,
			},
		});

		await this.prisma.user.update({
			where: {
				id: userConfirmEmail.userId,
			},
			data: {
				verified: true,
			},
		});

		return {
			message: 'Email confirmado com sucesso!',
			code: API_CODES.success.EMAIL_CONFIRMED,
			data: {
				confirmed: true,
			},
		};
	}

	async resendEmailConfirmation(email: string) {
		const user = await this.prisma.user.findFirst({
			where: {
				email,
			},
		});

		if (!user) {
			throw new BadRequestException({
				message: 'Usuário não encontrado!',
				code: API_CODES.error.USER_NOT_FOUND,
			});
		}

		const token = jwt.sign(
			{ userId: user.id },
			this.config.get('JWT_SEND_EMAIL_CODE'),
			{ expiresIn: '30m' },
		);

		const code = generateCode();
		const thirtyMinutes = dayjs().add(30, 'minutes').toDate();

		const confirmEmail = await this.prisma.confirmEmail.create({
			data: {
				userId: user.id,
				token,
				code,
				expiresAt: thirtyMinutes,
			},
		});

		await this.resend.sendEmailConfirmation({
			userEmail: user.email,
			code: confirmEmail.code,
		});

		return {
			message: 'Email de confirmação reenviado com sucesso!',
			code: API_CODES.success.EMAIL_RESENT,
			data: {
				token: confirmEmail.token,
			},
		};
	}

	async login(email: string, password: string) {
		const user = await this.prisma.user.findFirst({
			where: {
				email,
			},
		});

		if (!user) {
			throw new BadRequestException({
				message: 'Usuário não encontrado!',
				code: API_CODES.error.USER_NOT_FOUND,
			});
		}

		const passwordMatch = bcrypt.compareSync(password, user.password);

		if (!passwordMatch) {
			throw new BadRequestException({
				message: 'Credenciais inválidas!',
				code: API_CODES.error.INVALID_TOKEN,
			});
		}

		const token = jwt.sign(
			{ userId: user.id },
			this.config.get('JWT_ACCESS_TOKEN_SECRET'),
			{ expiresIn: '8h' },
		);

		const refreshToken = jwt.sign(
			{ userId: user.id },
			this.config.get('JWT_REFRESH_TOKEN_SECRET'),
			{ expiresIn: '7d' },
		);

		const created = dayjs().toDate();
		const expires = dayjs().add(7, 'days').toDate();

		await this.prisma.refreshToken.create({
			data: {
				userId: user.id,
				token: refreshToken,
				createdAt: created,
				expiresAt: expires,
			},
		});

		return {
			message: 'Logado com sucesso!',
			code: API_CODES.success.LOGGED_IN_SUCCESSFULY,
			data: {
				token,
				refreshToken,
				expires,
			},
		};
	}

	async forgotPassword(email: string) {
		const user = await this.prisma.user.findFirst({
			where: {
				email,
			},
		});

		if (!user) {
			throw new BadRequestException({
				message: 'Usuário não encontrado!',
				code: API_CODES.error.USER_NOT_FOUND,
			});
		}

		const token = jwt.sign(
			{ userId: user.id },
			this.config.get('JWT_FORGOT_PASSWORD'),
			{ expiresIn: '30m' },
		);

		const tempPassword = generateTempPassword();

		await this.resend.sendEmailForgotPassword({
			userEmail: user.email,
			tempPassword,
		});

		await this.prisma.resetPassword.create({
			data: {
				userId: user.id,
				email,
				tempPassword,
			},
		});

		return {
			message: 'Enviamos um email com as instruções para redefinir sua senha!',
			code: API_CODES.success.EMAIL_RESENT,
			data: {
				token,
			},
		};
	}

	async resetPassword(
		req: Request,
		email: string,
		tempPassword: string,
		newPassword: string,
	) {
		const token = req.headers['authorization'] as string;

		if (!token || !token.startsWith('Bearer ')) {
			throw new UnauthorizedException({
				message: 'Token não informado ou mal formatado!',
				code: API_CODES.error.INVALID_TOKEN,
			});
		}

		const userToken = token.split(' ')[1];

		let decoded: JwtPayload;
		try {
			decoded = jwt.verify(
				userToken,
				this.config.get('JWT_FORGOT_PASSWORD'),
			) as JwtPayload;
		} catch (error: any) {
			console.error('Erro ao verificar JWT:', error?.name, error?.message);
			if (error?.name === 'TokenExpiredError') {
				throw new UnauthorizedException({
					message: 'Token expirado!',
					code: API_CODES.error.INVALID_TOKEN,
				});
			}
			throw new UnauthorizedException({
				message: 'Token inválido!',
				code: API_CODES.error.INVALID_TOKEN,
			});
		}

		if (!decoded || !decoded.userId) {
			throw new UnauthorizedException({
				message: 'Token inválido!',
				code: API_CODES.error.INVALID_TOKEN,
			});
		}

		const user = await this.prisma.user.findFirst({
			where: {
				email,
			},
		});

		if (!user) {
			throw new BadRequestException({
				message: 'Email não encontrado!',
				code: API_CODES.error.USER_NOT_FOUND,
			});
		}

		const checkTempPassword = await this.prisma.resetPassword.findFirst({
			where: {
				userId: user.id,
				tempPassword,
			},
		});

		if (tempPassword !== checkTempPassword.tempPassword) {
			throw new BadRequestException({
				message: 'Código inválido!',
				code: API_CODES.error.INVALID_CODE,
			});
		}

		const userResetPassword = await this.prisma.resetPassword.findFirst({
			where: {
				userId: user.id,
				tempPassword,
			},
		});

		if (!userResetPassword) {
			throw new BadRequestException({
				message: 'Código inválido!',
				code: API_CODES.error.INVALID_CODE,
			});
		}

		const hashedPassword = bcrypt.hashSync(newPassword, 10);

		const updatedUserPassword = await this.prisma.$transaction(
			async (ctx) => {
				await ctx.resetPassword.delete({
					where: {
						id: userResetPassword.id,
					},
				});

				ctx.user.update({
					where: {
						id: user.id,
					},
					data: {
						password: hashedPassword,
					},
				});

				return {
					message: 'Senha redefinida com sucesso!',
					code: API_CODES.success.PASSWORD_RESETED,
				};
			},
			{
				timeout: 30000,
			},
		);

		return updatedUserPassword;
	}

	async me(req: Request) {
		const token = req.headers['authorization'] as string;

		if (!token || !token.startsWith('Bearer ')) {
			throw new UnauthorizedException({
				message: 'Token não informado ou mal formatado!',
				code: API_CODES.error.INVALID_TOKEN,
			});
		}

		const userToken = token.split(' ')[1];

		let decoded: JwtPayload;
		try {
			decoded = jwt.verify(
				userToken,
				this.config.get('JWT_ACCESS_TOKEN_SECRET'),
			) as JwtPayload;
		} catch (error: any) {
			console.error('Erro ao verificar JWT:', error?.name, error?.message);
			if (error?.name === 'TokenExpiredError') {
				throw new UnauthorizedException({
					message: 'Token expirado!',
					code: API_CODES.error.INVALID_TOKEN,
				});
			}
			throw new UnauthorizedException({
				message: 'Token inválido!',
				code: API_CODES.error.INVALID_TOKEN,
			});
		}

		if (!decoded || !decoded.userId) {
			throw new BadRequestException({
				message: 'Token inválido!',
				code: API_CODES.error.UNAUTHORIZED_ACCESS_TOKEN,
			});
		}

		const user = await this.prisma.user.findFirst({
			where: {
				id: decoded.userId as string,
			},
		});

		const userProfile = await this.prisma.profile.findFirst({
			where: {
				userId: user.id,
			},
		});

		return {
			message: 'Usuário encontrado!',
			code: API_CODES.success.USER_FOUND,
			data: {
				user: {
					...user,
					password: undefined,
				},
				profile: userProfile,
			},
		};
	}

	async logout(req: Request) {
		const token = req.headers['authorization'] as string;

		if (!token || !token.startsWith('Bearer ')) {
			throw new UnauthorizedException({
				message: 'Token não informado ou mal formatado!',
				code: API_CODES.error.INVALID_TOKEN,
			});
		}

		const userToken = token.split(' ')[1];

		let decoded: JwtPayload;
		try {
			decoded = jwt.verify(
				userToken,
				this.config.get('JWT_ACCESS_TOKEN_SECRET'),
			) as JwtPayload;
		} catch (error: any) {
			console.error('Erro ao verificar JWT:', error?.name, error?.message);
			if (error?.name === 'TokenExpiredError') {
				throw new UnauthorizedException({
					message: 'Token expirado!',
					code: API_CODES.error.INVALID_TOKEN,
				});
			}
			throw new UnauthorizedException({
				message: 'Token inválido!',
				code: API_CODES.error.INVALID_TOKEN,
			});
		}

		const user = await this.prisma.user.findFirst({
			where: {
				id: decoded.userId as string,
			},
		});

		if (!user) {
			throw new BadRequestException({
				message: 'Usuário não encontrado!',
				code: API_CODES.error.USER_NOT_FOUND,
			});
		}

		return {
			message: 'Usuário deslogado com sucesso!',
			code: API_CODES.success.LOGGED_OUT_SUCCESSFULY,
		};
	}

	async refreshToken(refreshToken: string) {
		const findToken = await this.prisma.refreshToken.findFirst({
			where: {
				token: refreshToken,
			},
		});

		if (!findToken) {
			throw new BadRequestException({
				message: 'Token inválido!',
				code: API_CODES.error.INVALID_TOKEN,
			});
		}

		const now = dayjs().toDate();

		if (now > findToken.expiresAt) {
			throw new UnauthorizedException({
				message: 'Token expirado!',
				code: API_CODES.error.EXPIRED_TOKEN,
			});
		}

		const user = await this.prisma.user.findFirst({
			where: {
				id: findToken.userId,
			},
		});

		if (!user) {
			throw new BadRequestException({
				message: 'Usuário não encontrado!',
				code: API_CODES.error.USER_NOT_FOUND,
			});
		}

		const token = jwt.sign(
			{ userId: user.id },
			this.config.get('JWT_ACCESS_TOKEN_SECRET'),
			{ expiresIn: '8h' },
		);

		const newRefreshToken = jwt.sign(
			{ userId: user.id },
			this.config.get('JWT_REFRESH_TOKEN_SECRET'),
			{ expiresIn: '7d' },
		);

		const created = dayjs().toDate();
		const expires = dayjs().add(7, 'days').toDate();

		await this.prisma.refreshToken.update({
			where: {
				id: findToken.id,
			},
			data: {
				token: newRefreshToken,
				createdAt: created,
				expiresAt: expires,
			},
		});

		return {
			message: 'Token atualizado com sucesso!',
			code: API_CODES.success.TOKEN_REFRESHED,
			data: {
				token,
				refreshToken: newRefreshToken,
				expires,
			},
		};
	}

	async emailAvailable(emailToValidate: FilterEmailDTO) {
		const { email } = emailToValidate;

		const user = await this.prisma.user.findFirst({
			where: {
				email,
			},
		});

		if (user) {
			return {
				message: 'Email já cadastrado!',
				isAvailable: false,
			};
		}

		return {
			message: 'Email disponível!',
			isAvailable: true,
		};
	}

	async updateProfile(req: Request, body: UpdateProfileDTO) {
		const token = req.headers['authorization'] as string;

		if (!token || !token.startsWith('Bearer ')) {
			throw new UnauthorizedException({
				message: 'Token não informado ou mal formatado!',
				code: API_CODES.error.INVALID_TOKEN,
			});
		}

		const userToken = token.split(' ')[1];

		let decoded: JwtPayload;
		try {
			decoded = jwt.verify(
				userToken,
				this.config.get('JWT_ACCESS_TOKEN_SECRET'),
			) as JwtPayload;
		} catch (error: any) {
			console.error('Erro ao verificar JWT:', error?.name, error?.message);
			if (error?.name === 'TokenExpiredError') {
				throw new UnauthorizedException({
					message: 'Token expirado!',
					code: API_CODES.error.INVALID_TOKEN,
				});
			}
			throw new UnauthorizedException({
				message: 'Token inválido!',
				code: API_CODES.error.INVALID_TOKEN,
			});
		}

		if (!decoded || !decoded.userId) {
			throw new BadRequestException({
				message: 'Token inválido!',
				code: API_CODES.error.INVALID_TOKEN,
			});
		}

		const existingProfile = await this.prisma.profile.findFirst({
			where: {
				userId: decoded.userId as string,
			},
		});

		if (!existingProfile) {
			throw new BadRequestException({
				message: 'Perfil não encontrado!',
				code: API_CODES.error.PROFILE_NOT_FOUND,
			});
		}

		const updatedProfile = await this.prisma.profile.update({
			where: {
				id: existingProfile.id,
			},
			data: {
				firstName: body.firstName,
				lastName: body.lastName,
				avatarUrl: body.avatarUrl,
				bio: body.bio,
				occupation: body.occupation,
				birthdate: body.birthdate ? new Date(body.birthdate) : null,
				updatedAt: new Date(),
			},
		});

		return {
			message: 'Perfil atualizado com sucesso!',
			code: API_CODES.success.PROFILE_UPDATED_SUCCESSFULLY,
			data: {
				profile: updatedProfile,
			},
		};
	}
}
