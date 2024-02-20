import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class FilterEmailDTO {
	@IsString()
	@IsEmail()
	@MinLength(8)
	@MaxLength(255)
	email: string;
}
