import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export abstract class UserLoginDTO {
	@ApiProperty({ example: 'johndoe@email.com' })
	@IsString()
	email: string;

	@ApiProperty({ example: 'password' })
	@IsString()
	password: string;
}
