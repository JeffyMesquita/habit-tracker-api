import { PrismaService } from '@/database/prisma.service';
import API_CODES from '@/misc/API/codes';
import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import {
	DashboardFilterDTO,
	AnalyticsPeriod,
} from './dtos/DashboardFilter.dto';
import { StreaksFilterDTO, StreakType } from './dtos/StreaksFilter.dto';

dayjs.extend(quarterOfYear);

@Injectable()
export class AnalyticsService {
	constructor(private prisma: PrismaService) {}

	async getDashboard(userId: string, filterDto: DashboardFilterDTO) {
		const { period, startDate, endDate, includeHabitDetails, includeTrends } =
			filterDto;

		// Calcular período baseado no filtro
		const dateRange = this.calculateDateRange(period, startDate, endDate);

		// Buscar dados básicos do usuário
		const [totalHabits, activeHabits, totalProgress] = await Promise.all([
			this.getTotalHabits(userId),
			this.getActiveHabits(userId, dateRange),
			this.getTotalProgress(userId, dateRange),
		]);

		// Calcular métricas gerais
		const overallCompletionRate = await this.getOverallCompletionRate(
			userId,
			dateRange,
		);
		const streakStats = await this.getStreakStats(userId);

		// Dados detalhados por hábito (opcional)
		let habitDetails = null;
		if (includeHabitDetails) {
			habitDetails = await this.getHabitDetails(userId, dateRange);
		}

		// Dados de tendências (opcional)
		let trends = null;
		if (includeTrends) {
			trends = await this.getTrends(userId, dateRange);
		}

		return {
			message: 'Dashboard carregado com sucesso!',
			code: API_CODES.success.DASHBOARD_DATA_FOUND,
			data: {
				period: {
					type: period,
					startDate: dateRange.startDate.toISOString().split('T')[0],
					endDate: dateRange.endDate.toISOString().split('T')[0],
				},
				summary: {
					totalHabits,
					activeHabits,
					totalProgress,
					overallCompletionRate,
					streaks: streakStats,
				},
				...(habitDetails && { habitDetails }),
				...(trends && { trends }),
			},
		};
	}

	async getStreaks(userId: string, filterDto: StreaksFilterDTO) {
		const { habitId, type, limit, includeActiveOnly } = filterDto;

		// Base query para buscar hábitos
		const habitWhere: any = {
			userId,
			...(habitId && { id: habitId }),
		};

		const habits = await this.prisma.habit.findMany({
			where: habitWhere,
			include: {
				weekDays: true,
				DailyHabitProgress: {
					orderBy: { date: 'desc' },
					take: 100, // Últimos 100 registros para calcular streaks
				},
			},
			take: limit,
		});

		if (habits.length === 0) {
			return {
				message: 'Nenhum hábito encontrado!',
				code: API_CODES.success.STREAKS_DATA_FOUND,
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
		}

		// Calcular streaks para cada hábito
		const streaksData = habits.map((habit) => {
			const streaks = this.calculateHabitStreaks(habit);
			return {
				habitId: habit.id,
				habitTitle: habit.title,
				currentStreak: streaks.current,
				longestStreak: streaks.longest,
				totalCompletions: habit.DailyHabitProgress.length,
				lastActivity: habit.DailyHabitProgress[0]?.date || null,
				isActive: streaks.current > 0,
				streakHistory: streaks.history,
			};
		});

		// Filtrar apenas streaks ativos se solicitado
		const filteredStreaks = includeActiveOnly
			? streaksData.filter((streak) => streak.isActive)
			: streaksData;

		// Aplicar filtro por tipo
		let finalStreaks = filteredStreaks;
		if (type === StreakType.CURRENT) {
			finalStreaks = filteredStreaks.filter(
				(streak) => streak.currentStreak > 0,
			);
		} else if (type === StreakType.LONGEST) {
			finalStreaks = filteredStreaks
				.sort((a, b) => b.longestStreak - a.longestStreak)
				.slice(0, limit);
		}

		// Calcular estatísticas resumo
		const summary = {
			totalHabits: habits.length,
			activeStreaks: filteredStreaks.filter((s) => s.isActive).length,
			longestStreak: Math.max(
				...filteredStreaks.map((s) => s.longestStreak),
				0,
			),
			averageStreak:
				filteredStreaks.length > 0
					? Math.round(
							filteredStreaks.reduce((acc, s) => acc + s.currentStreak, 0) /
								filteredStreaks.length,
						)
					: 0,
		};

		return {
			message: 'Streaks encontrados com sucesso!',
			code: API_CODES.success.STREAKS_DATA_FOUND,
			data: {
				streaks: finalStreaks,
				summary,
			},
		};
	}

	// Funções auxiliares privadas
	private calculateDateRange(
		period: AnalyticsPeriod,
		startDate?: string,
		endDate?: string,
	) {
		const now = dayjs();

		if (startDate && endDate) {
			return {
				startDate: dayjs(startDate).startOf('day').toDate(),
				endDate: dayjs(endDate).endOf('day').toDate(),
			};
		}

		switch (period) {
			case AnalyticsPeriod.WEEK:
				return {
					startDate: now.startOf('week').toDate(),
					endDate: now.endOf('week').toDate(),
				};
			case AnalyticsPeriod.MONTH:
				return {
					startDate: now.startOf('month').toDate(),
					endDate: now.endOf('month').toDate(),
				};
			case AnalyticsPeriod.QUARTER:
				return {
					startDate: now.startOf('quarter').toDate(),
					endDate: now.endOf('quarter').toDate(),
				};
			case AnalyticsPeriod.YEAR:
				return {
					startDate: now.startOf('year').toDate(),
					endDate: now.endOf('year').toDate(),
				};
			case AnalyticsPeriod.ALL:
			default:
				return {
					startDate: new Date('2024-01-01'),
					endDate: now.endOf('day').toDate(),
				};
		}
	}

	private async getTotalHabits(userId: string): Promise<number> {
		return this.prisma.habit.count({
			where: { userId },
		});
	}

	private async getActiveHabits(
		userId: string,
		dateRange: { startDate: Date; endDate: Date },
	): Promise<number> {
		return this.prisma.habit.count({
			where: {
				userId,
				DailyHabitProgress: {
					some: {
						date: {
							gte: dateRange.startDate,
							lte: dateRange.endDate,
						},
					},
				},
			},
		});
	}

	private async getTotalProgress(
		userId: string,
		dateRange: { startDate: Date; endDate: Date },
	): Promise<number> {
		const result = await this.prisma.dailyHabitProgress.aggregate({
			where: {
				userId,
				date: {
					gte: dateRange.startDate,
					lte: dateRange.endDate,
				},
			},
			_sum: {
				completedCount: true,
			},
		});

		return result._sum.completedCount || 0;
	}

	private async getOverallCompletionRate(
		userId: string,
		dateRange: { startDate: Date; endDate: Date },
	): Promise<number> {
		const totalProgress = await this.prisma.dailyHabitProgress.findMany({
			where: {
				userId,
				date: {
					gte: dateRange.startDate,
					lte: dateRange.endDate,
				},
			},
			include: {
				habit: true,
			},
		});

		if (totalProgress.length === 0) return 0;

		const totalPossible = totalProgress.reduce(
			(acc, progress) => acc + progress.habit.frequency,
			0,
		);
		const totalCompleted = totalProgress.reduce(
			(acc, progress) => acc + progress.completedCount,
			0,
		);

		return totalPossible > 0
			? Math.round((totalCompleted / totalPossible) * 100)
			: 0;
	}

	private async getStreakStats(userId: string) {
		const habits = await this.prisma.habit.findMany({
			where: { userId },
			include: {
				DailyHabitProgress: {
					orderBy: { date: 'desc' },
					take: 30,
				},
			},
		});

		const streaks = habits.map((habit) => {
			const calculatedStreaks = this.calculateHabitStreaks(habit);
			return {
				current: calculatedStreaks.current,
				longest: calculatedStreaks.longest,
			};
		});

		return {
			currentStreaks: streaks.filter((s) => s.current > 0).length,
			longestOverall: Math.max(...streaks.map((s) => s.longest), 0),
			averageCurrent:
				streaks.length > 0
					? Math.round(
							streaks.reduce((acc, s) => acc + s.current, 0) / streaks.length,
						)
					: 0,
		};
	}

	private async getHabitDetails(
		userId: string,
		dateRange: { startDate: Date; endDate: Date },
	) {
		const habits = await this.prisma.habit.findMany({
			where: { userId },
			include: {
				DailyHabitProgress: {
					where: {
						date: {
							gte: dateRange.startDate,
							lte: dateRange.endDate,
						},
					},
					orderBy: { date: 'desc' },
				},
				weekDays: true,
			},
		});

		return habits.map((habit) => {
			const totalDays = habit.DailyHabitProgress.length;
			const completedCount = habit.DailyHabitProgress.reduce(
				(acc, p) => acc + p.completedCount,
				0,
			);
			const possibleCount = totalDays * habit.frequency;

			return {
				id: habit.id,
				title: habit.title,
				frequency: habit.frequency,
				completionRate:
					possibleCount > 0
						? Math.round((completedCount / possibleCount) * 100)
						: 0,
				totalDays,
				completedCount,
				lastActivity: habit.DailyHabitProgress[0]?.date || null,
				streak: this.calculateHabitStreaks(habit).current,
			};
		});
	}

	private async getTrends(
		userId: string,
		dateRange: { startDate: Date; endDate: Date },
	) {
		// Dividir período em semanas para análise de tendência
		const weeks = [];
		let currentDate = dayjs(dateRange.startDate);
		const endDate = dayjs(dateRange.endDate);

		while (currentDate.isBefore(endDate)) {
			const weekStart = currentDate.startOf('week').toDate();
			const weekEnd = currentDate.endOf('week').toDate();

			const weekProgress = await this.getTotalProgress(userId, {
				startDate: weekStart,
				endDate: weekEnd,
			});

			weeks.push({
				week: currentDate.format('YYYY-[W]WW'),
				startDate: weekStart.toISOString().split('T')[0],
				endDate: weekEnd.toISOString().split('T')[0],
				totalProgress: weekProgress,
			});

			currentDate = currentDate.add(1, 'week');
		}

		return {
			weeklyProgress: weeks,
			trend:
				weeks.length > 1
					? weeks[weeks.length - 1].totalProgress > weeks[0].totalProgress
						? 'up'
						: weeks[weeks.length - 1].totalProgress < weeks[0].totalProgress
							? 'down'
							: 'stable'
					: 'stable',
		};
	}

	private calculateHabitStreaks(habit: any) {
		const progressDates = habit.DailyHabitProgress.map((p: any) =>
			dayjs(p.date),
		).sort((a: any, b: any) => b.diff(a));

		if (progressDates.length === 0) {
			return { current: 0, longest: 0, history: [] };
		}

		let currentStreak = 0;
		let longestStreak = 0;
		let tempStreak = 0;
		let lastDate = dayjs();

		// Verificar se há atividade hoje ou ontem para streak atual
		const today = dayjs().startOf('day');
		const yesterday = today.subtract(1, 'day');
		const latestActivity = progressDates[0];

		if (
			latestActivity.isSame(today, 'day') ||
			latestActivity.isSame(yesterday, 'day')
		) {
			currentStreak = 1;
			tempStreak = 1;
			lastDate = latestActivity;

			// Contar dias consecutivos para trás
			for (let i = 1; i < progressDates.length; i++) {
				const currentDate = progressDates[i];
				const expectedDate = lastDate.subtract(1, 'day');

				if (currentDate.isSame(expectedDate, 'day')) {
					currentStreak++;
					tempStreak++;
					lastDate = currentDate;
				} else {
					break;
				}
			}
		}

		// Calcular streak mais longo
		tempStreak = 0;
		for (let i = 0; i < progressDates.length; i++) {
			if (i === 0) {
				tempStreak = 1;
			} else {
				const currentDate = progressDates[i];
				const previousDate = progressDates[i - 1];

				if (previousDate.diff(currentDate, 'day') === 1) {
					tempStreak++;
				} else {
					longestStreak = Math.max(longestStreak, tempStreak);
					tempStreak = 1;
				}
			}
		}
		longestStreak = Math.max(longestStreak, tempStreak);

		return {
			current: currentStreak,
			longest: longestStreak,
			history: progressDates.map((date: any) => date.format('YYYY-MM-DD')),
		};
	}
}
