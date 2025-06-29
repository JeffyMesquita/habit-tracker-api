import { Controller, Get, Query, Req } from '@nestjs/common';
import {
	ApiTags,
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiQuery,
} from '@nestjs/swagger';
import { Auth } from '@/guards/useAuth';
import { JwtPayload } from '@/@types/JwtPayload';
import { AnalyticsService } from './analytics.service';
import {
	DashboardFilterDTO,
	AnalyticsPeriod,
} from './dtos/DashboardFilter.dto';
import { StreaksFilterDTO, StreakType } from './dtos/StreaksFilter.dto';

@ApiTags('Analytics')
@ApiBearerAuth()
@Auth()
@Controller('/app/analytics')
export class AnalyticsController {
	constructor(private readonly analyticsService: AnalyticsService) {}

	@Get('dashboard')
	@ApiOperation({
		summary: 'Obter dashboard de analytics',
		description:
			'Retorna métricas consolidadas do usuário incluindo progresso geral, estatísticas e tendências',
	})
	@ApiQuery({
		name: 'period',
		enum: AnalyticsPeriod,
		required: false,
		description: 'Período para análise dos dados',
		example: AnalyticsPeriod.MONTH,
	})
	@ApiQuery({
		name: 'startDate',
		required: false,
		description: 'Data de início customizada (YYYY-MM-DD)',
		example: '2024-01-01',
	})
	@ApiQuery({
		name: 'endDate',
		required: false,
		description: 'Data de fim customizada (YYYY-MM-DD)',
		example: '2024-12-31',
	})
	@ApiQuery({
		name: 'includeHabitDetails',
		required: false,
		type: Boolean,
		description: 'Incluir detalhes por hábito',
		example: true,
	})
	@ApiQuery({
		name: 'includeTrends',
		required: false,
		type: Boolean,
		description: 'Incluir análise de tendências',
		example: false,
	})
	@ApiResponse({
		status: 200,
		description: 'Dashboard carregado com sucesso',
		schema: {
			type: 'object',
			properties: {
				message: { type: 'string' },
				code: { type: 'string' },
				data: {
					type: 'object',
					properties: {
						period: {
							type: 'object',
							properties: {
								type: { type: 'string' },
								startDate: { type: 'string' },
								endDate: { type: 'string' },
							},
						},
						summary: {
							type: 'object',
							properties: {
								totalHabits: { type: 'number' },
								activeHabits: { type: 'number' },
								totalProgress: { type: 'number' },
								overallCompletionRate: { type: 'number' },
								streaks: {
									type: 'object',
									properties: {
										currentStreaks: { type: 'number' },
										longestOverall: { type: 'number' },
										averageCurrent: { type: 'number' },
									},
								},
							},
						},
						habitDetails: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									id: { type: 'string' },
									title: { type: 'string' },
									frequency: { type: 'number' },
									completionRate: { type: 'number' },
									totalDays: { type: 'number' },
									completedCount: { type: 'number' },
									lastActivity: { type: 'string', nullable: true },
									streak: { type: 'number' },
								},
							},
						},
						trends: {
							type: 'object',
							properties: {
								weeklyProgress: {
									type: 'array',
									items: {
										type: 'object',
										properties: {
											week: { type: 'string' },
											startDate: { type: 'string' },
											endDate: { type: 'string' },
											totalProgress: { type: 'number' },
										},
									},
								},
								trend: { type: 'string', enum: ['up', 'down', 'stable'] },
							},
						},
					},
				},
			},
		},
	})
	@ApiResponse({
		status: 401,
		description: 'Token inválido ou ausente',
	})
	async getDashboard(
		@Req() req: Request,
		@Query() filterDto: DashboardFilterDTO,
	) {
		const { userId } = req['user'] as JwtPayload;
		return this.analyticsService.getDashboard(userId, filterDto);
	}

	@Get('streaks')
	@ApiOperation({
		summary: 'Obter streaks dos hábitos',
		description:
			'Retorna informações sobre sequências (streaks) dos hábitos do usuário, incluindo streak atual e mais longo',
	})
	@ApiQuery({
		name: 'habitId',
		required: false,
		description: 'ID específico do hábito para analisar',
		example: 'uuid-do-habito',
	})
	@ApiQuery({
		name: 'type',
		enum: StreakType,
		required: false,
		description: 'Tipo de streak para retornar',
		example: StreakType.ALL,
	})
	@ApiQuery({
		name: 'limit',
		required: false,
		type: Number,
		description: 'Limite de resultados',
		example: 10,
	})
	@ApiQuery({
		name: 'includeActiveOnly',
		required: false,
		type: Boolean,
		description: 'Incluir apenas streaks ativos',
		example: false,
	})
	@ApiResponse({
		status: 200,
		description: 'Streaks encontrados com sucesso',
		schema: {
			type: 'object',
			properties: {
				message: { type: 'string' },
				code: { type: 'string' },
				data: {
					type: 'object',
					properties: {
						streaks: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									habitId: { type: 'string' },
									habitTitle: { type: 'string' },
									currentStreak: { type: 'number' },
									longestStreak: { type: 'number' },
									totalCompletions: { type: 'number' },
									lastActivity: { type: 'string', nullable: true },
									isActive: { type: 'boolean' },
									streakHistory: {
										type: 'array',
										items: { type: 'string' },
									},
								},
							},
						},
						summary: {
							type: 'object',
							properties: {
								totalHabits: { type: 'number' },
								activeStreaks: { type: 'number' },
								longestStreak: { type: 'number' },
								averageStreak: { type: 'number' },
							},
						},
					},
				},
			},
		},
	})
	@ApiResponse({
		status: 401,
		description: 'Token inválido ou ausente',
	})
	async getStreaks(@Req() req: Request, @Query() filterDto: StreaksFilterDTO) {
		const { userId } = req['user'] as JwtPayload;
		return this.analyticsService.getStreaks(userId, filterDto);
	}
}
