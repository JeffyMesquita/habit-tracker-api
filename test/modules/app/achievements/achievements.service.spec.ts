import { Test, TestingModule } from '@nestjs/testing';
import {
	BadRequestException,
	NotFoundException,
	ConflictException,
} from '@nestjs/common';
import { AchievementsService } from '@/modules/app/achievements/achievements.service';
import { PrismaService } from '@/database/prisma.service';
import { UnlockAchievementDTO } from '@/modules/app/achievements/dtos/UnlockAchievement.dto';
import { FilterAchievementsDTO } from '@/modules/app/achievements/dtos/FilterAchievements.dto';
import API_CODES from '@/misc/API/codes';
import { vi } from 'vitest';

const mockPrismaService = {
	achievements: {
		create: vi.fn(),
		findMany: vi.fn(),
		findFirst: vi.fn(),
		count: vi.fn(),
	},
	habit: {
		count: vi.fn(),
	},
	dailyHabitProgress: {
		count: vi.fn(),
	},
	habitStreak: {
		findFirst: vi.fn(),
	},
	userActivityLog: {
		create: vi.fn(),
	},
};

describe('AchievementsService', () => {
	let service: AchievementsService;
	let prisma: typeof mockPrismaService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AchievementsService,
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
			],
		}).compile();

		service = module.get<AchievementsService>(AchievementsService);
		prisma = module.get(PrismaService);

		vi.clearAllMocks();
	});

	describe('unlock', () => {
		const userId = 'user-id';
		const unlockDto: UnlockAchievementDTO = {
			achievementType: 'first_habit_created',
			details: 'Created your first habit!',
		};

		it('should unlock achievement successfully', async () => {
			const mockAchievement = {
				id: 'achievement-id',
				userId,
				achievementType: 'first_habit_created',
				timestamp: new Date(),
			};

			prisma.achievements.findFirst.mockResolvedValue(null);
			prisma.habit.count.mockResolvedValue(1);
			prisma.achievements.create.mockResolvedValue(mockAchievement);
			prisma.userActivityLog.create.mockResolvedValue({});

			const result = await service.unlock(userId, unlockDto);

			expect(result).toEqual({
				message: API_CODES.success.ACHIEVEMENT_UNLOCKED,
				data: mockAchievement,
			});
		});

		it('should throw error if achievement already unlocked', async () => {
			const existingAchievement = { id: 'existing-achievement' };
			prisma.achievements.findFirst.mockResolvedValue(existingAchievement);

			await expect(service.unlock(userId, unlockDto)).rejects.toThrow(
				ConflictException,
			);
		});

		it('should throw error if conditions not met', async () => {
			const invalidDto = {
				achievementType: 'first_habit_created',
				details: 'Invalid attempt',
			};

			prisma.achievements.findFirst.mockResolvedValue(null);
			prisma.habit.count.mockResolvedValue(0);

			await expect(service.unlock(userId, invalidDto)).rejects.toThrow(
				BadRequestException,
			);
		});
	});

	describe('findAll', () => {
		const userId = 'user-id';
		const filters: FilterAchievementsDTO = {
			limit: 20,
			offset: 0,
		};

		it('should return achievements with enhanced data', async () => {
			const mockAchievements = [
				{
					id: 'achievement-1',
					userId,
					achievementType: 'first_habit_created',
					timestamp: new Date(),
					details: '{"description": "Created your first habit!"}',
				},
			];

			prisma.achievements.findMany.mockResolvedValue(mockAchievements);
			prisma.achievements.count.mockResolvedValue(1);

			const result = await service.findAll(userId, filters);

			expect(result.message).toBe(API_CODES.success.ACHIEVEMENTS_FOUND);
			expect(result.data).toHaveLength(1);
			expect(result.data[0]).toHaveProperty('metadata');
		});

		it('should apply filters correctly', async () => {
			const filteredOptions: FilterAchievementsDTO = {
				achievementType: 'habit_streak_7',
				fromDate: '2025-01-01',
				toDate: '2025-12-31',
				limit: 10,
				offset: 5,
			};

			prisma.achievements.findMany.mockResolvedValue([]);
			prisma.achievements.count.mockResolvedValue(0);

			await service.findAll(userId, filteredOptions);

			expect(prisma.achievements.findMany).toHaveBeenCalledWith({
				where: expect.objectContaining({
					userId,
					achievementType: 'habit_streak_7',
					timestamp: expect.any(Object),
				}),
				orderBy: expect.any(Object),
				skip: 5,
				take: 10,
			});
		});
	});

	describe('findOne', () => {
		const userId = 'user-id';
		const achievementId = 'achievement-id';

		it('should return achievement with enhanced data', async () => {
			const mockAchievement = {
				id: achievementId,
				userId,
				achievementType: 'first_habit_created',
				timestamp: new Date(),
				details: '{"description": "Created your first habit!"}',
			};

			prisma.achievements.findFirst.mockResolvedValue(mockAchievement);

			const result = await service.findOne(userId, achievementId);

			expect(result.message).toBe(API_CODES.success.ACHIEVEMENT_FOUND);
			expect(result.data).toHaveProperty('metadata');
		});

		it('should throw error if achievement not found', async () => {
			prisma.achievements.findFirst.mockResolvedValue(null);

			await expect(service.findOne(userId, achievementId)).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe('getUserStats', () => {
		const userId = 'user-id';

		it('should return user achievement statistics', async () => {
			const mockAchievements = [
				{
					id: 'achievement-1',
					achievementType: 'first_habit_created',
					timestamp: new Date(),
				},
				{
					id: 'achievement-2',
					achievementType: 'habit_streak_7',
					timestamp: new Date(),
				},
			];

			prisma.achievements.findMany.mockResolvedValue(mockAchievements);

			const result = await service.getUserStats(userId);

			expect(result.message).toBe(
				API_CODES.success.USER_ACHIEVEMENTS_RETRIEVED,
			);
			expect(result.data).toHaveProperty('totalUnlocked', 2);
			expect(result.data).toHaveProperty('categories');
			expect(result.data.categories.habits).toBe(1);
			expect(result.data.categories.streaks).toBe(1);
		});
	});

	describe('checkAndUnlockAchievements', () => {
		const userId = 'user-id';

		it('should check habit creation achievements', async () => {
			prisma.habit.count.mockResolvedValue(1);
			prisma.achievements.findFirst.mockResolvedValue(null);
			prisma.achievements.create.mockResolvedValue({
				id: 'new-achievement',
				achievementType: 'first_habit_created',
			});
			prisma.userActivityLog.create.mockResolvedValue({});

			const result = await service.checkAndUnlockAchievements(
				userId,
				'habit_created',
			);

			expect(result).toHaveLength(1);
			expect(result[0].achievementType).toBe('first_habit_created');
		});

		it('should check progress achievements', async () => {
			prisma.dailyHabitProgress.count.mockResolvedValue(10);
			prisma.achievements.findFirst.mockResolvedValue(null);
			prisma.achievements.create.mockResolvedValue({
				id: 'new-achievement',
				achievementType: 'habits_completed_10',
			});
			prisma.userActivityLog.create.mockResolvedValue({});

			const result = await service.checkAndUnlockAchievements(
				userId,
				'habit_progress',
			);

			expect(result).toHaveLength(1);
			expect(result[0].achievementType).toBe('habits_completed_10');
		});

		it('should check streak achievements', async () => {
			const streakData = { streakLength: 7, habitId: 'habit-id' };
			prisma.achievements.findFirst.mockResolvedValue(null);
			prisma.achievements.create.mockResolvedValue({
				id: 'new-achievement',
				achievementType: 'habit_streak_7',
			});
			prisma.userActivityLog.create.mockResolvedValue({});

			const result = await service.checkAndUnlockAchievements(
				userId,
				'streak_achieved',
				streakData,
			);

			expect(result).toHaveLength(1);
			expect(result[0].achievementType).toBe('habit_streak_7');
		});
	});

	describe('validateAchievementConditions', () => {
		const userId = 'user-id';

		it('should validate first habit created', async () => {
			const dto = { achievementType: 'first_habit_created' };
			prisma.habit.count.mockResolvedValue(1);

			const isValid = await (service as any).validateAchievementConditions(
				userId,
				dto,
			);

			expect(isValid).toBe(true);
		});

		it('should validate streak achievement', async () => {
			const dto = { achievementType: 'habit_streak_7' };
			const mockStreak = {
				startDate: new Date('2025-01-01'),
				endDate: new Date('2025-01-07'),
			};
			prisma.habitStreak.findFirst.mockResolvedValue(mockStreak);

			const isValid = await (service as any).validateAchievementConditions(
				userId,
				dto,
			);

			expect(isValid).toBe(true);
		});

		it('should validate completion achievement', async () => {
			const dto = { achievementType: 'habits_completed_10' };
			prisma.dailyHabitProgress.count.mockResolvedValue(15);

			const isValid = await (service as any).validateAchievementConditions(
				userId,
				dto,
			);

			expect(isValid).toBe(true);
		});
	});
});
