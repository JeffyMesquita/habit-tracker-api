import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
}
