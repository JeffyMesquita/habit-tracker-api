import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
	console.log('🌱 Iniciando seed do banco de dados...');

	// Limpar dados existentes (em ordem reversa de dependências)
	await prisma.userSurveyResponses.deleteMany();
	await prisma.userInteractions.deleteMany();
	await prisma.userPreferences.deleteMany();
	await prisma.achievements.deleteMany();
	await prisma.userActivityLog.deleteMany();
	await prisma.userGoals.deleteMany();
	await prisma.userMetrics.deleteMany();
	await prisma.userFeedback.deleteMany();
	await prisma.habitStreak.deleteMany();
	await prisma.dailyProgressSummary.deleteMany();
	await prisma.dailyHabitProgress.deleteMany();
	await prisma.dayHabit.deleteMany();
	await prisma.day.deleteMany();
	await prisma.habitWeekDays.deleteMany();
	await prisma.habit.deleteMany();
	await prisma.refreshToken.deleteMany();
	await prisma.resetPassword.deleteMany();
	await prisma.confirmEmail.deleteMany();
	await prisma.premiumSubscription.deleteMany();
	await prisma.address.deleteMany();
	await prisma.profile.deleteMany();
	await prisma.user.deleteMany();
	await prisma.role.deleteMany();

	console.log('🗑️  Dados antigos removidos');

	// 1. Criar Roles
	const roles = await Promise.all([
		prisma.role.create({
			data: {
				name: '@ADMIN',
			},
		}),
		prisma.role.create({
			data: {
				name: '@USER',
			},
		}),
	]);

	console.log('✅ Roles criadas');

	// 2. Criar Usuários
	const hashedPassword = await bcrypt.hash('123456', 10);

	const users = await Promise.all([
		// Admin
		prisma.user.create({
			data: {
				email: 'admin@habittracker.com',
				password: hashedPassword,
				verified: true,
				roleId: roles[0].id, // @ADMIN
			},
		}),
		// Usuário regular ativo
		prisma.user.create({
			data: {
				email: 'joao.silva@email.com',
				password: hashedPassword,
				verified: true,
				roleId: roles[1].id, // @USER
			},
		}),
		// Usuário regular ativo
		prisma.user.create({
			data: {
				email: 'maria.santos@email.com',
				password: hashedPassword,
				verified: true,
				roleId: roles[1].id, // @USER
			},
		}),
		// Usuário iniciante
		prisma.user.create({
			data: {
				email: 'pedro.costa@email.com',
				password: hashedPassword,
				verified: true,
				roleId: roles[1].id, // @USER
			},
		}),
		// Usuário não verificado
		prisma.user.create({
			data: {
				email: 'ana.oliveira@email.com',
				password: hashedPassword,
				verified: false,
				roleId: roles[1].id, // @USER
			},
		}),
	]);

	console.log('✅ Usuários criados');

	// 3. Criar Perfis
	await Promise.all([
		prisma.profile.create({
			data: {
				firstName: 'Admin',
				lastName: 'Sistema',
				bio: 'Administrador do sistema Habit Tracker',
				occupation: 'Desenvolvedor',
				birthdate: new Date('1990-01-01'),
				userId: users[0].id,
			},
		}),
		prisma.profile.create({
			data: {
				firstName: 'João',
				lastName: 'Silva',
				bio: 'Entusiasta de produtividade e desenvolvimento pessoal',
				occupation: 'Engenheiro de Software',
				birthdate: new Date('1992-03-15'),
				avatarUrl:
					'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
				userId: users[1].id,
			},
		}),
		prisma.profile.create({
			data: {
				firstName: 'Maria',
				lastName: 'Santos',
				bio: 'Coach de vida e wellness. Apaixonada por hábitos saudáveis.',
				occupation: 'Life Coach',
				birthdate: new Date('1988-07-22'),
				avatarUrl:
					'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
				userId: users[2].id,
			},
		}),
		prisma.profile.create({
			data: {
				firstName: 'Pedro',
				lastName: 'Costa',
				bio: 'Estudante universitário focado em criar bons hábitos',
				occupation: 'Estudante',
				birthdate: new Date('2001-12-08'),
				userId: users[3].id,
			},
		}),
		prisma.profile.create({
			data: {
				firstName: 'Ana',
				lastName: 'Oliveira',
				bio: 'Designer gráfica em busca de equilíbrio',
				occupation: 'Designer',
				birthdate: new Date('1995-05-30'),
				userId: users[4].id,
			},
		}),
	]);

	console.log('✅ Perfis criados');

	// 4. Criar Endereços
	await Promise.all([
		prisma.address.create({
			data: {
				city: 'São Paulo',
				state: 'SP',
				country: 'Brasil',
				userId: users[0].id,
			},
		}),
		prisma.address.create({
			data: {
				city: 'Rio de Janeiro',
				state: 'RJ',
				country: 'Brasil',
				userId: users[1].id,
			},
		}),
		prisma.address.create({
			data: {
				city: 'Belo Horizonte',
				state: 'MG',
				country: 'Brasil',
				userId: users[2].id,
			},
		}),
		prisma.address.create({
			data: {
				city: 'Porto Alegre',
				state: 'RS',
				country: 'Brasil',
				userId: users[3].id,
			},
		}),
		prisma.address.create({
			data: {
				city: 'Recife',
				state: 'PE',
				country: 'Brasil',
				userId: users[4].id,
			},
		}),
	]);

	console.log('✅ Endereços criados');

	// 5. Criar Assinaturas Premium
	await prisma.premiumSubscription.create({
		data: {
			userId: users[2].id, // Maria (premium user)
			startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 dias atrás
			months: 12,
			renewalDate: new Date(Date.now() + 345 * 24 * 60 * 60 * 1000), // quase 1 ano
			lastRenewal: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
		},
	});

	console.log('✅ Assinaturas criadas');

	// 6. Criar Hábitos
	const habits = await Promise.all([
		// Hábitos do João (usuário ativo)
		prisma.habit.create({
			data: {
				title: 'Exercitar-se',
				frequency: 5, // 5 vezes por semana
				moment: new Date('2024-01-01T06:00:00Z'),
				createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 dias atrás
				userId: users[1].id,
			},
		}),
		prisma.habit.create({
			data: {
				title: 'Ler livros',
				frequency: 7, // todos os dias
				moment: new Date('2024-01-01T20:00:00Z'),
				createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 dias atrás
				userId: users[1].id,
			},
		}),
		prisma.habit.create({
			data: {
				title: 'Meditar',
				frequency: 7,
				moment: new Date('2024-01-01T07:00:00Z'),
				createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
				userId: users[1].id,
			},
		}),

		// Hábitos da Maria (premium user)
		prisma.habit.create({
			data: {
				title: 'Yoga matinal',
				frequency: 6,
				moment: new Date('2024-01-01T06:30:00Z'),
				createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 dias atrás
				userId: users[2].id,
			},
		}),
		prisma.habit.create({
			data: {
				title: 'Gratidão diária',
				frequency: 7,
				moment: new Date('2024-01-01T21:00:00Z'),
				createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 dias atrás
				userId: users[2].id,
			},
		}),
		prisma.habit.create({
			data: {
				title: 'Planejamento semanal',
				frequency: 1,
				moment: new Date('2024-01-01T19:00:00Z'),
				createdAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000), // 75 dias atrás
				userId: users[2].id,
			},
		}),

		// Hábitos do Pedro (iniciante)
		prisma.habit.create({
			data: {
				title: 'Beber água',
				frequency: 7,
				moment: new Date('2024-01-01T08:00:00Z'),
				createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 dias atrás
				userId: users[3].id,
			},
		}),
		prisma.habit.create({
			data: {
				title: 'Estudar programação',
				frequency: 5,
				moment: new Date('2024-01-01T14:00:00Z'),
				createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 dias atrás
				userId: users[3].id,
			},
		}),

		// Hábitos da Ana
		prisma.habit.create({
			data: {
				title: 'Desenhar',
				frequency: 4,
				moment: new Date('2024-01-01T15:00:00Z'),
				createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 dias atrás
				userId: users[4].id,
			},
		}),
	]);

	console.log('✅ Hábitos criados');

	// 7. Criar HabitWeekDays
	await Promise.all([
		// João - Exercitar (seg, ter, qua, qui, sex)
		...Array.from({ length: 5 }, (_, i) =>
			prisma.habitWeekDays.create({
				data: {
					habitId: habits[0].id,
					weekDay: i + 1, // 1-5 (seg-sex)
				},
			}),
		),
		// João - Ler (todos os dias)
		...Array.from({ length: 7 }, (_, i) =>
			prisma.habitWeekDays.create({
				data: {
					habitId: habits[1].id,
					weekDay: i, // 0-6 (dom-sab)
				},
			}),
		),
		// João - Meditar (todos os dias)
		...Array.from({ length: 7 }, (_, i) =>
			prisma.habitWeekDays.create({
				data: {
					habitId: habits[2].id,
					weekDay: i,
				},
			}),
		),
		// Maria - Yoga (seg-sab)
		...Array.from({ length: 6 }, (_, i) =>
			prisma.habitWeekDays.create({
				data: {
					habitId: habits[3].id,
					weekDay: i + 1, // 1-6
				},
			}),
		),
		// Maria - Gratidão (todos os dias)
		...Array.from({ length: 7 }, (_, i) =>
			prisma.habitWeekDays.create({
				data: {
					habitId: habits[4].id,
					weekDay: i,
				},
			}),
		),
		// Maria - Planejamento (domingo)
		prisma.habitWeekDays.create({
			data: {
				habitId: habits[5].id,
				weekDay: 0, // domingo
			},
		}),
		// Pedro - Beber água (todos os dias)
		...Array.from({ length: 7 }, (_, i) =>
			prisma.habitWeekDays.create({
				data: {
					habitId: habits[6].id,
					weekDay: i,
				},
			}),
		),
		// Pedro - Estudar (seg-sex)
		...Array.from({ length: 5 }, (_, i) =>
			prisma.habitWeekDays.create({
				data: {
					habitId: habits[7].id,
					weekDay: i + 1,
				},
			}),
		),
		// Ana - Desenhar (ter, qui, sab, dom)
		...[2, 4, 6, 0].map((day) =>
			prisma.habitWeekDays.create({
				data: {
					habitId: habits[8].id,
					weekDay: day,
				},
			}),
		),
	]);

	console.log('✅ Dias da semana dos hábitos criados');

	// 8. Criar Days (últimos 30 dias)
	const days = [];
	for (let i = 29; i >= 0; i--) {
		const date = new Date();
		date.setDate(date.getDate() - i);
		date.setHours(0, 0, 0, 0);

		const day = await prisma.day.create({
			data: {
				date: date,
			},
		});
		days.push(day);
	}

	console.log('✅ Dias criados');

	// 9. Criar DayHabits (progresso realista)
	const dayHabits = [];

	// Simular progresso para os últimos 30 dias
	for (let i = 0; i < 30; i++) {
		const day = days[i];
		const dayOfWeek = day.date.getDay();

		// João - progresso consistente mas não perfeito
		if (Math.random() > 0.15) {
			// 85% de consistência
			// Exercitar (seg-sex)
			if (dayOfWeek >= 1 && dayOfWeek <= 5 && Math.random() > 0.2) {
				dayHabits.push(
					prisma.dayHabit.create({
						data: { dayId: day.id, habitId: habits[0].id },
					}),
				);
			}
			// Ler (todos os dias)
			if (Math.random() > 0.1) {
				dayHabits.push(
					prisma.dayHabit.create({
						data: { dayId: day.id, habitId: habits[1].id },
					}),
				);
			}
			// Meditar (todos os dias, começou há 30 dias)
			if (i >= 0 && Math.random() > 0.25) {
				dayHabits.push(
					prisma.dayHabit.create({
						data: { dayId: day.id, habitId: habits[2].id },
					}),
				);
			}
		}

		// Maria - usuária premium muito consistente
		if (Math.random() > 0.05) {
			// 95% de consistência
			// Yoga (seg-sab)
			if (dayOfWeek >= 1 && dayOfWeek <= 6 && Math.random() > 0.1) {
				dayHabits.push(
					prisma.dayHabit.create({
						data: { dayId: day.id, habitId: habits[3].id },
					}),
				);
			}
			// Gratidão (todos os dias)
			if (Math.random() > 0.05) {
				dayHabits.push(
					prisma.dayHabit.create({
						data: { dayId: day.id, habitId: habits[4].id },
					}),
				);
			}
			// Planejamento (domingo)
			if (dayOfWeek === 0 && Math.random() > 0.1) {
				dayHabits.push(
					prisma.dayHabit.create({
						data: { dayId: day.id, habitId: habits[5].id },
					}),
				);
			}
		}

		// Pedro - iniciante, progresso crescente
		if (i <= 10) {
			// só começou há 10 dias
			const consistency = Math.min(0.3 + (10 - i) * 0.05, 0.8); // melhora com o tempo
			if (Math.random() < consistency) {
				// Beber água
				if (Math.random() > 0.2) {
					dayHabits.push(
						prisma.dayHabit.create({
							data: { dayId: day.id, habitId: habits[6].id },
						}),
					);
				}
				// Estudar (seg-sex, só começou há 7 dias)
				if (i <= 7 && dayOfWeek >= 1 && dayOfWeek <= 5 && Math.random() > 0.3) {
					dayHabits.push(
						prisma.dayHabit.create({
							data: { dayId: day.id, habitId: habits[7].id },
						}),
					);
				}
			}
		}

		// Ana - inconsistente
		if (i <= 20 && Math.random() > 0.6) {
			// 40% de consistência, só há 20 dias
			// Desenhar (ter, qui, sab, dom)
			if ([2, 4, 6, 0].includes(dayOfWeek) && Math.random() > 0.4) {
				dayHabits.push(
					prisma.dayHabit.create({
						data: { dayId: day.id, habitId: habits[8].id },
					}),
				);
			}
		}
	}

	await Promise.all(dayHabits);
	console.log('✅ Progresso dos hábitos criado');

	// 10. Criar DailyProgressSummary
	const summaryData = [];
	for (let i = 0; i < 30; i++) {
		const date = days[i].date;

		summaryData.push(
			// João
			prisma.dailyProgressSummary.create({
				data: {
					userId: users[1].id,
					date: date,
					totalHabits: 3,
					completedHabits: Math.floor(Math.random() * 3) + 1,
				},
			}),
			// Maria
			prisma.dailyProgressSummary.create({
				data: {
					userId: users[2].id,
					date: date,
					totalHabits: 3,
					completedHabits: Math.floor(Math.random() * 3) + 2, // mais consistente
				},
			}),
		);

		// Pedro (só últimos 10 dias)
		if (i <= 10) {
			summaryData.push(
				prisma.dailyProgressSummary.create({
					data: {
						userId: users[3].id,
						date: date,
						totalHabits: i <= 7 ? 2 : 1, // ganhou um hábito há 7 dias
						completedHabits: Math.floor(Math.random() * 2),
					},
				}),
			);
		}
	}

	await Promise.all(summaryData);
	console.log('✅ Resumos diários criados');

	// 11. Criar HabitStreaks
	await Promise.all([
		prisma.habitStreak.create({
			data: {
				userId: users[1].id, // João
				startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
				endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
			},
		}),
		prisma.habitStreak.create({
			data: {
				userId: users[2].id, // Maria
				startDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
				endDate: new Date(), // streak atual
			},
		}),
		prisma.habitStreak.create({
			data: {
				userId: users[3].id, // Pedro
				startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
				endDate: new Date(),
			},
		}),
	]);

	console.log('✅ Streaks criados');

	// 12. Criar UserMetrics
	await Promise.all([
		prisma.userMetrics.create({
			data: {
				userId: users[1].id, // João
				averageCompletionRate: 0.78,
				longestStreak: 14,
			},
		}),
		prisma.userMetrics.create({
			data: {
				userId: users[2].id, // Maria
				averageCompletionRate: 0.94,
				longestStreak: 45,
			},
		}),
		prisma.userMetrics.create({
			data: {
				userId: users[3].id, // Pedro
				averageCompletionRate: 0.65,
				longestStreak: 5,
			},
		}),
	]);

	console.log('✅ Métricas dos usuários criadas');

	// 13. Criar Achievements
	await Promise.all([
		prisma.achievements.create({
			data: {
				userId: users[1].id,
				achievementType: 'first_habit',
				timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
			},
		}),
		prisma.achievements.create({
			data: {
				userId: users[1].id,
				achievementType: 'week_streak',
				timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
			},
		}),
		prisma.achievements.create({
			data: {
				userId: users[2].id,
				achievementType: 'first_habit',
				timestamp: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
			},
		}),
		prisma.achievements.create({
			data: {
				userId: users[2].id,
				achievementType: 'month_streak',
				timestamp: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
			},
		}),
		prisma.achievements.create({
			data: {
				userId: users[2].id,
				achievementType: 'habit_master',
				timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
			},
		}),
		prisma.achievements.create({
			data: {
				userId: users[3].id,
				achievementType: 'first_habit',
				timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
			},
		}),
	]);

	console.log('✅ Conquistas criadas');

	// 14. Criar UserPreferences
	await Promise.all([
		prisma.userPreferences.create({
			data: {
				userId: users[1].id,
				theme: 'dark',
				notificationSettings: {
					email: true,
					push: true,
					reminderTime: '07:00',
					weeklyReport: true,
				},
			},
		}),
		prisma.userPreferences.create({
			data: {
				userId: users[2].id,
				theme: 'light',
				notificationSettings: {
					email: true,
					push: true,
					reminderTime: '06:30',
					weeklyReport: true,
					achievements: true,
					streakReminders: true,
				},
			},
		}),
		prisma.userPreferences.create({
			data: {
				userId: users[3].id,
				theme: 'auto',
				notificationSettings: {
					email: false,
					push: true,
					reminderTime: '08:00',
				},
			},
		}),
	]);

	console.log('✅ Preferências dos usuários criadas');

	// 15. Criar UserFeedback
	await Promise.all([
		prisma.userFeedback.create({
			data: {
				userId: users[1].id,
				feedbackType: 'feature_request',
				comments:
					'Seria legal ter estatísticas mais detalhadas sobre os hábitos',
				timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
			},
		}),
		prisma.userFeedback.create({
			data: {
				userId: users[2].id,
				feedbackType: 'general',
				comments: 'Adorando o app! Muito útil para manter a consistência.',
				timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
			},
		}),
		prisma.userFeedback.create({
			data: {
				feedbackType: 'bug_report', // feedback anônimo
				comments: 'O gráfico de progresso não está carregando corretamente',
				timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
			},
		}),
	]);

	console.log('✅ Feedback dos usuários criado');

	// 16. Criar alguns registros de autenticação
	await Promise.all([
		prisma.confirmEmail.create({
			data: {
				userId: users[4].id, // Ana (não verificada)
				token: 'confirm_' + Math.random().toString(36).substring(7),
				code: Math.floor(100000 + Math.random() * 900000).toString(),
				attempts: 0,
				expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
			},
		}),
		prisma.refreshToken.create({
			data: {
				userId: users[1].id,
				token: 'refresh_' + Math.random().toString(36).substring(7),
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
			},
		}),
	]);

	console.log('✅ Registros de autenticação criados');

	console.log('\n🎉 Seed completo! Dados inseridos com sucesso:');
	console.log(
		'👥 5 usuários (1 admin, 2 regulares, 1 premium, 1 não verificado)',
	);
	console.log('📋 9 hábitos distribuídos entre os usuários');
	console.log('📊 30 dias de progresso simulado realista com resumos diários');
	console.log('🔥 Streaks e sequências de hábitos');
	console.log('🏆 6 conquistas desbloqueadas');
	console.log('📈 Métricas, preferências e feedback configurados');
	console.log('🔐 Tokens de autenticação e confirmação de email');
	console.log('\n✨ O banco está pronto para uso!');
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error('❌ Erro durante o seed:', e);
		await prisma.$disconnect();
		process.exit(1);
	});
