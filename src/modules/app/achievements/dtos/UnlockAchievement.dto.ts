import { ApiProperty } from '@nestjs/swagger';
import {
	IsString,
	IsNotEmpty,
	IsIn,
	IsOptional,
	MaxLength,
} from 'class-validator';

export class UnlockAchievementDTO {
	@ApiProperty({
		description: 'Type of achievement to unlock',
		example: 'first_habit_created',
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
	})
	@IsString()
	@IsNotEmpty()
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
	achievementType: string;

	@ApiProperty({
		description: 'Optional details about the achievement unlock',
		example: 'Achieved 7-day streak on Exercise habit',
		required: false,
		maxLength: 200,
	})
	@IsOptional()
	@IsString()
	@MaxLength(200)
	details?: string;

	@ApiProperty({
		description: 'Related habit ID if applicable',
		example: 'uuid-of-habit',
		required: false,
	})
	@IsOptional()
	@IsString()
	habitId?: string;

	@ApiProperty({
		description: 'Related goal ID if applicable',
		example: 'uuid-of-goal',
		required: false,
	})
	@IsOptional()
	@IsString()
	goalId?: string;
}
