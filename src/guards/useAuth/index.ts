import { PrismaService } from '@database/prisma.service';
import API_CODES from '@misc/API/codes';
import {
	Injectable,
	CanActivate,
	ExecutionContext,
	UnauthorizedException,
	BadRequestException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class UseAuth implements CanActivate {
	constructor(private readonly prisma: PrismaService) {}
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const token = this.getToken(request);
		if (!token) {
			throw new UnauthorizedException({
				message: 'Você precisa estar logado para acessar este conteúdo.',
				code: API_CODES.error.UNAUTHORIZED_ACCESS_TOKEN,
			});
		}

		try {
			const verify = jwt.verify(
				token,
				process.env.JWT_ACCESS_TOKEN_SECRET,
				{},
			) as jwt.JwtPayload;
			if (!verify) {
				throw new UnauthorizedException({
					message: 'Credenciais de acesso incorretas.',
					code: API_CODES.error.UNAUTHORIZED_ACCESS_TOKEN,
				});
			}

			const user = await this.prisma.user.findUnique({
				where: {
					id: verify.subject,
				},
			});

			request.token = verify;
			request.user = user;

			return !!user;
		} catch (err) {
			if (err.name === 'TokenExpiredError') {
				throw new UnauthorizedException({
					message: 'Credenciais de acesso expiradas.',
					code: API_CODES.error.EXPIRED_ACCESS_TOKEN,
				});
			}

			throw new BadRequestException();
		}
	}

	getToken(request: Request): string | undefined {
		const [type, token] = request.headers['authorization']?.split(' ') ?? [];
		return type === 'Bearer' ? token : undefined;
	}
}
