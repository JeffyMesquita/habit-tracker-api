import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
	Query,
	Req,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiTags,
	ApiQuery,
	ApiParam,
	ApiOperation,
	ApiResponse,
} from '@nestjs/swagger';
import { Auth } from '@/guards/useAuth';
import { HabitsService } from './habits.service';
import { CreateHabitDTO } from './dtos/CreateHabit.dto';
import { UpdateHabitDTO } from './dtos/UpdateHabit.dto';
import { RecordProgressDTO } from './dtos/RecordProgress.dto';
import { FilterHabitsDTO, HabitFilterPeriod } from './dtos/FilterHabits.dto';
import { JwtPayload } from '@/@types/JwtPayload';

@ApiTags('Habits')
@ApiBearerAuth()
@Auth()
@Controller('/app/habits')
export class HabitsController {
	constructor(private readonly habitsService: HabitsService) {}

	@Post()
	@ApiOperation({
		summary: 'Criar novo hábito',
		description: 'Cria um novo hábito para o usuário autenticado',
	})
	@ApiResponse({
		status: 201,
		description: 'Hábito criado com sucesso',
	})
	@ApiResponse({
		status: 400,
		description: 'Hábito com este título já existe',
	})
	async createHabit(
		@Req() req: Request,
		@Body() createHabitDto: CreateHabitDTO,
	) {
		const { userId } = req['user'] as JwtPayload;
		return this.habitsService.createHabit(userId, createHabitDto);
	}

	@Get()
	@ApiOperation({
		summary: 'Listar hábitos',
		description: 'Lista todos os hábitos do usuário com filtros opcionais',
	})
	@ApiQuery({
		name: 'period',
		required: false,
		enum: ['today', 'week', 'month', 'all'],
		description: 'Período para filtrar hábitos',
	})
	@ApiQuery({
		name: 'date',
		required: false,
		example: '2024-12-29',
		description: 'Data específica (YYYY-MM-DD)',
	})
	@ApiQuery({
		name: 'includeProgress',
		required: false,
		type: Boolean,
		description: 'Incluir progresso dos hábitos',
	})
	@ApiResponse({
		status: 200,
		description: 'Hábitos encontrados',
	})
	async getHabits(@Req() req: Request, @Query() filterDto: FilterHabitsDTO) {
		const { userId } = req['user'] as JwtPayload;
		return this.habitsService.getHabits(userId, filterDto);
	}

	@Get('/today')
	@ApiOperation({
		summary: 'Hábitos de hoje',
		description: 'Retorna hábitos que devem ser feitos hoje',
	})
	@ApiResponse({
		status: 200,
		description: 'Hábitos de hoje encontrados',
	})
	async getTodayHabits(@Req() req: Request) {
		const { userId } = req['user'] as JwtPayload;
		return this.habitsService.getHabits(userId, {
			period: HabitFilterPeriod.TODAY,
		});
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Buscar hábito por ID',
		description: 'Retorna um hábito específico com histórico de progresso',
	})
	@ApiParam({
		name: 'id',
		description: 'ID do hábito',
		example: 'uuid',
	})
	@ApiResponse({
		status: 200,
		description: 'Hábito encontrado',
	})
	@ApiResponse({
		status: 404,
		description: 'Hábito não encontrado',
	})
	async getHabitById(@Req() req: Request, @Param('id') habitId: string) {
		const { userId } = req['user'] as JwtPayload;
		return this.habitsService.getHabitById(userId, habitId);
	}

	@Put(':id')
	@ApiOperation({
		summary: 'Atualizar hábito',
		description: 'Atualiza informações de um hábito existente',
	})
	@ApiParam({
		name: 'id',
		description: 'ID do hábito',
		example: 'uuid',
	})
	@ApiResponse({
		status: 200,
		description: 'Hábito atualizado com sucesso',
	})
	@ApiResponse({
		status: 404,
		description: 'Hábito não encontrado',
	})
	@ApiResponse({
		status: 400,
		description: 'Título já existe',
	})
	async updateHabit(
		@Req() req: Request,
		@Param('id') habitId: string,
		@Body() updateHabitDto: UpdateHabitDTO,
	) {
		const { userId } = req['user'] as JwtPayload;
		return this.habitsService.updateHabit(userId, habitId, updateHabitDto);
	}

	@Delete(':id')
	@ApiOperation({
		summary: 'Deletar hábito',
		description: 'Remove um hábito e todo seu histórico de progresso',
	})
	@ApiParam({
		name: 'id',
		description: 'ID do hábito',
		example: 'uuid',
	})
	@ApiResponse({
		status: 200,
		description: 'Hábito deletado com sucesso',
	})
	@ApiResponse({
		status: 404,
		description: 'Hábito não encontrado',
	})
	async deleteHabit(@Req() req: Request, @Param('id') habitId: string) {
		const { userId } = req['user'] as JwtPayload;
		return this.habitsService.deleteHabit(userId, habitId);
	}

	@Post(':id/progress')
	@ApiOperation({
		summary: 'Registrar progresso',
		description: 'Registra ou atualiza o progresso diário de um hábito',
	})
	@ApiParam({
		name: 'id',
		description: 'ID do hábito',
		example: 'uuid',
	})
	@ApiResponse({
		status: 201,
		description: 'Progresso registrado com sucesso',
	})
	@ApiResponse({
		status: 404,
		description: 'Hábito não encontrado',
	})
	async recordProgress(
		@Req() req: Request,
		@Param('id') habitId: string,
		@Body() recordProgressDto: RecordProgressDTO,
	) {
		const { userId } = req['user'] as JwtPayload;
		return this.habitsService.recordProgress(
			userId,
			habitId,
			recordProgressDto,
		);
	}

	@Get(':id/progress')
	@ApiOperation({
		summary: 'Histórico de progresso',
		description:
			'Retorna o histórico de progresso de um hábito com estatísticas',
	})
	@ApiParam({
		name: 'id',
		description: 'ID do hábito',
		example: 'uuid',
	})
	@ApiQuery({
		name: 'startDate',
		required: false,
		example: '2024-11-29',
		description: 'Data inicial (YYYY-MM-DD)',
	})
	@ApiQuery({
		name: 'endDate',
		required: false,
		example: '2024-12-29',
		description: 'Data final (YYYY-MM-DD)',
	})
	@ApiResponse({
		status: 200,
		description: 'Progresso encontrado',
	})
	@ApiResponse({
		status: 404,
		description: 'Hábito não encontrado',
	})
	async getHabitProgress(
		@Req() req: Request,
		@Param('id') habitId: string,
		@Query('startDate') startDate?: string,
		@Query('endDate') endDate?: string,
	) {
		const { userId } = req['user'] as JwtPayload;
		return this.habitsService.getHabitProgress(
			userId,
			habitId,
			startDate,
			endDate,
		);
	}
}
