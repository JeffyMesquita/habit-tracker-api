import { PrismaService } from '@/database/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateAccountDTO } from './dtos/CreateAccount.dto';
import API_CODES from '@/misc/API/codes';
import * as bcrypt from 'bcrypt';
import { ROLES } from '@/misc/enums/roles';
import dayjs from 'dayjs';

@Injectable()
export class UserService {
	constructor(private prisma: PrismaService) {}

	async create({ email, password }: CreateAccountDTO) {
		const userExists = await this.prisma.user.findFirst({
			where: {
				email,
			},
		});

		if (userExists) {
			throw new BadRequestException({
				message: 'Uma conta com este email já existe!',
				code: API_CODES.error.ACCOUNT_ALREADY_EXISTS,
			});
		}

		const hashedPassword = bcrypt.hashSync(password, 10);
		const role = await this.prisma.role.findUnique({
			where: {
				name: ROLES.USER,
			},
		});

		const newUser = await this.prisma.user.create({
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

		await this.prisma.premiumSubscription.create({
			data: {
				userId: newUser?.id,
				renewalDate: onMonthAfter,
				lastRenewal: today,
			},
		});

		return {
			message: 'Conta criada com sucesso!',
			code: API_CODES.success.ACCOUNT_CREATED_SUCCESSFULY,
		};
	}
}
