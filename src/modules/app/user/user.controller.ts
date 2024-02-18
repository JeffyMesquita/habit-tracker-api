import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateAccountDTO } from './dtos/CreateAccount.dto';
import { UserLoginDTO } from './dtos/UserLogin.dto';
import { UserService } from './user.service';
// import { UpdateProfileDTO } from './dtos/UpdateProfile.dto';

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
	async confirmEmail(@Body() { code }: { code: string }) {
		return this.userService.confirmEmail(code);
	}

	@Post('/resend-email')
	async resendEmail(@Body() { email }: { email: string }) {
		return this.userService.resendEmailConfirmation(email);
	}

	@Post('/login')
	async login(@Body() { email, password }: UserLoginDTO) {
		return this.userService.login(email, password);
	}

	@ApiBearerAuth()
	@Get('/me')
	async me(@Req() req: Request) {
		return this.userService.me(req);
	}

	@ApiBearerAuth()
	@Get('/logout')
	async logout(@Req() req: Request) {
		return this.userService.logout(req);
	}

	// @ApiBearerAuth()
	// @Patch('/profile/:id')
	// async updateProfile(@Req() req: Request, @Body() body: UpdateProfileDTO) {
	// 	return this.userService.updateProfile(req, body);
	// }
}
