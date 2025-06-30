import {
	Injectable,
	BadRequestException,
	NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { EmailService } from './services/email.service';
import API_CODES from '@/misc/API/codes';

@Injectable()
export class NotificationsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly emailService: EmailService,
	) {}

	async sendNotification(userId: string, type: string, data: any) {
		try {
			const preferences = await this.getUserPreferences(userId);

			if (!this.isNotificationEnabled(preferences.data, type)) {
				return {
					success: false,
					message: 'Tipo de notificação desabilitado para este usuário',
				};
			}

			const log = await this.prisma.notificationLog.create({
				data: {
					userId,
					type,
					channel: 'email',
					status: 'queued',
					title: data.title || 'Notificação',
					body: data.body || 'Nova notificação disponível',
					createdAt: new Date(),
				},
			});

			if (preferences.data.emailEnabled) {
				await this.sendEmailNotification(userId, type, data, log.id);
			}

			return {
				success: true,
				message: 'Notificação enviada com sucesso',
				code: API_CODES.success.NOTIFICATION_SENT_SUCCESSFULLY,
				data: { notificationId: log.id },
			};
		} catch (error) {
			throw new BadRequestException({
				message: 'Erro ao enviar notificação',
				code: API_CODES.error.NOTIFICATION_SEND_FAILED,
				error: error.message,
			});
		}
	}

	private async sendEmailNotification(
		userId: string,
		type: string,
		data: any,
		logId: string,
	) {
		try {
			const user = await this.prisma.user.findUnique({
				where: { id: userId },
				select: {
					email: true,
					profile: {
						select: { firstName: true },
					},
				},
			});

			if (!user?.email) {
				throw new Error('User email not found');
			}

			const emailData = {
				...data,
				userName: user.profile?.firstName || 'Usuário',
				userEmail: user.email,
			};

			let emailResult;
			switch (type) {
				case 'habit_reminder':
					emailResult = await this.emailService.sendHabitReminder(
						user.email,
						emailData,
					);
					break;
				case 'achievement_unlocked':
					emailResult = await this.emailService.sendAchievementUnlocked(
						user.email,
						emailData,
					);
					break;
				case 'weekly_report':
					emailResult = await this.emailService.sendWeeklyReport(
						user.email,
						emailData,
					);
					break;
				default:
					emailResult = await this.emailService.sendEmail({
						to: user.email,
						subject: data.title || 'Notificação do Habit Tracker',
						template: 'habit-reminder',
						data: emailData,
					});
			}

			await this.prisma.notificationLog.update({
				where: { id: logId },
				data: {
					status: emailResult.success ? 'sent' : 'failed',
					deliveredAt: emailResult.success ? new Date() : null,
					errorMessage: emailResult.error || null,
					providerMessageId: emailResult.messageId || null,
				},
			});
		} catch (error) {
			await this.prisma.notificationLog.update({
				where: { id: logId },
				data: {
					status: 'failed',
					errorMessage: error.message,
				},
			});

			console.error('Email notification failed:', error);
		}
	}

	async getUserPreferences(userId: string) {
		try {
			let preferences = await this.prisma.notificationPreferences.findUnique({
				where: { userId },
			});

			if (!preferences) {
				preferences = await this.prisma.notificationPreferences.create({
					data: {
						userId,
						emailEnabled: true,
						pushEnabled: true,
						habitReminders: true,
						achievements: true,
						weeklyReports: true,
						monthlyReports: true,
						inactivityAlerts: true,
						streakWarnings: true,
					},
				});
			}

			return {
				success: true,
				message: 'Preferências encontradas',
				code: API_CODES.success.NOTIFICATION_PREFERENCES_FOUND,
				data: preferences,
			};
		} catch (error) {
			throw new NotFoundException({
				message: 'Erro ao buscar preferências',
				code: API_CODES.error.NOTIFICATION_PREFERENCES_NOT_FOUND,
				error: error.message,
			});
		}
	}

	async updateUserPreferences(userId: string, updateData: any) {
		try {
			const preferences = await this.prisma.notificationPreferences.upsert({
				where: { userId },
				update: {
					...updateData,
					updatedAt: new Date(),
				},
				create: {
					userId,
					...updateData,
				},
			});

			return {
				success: true,
				message: 'Preferências atualizadas com sucesso',
				code: API_CODES.success.NOTIFICATION_PREFERENCES_UPDATED,
				data: preferences,
			};
		} catch (error) {
			throw new BadRequestException({
				message: 'Erro ao atualizar preferências',
				code: API_CODES.error.NOTIFICATION_PREFERENCES_UPDATE_FAILED,
				error: error.message,
			});
		}
	}

	async registerDevice(userId: string, deviceData: any) {
		try {
			const existingDevice = await this.prisma.userDevice.findFirst({
				where: {
					userId,
					deviceToken: deviceData.deviceToken,
				},
			});

			if (existingDevice) {
				const updatedDevice = await this.prisma.userDevice.update({
					where: { id: existingDevice.id },
					data: {
						...deviceData,
						isActive: true,
						lastUsed: new Date(),
						updatedAt: new Date(),
					},
				});

				return {
					success: true,
					message: 'Dispositivo atualizado com sucesso',
					code: API_CODES.success.DEVICE_REGISTERED_SUCCESSFULLY,
					data: updatedDevice,
				};
			}

			const device = await this.prisma.userDevice.create({
				data: {
					userId,
					...deviceData,
					isActive: true,
					lastUsed: new Date(),
				},
			});

			return {
				success: true,
				message: 'Dispositivo registrado com sucesso',
				code: API_CODES.success.DEVICE_REGISTERED_SUCCESSFULLY,
				data: device,
			};
		} catch (error) {
			throw new BadRequestException({
				message: 'Erro ao registrar dispositivo',
				code: API_CODES.error.DEVICE_REGISTRATION_FAILED,
				error: error.message,
			});
		}
	}

	async removeDevice(userId: string, deviceId: string) {
		try {
			const device = await this.prisma.userDevice.findFirst({
				where: {
					id: deviceId,
					userId,
				},
			});

			if (!device) {
				throw new NotFoundException({
					message: 'Dispositivo não encontrado',
					code: API_CODES.error.DEVICE_NOT_FOUND,
				});
			}

			await this.prisma.userDevice.delete({
				where: { id: deviceId },
			});

			return {
				success: true,
				message: 'Dispositivo removido com sucesso',
				code: API_CODES.success.DEVICE_REMOVED_SUCCESSFULLY,
			};
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			throw new BadRequestException({
				message: 'Erro ao remover dispositivo',
				code: API_CODES.error.DEVICE_NOT_FOUND,
				error: error.message,
			});
		}
	}

	async sendTestNotification(userId: string, type: string) {
		try {
			const user = await this.prisma.user.findUnique({
				where: { id: userId },
				select: {
					email: true,
					profile: {
						select: { firstName: true },
					},
				},
			});

			if (!user?.email) {
				throw new Error('User email not found');
			}

			const emailResult = await this.emailService.sendTestEmail(
				user.email,
				type,
			);

			const log = await this.prisma.notificationLog.create({
				data: {
					userId,
					type: `test_${type}`,
					channel: 'email',
					status: emailResult.success ? 'sent' : 'failed',
					title: '🧪 Notificação de Teste',
					body: 'Esta é uma notificação de teste do sistema.',
					deliveredAt: emailResult.success ? new Date() : null,
					errorMessage: emailResult.error || null,
					providerMessageId: emailResult.messageId || null,
					createdAt: new Date(),
				},
			});

			return {
				success: true,
				message: 'Notificação de teste enviada',
				code: API_CODES.success.TEST_NOTIFICATION_SENT,
				data: {
					notificationId: log.id,
					emailDelivered: emailResult.success,
					messageId: emailResult.messageId,
				},
			};
		} catch (error) {
			throw new BadRequestException({
				message: 'Erro ao enviar notificação de teste',
				code: API_CODES.error.NOTIFICATION_SEND_FAILED,
				error: error.message,
			});
		}
	}

	private isNotificationEnabled(preferences: any, type: string): boolean {
		const typeMap = {
			habit_reminder: 'habitReminders',
			achievement_unlocked: 'achievements',
			weekly_report: 'weeklyReports',
			monthly_report: 'monthlyReports',
			inactivity_alert: 'inactivityAlerts',
			streak_warning: 'streakWarnings',
		};

		const prefKey = typeMap[type];
		return prefKey ? preferences[prefKey] : true;
	}

	isHealthy(): boolean {
		return this.emailService.isHealthy();
	}
}
