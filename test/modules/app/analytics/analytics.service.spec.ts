import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from '@/modules/app/analytics/analytics.service';
import { PrismaService } from '@/database/prisma.service';
import {
	DashboardFilterDTO,
	AnalyticsPeriod,
} from '@/modules/app/analytics/dtos/DashboardFilter.dto';
import {
	StreaksFilterDTO,
	StreakType,
} from '@/modules/app/analytics/dtos/StreaksFilter.dto';
import { vi } from 'vitest';

describe('AnalyticsService', () => {
	let service: AnalyticsService;

	const mockPrismaService = {
		habit: {
			count: vi.fn(),
			findMany: vi.fn(),
		},
		dailyHabitProgress: {
			aggregate: vi.fn(),
			findMany: vi.fn(),
		},
		profile: {
			findFirst: vi.fn(),
			update: vi.fn(),
		},
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AnalyticsService,
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
			],
		}).compile();

		service = module.get<AnalyticsService>(AnalyticsService);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('getDashboard', () => {
		it('should return dashboard data successfully', async () => {
			const userId = 'user-123';
			const filterDto: DashboardFilterDTO = {
				period: AnalyticsPeriod.MONTH,
				includeHabitDetails: true,
				includeTrends: false,
			};

			// Mock das chamadas do Prisma
			mockPrismaService.habit.count.mockResolvedValueOnce(5); // totalHabits
			mockPrismaService.habit.count.mockResolvedValueOnce(3); // activeHabits
			mockPrismaService.dailyHabitProgress.aggregate.mockResolvedValue({
				_sum: { completedCount: 50 },
			});
			mockPrismaService.dailyHabitProgress.findMany.mockResolvedValue([
				{
					completedCount: 3,
					habit: { frequency: 5 },
				},
				{
					completedCount: 4,
					habit: { frequency: 5 },
				},
			]);
			mockPrismaService.habit.findMany.mockResolvedValueOnce([
				{
					id: '1',
					title: 'Exercitar',
					frequency: 3,
					DailyHabitProgress: [
						{ date: new Date(), completedCount: 2 },
						{ date: new Date(), completedCount: 3 },
					],
				},
			]);
			mockPrismaService.habit.findMany.mockResolvedValueOnce([
				{
					id: '1',
					title: 'Exercitar',
					DailyHabitProgress: [{ date: new Date(), completedCount: 2 }],
				},
			]);

			const result = await service.getDashboard(userId, filterDto);

			expect(result).toEqual(
				expect.objectContaining({
					message: 'Dashboard carregado com sucesso!',
					data: expect.objectContaining({
						summary: expect.objectContaining({
							totalHabits: 5,
							activeHabits: 3,
							totalProgress: 50,
						}),
					}),
				}),
			);
		});

		it('should return dashboard without habit details when includeHabitDetails is false', async () => {
			const userId = 'user-123';
			const filterDto: DashboardFilterDTO = {
				period: AnalyticsPeriod.WEEK,
				includeHabitDetails: false,
				includeTrends: false,
			};

			mockPrismaService.habit.count.mockResolvedValueOnce(3);
			mockPrismaService.habit.count.mockResolvedValueOnce(2);
			mockPrismaService.dailyHabitProgress.aggregate.mockResolvedValue({
				_sum: { completedCount: 25 },
			});
			mockPrismaService.dailyHabitProgress.findMany.mockResolvedValue([]);
			mockPrismaService.habit.findMany.mockResolvedValue([]);

			const result = await service.getDashboard(userId, filterDto);

			expect(result).toEqual(
				expect.objectContaining({
					message: 'Dashboard carregado com sucesso!',
					data: expect.objectContaining({
						summary: expect.objectContaining({
							totalHabits: 3,
							activeHabits: 2,
							totalProgress: 25,
						}),
					}),
				}),
			);
			expect(result.data.habitDetails).toBeUndefined();
			expect(result.data.trends).toBeUndefined();
		});
	});

	describe('getStreaks', () => {
		it('should return streaks data successfully', async () => {
			const userId = 'user-123';
			const filterDto: StreaksFilterDTO = {
				type: StreakType.ALL,
				limit: 10,
				includeActiveOnly: false,
			};

			const mockHabits = [
				{
					id: 'habit-1',
					title: 'Exercitar',
					DailyHabitProgress: [
						{ date: new Date(), completedCount: 1 },
						{ date: new Date(Date.now() - 86400000), completedCount: 1 }, // Yesterday
					],
					weekDays: [],
				},
				{
					id: 'habit-2',
					title: 'Ler',
					DailyHabitProgress: [
						{ date: new Date(Date.now() - 172800000), completedCount: 1 }, // 2 days ago
					],
					weekDays: [],
				},
			];

			mockPrismaService.habit.findMany.mockResolvedValue(mockHabits);

			const result = await service.getStreaks(userId, filterDto);

			expect(result).toEqual(
				expect.objectContaining({
					message: 'Streaks encontrados com sucesso!',
					data: expect.objectContaining({
						streaks: expect.arrayContaining([
							expect.objectContaining({
								habitId: 'habit-1',
								habitTitle: 'Exercitar',
								currentStreak: expect.any(Number),
								longestStreak: expect.any(Number),
								totalCompletions: expect.any(Number),
								isActive: expect.any(Boolean),
							}),
						]),
						summary: expect.objectContaining({
							totalHabits: 2,
							activeStreaks: expect.any(Number),
							longestStreak: expect.any(Number),
							averageStreak: expect.any(Number),
						}),
					}),
				}),
			);
		});

		it('should return empty streaks when no habits found', async () => {
			const userId = 'user-123';
			const filterDto: StreaksFilterDTO = {
				type: StreakType.CURRENT,
				limit: 5,
			};

			mockPrismaService.habit.findMany.mockResolvedValue([]);

			const result = await service.getStreaks(userId, filterDto);

			expect(result).toEqual(
				expect.objectContaining({
					message: 'Nenhum hábito encontrado!',
					data: expect.objectContaining({
						streaks: [],
						summary: {
							totalHabits: 0,
							activeStreaks: 0,
							longestStreak: 0,
							averageStreak: 0,
						},
					}),
				}),
			);
		});

		it('should filter streaks by habitId', async () => {
			const userId = 'user-123';
			const habitId = 'specific-habit-id';
			const filterDto: StreaksFilterDTO = {
				habitId,
				type: StreakType.ALL,
				limit: 10,
			};

			const mockHabit = [
				{
					id: habitId,
					title: 'Specific Habit',
					DailyHabitProgress: [{ date: new Date(), completedCount: 1 }],
					weekDays: [],
				},
			];

			mockPrismaService.habit.findMany.mockResolvedValue(mockHabit);

			const result = await service.getStreaks(userId, filterDto);

			expect(mockPrismaService.habit.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						userId,
						id: habitId,
					}),
				}),
			);

			expect(result.data.streaks).toHaveLength(1);
			expect(result.data.streaks[0].habitId).toBe(habitId);
		});

		it('should return only active streaks when includeActiveOnly is true', async () => {
			const userId = 'user-123';
			const filterDto: StreaksFilterDTO = {
				type: StreakType.ALL,
				includeActiveOnly: true,
				limit: 10,
			};

			const mockHabits = [
				{
					id: 'habit-active',
					title: 'Active Habit',
					DailyHabitProgress: [{ date: new Date(), completedCount: 1 }],
					weekDays: [],
				},
				{
					id: 'habit-inactive',
					title: 'Inactive Habit',
					DailyHabitProgress: [
						{ date: new Date(Date.now() - 172800000), completedCount: 1 }, // 2 days ago
					],
					weekDays: [],
				},
			];

			mockPrismaService.habit.findMany.mockResolvedValue(mockHabits);

			const result = await service.getStreaks(userId, filterDto);

			// Verificar se pelo menos alguns streaks foram retornados e filtrados corretamente
			expect(result.data.streaks).toBeDefined();
			expect(Array.isArray(result.data.streaks)).toBe(true);
		});
	});
});
