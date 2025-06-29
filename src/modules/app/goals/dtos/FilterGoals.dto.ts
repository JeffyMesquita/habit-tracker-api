import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
	IsOptional,
	IsString,
	IsDateString,
	IsIn,
	IsInt,
	Min,
	Max,
} from 'class-validator';

export class FilterGoalsDTO {
	@ApiProperty({
		description: 'Filter by goal type',
		example: 'habit_completion',
		enum: [
			'habit_completion',
			'streak_achievement',
			'weekly_consistency',
			'monthly_target',
			'habit_frequency',
			'total_days_active',
		],
		required: false,
	})
	@IsOptional()
	@IsString()
	@IsIn([
		'habit_completion',
		'streak_achievement',
		'weekly_consistency',
		'monthly_target',
		'habit_frequency',
		'total_days_active',
	])
	goalType?: string;

	@ApiProperty({
		description: 'Filter by goal status',
		example: 'active',
		enum: ['active', 'completed', 'expired', 'all'],
		required: false,
		default: 'active',
	})
	@IsOptional()
	@IsString()
	@IsIn(['active', 'completed', 'expired', 'all'])
	status?: string = 'active';

	@ApiProperty({
		description: 'Filter goals starting from this date',
		example: '2025-01-01',
		required: false,
	})
	@IsOptional()
	@IsDateString()
	startDate?: string;

	@ApiProperty({
		description: 'Filter goals ending before this date',
		example: '2025-12-31',
		required: false,
	})
	@IsOptional()
	@IsDateString()
	endDate?: string;

	@ApiProperty({
		description: 'Filter by specific habit ID',
		example: 'uuid-of-habit',
		required: false,
	})
	@IsOptional()
	@IsString()
	habitId?: string;

	@ApiProperty({
		description: 'Filter by priority level',
		example: 5,
		minimum: 1,
		maximum: 5,
		required: false,
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(5)
	priority?: number;

	@ApiProperty({
		description: 'Number of goals to return',
		example: 10,
		minimum: 1,
		maximum: 100,
		required: false,
		default: 10,
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(100)
	@Transform(({ value }) => parseInt(value, 10))
	limit?: number = 10;

	@ApiProperty({
		description: 'Number of goals to skip (for pagination)',
		example: 0,
		minimum: 0,
		required: false,
		default: 0,
	})
	@IsOptional()
	@IsInt()
	@Min(0)
	@Transform(({ value }) => parseInt(value, 10))
	offset?: number = 0;

	@ApiProperty({
		description: 'Sort order',
		example: 'desc',
		enum: ['asc', 'desc'],
		required: false,
		default: 'desc',
	})
	@IsOptional()
	@IsString()
	@IsIn(['asc', 'desc'])
	order?: string = 'desc';

	@ApiProperty({
		description: 'Sort by field',
		example: 'endDate',
		enum: ['createdAt', 'startDate', 'endDate', 'priority', 'targetValue'],
		required: false,
		default: 'endDate',
	})
	@IsOptional()
	@IsString()
	@IsIn(['createdAt', 'startDate', 'endDate', 'priority', 'targetValue'])
	sortBy?: string = 'endDate';
}
