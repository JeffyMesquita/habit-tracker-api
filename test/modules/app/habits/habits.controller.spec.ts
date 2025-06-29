import { Test, TestingModule } from '@nestjs/testing';
import { HabitsController } from '@/modules/app/habits/habits.controller';
import { HabitsService } from '@/modules/app/habits/habits.service';
import { PrismaService } from '@/database/prisma.service';
import { CreateHabitDTO } from '@/modules/app/habits/dtos/CreateHabit.dto';
import { RecordProgressDTO } from '@/modules/app/habits/dtos/RecordProgress.dto';
import {
	FilterHabitsDTO,
	HabitFilterPeriod,
} from '@/modules/app/habits/dtos/FilterHabits.dto';
import API_CODES from '@/misc/API/codes';
import { vi } from 'vitest';

describe('HabitsController', () => {
	let controller: HabitsController;
	let service: HabitsService;

	const mockHabitsService = {
		createHabit: vi.fn(),
		getHabits: vi.fn(),
		getHabitById: vi.fn(),
		updateHabit: vi.fn(),
		deleteHabit: vi.fn(),
		recordProgress: vi.fn(),
		getHabitProgress: vi.fn(),
	};

	const mockPrismaService = {
		user: {
			findUnique: vi.fn(),
		},
	};

	const mockRequest = {
		user: {
			userId: 'user-123',
		},
	} as any;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [HabitsController],
			providers: [
				{
					provide: HabitsService,
					useValue: mockHabitsService,
				},
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
			],
		}).compile();

		controller = module.get<HabitsController>(HabitsController);
		service = module.get<HabitsService>(HabitsService);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('createHabit', () => {
		it('should create a habit successfully', async () => {
			const createHabitDto: CreateHabitDTO = {
				title: 'Beber 2L de água',
				frequency: 1,
				weekDays: [1, 2, 3, 4, 5],
				moment: '08:00',
			};

			const expectedResult = {
				message: 'Hábito criado com sucesso!',
				code: API_CODES.success.HABIT_CREATED_SUCCESSFULLY,
				data: {
					habit: {
						id: 'habit-123',
						title: 'Beber 2L de água',
						frequency: 1,
						userId: 'user-123',
					},
				},
			};

			mockHabitsService.createHabit.mockResolvedValue(expectedResult);

			const result = await controller.createHabit(mockRequest, createHabitDto);

			expect(service.createHabit).toHaveBeenCalledWith(
				'user-123',
				createHabitDto,
			);
			expect(result).toEqual(expectedResult);
		});
	});

	describe('getHabits', () => {
		it('should get habits with filters', async () => {
			const filterDto: FilterHabitsDTO = {
				period: HabitFilterPeriod.TODAY,
				includeProgress: true,
			};

			const expectedResult = {
				message: 'Hábitos encontrados!',
				code: API_CODES.success.HABITS_FOUND,
				data: {
					habits: [],
					total: 0,
					date: '2024-12-29',
				},
			};

			mockHabitsService.getHabits.mockResolvedValue(expectedResult);

			const result = await controller.getHabits(mockRequest, filterDto);

			expect(service.getHabits).toHaveBeenCalledWith('user-123', filterDto);
			expect(result).toEqual(expectedResult);
		});
	});

	describe('getTodayHabits', () => {
		it('should get today habits', async () => {
			const expectedResult = {
				message: 'Hábitos encontrados!',
				code: API_CODES.success.HABITS_FOUND,
				data: {
					habits: [],
					total: 0,
					date: '2024-12-29',
				},
			};

			mockHabitsService.getHabits.mockResolvedValue(expectedResult);

			const result = await controller.getTodayHabits(mockRequest);

			expect(service.getHabits).toHaveBeenCalledWith('user-123', {
				period: HabitFilterPeriod.TODAY,
			});
			expect(result).toEqual(expectedResult);
		});
	});

	describe('getHabitById', () => {
		it('should get habit by id', async () => {
			const habitId = 'habit-123';
			const expectedResult = {
				message: 'Hábito encontrado!',
				code: API_CODES.success.HABIT_FOUND,
				data: {
					habit: {
						id: habitId,
						title: 'Beber 2L de água',
						frequency: 1,
					},
				},
			};

			mockHabitsService.getHabitById.mockResolvedValue(expectedResult);

			const result = await controller.getHabitById(mockRequest, habitId);

			expect(service.getHabitById).toHaveBeenCalledWith('user-123', habitId);
			expect(result).toEqual(expectedResult);
		});
	});

	describe('recordProgress', () => {
		it('should record progress successfully', async () => {
			const habitId = 'habit-123';
			const recordProgressDto: RecordProgressDTO = {
				completedCount: 2,
				date: '2024-12-29',
			};

			const expectedResult = {
				message: 'Progresso registrado com sucesso!',
				code: API_CODES.success.HABIT_PROGRESS_RECORDED,
				data: {
					progress: {
						id: 'progress-123',
						userId: 'user-123',
						habitId,
						completedCount: 2,
					},
				},
			};

			mockHabitsService.recordProgress.mockResolvedValue(expectedResult);

			const result = await controller.recordProgress(
				mockRequest,
				habitId,
				recordProgressDto,
			);

			expect(service.recordProgress).toHaveBeenCalledWith(
				'user-123',
				habitId,
				recordProgressDto,
			);
			expect(result).toEqual(expectedResult);
		});
	});

	describe('deleteHabit', () => {
		it('should delete habit successfully', async () => {
			const habitId = 'habit-123';
			const expectedResult = {
				message: 'Hábito deletado com sucesso!',
				code: API_CODES.success.HABIT_DELETED_SUCCESSFULLY,
			};

			mockHabitsService.deleteHabit.mockResolvedValue(expectedResult);

			const result = await controller.deleteHabit(mockRequest, habitId);

			expect(service.deleteHabit).toHaveBeenCalledWith('user-123', habitId);
			expect(result).toEqual(expectedResult);
		});
	});
});
