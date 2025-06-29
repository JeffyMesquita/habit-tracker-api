import { Test, TestingModule } from '@nestjs/testing';
import {
	BadRequestException,
	NotFoundException,
	ConflictException,
} from '@nestjs/common';
import { GoalsService } from '@/modules/app/goals/goals.service';
import { PrismaService } from '@/database/prisma.service';
import { AchievementsService } from '@/modules/app/achievements/achievements.service';
import { CreateGoalDTO } from '@/modules/app/goals/dtos/CreateGoal.dto';
import { UpdateGoalDTO } from '@/modules/app/goals/dtos/UpdateGoal.dto';
import { FilterGoalsDTO } from '@/modules/app/goals/dtos/FilterGoals.dto';
import API_CODES from '@/misc/API/codes';
import { vi } from 'vitest';

const mockPrismaService = {
	userGoals: {
		create: vi.fn(),
		findMany: vi.fn(),
		findFirst: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		count: vi.fn(),
	},
	habit: {
		findFirst: vi.fn(),
		count: vi.fn(),
	},
	dailyHabitProgress: {
		count: vi.fn(),
		aggregate: vi.fn(),
		groupBy: vi.fn(),
	},
	habitStreak: {
		findMany: vi.fn(),
		findFirst: vi.fn(),
	},
};

const mockAchievementsService = {
	handleGoalCompletion: vi.fn(),
	unlockAchievement: vi.fn(),
	getUserAchievements: vi.fn(),
	getAchievementStats: vi.fn(),
	getAchievementById: vi.fn(),
};

describe('GoalsService', () => {
	let service: GoalsService;
	let prisma: typeof mockPrismaService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				GoalsService,
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
				{
					provide: AchievementsService,
					useValue: mockAchievementsService,
				},
			],
		}).compile();

		service = module.get<GoalsService>(GoalsService);
		prisma = module.get(PrismaService);

		// Reset all mocks
		vi.clearAllMocks();
	});

	describe('create', () => {
		const userId = 'user-id';
		const createGoalDto: CreateGoalDTO = {
			goalType: 'habit_completion',
			targetValue: 30,
			startDate: '2025-12-01',
			endDate: '2025-12-31',
			title: 'Complete 30 days',
			description: 'Challenge myself',
			priority: 3,
		};

		it('should create a goal successfully', async () => {
			const mockGoal = {
				id: 'goal-id',
				userId,
				goalType: 'habit_completion',
				targetValue: 30,
				startDate: new Date('2025-12-01'),
				endDate: new Date('2025-12-31'),
			};

			prisma.userGoals.findFirst.mockResolvedValue(null);
			prisma.userGoals.create.mockResolvedValue(mockGoal);

			const result = await service.create(userId, createGoalDto);

			expect(result).toEqual({
				message: API_CODES.success.GOAL_CREATED_SUCCESSFULLY,
				data: mockGoal,
			});
		});

		it('should throw error if end date is before start date', async () => {
			const invalidDto = {
				...createGoalDto,
				startDate: '2025-12-31',
				endDate: '2025-12-01',
			};

			await expect(service.create(userId, invalidDto)).rejects.toThrow(
				BadRequestException,
			);
		});

		it('should throw error if start date is in the past', async () => {
			const invalidDto = {
				...createGoalDto,
				startDate: '2024-01-01',
			};

			await expect(service.create(userId, invalidDto)).rejects.toThrow(
				BadRequestException,
			);
		});

		it('should throw error if conflicting goal exists', async () => {
			const conflictingGoal = { id: 'existing-goal' };
			prisma.userGoals.findFirst.mockResolvedValue(conflictingGoal);

			await expect(service.create(userId, createGoalDto)).rejects.toThrow(
				ConflictException,
			);
		});

		it('should validate habit exists when habitId provided', async () => {
			const dtoWithHabit = { ...createGoalDto, habitId: 'habit-id' };

			prisma.userGoals.findFirst.mockResolvedValue(null);
			prisma.habit.findFirst.mockResolvedValue(null); // Habit not found

			await expect(service.create(userId, dtoWithHabit)).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe('findAll', () => {
		const userId = 'user-id';
		const filters: FilterGoalsDTO = {
			status: 'active',
			limit: 10,
			offset: 0,
		};

		it('should return goals with progress calculation', async () => {
			const mockGoals = [
				{
					id: 'goal-1',
					userId,
					goalType: 'habit_completion',
					targetValue: 30,
					startDate: new Date('2025-12-01'),
					endDate: new Date('2025-12-31'),
				},
			];

			prisma.userGoals.findMany.mockResolvedValue(mockGoals);
			prisma.userGoals.count.mockResolvedValue(1);
			prisma.dailyHabitProgress.count.mockResolvedValue(15);

			const result = await service.findAll(userId, filters);

			expect(result.message).toBe(API_CODES.success.GOALS_FOUND);
			expect(result.data).toHaveLength(1);
		});

		it('should apply filters correctly', async () => {
			const filteredOptions: FilterGoalsDTO = {
				goalType: 'habit_completion',
				status: 'active',
				priority: 5,
				limit: 5,
				offset: 10,
			};

			prisma.userGoals.findMany.mockResolvedValue([]);
			prisma.userGoals.count.mockResolvedValue(0);

			await service.findAll(userId, filteredOptions);

			expect(prisma.userGoals.findMany).toHaveBeenCalledWith({
				where: expect.objectContaining({
					userId,
					goalType: 'habit_completion',
				}),
				orderBy: expect.any(Object),
				skip: 10,
				take: 5,
			});
		});
	});

	describe('findOne', () => {
		const userId = 'user-id';
		const goalId = 'goal-id';

		it('should return goal with progress', async () => {
			const mockGoal = {
				id: goalId,
				userId,
				goalType: 'habit_completion',
				targetValue: 30,
				startDate: new Date('2025-12-01'),
				endDate: new Date('2025-12-31'),
			};

			prisma.userGoals.findFirst.mockResolvedValue(mockGoal);
			prisma.dailyHabitProgress.count.mockResolvedValue(15);

			const result = await service.findOne(userId, goalId);

			expect(result.message).toBe(API_CODES.success.GOAL_FOUND);
		});

		it('should throw error if goal not found', async () => {
			prisma.userGoals.findFirst.mockResolvedValue(null);

			await expect(service.findOne(userId, goalId)).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe('update', () => {
		const userId = 'user-id';
		const goalId = 'goal-id';
		const updateDto: UpdateGoalDTO = {
			targetValue: 40,
			title: 'Updated title',
		};

		it('should update goal successfully', async () => {
			const existingGoal = {
				id: goalId,
				userId,
				startDate: new Date('2025-12-01'),
				endDate: new Date('2025-12-31'),
			};
			const updatedGoal = { ...existingGoal, targetValue: 40 };

			prisma.userGoals.findFirst.mockResolvedValue(existingGoal);
			prisma.userGoals.update.mockResolvedValue(updatedGoal);

			const result = await service.update(userId, goalId, updateDto);

			expect(result.message).toBe(API_CODES.success.GOAL_UPDATED_SUCCESSFULLY);
		});

		it('should throw error if goal not found', async () => {
			prisma.userGoals.findFirst.mockResolvedValue(null);

			await expect(service.update(userId, goalId, updateDto)).rejects.toThrow(
				NotFoundException,
			);
		});

		it('should validate date changes', async () => {
			const existingGoal = {
				id: goalId,
				userId,
				startDate: new Date('2025-12-01'),
				endDate: new Date('2025-12-31'),
			};

			const invalidUpdateDto = {
				...updateDto,
				startDate: '2025-12-31', // After end date
			};

			prisma.userGoals.findFirst.mockResolvedValue(existingGoal);

			await expect(
				service.update(userId, goalId, invalidUpdateDto),
			).rejects.toThrow(BadRequestException);
		});
	});

	describe('remove', () => {
		const userId = 'user-id';
		const goalId = 'goal-id';

		it('should delete goal successfully', async () => {
			const existingGoal = { id: goalId, userId };

			prisma.userGoals.findFirst.mockResolvedValue(existingGoal);
			prisma.userGoals.delete.mockResolvedValue(existingGoal);

			const result = await service.remove(userId, goalId);

			expect(result.message).toBe(API_CODES.success.GOAL_DELETED_SUCCESSFULLY);
		});

		it('should throw error if goal not found', async () => {
			prisma.userGoals.findFirst.mockResolvedValue(null);

			await expect(service.remove(userId, goalId)).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe('getProgress', () => {
		const userId = 'user-id';
		const goalId = 'goal-id';

		it('should return goal progress', async () => {
			const mockGoal = {
				id: goalId,
				userId,
				goalType: 'habit_completion',
				targetValue: 30,
				startDate: new Date('2025-12-01'),
				endDate: new Date('2025-12-31'),
			};

			prisma.userGoals.findFirst.mockResolvedValue(mockGoal);
			prisma.dailyHabitProgress.count.mockResolvedValue(20);

			const result = await service.getProgress(userId, goalId);

			expect(result.message).toBe(API_CODES.success.GOAL_PROGRESS_RETRIEVED);
		});

		it('should throw error if goal not found', async () => {
			prisma.userGoals.findFirst.mockResolvedValue(null);

			await expect(service.getProgress(userId, goalId)).rejects.toThrow(
				NotFoundException,
			);
		});
	});
});
