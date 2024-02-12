import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateAccountDTO } from './dtos/CreateAccount.dto';

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
	async login(@Body() { email, password }: CreateAccountDTO) {
		return this.userService.login(email, password);
	}
}
