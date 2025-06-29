import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	Query,
	UseGuards,
	Req,
} from '@nestjs/common';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
	ApiParam,
	ApiQuery,
} from '@nestjs/swagger';
import { GoalsService } from '@/modules/app/goals/goals.service';
import { CreateGoalDTO } from '@/modules/app/goals/dtos/CreateGoal.dto';
import { UpdateGoalDTO } from '@/modules/app/goals/dtos/UpdateGoal.dto';
import { FilterGoalsDTO } from '@/modules/app/goals/dtos/FilterGoals.dto';
import { UseAuth } from '@/guards/useAuth';

@ApiTags('Goals')
@ApiBearerAuth()
@UseGuards(UseAuth)
@Controller('goals')
export class GoalsController {
	constructor(private readonly goalsService: GoalsService) {}

	@Post()
	@ApiOperation({
		summary: 'Create a new goal',
		description: 'Create a new personal goal with target value and date range',
	})
	@ApiResponse({
		status: 201,
		description: 'Goal created successfully',
		schema: {
			type: 'object',
			properties: {
				message: { type: 'string', example: '@GOAL_CREATED_SUCCESSFULLY' },
				data: {
					type: 'object',
					properties: {
						id: { type: 'string', example: 'uuid' },
						goalType: { type: 'string', example: 'habit_completion' },
						targetValue: { type: 'number', example: 30 },
						startDate: { type: 'string', example: '2025-01-29T00:00:00.000Z' },
						endDate: { type: 'string', example: '2025-02-28T00:00:00.000Z' },
						userId: { type: 'string', example: 'uuid' },
					},
				},
			},
		},
	})
	@ApiResponse({
		status: 400,
		description: 'Invalid goal data or date conflict',
	})
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({
		status: 409,
		description: 'Goal already exists for this period',
	})
	async create(@Body() createGoalDto: CreateGoalDTO, @Req() req: any) {
		return this.goalsService.create(req.user.userId, createGoalDto);
	}

	@Get()
	@ApiOperation({
		summary: 'List user goals',
		description:
			'Get all goals for the authenticated user with filtering and pagination',
	})
	@ApiQuery({
		name: 'goalType',
		required: false,
		description: 'Filter by goal type',
	})
	@ApiQuery({
		name: 'status',
		required: false,
		description: 'Filter by goal status',
	})
	@ApiQuery({
		name: 'startDate',
		required: false,
		description: 'Filter from start date',
	})
	@ApiQuery({
		name: 'endDate',
		required: false,
		description: 'Filter to end date',
	})
	@ApiQuery({
		name: 'habitId',
		required: false,
		description: 'Filter by habit ID',
	})
	@ApiQuery({
		name: 'priority',
		required: false,
		description: 'Filter by priority level',
	})
	@ApiQuery({
		name: 'limit',
		required: false,
		description: 'Number of results to return',
	})
	@ApiQuery({
		name: 'offset',
		required: false,
		description: 'Number of results to skip',
	})
	@ApiQuery({
		name: 'order',
		required: false,
		description: 'Sort order (asc/desc)',
	})
	@ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field' })
	@ApiResponse({
		status: 200,
		description: 'Goals retrieved successfully',
		schema: {
			type: 'object',
			properties: {
				message: { type: 'string', example: '@GOALS_FOUND' },
				data: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							id: { type: 'string', example: 'uuid' },
							goalType: { type: 'string', example: 'habit_completion' },
							targetValue: { type: 'number', example: 30 },
							startDate: { type: 'string' },
							endDate: { type: 'string' },
							progress: {
								type: 'object',
								properties: {
									goalId: { type: 'string' },
									currentValue: { type: 'number', example: 15 },
									targetValue: { type: 'number', example: 30 },
									progress: { type: 'number', example: 50.0 },
									status: { type: 'string', example: 'active' },
									daysRemaining: { type: 'number', example: 15 },
								},
							},
						},
					},
				},
				meta: {
					type: 'object',
					properties: {
						total: { type: 'number', example: 5 },
						limit: { type: 'number', example: 10 },
						offset: { type: 'number', example: 0 },
					},
				},
			},
		},
	})
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	async findAll(@Query() filterDto: FilterGoalsDTO, @Req() req: any) {
		return this.goalsService.findAll(req.user.userId, filterDto);
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Get goal by ID',
		description: 'Get a specific goal with progress information',
	})
	@ApiParam({ name: 'id', description: 'Goal ID' })
	@ApiResponse({
		status: 200,
		description: 'Goal found successfully',
		schema: {
			type: 'object',
			properties: {
				message: { type: 'string', example: '@GOAL_FOUND' },
				data: {
					type: 'object',
					properties: {
						id: { type: 'string', example: 'uuid' },
						goalType: { type: 'string', example: 'habit_completion' },
						targetValue: { type: 'number', example: 30 },
						startDate: { type: 'string' },
						endDate: { type: 'string' },
						progress: {
							type: 'object',
							properties: {
								goalId: { type: 'string' },
								currentValue: { type: 'number', example: 15 },
								targetValue: { type: 'number', example: 30 },
								progress: { type: 'number', example: 50.0 },
								status: { type: 'string', example: 'active' },
								daysRemaining: { type: 'number', example: 15 },
							},
						},
					},
				},
			},
		},
	})
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 404, description: 'Goal not found' })
	async findOne(@Param('id') id: string, @Req() req: any) {
		return this.goalsService.findOne(req.user.userId, id);
	}

	@Patch(':id')
	@ApiOperation({
		summary: 'Update goal',
		description: 'Update an existing goal',
	})
	@ApiParam({ name: 'id', description: 'Goal ID' })
	@ApiResponse({
		status: 200,
		description: 'Goal updated successfully',
		schema: {
			type: 'object',
			properties: {
				message: { type: 'string', example: '@GOAL_UPDATED_SUCCESSFULLY' },
				data: {
					type: 'object',
					properties: {
						id: { type: 'string', example: 'uuid' },
						goalType: { type: 'string', example: 'habit_completion' },
						targetValue: { type: 'number', example: 30 },
						startDate: { type: 'string' },
						endDate: { type: 'string' },
					},
				},
			},
		},
	})
	@ApiResponse({
		status: 400,
		description: 'Invalid goal data or date conflict',
	})
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 404, description: 'Goal not found' })
	async update(
		@Param('id') id: string,
		@Body() updateGoalDto: UpdateGoalDTO,
		@Req() req: any,
	) {
		return this.goalsService.update(req.user.userId, id, updateGoalDto);
	}

	@Delete(':id')
	@ApiOperation({
		summary: 'Delete goal',
		description: 'Delete an existing goal',
	})
	@ApiParam({ name: 'id', description: 'Goal ID' })
	@ApiResponse({
		status: 200,
		description: 'Goal deleted successfully',
		schema: {
			type: 'object',
			properties: {
				message: { type: 'string', example: '@GOAL_DELETED_SUCCESSFULLY' },
			},
		},
	})
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 404, description: 'Goal not found' })
	async remove(@Param('id') id: string, @Req() req: any) {
		return this.goalsService.remove(req.user.userId, id);
	}

	@Get(':id/progress')
	@ApiOperation({
		summary: 'Get goal progress',
		description: 'Get detailed progress information for a specific goal',
	})
	@ApiParam({ name: 'id', description: 'Goal ID' })
	@ApiResponse({
		status: 200,
		description: 'Goal progress retrieved successfully',
		schema: {
			type: 'object',
			properties: {
				message: { type: 'string', example: '@GOAL_PROGRESS_RETRIEVED' },
				data: {
					type: 'object',
					properties: {
						goalId: { type: 'string', example: 'uuid' },
						currentValue: { type: 'number', example: 15 },
						targetValue: { type: 'number', example: 30 },
						progress: { type: 'number', example: 50.0 },
						status: { type: 'string', example: 'active' },
						daysRemaining: { type: 'number', example: 15 },
						completionDate: { type: 'string', nullable: true },
					},
				},
			},
		},
	})
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 404, description: 'Goal not found' })
	async getProgress(@Param('id') id: string, @Req() req: any) {
		return this.goalsService.getProgress(req.user.userId, id);
	}

	@Post(':id/complete')
	@ApiOperation({
		summary: 'Mark goal as completed',
		description:
			'Manually mark a goal as completed (for admin or special cases)',
	})
	@ApiParam({ name: 'id', description: 'Goal ID' })
	@ApiResponse({
		status: 200,
		description: 'Goal marked as completed successfully',
		schema: {
			type: 'object',
			properties: {
				message: {
					type: 'string',
					example: 'Goal marked as completed successfully',
				},
				data: {
					type: 'object',
					properties: {
						goalId: { type: 'string', example: 'uuid' },
						completedAt: {
							type: 'string',
							example: '2025-01-29T19:30:00.000Z',
						},
					},
				},
			},
		},
	})
	@ApiResponse({
		status: 400,
		description: 'Goal is already completed or invalid',
	})
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 404, description: 'Goal not found' })
	async completeGoal(@Param('id') id: string, @Req() req: any) {
		return this.goalsService.completeGoal(req.user.userId, id);
	}
}
