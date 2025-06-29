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

export class FilterAchievementsDTO {
	@ApiProperty({
		description: 'Filter by achievement type',
		example: 'habit_streak_7',
		enum: [
			'first_habit_created',
			'habit_streak_7',
			'habit_streak_30',
			'habit_streak_100',
			'habits_completed_10',
			'habits_completed_50',
			'habits_completed_100',
			'weekly_consistency',
			'monthly_consistency',
			'early_adopter',
			'goal_achiever',
			'perfectionist',
		],
		required: false,
	})
	@IsOptional()
	@IsString()
	@IsIn([
		'first_habit_created',
		'habit_streak_7',
		'habit_streak_30',
		'habit_streak_100',
		'habits_completed_10',
		'habits_completed_50',
		'habits_completed_100',
		'weekly_consistency',
		'monthly_consistency',
		'early_adopter',
		'goal_achiever',
		'perfectionist',
	])
	achievementType?: string;

	@ApiProperty({
		description: 'Filter achievements unlocked from this date',
		example: '2025-01-01',
		required: false,
	})
	@IsOptional()
	@IsDateString()
	fromDate?: string;

	@ApiProperty({
		description: 'Filter achievements unlocked before this date',
		example: '2025-12-31',
		required: false,
	})
	@IsOptional()
	@IsDateString()
	toDate?: string;

	@ApiProperty({
		description: 'Number of achievements to return',
		example: 20,
		minimum: 1,
		maximum: 100,
		required: false,
		default: 20,
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(100)
	@Transform(({ value }) => parseInt(value, 10))
	limit?: number = 20;

	@ApiProperty({
		description: 'Number of achievements to skip (for pagination)',
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
		example: 'timestamp',
		enum: ['timestamp', 'achievementType'],
		required: false,
		default: 'timestamp',
	})
	@IsOptional()
	@IsString()
	@IsIn(['timestamp', 'achievementType'])
	sortBy?: string = 'timestamp';
}
