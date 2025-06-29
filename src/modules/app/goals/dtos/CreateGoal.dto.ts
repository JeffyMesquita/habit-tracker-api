import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
	IsString,
	IsNotEmpty,
	IsInt,
	Min,
	IsDateString,
	IsOptional,
	MaxLength,
	IsIn,
	Max,
} from 'class-validator';

export class CreateGoalDTO {
	@ApiProperty({
		description: 'Type of goal (habit, streak, completion_rate, etc.)',
		example: 'habit_completion',
		enum: [
			'habit_completion',
			'streak_achievement',
			'weekly_consistency',
			'monthly_target',
			'habit_frequency',
			'total_days_active',
		],
	})
	@IsString()
	@IsNotEmpty()
	@IsIn([
		'habit_completion',
		'streak_achievement',
		'weekly_consistency',
		'monthly_target',
		'habit_frequency',
		'total_days_active',
	])
	goalType: string;

	@ApiProperty({
		description: 'Target value to achieve (depends on goal type)',
		example: 30,
		minimum: 1,
		maximum: 1000,
	})
	@IsInt()
	@Min(1)
	@Max(1000)
	targetValue: number;

	@ApiProperty({
		description: 'Start date of the goal (ISO 8601 format)',
		example: '2025-01-29',
	})
	@IsDateString()
	startDate: string;

	@ApiProperty({
		description: 'End date of the goal (ISO 8601 format)',
		example: '2025-02-28',
	})
	@IsDateString()
	endDate: string;

	@ApiProperty({
		description: 'Goal title/description (optional)',
		example: 'Complete 30 days of exercise habit',
		required: false,
		maxLength: 100,
	})
	@IsOptional()
	@IsString()
	@MaxLength(100)
	@Transform(({ value }) => value?.trim())
	title?: string;

	@ApiProperty({
		description: 'Goal description with more details (optional)',
		example: 'Challenge myself to exercise every day for a month',
		required: false,
		maxLength: 500,
	})
	@IsOptional()
	@IsString()
	@MaxLength(500)
	@Transform(({ value }) => value?.trim())
	description?: string;

	@ApiProperty({
		description: 'Specific habit ID if goal is habit-related (optional)',
		example: 'uuid-of-specific-habit',
		required: false,
	})
	@IsOptional()
	@IsString()
	habitId?: string;

	@ApiProperty({
		description: 'Priority level of the goal (1-5, where 5 is highest)',
		example: 3,
		minimum: 1,
		maximum: 5,
		required: false,
		default: 3,
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(5)
	priority?: number = 3;
}
