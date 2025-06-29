import { ApiProperty } from '@nestjs/swagger';
import {
	IsEnum,
	IsOptional,
	IsString,
	IsDateString,
	IsArray,
} from 'class-validator';

export enum ReportType {
	WEEKLY = 'weekly',
	MONTHLY = 'monthly',
	CUSTOM = 'custom',
	QUARTERLY = 'quarterly',
	YEARLY = 'yearly',
}

export enum ReportFormat {
	JSON = 'json',
	CSV = 'csv',
	PDF = 'pdf',
}

export class GenerateReportDTO {
	@ApiProperty({
		description: 'Tipo de relatório',
		enum: ReportType,
		example: ReportType.WEEKLY,
	})
	@IsEnum(ReportType)
	reportType: ReportType;

	@ApiProperty({
		description: 'Data de início (para relatórios customizados)',
		type: 'string',
		format: 'date',
		required: false,
		example: '2025-01-01',
	})
	@IsOptional()
	@IsDateString()
	startDate?: string;

	@ApiProperty({
		description: 'Data de fim (para relatórios customizados)',
		type: 'string',
		format: 'date',
		required: false,
		example: '2025-01-31',
	})
	@IsOptional()
	@IsDateString()
	endDate?: string;

	@ApiProperty({
		description: 'IDs específicos de hábitos para incluir no relatório',
		type: [String],
		required: false,
		example: ['habit-uuid-1', 'habit-uuid-2'],
	})
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	habitIds?: string[];

	@ApiProperty({
		description: 'Formato de saída do relatório',
		enum: ReportFormat,
		example: ReportFormat.JSON,
		required: false,
	})
	@IsOptional()
	@IsEnum(ReportFormat)
	format?: ReportFormat;

	@ApiProperty({
		description: 'Incluir gráficos no relatório',
		type: 'boolean',
		required: false,
		example: true,
	})
	@IsOptional()
	includeCharts?: boolean;

	@ApiProperty({
		description: 'Incluir conquistas no relatório',
		type: 'boolean',
		required: false,
		example: true,
	})
	@IsOptional()
	includeAchievements?: boolean;
}
