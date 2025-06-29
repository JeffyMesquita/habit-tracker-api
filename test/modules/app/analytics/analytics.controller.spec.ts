import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from '@/modules/app/analytics/analytics.controller';
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

describe('AnalyticsController', () => {
	let controller: AnalyticsController;
	let analyticsService: AnalyticsService;

	const mockAnalyticsService = {
		getDashboard: vi.fn(),
		getStreaks: vi.fn(),
	};

	const mockPrismaService = {
		user: { findFirst: vi.fn() },
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AnalyticsController],
			providers: [
				{
					provide: AnalyticsService,
					useValue: mockAnalyticsService,
				},
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
			],
		}).compile();

		controller = module.get<AnalyticsController>(AnalyticsController);
		analyticsService = module.get<AnalyticsService>(AnalyticsService);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('getDashboard', () => {
		it('should call analyticsService.getDashboard with correct parameters', async () => {
			const mockRequest = {
				user: { userId: 'user-123' },
			} as any;

			const filterDto: DashboardFilterDTO = {
				period: AnalyticsPeriod.MONTH,
				includeHabitDetails: true,
				includeTrends: false,
			};

			const expectedResult = {
				message: 'Dashboard carregado com sucesso!',
				data: {
					summary: {
						totalHabits: 5,
						activeHabits: 3,
						totalProgress: 25,
					},
				},
			};

			mockAnalyticsService.getDashboard.mockResolvedValue(expectedResult);

			const result = await controller.getDashboard(mockRequest, filterDto);

			expect(analyticsService.getDashboard).toHaveBeenCalledWith(
				'user-123',
				filterDto,
			);
			expect(result).toEqual(expectedResult);
		});

		it('should handle dashboard request with custom date range', async () => {
			const mockRequest = {
				user: { userId: 'user-456' },
			} as any;

			const filterDto: DashboardFilterDTO = {
				period: AnalyticsPeriod.ALL,
				startDate: '2024-01-01',
				endDate: '2024-12-31',
				includeHabitDetails: false,
				includeTrends: true,
			};

			const expectedResult = {
				message: 'Dashboard carregado com sucesso!',
				data: {
					period: {
						type: 'all',
						startDate: '2024-01-01',
						endDate: '2024-12-31',
					},
					summary: {},
					trends: {},
				},
			};

			mockAnalyticsService.getDashboard.mockResolvedValue(expectedResult);

			const result = await controller.getDashboard(mockRequest, filterDto);

			expect(analyticsService.getDashboard).toHaveBeenCalledWith(
				'user-456',
				filterDto,
			);
			expect(result).toEqual(expectedResult);
		});
	});

	describe('getStreaks', () => {
		it('should call analyticsService.getStreaks with correct parameters', async () => {
			const mockRequest = {
				user: { userId: 'user-789' },
			} as any;

			const filterDto: StreaksFilterDTO = {
				type: StreakType.CURRENT,
				limit: 5,
				includeActiveOnly: true,
			};

			const expectedResult = {
				message: 'Streaks encontrados com sucesso!',
				data: {
					streaks: [
						{
							habitId: 'habit-1',
							habitTitle: 'Exercitar',
							currentStreak: 3,
							longestStreak: 7,
							isActive: true,
						},
					],
					summary: {
						totalHabits: 1,
						activeStreaks: 1,
						longestStreak: 7,
						averageStreak: 3,
					},
				},
			};

			mockAnalyticsService.getStreaks.mockResolvedValue(expectedResult);

			const result = await controller.getStreaks(mockRequest, filterDto);

			expect(analyticsService.getStreaks).toHaveBeenCalledWith(
				'user-789',
				filterDto,
			);
			expect(result).toEqual(expectedResult);
		});

		it('should handle streaks request for specific habit', async () => {
			const mockRequest = {
				user: { userId: 'user-999' },
			} as any;

			const filterDto: StreaksFilterDTO = {
				habitId: 'specific-habit-id',
				type: StreakType.LONGEST,
				limit: 1,
			};

			const expectedResult = {
				message: 'Streaks encontrados com sucesso!',
				data: {
					streaks: [
						{
							habitId: 'specific-habit-id',
							habitTitle: 'Habit Específico',
							currentStreak: 0,
							longestStreak: 15,
							isActive: false,
						},
					],
					summary: {
						totalHabits: 1,
						activeStreaks: 0,
						longestStreak: 15,
						averageStreak: 0,
					},
				},
			};

			mockAnalyticsService.getStreaks.mockResolvedValue(expectedResult);

			const result = await controller.getStreaks(mockRequest, filterDto);

			expect(analyticsService.getStreaks).toHaveBeenCalledWith(
				'user-999',
				filterDto,
			);
			expect(result).toEqual(expectedResult);
		});

		it('should handle empty streaks response', async () => {
			const mockRequest = {
				user: { userId: 'user-empty' },
			} as any;

			const filterDto: StreaksFilterDTO = {
				type: StreakType.ALL,
				limit: 10,
			};

			const expectedResult = {
				message: 'Nenhum hábito encontrado!',
				data: {
					streaks: [],
					summary: {
						totalHabits: 0,
						activeStreaks: 0,
						longestStreak: 0,
						averageStreak: 0,
					},
				},
			};

			mockAnalyticsService.getStreaks.mockResolvedValue(expectedResult);

			const result = await controller.getStreaks(mockRequest, filterDto);

			expect(analyticsService.getStreaks).toHaveBeenCalledWith(
				'user-empty',
				filterDto,
			);
			expect(result).toEqual(expectedResult);
		});
	});
});
