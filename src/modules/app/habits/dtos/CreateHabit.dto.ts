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

export abstract class CreateHabitDTO {
	@ApiProperty({
		example: 'Beber 2L de água',
		description: 'Título único do hábito',
	})
	@IsString()
	title: string;

	@ApiProperty({
		example: 1,
		description: 'Frequência diária do hábito (quantas vezes por dia)',
		required: false,
		default: 1,
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(10)
	frequency?: number;

	@ApiProperty({
		example: [1, 2, 3, 4, 5],
		description: 'Dias da semana (0=domingo, 1=segunda, ..., 6=sábado)',
		type: [Number],
	})
	@IsArray()
	@IsInt({ each: true })
	@Min(0, { each: true })
	@Max(6, { each: true })
	@ArrayUnique()
	weekDays: number[];

	@ApiProperty({
		example: '08:00',
		description: 'Horário sugerido para o hábito (formato HH:mm)',
		required: false,
	})
	@IsOptional()
	@IsString()
	moment?: string;
}
