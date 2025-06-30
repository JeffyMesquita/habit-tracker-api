import {
	Injectable,
	BadRequestException,
	NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import API_CODES from '@/misc/API/codes';

@Injectable()
export class NotificationsService {
	constructor(private readonly prisma: PrismaService) {}

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
			const testData = {
				title: '🧪 Notificação de Teste',
				body: 'Esta é uma notificação de teste do sistema.',
				habitTitle: 'Exercícios',
				currentStreak: 5,
				completionRate: 85,
			};

			const result = await this.sendNotification(userId, type, testData);

			return {
				success: true,
				message: 'Notificação de teste enviada',
				code: API_CODES.success.TEST_NOTIFICATION_SENT,
				data: result,
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
}
