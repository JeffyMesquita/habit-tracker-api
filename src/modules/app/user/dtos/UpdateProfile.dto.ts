import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString } from 'class-validator';

export abstract class UpdateProfileDTO {
	@ApiProperty({ example: 'John' })
	@IsString()
	firstName: string;

	@ApiProperty({ example: 'Doe' })
	@IsString()
	lastName: string;

	@ApiProperty({ example: 'https://www.example.com/image.jpg' })
	@IsString()
	avatarUrl: string;

	@ApiProperty({ example: 'Some description of me' })
	@IsString()
	bio: string;

	@ApiProperty({ example: 'Student' })
	@IsString()
	occupation: string;

	@ApiProperty({ example: '19/12¹1987' })
	@IsDateString()
	birthdate: string;
}
