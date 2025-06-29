import { Body, Controller, Get, Post, Put, Req, Query } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiTags,
	ApiQuery,
	ApiOperation,
	ApiResponse,
} from '@nestjs/swagger';
import { Auth } from '@/guards/useAuth';
import { CreateAccountDTO } from './dtos/CreateAccount.dto';
import { UserLoginDTO } from './dtos/UserLogin.dto';
import { UserService } from './user.service';
import { FilterEmailDTO } from './dtos/FilterEmail.dto';
import { UpdateProfileDTO } from './dtos/UpdateProfile.dto';

@ApiTags('Authentications')
@Controller('/app/user')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Post('/register')
	async create(@Body() createAccount: CreateAccountDTO) {
		return this.userService.create(createAccount);
	}

	@ApiBearerAuth()
	@Post('/confirm-email')
	async confirmEmail(@Req() req: Request, @Body() { code }: { code: string }) {
		return this.userService.confirmEmail(req, code);
	}

	@Post('/resend-email')
	async resendEmail(@Body() { email }: { email: string }) {
		return this.userService.resendEmailConfirmation(email);
	}

	@Post('/login')
	async login(@Body() { email, password }: UserLoginDTO) {
		return this.userService.login(email, password);
	}

	@Post('/forgot-password')
	async forgotPassword(@Body() { email }: { email: string }) {
		return this.userService.forgotPassword(email);
	}

	@ApiBearerAuth()
	@Post('/reset-password')
	async resetPassword(
		@Req() req: Request,
		@Body()
		{
			email,
			tempPassword,
			newPassword,
		}: {
			email: string;
			tempPassword: string;
			newPassword: string;
		},
	) {
		return this.userService.resetPassword(
			req,
			email,
			tempPassword,
			newPassword,
		);
	}

	@ApiBearerAuth()
	@Auth()
	@Get('/me')
	async me(@Req() req: Request) {
		return this.userService.me(req);
	}

	@ApiBearerAuth()
	@Auth()
	@Get('/logout')
	async logout(@Req() req: Request) {
		return this.userService.logout(req);
	}

	@Post('/refresh-token')
	async refreshToken(@Body() { refreshToken }: { refreshToken: string }) {
		return this.userService.refreshToken(refreshToken);
	}

	@ApiQuery({ name: 'email', required: true })
	@Get('/email-available')
	async emailAvailable(@Query() email: FilterEmailDTO) {
		return this.userService.emailAvailable(email);
	}

	@ApiBearerAuth()
	@Auth()
	@Put('/profile')
	@ApiOperation({
		summary: 'Atualizar perfil do usuário',
		description: 'Atualiza as informações do perfil do usuário autenticado',
	})
	@ApiResponse({
		status: 200,
		description: 'Perfil atualizado com sucesso',
	})
	@ApiResponse({
		status: 404,
		description: 'Perfil não encontrado',
	})
	@ApiResponse({
		status: 401,
		description: 'Token inválido ou ausente',
	})
	async updateProfile(@Req() req: Request, @Body() body: UpdateProfileDTO) {
		return this.userService.updateProfile(req, body);
	}
}
