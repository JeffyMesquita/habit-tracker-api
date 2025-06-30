import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import {
	GenerateReportDTO,
	ReportType,
	ReportFormat,
} from './dtos/GenerateReport.dto';
import API_CODES from '@/misc/API/codes';

@Injectable()
export class ReportsService {
	constructor(private readonly prisma: PrismaService) {}

	async generateReport(userId: string, generateDto: GenerateReportDTO) {
		const {
			reportType,
			startDate,
			endDate,
			habitIds,
			format = 'json',
		} = generateDto;

		// Validate dates for custom reports
		if (reportType === ReportType.CUSTOM) {
			if (!startDate || !endDate) {
				throw new BadRequestException(API_CODES.error.INVALID_REPORT_PERIOD);
			}

			const start = new Date(startDate);
			const end = new Date(endDate);

			if (start >= end) {
				throw new BadRequestException(API_CODES.error.INVALID_REPORT_PERIOD);
			}
		}

		// Calculate report period
		const period = this.calculateReportPeriod(reportType, startDate, endDate);

		// Generate comprehensive report data
		const reportData = await this.generateReportData(
			userId,
			period,
			habitIds,
			generateDto,
		);

		return {
			message: this.getSuccessMessage(reportType),
			data: {
				period,
				generatedAt: new Date(),
				format,
				...reportData,
			},
		};
	}

	async getWeeklyReport(userId: string, weekOffset: number = 0) {
		const now = new Date();
		const startOfWeek = new Date(now);
		startOfWeek.setDate(now.getDate() - now.getDay() - weekOffset * 7);
		startOfWeek.setHours(0, 0, 0, 0);

		const endOfWeek = new Date(startOfWeek);
		endOfWeek.setDate(startOfWeek.getDate() + 6);
		endOfWeek.setHours(23, 59, 59, 999);

		const period = { startDate: startOfWeek, endDate: endOfWeek };
		const reportData = await this.generateReportData(userId, period);

		return {
			message: API_CODES.success.WEEKLY_REPORT_GENERATED,
			data: {
				period,
				weekNumber: this.getWeekNumber(startOfWeek),
				...reportData,
			},
		};
	}

	async getMonthlyReport(userId: string, monthOffset: number = 0) {
		const now = new Date();
		const targetDate = new Date(
			now.getFullYear(),
			now.getMonth() - monthOffset,
			1,
		);

		const startOfMonth = new Date(
			targetDate.getFullYear(),
			targetDate.getMonth(),
			1,
		);
		const endOfMonth = new Date(
			targetDate.getFullYear(),
			targetDate.getMonth() + 1,
			0,
		);
		endOfMonth.setHours(23, 59, 59, 999);

		const period = { startDate: startOfMonth, endDate: endOfMonth };
		const reportData = await this.generateReportData(userId, period);

		return {
			message: API_CODES.success.MONTHLY_REPORT_GENERATED,
			data: {
				period,
				month: startOfMonth.toLocaleDateString('pt-BR', {
					month: 'long',
					year: 'numeric',
				}),
				...reportData,
			},
		};
	}

	async exportReport(userId: string, reportData: any, format: ReportFormat) {
		try {
			switch (format) {
				case ReportFormat.JSON:
					return this.exportToJSON(reportData);
				case ReportFormat.CSV:
					return this.exportToCSV(reportData);
				case ReportFormat.PDF:
					return this.exportToPDF();
				default:
					return this.exportToJSON(reportData);
			}
		} catch (error) {
			throw new BadRequestException(API_CODES.error.REPORT_EXPORT_FAILED);
		}
	}

	private async generateReportData(
		userId: string,
		period: { startDate: Date; endDate: Date },
		habitIds?: string[],
		options?: Partial<GenerateReportDTO>,
	) {
		// Base habit filter
		const habitFilter: any = {
			userId,
			...(habitIds && habitIds.length > 0 ? { id: { in: habitIds } } : {}),
		};

		// Get habits data with correct relations
		const habits = await this.prisma.habit.findMany({
			where: habitFilter,
			include: {
				DailyHabitProgress: {
					where: {
						date: {
							gte: period.startDate,
							lte: period.endDate,
						},
					},
				},
				HabitStreak: {
					where: {
						OR: [
							{ endDate: null }, // Current streaks
							{
								endDate: {
									gte: period.startDate,
									lte: period.endDate,
								},
							},
						],
					},
				},
			},
		});

		// Calculate habit metrics
		const habitMetrics = habits.map((habit) => {
			const progress = habit.DailyHabitProgress;
			const completed = progress.filter((p) => p.completedCount > 0).length;
			const total = progress.length;
			const completionRate = total > 0 ? (completed / total) * 100 : 0;

			return {
				id: habit.id,
				name: habit.title,
				category: habit.category || 'Geral',
				daysCompleted: completed,
				totalDays: total,
				completionRate: Math.round(completionRate * 100) / 100,
				currentStreak: this.calculateCurrentStreak(habit.HabitStreak),
				longestStreak: this.calculateLongestStreak(habit.HabitStreak),
			};
		});

		// Overall statistics
		const totalHabits = habits.length;
		const totalCompletions = habitMetrics.reduce(
			(sum, h) => sum + h.daysCompleted,
			0,
		);
		const totalPossible = habitMetrics.reduce((sum, h) => sum + h.totalDays, 0);
		const overallCompletionRate =
			totalPossible > 0 ? (totalCompletions / totalPossible) * 100 : 0;

		// Best and worst habits
		const sortedByCompletion = [...habitMetrics].sort(
			(a, b) => b.completionRate - a.completionRate,
		);
		const bestHabits = sortedByCompletion.slice(0, 3);
		const worstHabits = sortedByCompletion.slice(-3).reverse();

		// Weekly trends (if applicable)
		const weeklyTrends = await this.calculateWeeklyTrends(
			userId,
			period,
			habitIds,
		);

		// Category breakdown
		const categoryBreakdown = this.calculateCategoryBreakdown(habitMetrics);

		const result = {
			summary: {
				totalHabits,
				totalCompletions,
				overallCompletionRate: Math.round(overallCompletionRate * 100) / 100,
				activeDays: this.calculateActiveDays(habits),
				categoryBreakdown,
			},
			habits: habitMetrics,
			insights: {
				bestPerformingHabits: bestHabits,
				needsAttentionHabits: worstHabits,
				weeklyTrends,
				topCategories: this.getTopCategories(categoryBreakdown),
			},
		};

		// Add achievements if requested
		if (options?.includeAchievements) {
			const achievements = await this.getAchievementsInPeriod(userId, period);
			result['achievements'] = achievements;
		}

		return result;
	}

	private calculateReportPeriod(
		reportType: ReportType,
		startDate?: string,
		endDate?: string,
	) {
		const now = new Date();

		switch (reportType) {
			case ReportType.WEEKLY:
				const startOfWeek = new Date(now);
				startOfWeek.setDate(now.getDate() - now.getDay());
				startOfWeek.setHours(0, 0, 0, 0);
				const endOfWeek = new Date(startOfWeek);
				endOfWeek.setDate(startOfWeek.getDate() + 6);
				endOfWeek.setHours(23, 59, 59, 999);
				return { startDate: startOfWeek, endDate: endOfWeek };

			case ReportType.MONTHLY:
				const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
				const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
				endOfMonth.setHours(23, 59, 59, 999);
				return { startDate: startOfMonth, endDate: endOfMonth };

			case ReportType.QUARTERLY:
				const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
				const startOfQuarter = new Date(
					now.getFullYear(),
					quarterStartMonth,
					1,
				);
				const endOfQuarter = new Date(
					now.getFullYear(),
					quarterStartMonth + 3,
					0,
				);
				endOfQuarter.setHours(23, 59, 59, 999);
				return { startDate: startOfQuarter, endDate: endOfQuarter };

			case ReportType.YEARLY:
				const startOfYear = new Date(now.getFullYear(), 0, 1);
				const endOfYear = new Date(now.getFullYear(), 11, 31);
				endOfYear.setHours(23, 59, 59, 999);
				return { startDate: startOfYear, endDate: endOfYear };

			case ReportType.CUSTOM:
				return {
					startDate: new Date(startDate!),
					endDate: new Date(endDate!),
				};

			default:
				throw new BadRequestException(API_CODES.error.INVALID_REPORT_PERIOD);
		}
	}

	private calculateCurrentStreak(streaks: any[]): number {
		const currentStreak = streaks.find((s) => s.endDate === null);
		return currentStreak ? currentStreak.streakLength || 0 : 0;
	}

	private calculateLongestStreak(streaks: any[]): number {
		return streaks.reduce(
			(max, streak) => Math.max(max, streak.streakLength || 0),
			0,
		);
	}

	private calculateActiveDays(habits: any[]): number {
		const activeDaysSet = new Set<string>();

		habits.forEach((habit) => {
			habit.DailyHabitProgress.forEach((progress) => {
				if (progress.completedCount > 0) {
					// Corrigido: usar completedCount
					activeDaysSet.add(progress.date.toISOString().split('T')[0]);
				}
			});
		});

		return activeDaysSet.size;
	}

	private async calculateWeeklyTrends(
		userId: string,
		period: { startDate: Date; endDate: Date },
		habitIds?: string[],
	) {
		const weeklyData = [];
		const currentDate = new Date(period.startDate);

		while (currentDate <= period.endDate) {
			const weekStart = new Date(currentDate);
			const weekEnd = new Date(currentDate);
			weekEnd.setDate(weekEnd.getDate() + 6);

			if (weekEnd > period.endDate) {
				weekEnd.setTime(period.endDate.getTime());
			}

			const weekCompletions = await this.prisma.dailyHabitProgress.count({
				where: {
					completedCount: { gt: 0 }, // Corrigido: usar completedCount > 0
					date: { gte: weekStart, lte: weekEnd },
					habit: {
						userId,
						...(habitIds && habitIds.length > 0
							? { id: { in: habitIds } }
							: {}),
					},
				},
			});

			weeklyData.push({
				week: `${weekStart.toISOString().split('T')[0]} - ${weekEnd.toISOString().split('T')[0]}`,
				completions: weekCompletions,
			});

			currentDate.setDate(currentDate.getDate() + 7);
		}

		return weeklyData;
	}

	private async getAchievementsInPeriod(
		userId: string,
		period: { startDate: Date; endDate: Date },
	) {
		return await this.prisma.achievements.findMany({
			where: {
				userId,
				timestamp: {
					gte: period.startDate,
					lte: period.endDate,
				},
			},
			orderBy: { timestamp: 'desc' },
		});
	}

	private getWeekNumber(date: Date): number {
		const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
		const pastDaysOfYear =
			(date.getTime() - firstDayOfYear.getTime()) / 86400000;
		return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
	}

	private getSuccessMessage(reportType: ReportType): string {
		switch (reportType) {
			case ReportType.WEEKLY:
				return API_CODES.success.WEEKLY_REPORT_GENERATED;
			case ReportType.MONTHLY:
				return API_CODES.success.MONTHLY_REPORT_GENERATED;
			case ReportType.CUSTOM:
				return API_CODES.success.CUSTOM_REPORT_GENERATED;
			default:
				return API_CODES.success.CUSTOM_REPORT_GENERATED;
		}
	}

	private exportToJSON(data: any) {
		return {
			format: 'json',
			data: JSON.stringify(data, null, 2),
			filename: `habit-report-${new Date().toISOString().split('T')[0]}.json`,
		};
	}

	private exportToCSV(data: any) {
		// Basic CSV export for habit metrics
		const headers = [
			'Habit Name',
			'Category',
			'Days Completed',
			'Total Days',
			'Completion Rate',
		];
		const rows =
			data.habits?.map((h) => [
				h.name,
				h.category,
				h.daysCompleted,
				h.totalDays,
				`${h.completionRate}%`,
			]) || [];

		const csvContent = [headers, ...rows]
			.map((row) => row.map((cell) => `"${cell}"`).join(','))
			.join('\n');

		return {
			format: 'csv',
			data: csvContent,
			filename: `habit-report-${new Date().toISOString().split('T')[0]}.csv`,
		};
	}

	private exportToPDF() {
		// Placeholder for PDF export - would need a PDF library like puppeteer
		return {
			format: 'pdf',
			data: 'PDF export not implemented yet',
			filename: `habit-report-${new Date().toISOString().split('T')[0]}.pdf`,
		};
	}

	private calculateCategoryBreakdown(habitMetrics: any[]) {
		const categoryStats = {};

		habitMetrics.forEach((habit) => {
			const category = habit.category;
			if (!categoryStats[category]) {
				categoryStats[category] = {
					totalHabits: 0,
					completedDays: 0,
					totalDays: 0,
					completionRate: 0,
				};
			}

			categoryStats[category].totalHabits++;
			categoryStats[category].completedDays += habit.daysCompleted;
			categoryStats[category].totalDays += habit.totalDays;
		});

		// Calculate completion rates
		Object.keys(categoryStats).forEach((category) => {
			const stats = categoryStats[category];
			stats.completionRate =
				stats.totalDays > 0
					? Math.round((stats.completedDays / stats.totalDays) * 10000) / 100
					: 0;
		});

		return categoryStats;
	}

	private getTopCategories(categoryBreakdown: any) {
		return Object.entries(categoryBreakdown)
			.map(([category, stats]: [string, any]) => ({
				category,
				completionRate: stats.completionRate,
				totalHabits: stats.totalHabits,
			}))
			.sort((a, b) => b.completionRate - a.completionRate)
			.slice(0, 3);
	}
}
