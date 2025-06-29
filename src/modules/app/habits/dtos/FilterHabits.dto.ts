import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum, IsBoolean } from 'class-validator';

export enum HabitFilterPeriod {
	TODAY = 'today',
	WEEK = 'week',
	MONTH = 'month',
	ALL = 'all',
}

export abstract class FilterHabitsDTO {
	@ApiProperty({
		example: 'today',
		description: 'Período para filtrar hábitos',
		enum: HabitFilterPeriod,
		required: false,
		default: 'all',
	})
	@IsOptional()
	@IsEnum(HabitFilterPeriod)
	period?: HabitFilterPeriod;

	@ApiProperty({
		example: '2024-12-29',
		description: 'Data específica para filtrar (formato YYYY-MM-DD)',
		required: false,
	})
	@IsOptional()
	@IsDateString()
	date?: string;

	@ApiProperty({
		example: true,
		description: 'Incluir progresso dos hábitos na resposta',
		required: false,
		default: false,
	})
	@IsOptional()
	@IsBoolean()
	includeProgress?: boolean;
}
