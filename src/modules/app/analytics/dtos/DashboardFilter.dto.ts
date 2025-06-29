import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString, IsBoolean } from 'class-validator';

export enum AnalyticsPeriod {
	WEEK = 'week',
	MONTH = 'month',
	QUARTER = 'quarter',
	YEAR = 'year',
	ALL = 'all',
}

export class DashboardFilterDTO {
	@ApiProperty({
		description: 'Período para análise dos dados',
		enum: AnalyticsPeriod,
		example: AnalyticsPeriod.MONTH,
		required: false,
	})
	@IsOptional()
	@IsEnum(AnalyticsPeriod)
	period?: AnalyticsPeriod = AnalyticsPeriod.MONTH;

	@ApiProperty({
		description: 'Data de início para análise customizada (YYYY-MM-DD)',
		example: '2024-01-01',
		required: false,
	})
	@IsOptional()
	@IsDateString()
	startDate?: string;

	@ApiProperty({
		description: 'Data de fim para análise customizada (YYYY-MM-DD)',
		example: '2024-12-31',
		required: false,
	})
	@IsOptional()
	@IsDateString()
	endDate?: string;

	@ApiProperty({
		description: 'Incluir dados detalhados por hábito',
		example: true,
		required: false,
	})
	@IsOptional()
	@IsBoolean()
	includeHabitDetails?: boolean = true;

	@ApiProperty({
		description: 'Incluir dados de tendências',
		example: true,
		required: false,
	})
	@IsOptional()
	@IsBoolean()
	includeTrends?: boolean = false;
}
