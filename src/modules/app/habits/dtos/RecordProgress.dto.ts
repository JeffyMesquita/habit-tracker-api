import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, IsOptional, IsDateString } from 'class-validator';

export abstract class RecordProgressDTO {
	@ApiProperty({
		example: 2,
		description:
			'Quantidade completada do hábito no dia (ex: bebeu 2 copos de água)',
		default: 1,
	})
	@IsInt()
	@Min(0)
	completedCount: number;

	@ApiProperty({
		example: '2024-12-29',
		description:
			'Data do progresso (formato YYYY-MM-DD). Se não informado, usa data atual',
		required: false,
	})
	@IsOptional()
	@IsDateString()
	date?: string;
}
