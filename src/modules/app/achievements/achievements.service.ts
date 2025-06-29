import {
	Injectable,
	NotFoundException,
	BadRequestException,
	ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { UnlockAchievementDTO } from '@/modules/app/achievements/dtos/UnlockAchievement.dto';
import { FilterAchievementsDTO } from '@/modules/app/achievements/dtos/FilterAchievements.dto';
import API_CODES from '@/misc/API/codes';
import dayjs from 'dayjs';

export interface AchievementData {
	id: string;
	userId: string;
	achievementType: string;
	timestamp: Date;
	details?: string;
	habitId?: string;
	goalId?: string;
}

export interface AchievementStats {
	totalUnlocked: number;
	recentAchievements: AchievementData[];
	categories: {
		habits: number;
		streaks: number;
		goals: number;
		consistency: number;
		milestones: number;
	};
}

@Injectable()
export class AchievementsService {
	constructor(private readonly prismaService: PrismaService) {}

	async unlock(userId: string, data: UnlockAchievementDTO) {
		// Check if achievement already unlocked
		const existingAchievement = await this.prismaService.achievements.findFirst(
			{
				where: {
					userId,
					achievementType: data.achievementType,
				},
			},
		);

		if (existingAchievement) {
			throw new ConflictException(API_CODES.error.ACHIEVEMENT_ALREADY_UNLOCKED);
		}

		// Validate conditions for achievement
		const isValid = await this.validateAchievementConditions(userId, data);
		if (!isValid) {
			throw new BadRequestException(
				API_CODES.error.ACHIEVEMENT_CONDITIONS_NOT_MET,
			);
		}

		try {
			const achievement = await this.prismaService.achievements.create({
				data: {
					userId,
					achievementType: data.achievementType,
					timestamp: new Date(),
					// Store additional data in details as JSON-like string
					details: JSON.stringify({
						description: data.details,
						habitId: data.habitId,
						goalId: data.goalId,
					}),
				},
			});

			// Log activity
			await this.logAchievementActivity(
				userId,
				data.achievementType,
				achievement.id,
			);

			return {
				message: API_CODES.success.ACHIEVEMENT_UNLOCKED,
				data: achievement,
			};
		} catch (error) {
			throw new BadRequestException(API_CODES.error.ACHIEVEMENT_UNLOCK_FAILED);
		}
	}

	async findAll(userId: string, filters: FilterAchievementsDTO) {
		const where: any = { userId };

		// Apply filters
		if (filters.achievementType) {
			where.achievementType = filters.achievementType;
		}

		if (filters.fromDate || filters.toDate) {
			where.timestamp = {};

			if (filters.fromDate) {
				where.timestamp.gte = dayjs(filters.fromDate).toDate();
			}

			if (filters.toDate) {
				where.timestamp.lte = dayjs(filters.toDate).toDate();
			}
		}

		const orderBy: any = {};
		orderBy[filters.sortBy || 'timestamp'] = filters.order || 'desc';

		const achievements = await this.prismaService.achievements.findMany({
			where,
			orderBy,
			skip: filters.offset || 0,
			take: filters.limit || 20,
		});

		// Parse details and enhance data
		const enhancedAchievements = achievements.map((achievement) => {
			let parsedDetails = {};
			try {
				parsedDetails = JSON.parse(achievement.details || '{}');
			} catch {
				parsedDetails = { description: achievement.details };
			}

			return {
				...achievement,
				...parsedDetails,
				metadata: this.getAchievementMetadata(achievement.achievementType),
			};
		});

		return {
			message: API_CODES.success.ACHIEVEMENTS_FOUND,
			data: enhancedAchievements,
			meta: {
				total: await this.prismaService.achievements.count({ where }),
				limit: filters.limit || 20,
				offset: filters.offset || 0,
			},
		};
	}

	async findOne(userId: string, achievementId: string) {
		const achievement = await this.prismaService.achievements.findFirst({
			where: { id: achievementId, userId },
		});

		if (!achievement) {
			throw new NotFoundException(API_CODES.error.ACHIEVEMENT_NOT_FOUND);
		}

		// Parse details and enhance data
		let parsedDetails = {};
		try {
			parsedDetails = JSON.parse(achievement.details || '{}');
		} catch {
			parsedDetails = { description: achievement.details };
		}

		const enhancedAchievement = {
			...achievement,
			...parsedDetails,
			metadata: this.getAchievementMetadata(achievement.achievementType),
		};

		return {
			message: API_CODES.success.ACHIEVEMENT_FOUND,
			data: enhancedAchievement,
		};
	}

	async getUserStats(
		userId: string,
	): Promise<{ message: string; data: AchievementStats }> {
		const achievements = await this.prismaService.achievements.findMany({
			where: { userId },
			orderBy: { timestamp: 'desc' },
		});

		const recentAchievements = achievements.slice(0, 5);

		// Categorize achievements
		const categories = {
			habits: 0,
			streaks: 0,
			goals: 0,
			consistency: 0,
			milestones: 0,
		};

		achievements.forEach((achievement) => {
			const type = achievement.achievementType;

			if (type.includes('streak')) categories.streaks++;
			else if (type.includes('habit')) categories.habits++;
			else if (type.includes('goal')) categories.goals++;
			else if (type.includes('consistency')) categories.consistency++;
			else categories.milestones++;
		});

		const stats: AchievementStats = {
			totalUnlocked: achievements.length,
			recentAchievements,
			categories,
		};

		return {
			message: API_CODES.success.USER_ACHIEVEMENTS_RETRIEVED,
			data: stats,
		};
	}

	// Auto-unlock achievements based on user activity
	async checkAndUnlockAchievements(
		userId: string,
		context: string,
		data?: any,
	) {
		const achievements = [];

		switch (context) {
			case 'habit_created':
				achievements.push(
					...(await this.checkHabitCreationAchievements(userId)),
				);
				break;

			case 'habit_progress':
				achievements.push(
					...(await this.checkProgressAchievements(userId, data)),
				);
				break;

			case 'streak_achieved':
				achievements.push(
					...(await this.checkStreakAchievements(userId, data)),
				);
				break;

			case 'goal_completed':
				achievements.push(...(await this.checkGoalAchievements(userId, data)));
				break;
		}

		// Unlock new achievements
		for (const achievement of achievements) {
			try {
				await this.unlock(userId, achievement);
			} catch (error) {
				// Achievement might already be unlocked, continue
			}
		}

		return achievements;
	}

	// New method for automatic integration with habits
	async handleProgressUpdate(
		userId: string,
		habitId: string,
		completedCount: number,
	) {
		try {
			// Check progress-based achievements
			await this.checkAndUnlockAchievements(userId, 'habit_progress', {
				habitId,
				completedCount,
			});

			// Check for streaks
			const currentStreak = await this.calculateCurrentStreak(userId, habitId);
			if (currentStreak > 0) {
				await this.checkAndUnlockAchievements(userId, 'streak_achieved', {
					habitId,
					streakLength: currentStreak,
				});
			}

			// Check consistency achievements
			await this.checkConsistencyAchievements(userId);
		} catch (error) {
			// Log error but don't fail the main operation
			console.error('Error in achievement processing:', error);
		}
	}

	async handleHabitCreation(userId: string, habitId: string) {
		try {
			await this.checkAndUnlockAchievements(userId, 'habit_created', {
				habitId,
			});
		} catch (error) {
			console.error('Error in habit creation achievement processing:', error);
		}
	}

	async handleGoalCompletion(userId: string, goalId: string) {
		try {
			await this.checkAndUnlockAchievements(userId, 'goal_completed', {
				goalId,
			});
		} catch (error) {
			console.error('Error in goal completion achievement processing:', error);
		}
	}

	private async calculateCurrentStreak(
		userId: string,
		habitId: string,
	): Promise<number> {
		const recentProgress = await this.prismaService.dailyHabitProgress.findMany(
			{
				where: {
					userId,
					habitId,
					completedCount: { gt: 0 },
				},
				orderBy: { date: 'desc' },
				take: 100, // Look at last 100 days max
			},
		);

		if (recentProgress.length === 0) return 0;

		let streak = 0;
		const today = dayjs().startOf('day');

		// Check if today or yesterday was completed (allow for flexibility)
		const lastCompletionDate = dayjs(recentProgress[0].date).startOf('day');
		const daysSinceLastCompletion = today.diff(lastCompletionDate, 'day');

		if (daysSinceLastCompletion > 1) {
			return 0; // Streak broken
		}

		// Count consecutive days
		let currentDate = lastCompletionDate;
		for (const progress of recentProgress) {
			const progressDate = dayjs(progress.date).startOf('day');

			if (progressDate.isSame(currentDate)) {
				streak++;
				currentDate = currentDate.subtract(1, 'day');
			} else {
				break;
			}
		}

		return streak;
	}

	private async checkConsistencyAchievements(userId: string) {
		const now = dayjs();
		const weekStart = now.startOf('week');
		const monthStart = now.startOf('month');

		// Check weekly consistency (5+ days completed this week)
		const weeklyProgress = await this.prismaService.dailyHabitProgress.count({
			where: {
				userId,
				completedCount: { gt: 0 },
				date: {
					gte: weekStart.toDate(),
					lte: now.toDate(),
				},
			},
		});

		if (weeklyProgress >= 5) {
			try {
				await this.unlock(userId, {
					achievementType: 'weekly_consistency',
					details: 'Maintained weekly consistency!',
				});
			} catch {
				// Already unlocked
			}
		}

		// Check monthly consistency (20+ days completed this month)
		const monthlyProgress = await this.prismaService.dailyHabitProgress.count({
			where: {
				userId,
				completedCount: { gt: 0 },
				date: {
					gte: monthStart.toDate(),
					lte: now.toDate(),
				},
			},
		});

		if (monthlyProgress >= 20) {
			try {
				await this.unlock(userId, {
					achievementType: 'monthly_consistency',
					details: 'Maintained monthly consistency!',
				});
			} catch {
				// Already unlocked
			}
		}
	}

	private async validateAchievementConditions(
		userId: string,
		data: UnlockAchievementDTO,
	): Promise<boolean> {
		const type = data.achievementType;

		switch (type) {
			case 'first_habit_created':
				return this.validateFirstHabitCreated(userId);

			case 'habit_streak_7':
			case 'habit_streak_30':
			case 'habit_streak_100':
				return this.validateStreakAchievement(userId, type);

			case 'habits_completed_10':
			case 'habits_completed_50':
			case 'habits_completed_100':
				return this.validateCompletionAchievement(userId, type);

			default:
				return true; // Allow manual unlocks for other types
		}
	}

	private async validateFirstHabitCreated(userId: string): Promise<boolean> {
		const habitCount = await this.prismaService.habit.count({
			where: { userId },
		});

		return habitCount >= 1;
	}

	private async validateStreakAchievement(
		userId: string,
		type: string,
	): Promise<boolean> {
		const targetDays = parseInt(type.split('_')[2]); // Extract number from type

		const longestStreak = await this.prismaService.habitStreak.findFirst({
			where: { userId },
			orderBy: { endDate: 'desc' },
		});

		if (!longestStreak) return false;

		const streakLength =
			dayjs(longestStreak.endDate).diff(longestStreak.startDate, 'day') + 1;
		return streakLength >= targetDays;
	}

	private async validateCompletionAchievement(
		userId: string,
		type: string,
	): Promise<boolean> {
		const targetCount = parseInt(type.split('_')[2]); // Extract number from type

		const completedCount = await this.prismaService.dailyHabitProgress.count({
			where: { userId },
		});

		return completedCount >= targetCount;
	}

	private async checkHabitCreationAchievements(userId: string) {
		const habitCount = await this.prismaService.habit.count({
			where: { userId },
		});

		const achievements = [];

		if (habitCount === 1) {
			achievements.push({
				achievementType: 'first_habit_created',
				details: 'Created your first habit!',
			});
		}

		return achievements;
	}

	private async checkProgressAchievements(userId: string, _data: any) {
		const completedCount = await this.prismaService.dailyHabitProgress.count({
			where: { userId },
		});

		const achievements = [];

		if (completedCount === 10) {
			achievements.push({
				achievementType: 'habits_completed_10',
				details: 'Completed 10 habit sessions!',
			});
		} else if (completedCount === 50) {
			achievements.push({
				achievementType: 'habits_completed_50',
				details: 'Completed 50 habit sessions!',
			});
		} else if (completedCount === 100) {
			achievements.push({
				achievementType: 'habits_completed_100',
				details: 'Completed 100 habit sessions!',
			});
		}

		return achievements;
	}

	private async checkStreakAchievements(userId: string, data: any) {
		const achievements = [];
		const streakLength = data?.streakLength || 0;

		if (streakLength === 7) {
			achievements.push({
				achievementType: 'habit_streak_7',
				details: 'Achieved a 7-day streak!',
				habitId: data?.habitId,
			});
		} else if (streakLength === 30) {
			achievements.push({
				achievementType: 'habit_streak_30',
				details: 'Achieved a 30-day streak!',
				habitId: data?.habitId,
			});
		} else if (streakLength === 100) {
			achievements.push({
				achievementType: 'habit_streak_100',
				details: 'Achieved a 100-day streak!',
				habitId: data?.habitId,
			});
		}

		return achievements;
	}

	private async checkGoalAchievements(userId: string, data: any) {
		const achievements = [];

		achievements.push({
			achievementType: 'goal_achiever',
			details: 'Completed your first goal!',
			goalId: data?.goalId,
		});

		return achievements;
	}

	private getAchievementMetadata(type: string) {
		const metadata: { [key: string]: any } = {
			first_habit_created: {
				title: 'Getting Started',
				description: 'Created your first habit',
				icon: '🌱',
				points: 10,
				rarity: 'common',
			},
			habit_streak_7: {
				title: 'Week Warrior',
				description: 'Maintained a 7-day streak',
				icon: '🔥',
				points: 25,
				rarity: 'common',
			},
			habit_streak_30: {
				title: 'Monthly Master',
				description: 'Maintained a 30-day streak',
				icon: '⭐',
				points: 100,
				rarity: 'rare',
			},
			habit_streak_100: {
				title: 'Centurion',
				description: 'Maintained a 100-day streak',
				icon: '👑',
				points: 500,
				rarity: 'legendary',
			},
			habits_completed_10: {
				title: 'Getting Into It',
				description: 'Completed 10 habit sessions',
				icon: '📈',
				points: 20,
				rarity: 'common',
			},
			habits_completed_50: {
				title: 'Habit Builder',
				description: 'Completed 50 habit sessions',
				icon: '🏗️',
				points: 75,
				rarity: 'uncommon',
			},
			habits_completed_100: {
				title: 'Century Club',
				description: 'Completed 100 habit sessions',
				icon: '💯',
				points: 200,
				rarity: 'rare',
			},
			weekly_consistency: {
				title: 'Consistent Performer',
				description: 'Maintained weekly consistency',
				icon: '📅',
				points: 50,
				rarity: 'uncommon',
			},
			monthly_consistency: {
				title: 'Reliable Rockstar',
				description: 'Maintained monthly consistency',
				icon: '📊',
				points: 150,
				rarity: 'rare',
			},
			goal_achiever: {
				title: 'Goal Getter',
				description: 'Completed your first goal',
				icon: '🎯',
				points: 75,
				rarity: 'uncommon',
			},
			perfectionist: {
				title: 'Perfectionist',
				description: 'Perfect completion rate for a month',
				icon: '✨',
				points: 300,
				rarity: 'epic',
			},
			early_adopter: {
				title: 'Early Adopter',
				description: 'One of the first users',
				icon: '🚀',
				points: 100,
				rarity: 'rare',
			},
		};

		return (
			metadata[type] || {
				title: 'Unknown Achievement',
				description: 'Special achievement',
				icon: '🏆',
				points: 0,
				rarity: 'common',
			}
		);
	}

	private async logAchievementActivity(
		userId: string,
		achievementType: string,
		achievementId: string,
	) {
		await this.prismaService.userActivityLog.create({
			data: {
				userId,
				activityType: 'achievement_unlocked',
				timestamp: new Date(),
				details: JSON.stringify({
					achievementType,
					achievementId,
				}),
			},
		});
	}
}
