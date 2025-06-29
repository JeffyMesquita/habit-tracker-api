import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsEnum, IsInt, Min } from 'class-validator';

export enum StreakType {
	CURRENT = 'current',
	LONGEST = 'longest',
	ALL = 'all',
}

export class StreaksFilterDTO {
	@ApiProperty({
		description: 'ID específico do hábito para analisar streaks',
		example: 'uuid-do-habito',
		required: false,
	})
	@IsOptional()
	@IsUUID()
	habitId?: string;

	@ApiProperty({
		description: 'Tipo de streak para retornar',
		enum: StreakType,
		example: StreakType.CURRENT,
		required: false,
	})
	@IsOptional()
	@IsEnum(StreakType)
	type?: StreakType = StreakType.ALL;

	@ApiProperty({
		description: 'Limite de resultados para retornar',
		example: 10,
		minimum: 1,
		required: false,
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	limit?: number = 10;

	@ApiProperty({
		description: 'Incluir apenas streaks ativos',
		example: true,
		required: false,
	})
	@IsOptional()
	includeActiveOnly?: boolean = false;
}
