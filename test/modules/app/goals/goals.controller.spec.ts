import { Test, TestingModule } from '@nestjs/testing';
import { GoalsController } from '@/modules/app/goals/goals.controller';
import { GoalsService } from '@/modules/app/goals/goals.service';
import { PrismaService } from '@/database/prisma.service';
import { CreateGoalDTO } from '@/modules/app/goals/dtos/CreateGoal.dto';
import { UpdateGoalDTO } from '@/modules/app/goals/dtos/UpdateGoal.dto';
import { FilterGoalsDTO } from '@/modules/app/goals/dtos/FilterGoals.dto';
import API_CODES from '@/misc/API/codes';
import { vi } from 'vitest';

const mockGoalsService = {
	create: vi.fn(),
	findAll: vi.fn(),
	findOne: vi.fn(),
	update: vi.fn(),
	remove: vi.fn(),
	getProgress: vi.fn(),
};

const mockPrismaService = {
	user: {
		findUnique: vi.fn(),
	},
};

describe('GoalsController', () => {
	let controller: GoalsController;
	let service: typeof mockGoalsService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [GoalsController],
			providers: [
				{
					provide: GoalsService,
					useValue: mockGoalsService,
				},
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
			],
		}).compile();

		controller = module.get<GoalsController>(GoalsController);
		service = module.get(GoalsService);

		vi.clearAllMocks();
	});

	describe('create', () => {
		it('should create a goal', async () => {
			const createGoalDto: CreateGoalDTO = {
				goalType: 'habit_completion',
				targetValue: 30,
				startDate: '2025-01-29',
				endDate: '2025-02-28',
				title: 'Complete 30 days',
			};

			const mockResult = {
				message: API_CODES.success.GOAL_CREATED_SUCCESSFULLY,
				data: { id: 'goal-id', ...createGoalDto },
			};

			const mockReq = { user: { userId: 'user-id' } };

			service.create.mockResolvedValue(mockResult);

			const result = await controller.create(createGoalDto, mockReq);

			expect(service.create).toHaveBeenCalledWith('user-id', createGoalDto);
			expect(result).toEqual(mockResult);
		});
	});

	describe('findAll', () => {
		it('should return all goals with filters', async () => {
			const filterDto: FilterGoalsDTO = {
				status: 'active',
				goalType: 'habit_completion',
				limit: 10,
				offset: 0,
			};

			const mockResult = {
				message: API_CODES.success.GOALS_FOUND,
				data: [
					{
						id: 'goal-1',
						goalType: 'habit_completion',
						targetValue: 30,
					},
				],
			};

			const mockReq = { user: { userId: 'user-id' } };

			service.findAll.mockResolvedValue(mockResult);

			const result = await controller.findAll(filterDto, mockReq);

			expect(service.findAll).toHaveBeenCalledWith('user-id', filterDto);
			expect(result).toEqual(mockResult);
		});
	});

	describe('findOne', () => {
		it('should return a specific goal', async () => {
			const goalId = 'goal-id';
			const mockResult = {
				message: API_CODES.success.GOAL_FOUND,
				data: {
					id: goalId,
					goalType: 'habit_completion',
					targetValue: 30,
				},
			};

			const mockReq = { user: { userId: 'user-id' } };

			service.findOne.mockResolvedValue(mockResult);

			const result = await controller.findOne(goalId, mockReq);

			expect(service.findOne).toHaveBeenCalledWith('user-id', goalId);
			expect(result).toEqual(mockResult);
		});
	});

	describe('update', () => {
		it('should update a goal', async () => {
			const goalId = 'goal-id';
			const updateGoalDto: UpdateGoalDTO = {
				targetValue: 40,
				title: 'Updated title',
			};

			const mockResult = {
				message: API_CODES.success.GOAL_UPDATED_SUCCESSFULLY,
				data: {
					id: goalId,
					targetValue: 40,
					title: 'Updated title',
				},
			};

			const mockReq = { user: { userId: 'user-id' } };

			service.update.mockResolvedValue(mockResult);

			const result = await controller.update(goalId, updateGoalDto, mockReq);

			expect(service.update).toHaveBeenCalledWith(
				'user-id',
				goalId,
				updateGoalDto,
			);
			expect(result).toEqual(mockResult);
		});
	});

	describe('remove', () => {
		it('should delete a goal', async () => {
			const goalId = 'goal-id';
			const mockResult = {
				message: API_CODES.success.GOAL_DELETED_SUCCESSFULLY,
			};

			const mockReq = { user: { userId: 'user-id' } };

			service.remove.mockResolvedValue(mockResult);

			const result = await controller.remove(goalId, mockReq);

			expect(service.remove).toHaveBeenCalledWith('user-id', goalId);
			expect(result).toEqual(mockResult);
		});
	});

	describe('getProgress', () => {
		it('should return goal progress', async () => {
			const goalId = 'goal-id';
			const mockResult = {
				message: API_CODES.success.GOAL_PROGRESS_RETRIEVED,
				data: {
					goalId,
					currentValue: 20,
					targetValue: 30,
					progress: 66.67,
					status: 'active',
					daysRemaining: 10,
				},
			};

			const mockReq = { user: { userId: 'user-id' } };

			service.getProgress.mockResolvedValue(mockResult);

			const result = await controller.getProgress(goalId, mockReq);

			expect(service.getProgress).toHaveBeenCalledWith('user-id', goalId);
			expect(result).toEqual(mockResult);
		});
	});
});
