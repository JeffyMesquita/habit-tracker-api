import { PrismaService } from '@/database/prisma.service';
import API_CODES from '@/misc/API/codes';
import {
	BadRequestException,
	Injectable,
	NotFoundException,
	ConflictException,
} from '@nestjs/common';
import dayjs from 'dayjs';
import { CreateHabitDTO } from './dtos/CreateHabit.dto';
import { UpdateHabitDTO } from './dtos/UpdateHabit.dto';
import { RecordProgressDTO } from './dtos/RecordProgress.dto';
import { FilterHabitsDTO, HabitFilterPeriod } from './dtos/FilterHabits.dto';
import { AchievementsService } from '@/modules/app/achievements/achievements.service';
import { GoalsService } from '@/modules/app/goals/goals.service';

@Injectable()
export class HabitsService {
	constructor(
		private prisma: PrismaService,
		private achievementsService: AchievementsService,
		private goalsService: GoalsService,
	) {}

	async createHabit(userId: string, createHabitDto: CreateHabitDTO) {
		const { title, frequency = 1, weekDays, moment } = createHabitDto;

		// Verificar se já existe um hábito com o mesmo título para este usuário
		const existingHabit = await this.prisma.habit.findFirst({
			where: {
				userId,
				title,
			},
		});

		if (existingHabit) {
			throw new BadRequestException({
				message: 'Já existe um hábito com este título!',
				code: API_CODES.error.HABIT_ALREADY_EXISTS,
			});
		}

		const result = await this.prisma.$transaction(async (ctx) => {
			// Criar o hábito
			const habit = await ctx.habit.create({
				data: {
					title,
					frequency,
					moment: moment ? dayjs(moment, 'HH:mm').toDate() : null,
					userId,
					createdAt: new Date(),
				},
			});

			// Criar os dias da semana para o hábito
			if (weekDays && weekDays.length > 0) {
				await ctx.habitWeekDays.createMany({
					data: weekDays.map((weekDay) => ({
						habitId: habit.id,
						weekDay,
					})),
				});
			}

			return habit;
		});

		// Integrar com achievements na criação de hábito
		await this.achievementsService.handleHabitCreation(userId, result.id);

		return {
			message: 'Hábito criado com sucesso!',
			code: API_CODES.success.HABIT_CREATED_SUCCESSFULLY,
			data: {
				habit: result,
			},
		};
	}

	async getHabits(userId: string, filterDto?: FilterHabitsDTO) {
		const { period, date, includeProgress } = filterDto || {};

		let dateFilter = {};
		const currentDate = dayjs();

		// Aplicar filtros de período
		if (period === HabitFilterPeriod.TODAY || date) {
			const targetDate = date ? dayjs(date) : currentDate;
			const weekDay = targetDate.day();

			// Buscar hábitos que devem ser feitos no dia específico
			dateFilter = {
				weekDays: {
					some: {
						weekDay,
					},
				},
			};
		} else if (period === HabitFilterPeriod.WEEK) {
			// Para a semana, buscar todos os hábitos (o frontend pode filtrar por dia)
			dateFilter = {};
		}

		const habits = await this.prisma.habit.findMany({
			where: {
				userId,
				...dateFilter,
			},
			include: {
				weekDays: true,
				DailyHabitProgress: includeProgress
					? {
							where: date
								? {
										date: {
											gte: dayjs(date).startOf('day').toDate(),
											lte: dayjs(date).endOf('day').toDate(),
										},
									}
								: undefined,
							orderBy: {
								date: 'desc',
							},
						}
					: false,
			},
			orderBy: {
				createdAt: 'desc',
			},
		});

		return {
			message: 'Hábitos encontrados!',
			code: API_CODES.success.HABITS_FOUND,
			data: {
				habits,
				total: habits.length,
				date: date || currentDate.format('YYYY-MM-DD'),
			},
		};
	}

	async getHabitById(userId: string, habitId: string) {
		const habit = await this.prisma.habit.findFirst({
			where: {
				id: habitId,
				userId,
			},
			include: {
				weekDays: true,
				DailyHabitProgress: {
					orderBy: {
						date: 'desc',
					},
					take: 30, // Últimos 30 dias
				},
			},
		});

		if (!habit) {
			throw new NotFoundException({
				message: 'Hábito não encontrado!',
				code: API_CODES.error.HABIT_NOT_FOUND,
			});
		}

		return {
			message: 'Hábito encontrado!',
			code: API_CODES.success.HABIT_FOUND,
			data: {
				habit,
			},
		};
	}

	async updateHabit(
		userId: string,
		habitId: string,
		updateHabitDto: UpdateHabitDTO,
	) {
		const { title, frequency, weekDays, moment } = updateHabitDto;

		// Verificar se o hábito existe e pertence ao usuário
		const existingHabit = await this.prisma.habit.findFirst({
			where: {
				id: habitId,
				userId,
			},
		});

		if (!existingHabit) {
			throw new NotFoundException({
				message: 'Hábito não encontrado!',
				code: API_CODES.error.HABIT_NOT_FOUND,
			});
		}

		// Verificar se o novo título já existe (se está sendo alterado)
		if (title && title !== existingHabit.title) {
			const titleExists = await this.prisma.habit.findFirst({
				where: {
					userId,
					title,
					id: {
						not: habitId,
					},
				},
			});

			if (titleExists) {
				throw new BadRequestException({
					message: 'Já existe um hábito com este título!',
					code: API_CODES.error.HABIT_ALREADY_EXISTS,
				});
			}
		}

		const result = await this.prisma.$transaction(async (ctx) => {
			// Atualizar o hábito
			const updatedHabit = await ctx.habit.update({
				where: {
					id: habitId,
				},
				data: {
					...(title && { title }),
					...(frequency !== undefined && { frequency }),
					...(moment !== undefined && {
						moment: moment ? dayjs(moment, 'HH:mm').toDate() : null,
					}),
					updatedAt: new Date(),
				},
			});

			// Atualizar dias da semana se fornecidos
			if (weekDays !== undefined) {
				// Deletar dias existentes
				await ctx.habitWeekDays.deleteMany({
					where: {
						habitId,
					},
				});

				// Criar novos dias
				if (weekDays.length > 0) {
					await ctx.habitWeekDays.createMany({
						data: weekDays.map((weekDay) => ({
							habitId,
							weekDay,
						})),
					});
				}
			}

			return updatedHabit;
		});

		return {
			message: 'Hábito atualizado com sucesso!',
			code: API_CODES.success.HABIT_UPDATED_SUCCESSFULLY,
			data: {
				habit: result,
			},
		};
	}

	async deleteHabit(userId: string, habitId: string) {
		// Verificar se o hábito existe e pertence ao usuário
		const existingHabit = await this.prisma.habit.findFirst({
			where: {
				id: habitId,
				userId,
			},
		});

		if (!existingHabit) {
			throw new NotFoundException({
				message: 'Hábito não encontrado!',
				code: API_CODES.error.HABIT_NOT_FOUND,
			});
		}

		await this.prisma.$transaction(async (ctx) => {
			// Deletar dias da semana
			await ctx.habitWeekDays.deleteMany({
				where: {
					habitId,
				},
			});

			// Deletar progresso diário
			await ctx.dailyHabitProgress.deleteMany({
				where: {
					habitId,
				},
			});

			// Deletar day habits
			await ctx.dayHabit.deleteMany({
				where: {
					habitId,
				},
			});

			// Deletar o hábito
			await ctx.habit.delete({
				where: {
					id: habitId,
				},
			});
		});

		return {
			message: 'Hábito deletado com sucesso!',
			code: API_CODES.success.HABIT_DELETED_SUCCESSFULLY,
		};
	}

	async recordProgress(
		userId: string,
		habitId: string,
		recordProgressDto: RecordProgressDTO,
	) {
		const { completedCount, date } = recordProgressDto;
		const targetDate = date ? dayjs(date) : dayjs();

		// Verificar se o hábito existe e pertence ao usuário
		const habit = await this.prisma.habit.findFirst({
			where: {
				id: habitId,
				userId,
			},
		});

		if (!habit) {
			throw new NotFoundException({
				message: 'Hábito não encontrado!',
				code: API_CODES.error.HABIT_NOT_FOUND,
			});
		}

		// Verificar se já existe progresso para esta data
		const existingProgress = await this.prisma.dailyHabitProgress.findFirst({
			where: {
				habitId,
				userId,
				date: {
					gte: targetDate.startOf('day').toDate(),
					lte: targetDate.endOf('day').toDate(),
				},
			},
		});

		let result;

		if (existingProgress) {
			// Atualizar progresso existente
			result = await this.prisma.dailyHabitProgress.update({
				where: {
					id: existingProgress.id,
				},
				data: {
					completedCount,
				},
			});
		} else {
			// Criar novo progresso
			result = await this.prisma.dailyHabitProgress.create({
				data: {
					userId,
					habitId,
					date: targetDate.toDate(),
					completedCount,
				},
			});
		}

		// Integrar com achievements
		await this.achievementsService.handleProgressUpdate(
			userId,
			habitId,
			completedCount,
		);

		// Verificar se alguma meta foi completada
		await this.goalsService.checkGoalCompletions(userId, habitId);

		return {
			message: 'Progresso registrado com sucesso!',
			code: API_CODES.success.HABIT_PROGRESS_RECORDED,
			data: {
				progress: result,
			},
		};
	}

	async getHabitProgress(
		userId: string,
		habitId: string,
		startDate?: string,
		endDate?: string,
	) {
		// Verificar se o hábito existe e pertence ao usuário
		const habit = await this.prisma.habit.findFirst({
			where: {
				id: habitId,
				userId,
			},
		});

		if (!habit) {
			throw new NotFoundException({
				message: 'Hábito não encontrado!',
				code: API_CODES.error.HABIT_NOT_FOUND,
			});
		}

		const start = startDate ? dayjs(startDate) : dayjs().subtract(30, 'days');
		const end = endDate ? dayjs(endDate) : dayjs();

		const progress = await this.prisma.dailyHabitProgress.findMany({
			where: {
				habitId,
				userId,
				date: {
					gte: start.startOf('day').toDate(),
					lte: end.endOf('day').toDate(),
				},
			},
			orderBy: {
				date: 'desc',
			},
		});

		// Calcular estatísticas
		const totalDays = progress.length;
		const completedDays = progress.filter((p) => p.completedCount > 0).length;
		const completionRate =
			totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

		return {
			message: 'Progresso do hábito encontrado!',
			code: API_CODES.success.HABIT_PROGRESS_FOUND,
			data: {
				habit: {
					id: habit.id,
					title: habit.title,
					frequency: habit.frequency,
				},
				progress,
				statistics: {
					totalDays,
					completedDays,
					completionRate: Math.round(completionRate * 100) / 100,
					period: {
						start: start.format('YYYY-MM-DD'),
						end: end.format('YYYY-MM-DD'),
					},
				},
			},
		};
	}
}
