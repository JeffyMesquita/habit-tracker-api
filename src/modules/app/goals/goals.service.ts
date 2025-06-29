import { PrismaService } from '@/database/prisma.service';
import API_CODES from '@/misc/API/codes';
import { AchievementsService } from '@/modules/app/achievements/achievements.service';
import { CreateGoalDTO } from '@/modules/app/goals/dtos/CreateGoal.dto';
import { FilterGoalsDTO } from '@/modules/app/goals/dtos/FilterGoals.dto';
import { UpdateGoalDTO } from '@/modules/app/goals/dtos/UpdateGoal.dto';
import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import dayjs from 'dayjs';

export interface GoalProgress {
	goalId: string;
	currentValue: number;
	targetValue: number;
	progress: number;
	status: 'active' | 'completed' | 'expired';
	daysRemaining: number;
	completionDate?: Date;
}

export interface GoalWithProgress {
	id: string;
	goalType: string;
	targetValue: number;
	startDate: Date;
	endDate: Date;
	title?: string;
	description?: string;
	habitId?: string;
	priority: number;
	createdAt: Date;
	updatedAt: Date;
	progress: GoalProgress;
}

@Injectable()
export class GoalsService {
	constructor(
		private readonly prismaService: PrismaService,
		private readonly achievementsService: AchievementsService,
	) {}

	async create(userId: string, data: CreateGoalDTO) {
		// Validate dates
		const startDate = dayjs(data.startDate);
		const endDate = dayjs(data.endDate);

		if (endDate.isBefore(startDate)) {
			throw new BadRequestException(API_CODES.error.GOAL_DATE_CONFLICT);
		}

		if (startDate.isBefore(dayjs().startOf('day'))) {
			throw new BadRequestException(API_CODES.error.GOAL_DATE_CONFLICT);
		}

		// Validate habit exists if habitId provided
		if (data.habitId) {
			const habit = await this.prismaService.habit.findFirst({
				where: { id: data.habitId, userId },
			});

			if (!habit) {
				throw new NotFoundException(API_CODES.error.HABIT_NOT_FOUND);
			}
		}

		// Check for conflicting goals of same type in same period
		const conflictingGoal = await this.prismaService.userGoals.findFirst({
			where: {
				userId,
				goalType: data.goalType,
				OR: [
					{
						startDate: { lte: endDate.toDate() },
						endDate: { gte: startDate.toDate() },
					},
				],
			},
		});

		if (conflictingGoal) {
			throw new ConflictException(API_CODES.error.GOAL_ALREADY_EXISTS);
		}

		try {
			const goal = await this.prismaService.userGoals.create({
				data: {
					userId,
					goalType: data.goalType,
					targetValue: data.targetValue,
					startDate: startDate.toDate(),
					endDate: endDate.toDate(),
					// Store additional data in a JSON-like structure
					...{
						title: data.title,
						description: data.description,
						habitId: data.habitId,
						priority: data.priority || 3,
					},
				},
			});

			return {
				message: API_CODES.success.GOAL_CREATED_SUCCESSFULLY,
				data: goal,
			};
		} catch (error) {
			throw new BadRequestException(API_CODES.error.GOAL_CREATION_FAILED);
		}
	}

	async findAll(userId: string, filters: FilterGoalsDTO) {
		const where: any = { userId };

		// Apply filters
		if (filters.goalType) {
			where.goalType = filters.goalType;
		}

		if (filters.startDate || filters.endDate) {
			where.AND = [];

			if (filters.startDate) {
				where.AND.push({
					startDate: { gte: dayjs(filters.startDate).toDate() },
				});
			}

			if (filters.endDate) {
				where.AND.push({
					endDate: { lte: dayjs(filters.endDate).toDate() },
				});
			}
		}

		// Status filter
		const now = dayjs();
		if (filters.status && filters.status !== 'all') {
			switch (filters.status) {
				case 'active':
					where.endDate = { gte: now.toDate() };
					break;
				case 'expired':
					where.endDate = { lt: now.toDate() };
					break;
			}
		}

		const orderBy: any = {};
		orderBy[filters.sortBy || 'endDate'] = filters.order || 'desc';

		const goals = await this.prismaService.userGoals.findMany({
			where,
			orderBy,
			skip: filters.offset || 0,
			take: filters.limit || 10,
		});

		// Calculate progress for each goal
		const goalsWithProgress = await Promise.all(
			goals.map(async (goal) => {
				const progress = await this.calculateGoalProgress(userId, goal);
				return {
					...goal,
					progress,
				};
			}),
		);

		return {
			message: API_CODES.success.GOALS_FOUND,
			data: goalsWithProgress,
			meta: {
				total: await this.prismaService.userGoals.count({ where }),
				limit: filters.limit || 10,
				offset: filters.offset || 0,
			},
		};
	}

	async findOne(
		userId: string,
		goalId: string,
	): Promise<{ message: string; data: any }> {
		const goal = await this.prismaService.userGoals.findFirst({
			where: { id: goalId, userId },
		});

		if (!goal) {
			throw new NotFoundException(API_CODES.error.GOAL_NOT_FOUND);
		}

		const progress = await this.calculateGoalProgress(userId, goal);

		return {
			message: API_CODES.success.GOAL_FOUND,
			data: {
				...goal,
				progress,
			},
		};
	}

	async update(userId: string, goalId: string, data: UpdateGoalDTO) {
		const goal = await this.prismaService.userGoals.findFirst({
			where: { id: goalId, userId },
		});

		if (!goal) {
			throw new NotFoundException(API_CODES.error.GOAL_NOT_FOUND);
		}

		// Validate dates if provided
		if (data.startDate || data.endDate) {
			const startDate = dayjs(data.startDate || goal.startDate);
			const endDate = dayjs(data.endDate || goal.endDate);

			if (endDate.isBefore(startDate)) {
				throw new BadRequestException(API_CODES.error.GOAL_DATE_CONFLICT);
			}
		}

		// Validate habit exists if habitId provided
		if (data.habitId) {
			const habit = await this.prismaService.habit.findFirst({
				where: { id: data.habitId, userId },
			});

			if (!habit) {
				throw new NotFoundException(API_CODES.error.HABIT_NOT_FOUND);
			}
		}

		try {
			const updateData: any = {};

			if (data.goalType) updateData.goalType = data.goalType;
			if (data.targetValue) updateData.targetValue = data.targetValue;
			if (data.startDate) updateData.startDate = dayjs(data.startDate).toDate();
			if (data.endDate) updateData.endDate = dayjs(data.endDate).toDate();

			const updatedGoal = await this.prismaService.userGoals.update({
				where: { id: goalId },
				data: updateData,
			});

			return {
				message: API_CODES.success.GOAL_UPDATED_SUCCESSFULLY,
				data: updatedGoal,
			};
		} catch (error) {
			throw new BadRequestException(API_CODES.error.GOAL_UPDATE_FAILED);
		}
	}

	async remove(userId: string, goalId: string) {
		const goal = await this.prismaService.userGoals.findFirst({
			where: { id: goalId, userId },
		});

		if (!goal) {
			throw new NotFoundException(API_CODES.error.GOAL_NOT_FOUND);
		}

		try {
			await this.prismaService.userGoals.delete({
				where: { id: goalId },
			});

			return {
				message: API_CODES.success.GOAL_DELETED_SUCCESSFULLY,
			};
		} catch (error) {
			throw new BadRequestException(API_CODES.error.GOAL_DELETION_FAILED);
		}
	}

	async getProgress(userId: string, goalId: string) {
		const goal = await this.prismaService.userGoals.findFirst({
			where: { id: goalId, userId },
		});

		if (!goal) {
			throw new NotFoundException(API_CODES.error.GOAL_NOT_FOUND);
		}

		const progress = await this.calculateGoalProgress(userId, goal);

		return {
			message: API_CODES.success.GOAL_PROGRESS_RETRIEVED,
			data: progress,
		};
	}

	private async calculateGoalProgress(
		userId: string,
		goal: any,
	): Promise<GoalProgress> {
		const now = dayjs();
		const startDate = dayjs(goal.startDate);
		const endDate = dayjs(goal.endDate);

		let currentValue = 0;
		let status: 'active' | 'completed' | 'expired' = 'active';

		// Determine if goal is expired
		if (now.isAfter(endDate)) {
			status = 'expired';
		}

		// Calculate current value based on goal type
		switch (goal.goalType) {
			case 'habit_completion':
				currentValue = await this.calculateHabitCompletionProgress(
					userId,
					goal.habitId,
					startDate,
					endDate,
				);
				break;

			case 'streak_achievement':
				currentValue = await this.calculateStreakProgress(userId);
				break;

			case 'weekly_consistency':
				currentValue = await this.calculateWeeklyConsistency(
					userId,
					goal.habitId,
					startDate,
					endDate,
				);
				break;

			case 'monthly_target':
				currentValue = await this.calculateMonthlyTarget(
					userId,
					goal.habitId,
					startDate,
					endDate,
				);
				break;

			case 'total_days_active':
				currentValue = await this.calculateTotalDaysActive(
					userId,
					startDate,
					endDate,
				);
				break;

			default:
				currentValue = 0;
		}

		// Calculate progress percentage
		const progress = Math.min((currentValue / goal.targetValue) * 100, 100);

		// Check if goal was previously completed
		if (goal.completedAt) {
			status = 'completed';
		} else if (currentValue >= goal.targetValue && status !== 'expired') {
			status = 'completed';
		}

		// Calculate days remaining
		const daysRemaining = Math.max(0, endDate.diff(now, 'day'));

		return {
			goalId: goal.id,
			currentValue,
			targetValue: goal.targetValue,
			progress: Math.round(progress * 100) / 100, // Round to 2 decimal places
			status,
			daysRemaining,
			completionDate:
				goal.completedAt || (status === 'completed' ? new Date() : undefined),
		};
	}

	private async calculateHabitCompletionProgress(
		userId: string,
		habitId: string | undefined,
		startDate: dayjs.Dayjs,
		endDate: dayjs.Dayjs,
	): Promise<number> {
		const where: any = {
			userId,
			date: {
				gte: startDate.toDate(),
				lte: endDate.toDate(),
			},
		};

		if (habitId) {
			where.habitId = habitId;
		}

		const completedDays = await this.prismaService.dailyHabitProgress.count({
			where,
		});

		return completedDays;
	}

	private async calculateStreakProgress(userId: string): Promise<number> {
		// This would require more complex streak calculation
		// For now, return a placeholder
		const streaks = await this.prismaService.habitStreak.findMany({
			where: { userId },
			orderBy: { endDate: 'desc' },
			take: 1,
		});

		return streaks.length > 0
			? dayjs(streaks[0].endDate).diff(streaks[0].startDate, 'day') + 1
			: 0;
	}

	private async calculateWeeklyConsistency(
		userId: string,
		habitId: string | undefined,
		startDate: dayjs.Dayjs,
		endDate: dayjs.Dayjs,
	): Promise<number> {
		const weeks = Math.ceil(endDate.diff(startDate, 'week', true));
		let consistentWeeks = 0;

		for (let i = 0; i < weeks; i++) {
			const weekStart = startDate.add(i, 'week');
			const weekEnd = weekStart.add(6, 'day');

			const where: any = {
				userId,
				date: {
					gte: weekStart.toDate(),
					lte: weekEnd.toDate(),
				},
			};

			if (habitId) {
				where.habitId = habitId;
			}

			const daysInWeek = await this.prismaService.dailyHabitProgress.count({
				where,
			});

			// Consider week consistent if at least 5 days were active
			if (daysInWeek >= 5) {
				consistentWeeks++;
			}
		}

		return consistentWeeks;
	}

	private async calculateMonthlyTarget(
		userId: string,
		habitId: string | undefined,
		startDate: dayjs.Dayjs,
		endDate: dayjs.Dayjs,
	): Promise<number> {
		// Sum of all completed counts in the period
		const where: any = {
			userId,
			date: {
				gte: startDate.toDate(),
				lte: endDate.toDate(),
			},
		};

		if (habitId) {
			where.habitId = habitId;
		}

		const result = await this.prismaService.dailyHabitProgress.aggregate({
			where,
			_sum: {
				completedCount: true,
			},
		});

		return result._sum.completedCount || 0;
	}

	private async calculateTotalDaysActive(
		userId: string,
		startDate: dayjs.Dayjs,
		endDate: dayjs.Dayjs,
	): Promise<number> {
		const activeDays = await this.prismaService.dailyHabitProgress.groupBy({
			by: ['date'],
			where: {
				userId,
				date: {
					gte: startDate.toDate(),
					lte: endDate.toDate(),
				},
			},
		});

		return activeDays.length;
	}

	// Auto-check for goal completion when habit progress is updated
	async checkGoalCompletions(userId: string, habitId?: string) {
		try {
			const activeGoals = await this.prismaService.userGoals.findMany({
				where: {
					userId,
					endDate: { gte: new Date() }, // Only active goals
					completedAt: null, // Only goals that haven't been completed yet
					...(habitId && { habitId }), // Specific habit if provided
				},
			});

			console.log(
				`Checking ${activeGoals.length} active goals for user ${userId}${habitId ? ` and habit ${habitId}` : ''}`,
			);

			let completedGoalsCount = 0;

			for (const goal of activeGoals) {
				const progress = await this.calculateGoalProgress(userId, goal);

				// Check if goal was just completed
				if (
					progress.status === 'completed' &&
					progress.currentValue >= goal.targetValue
				) {
					// Mark as completed and trigger achievement
					await this.markGoalAsCompleted(goal.id);
					await this.achievementsService.handleGoalCompletion(userId, goal.id);

					completedGoalsCount++;
					console.log(
						`✅ Goal "${goal.goalType}" completed! Progress: ${progress.currentValue}/${goal.targetValue}`,
					);
				}
			}

			if (completedGoalsCount > 0) {
				console.log(
					`🎉 ${completedGoalsCount} goal(s) completed for user ${userId}`,
				);
			}

			return completedGoalsCount;
		} catch (error) {
			console.error('Error checking goal completions:', error);
			return 0;
		}
	}

	// Public method to manually mark a goal as completed (for admin or special cases)
	async completeGoal(userId: string, goalId: string) {
		const goal = await this.prismaService.userGoals.findFirst({
			where: { id: goalId, userId },
		});

		if (!goal) {
			throw new NotFoundException(API_CODES.error.GOAL_NOT_FOUND);
		}

		if (goal.completedAt) {
			throw new BadRequestException('Goal is already completed');
		}

		try {
			await this.markGoalAsCompleted(goalId);
			await this.achievementsService.handleGoalCompletion(userId, goalId);

			return {
				message: 'Goal marked as completed successfully',
				data: {
					goalId,
					completedAt: new Date(),
				},
			};
		} catch (error) {
			throw new BadRequestException('Failed to mark goal as completed');
		}
	}

	private async checkIfGoalWasCompleted(goalId: string): Promise<boolean> {
		try {
			const goal = await this.prismaService.userGoals.findUnique({
				where: { id: goalId },
				select: { completedAt: true },
			});

			// Goal is considered completed if completedAt field is set
			return goal?.completedAt !== null && goal?.completedAt !== undefined;
		} catch (error) {
			console.error('Error checking goal completion status:', error);
			return false;
		}
	}

	private async markGoalAsCompleted(goalId: string): Promise<void> {
		try {
			await this.prismaService.userGoals.update({
				where: { id: goalId },
				data: {
					completedAt: new Date(),
					updatedAt: new Date(),
				},
			});

			console.log(
				`Goal ${goalId} marked as completed at ${new Date().toISOString()}`,
			);
		} catch (error) {
			console.error('Error marking goal as completed:', error);
			throw error;
		}
	}
}
