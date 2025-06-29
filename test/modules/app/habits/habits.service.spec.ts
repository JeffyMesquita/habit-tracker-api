import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { HabitsService } from '@/modules/app/habits/habits.service';
import { PrismaService } from '@/database/prisma.service';
import { CreateHabitDTO } from '@/modules/app/habits/dtos/CreateHabit.dto';
import { RecordProgressDTO } from '@/modules/app/habits/dtos/RecordProgress.dto';
import API_CODES from '@/misc/API/codes';
import { vi } from 'vitest';

describe('HabitsService', () => {
	let service: HabitsService;

	const mockPrismaService = {
		habit: {
			findFirst: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		habitWeekDays: {
			createMany: vi.fn(),
			deleteMany: vi.fn(),
		},
		dailyHabitProgress: {
			findFirst: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			deleteMany: vi.fn(),
		},
		dayHabit: {
			deleteMany: vi.fn(),
		},
		$transaction: vi.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				HabitsService,
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
			],
		}).compile();

		service = module.get<HabitsService>(HabitsService);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('createHabit', () => {
		const userId = 'user-123';
		const createHabitDto: CreateHabitDTO = {
			title: 'Beber 2L de água',
			frequency: 1,
			weekDays: [1, 2, 3, 4, 5],
			moment: '08:00',
		};

		it('should create a habit successfully', async () => {
			const mockHabit = {
				id: 'habit-123',
				title: 'Beber 2L de água',
				frequency: 1,
				userId,
				createdAt: new Date(),
			};

			mockPrismaService.habit.findFirst.mockResolvedValue(null);
			mockPrismaService.$transaction.mockImplementation(async (callback) => {
				return callback({
					habit: {
						create: vi.fn().mockResolvedValue(mockHabit),
					},
					habitWeekDays: {
						createMany: vi.fn().mockResolvedValue({}),
					},
				});
			});

			const result = await service.createHabit(userId, createHabitDto);

			expect(result).toEqual({
				message: 'Hábito criado com sucesso!',
				code: API_CODES.success.HABIT_CREATED_SUCCESSFULLY,
				data: {
					habit: mockHabit,
				},
			});
		});

		it('should throw BadRequestException if habit title already exists', async () => {
			const existingHabit = {
				id: 'existing-habit',
				title: 'Beber 2L de água',
				userId,
			};

			mockPrismaService.habit.findFirst.mockResolvedValue(existingHabit);

			await expect(service.createHabit(userId, createHabitDto)).rejects.toThrow(
				BadRequestException,
			);
		});
	});

	describe('getHabitById', () => {
		const userId = 'user-123';
		const habitId = 'habit-123';

		it('should return habit if found', async () => {
			const mockHabit = {
				id: habitId,
				title: 'Beber 2L de água',
				frequency: 1,
				userId,
				weekDays: [{ weekDay: 1 }, { weekDay: 2 }],
				DailyHabitProgress: [],
			};

			mockPrismaService.habit.findFirst.mockResolvedValue(mockHabit);

			const result = await service.getHabitById(userId, habitId);

			expect(result).toEqual({
				message: 'Hábito encontrado!',
				code: API_CODES.success.HABIT_FOUND,
				data: {
					habit: mockHabit,
				},
			});
		});

		it('should throw NotFoundException if habit not found', async () => {
			mockPrismaService.habit.findFirst.mockResolvedValue(null);

			await expect(service.getHabitById(userId, habitId)).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe('recordProgress', () => {
		const userId = 'user-123';
		const habitId = 'habit-123';
		const recordProgressDto: RecordProgressDTO = {
			completedCount: 2,
			date: '2024-12-29',
		};

		it('should record new progress successfully', async () => {
			const mockHabit = {
				id: habitId,
				title: 'Beber 2L de água',
				userId,
			};

			const mockProgress = {
				id: 'progress-123',
				userId,
				habitId,
				date: new Date('2024-12-29'),
				completedCount: 2,
			};

			mockPrismaService.habit.findFirst.mockResolvedValue(mockHabit);
			mockPrismaService.dailyHabitProgress.findFirst.mockResolvedValue(null);
			mockPrismaService.dailyHabitProgress.create.mockResolvedValue(
				mockProgress,
			);

			const result = await service.recordProgress(
				userId,
				habitId,
				recordProgressDto,
			);

			expect(result).toEqual({
				message: 'Progresso registrado com sucesso!',
				code: API_CODES.success.HABIT_PROGRESS_RECORDED,
				data: {
					progress: mockProgress,
				},
			});
		});

		it('should update existing progress', async () => {
			const mockHabit = {
				id: habitId,
				title: 'Beber 2L de água',
				userId,
			};

			const existingProgress = {
				id: 'progress-123',
				userId,
				habitId,
				date: new Date('2024-12-29'),
				completedCount: 1,
			};

			const updatedProgress = {
				...existingProgress,
				completedCount: 2,
			};

			mockPrismaService.habit.findFirst.mockResolvedValue(mockHabit);
			mockPrismaService.dailyHabitProgress.findFirst.mockResolvedValue(
				existingProgress,
			);
			mockPrismaService.dailyHabitProgress.update.mockResolvedValue(
				updatedProgress,
			);

			const result = await service.recordProgress(
				userId,
				habitId,
				recordProgressDto,
			);

			expect(result).toEqual({
				message: 'Progresso registrado com sucesso!',
				code: API_CODES.success.HABIT_PROGRESS_RECORDED,
				data: {
					progress: updatedProgress,
				},
			});
		});

		it('should throw NotFoundException if habit not found', async () => {
			mockPrismaService.habit.findFirst.mockResolvedValue(null);

			await expect(
				service.recordProgress(userId, habitId, recordProgressDto),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('deleteHabit', () => {
		const userId = 'user-123';
		const habitId = 'habit-123';

		it('should delete habit successfully', async () => {
			const mockHabit = {
				id: habitId,
				title: 'Beber 2L de água',
				userId,
			};

			mockPrismaService.habit.findFirst.mockResolvedValue(mockHabit);
			mockPrismaService.$transaction.mockImplementation(async (callback) => {
				return callback({
					habitWeekDays: {
						deleteMany: vi.fn().mockResolvedValue({}),
					},
					dailyHabitProgress: {
						deleteMany: vi.fn().mockResolvedValue({}),
					},
					dayHabit: {
						deleteMany: vi.fn().mockResolvedValue({}),
					},
					habit: {
						delete: vi.fn().mockResolvedValue({}),
					},
				});
			});

			const result = await service.deleteHabit(userId, habitId);

			expect(result).toEqual({
				message: 'Hábito deletado com sucesso!',
				code: API_CODES.success.HABIT_DELETED_SUCCESSFULLY,
			});
		});

		it('should throw NotFoundException if habit not found', async () => {
			mockPrismaService.habit.findFirst.mockResolvedValue(null);

			await expect(service.deleteHabit(userId, habitId)).rejects.toThrow(
				NotFoundException,
			);
		});
	});
});
