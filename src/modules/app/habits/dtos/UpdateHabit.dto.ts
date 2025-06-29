import { ApiProperty } from '@nestjs/swagger';
import {
	IsString,
	IsArray,
	IsOptional,
	IsInt,
	Min,
	Max,
	ArrayUnique,
} from 'class-validator';

export abstract class UpdateHabitDTO {
	@ApiProperty({
		example: 'Beber 3L de água',
		description: 'Novo título do hábito',
		required: false,
	})
	@IsOptional()
	@IsString()
	title?: string;

	@ApiProperty({
		example: 2,
		description: 'Nova frequência diária do hábito',
		required: false,
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(10)
	frequency?: number;

	@ApiProperty({
		example: [1, 2, 3, 4, 5, 6],
		description: 'Novos dias da semana (0=domingo, 1=segunda, ..., 6=sábado)',
		type: [Number],
		required: false,
	})
	@IsOptional()
	@IsArray()
	@IsInt({ each: true })
	@Min(0, { each: true })
	@Max(6, { each: true })
	@ArrayUnique()
	weekDays?: number[];

	@ApiProperty({
		example: '09:00',
		description: 'Novo horário sugerido para o hábito (formato HH:mm)',
		required: false,
	})
	@IsOptional()
	@IsString()
	moment?: string;
}
