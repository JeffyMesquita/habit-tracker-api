import {
	Controller,
	Get,
	Post,
	Param,
	Query,
	Body,
	Req,
	UseGuards,
	ParseUUIDPipe,
} from '@nestjs/common';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
	ApiParam,
	ApiQuery,
} from '@nestjs/swagger';
import { AchievementsService } from './achievements.service';
import { UnlockAchievementDTO } from './dtos/UnlockAchievement.dto';
import { FilterAchievementsDTO } from './dtos/FilterAchievements.dto';
import { UseAuth } from '@/guards/useAuth';

@ApiTags('Achievements - Sistema de Conquistas')
@ApiBearerAuth()
@UseGuards(UseAuth)
@Controller('app/achievements')
export class AchievementsController {
	constructor(private readonly achievementsService: AchievementsService) {}

	@Post('unlock')
	@ApiOperation({
		summary: 'Desbloquear uma conquista',
		description: 'Desbloqueia manualmente uma conquista para o usuário.',
	})
	@ApiResponse({
		status: 201,
		description: 'Conquista desbloqueada com sucesso',
	})
	@ApiResponse({
		status: 400,
		description: 'Condições da conquista não atendidas',
	})
	@ApiResponse({ status: 409, description: 'Conquista já desbloqueada' })
	async unlock(@Body() unlockDto: UnlockAchievementDTO, @Req() req: any) {
		return this.achievementsService.unlock(req.user.userId, unlockDto);
	}

	@Get()
	@ApiOperation({
		summary: 'Listar conquistas do usuário',
		description: 'Retorna todas as conquistas desbloqueadas pelo usuário.',
	})
	@ApiQuery({
		name: 'achievementType',
		required: false,
		description: 'Filtrar por tipo',
	})
	@ApiQuery({ name: 'fromDate', required: false, description: 'Data inicial' })
	@ApiQuery({ name: 'toDate', required: false, description: 'Data final' })
	@ApiQuery({
		name: 'limit',
		required: false,
		description: 'Limite de resultados',
	})
	@ApiQuery({ name: 'offset', required: false, description: 'Deslocamento' })
	@ApiResponse({ status: 200, description: 'Lista de conquistas encontrada' })
	async findAll(@Query() filterDto: FilterAchievementsDTO, @Req() req: any) {
		return this.achievementsService.findAll(req.user.userId, filterDto);
	}

	@Get('stats')
	@ApiOperation({
		summary: 'Estatísticas de conquistas do usuário',
		description: 'Retorna estatísticas completas das conquistas do usuário.',
	})
	@ApiResponse({ status: 200, description: 'Estatísticas de conquistas' })
	async getUserStats(@Req() req: any) {
		return this.achievementsService.getUserStats(req.user.userId);
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Detalhes de uma conquista específica',
		description:
			'Retorna informações detalhadas sobre uma conquista específica.',
	})
	@ApiParam({ name: 'id', type: 'string', description: 'ID da conquista' })
	@ApiResponse({ status: 200, description: 'Detalhes da conquista' })
	@ApiResponse({ status: 404, description: 'Conquista não encontrada' })
	async findOne(
		@Param('id', ParseUUIDPipe) achievementId: string,
		@Req() req: any,
	) {
		return this.achievementsService.findOne(req.user.userId, achievementId);
	}
}
