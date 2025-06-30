import { Injectable, Logger } from '@nestjs/common';
import { FirebasePushProvider } from '../providers/push/firebase.provider';
import {
	PushNotificationData,
	PushSendResult,
	PushOptions,
	PushNotificationType,
} from '../providers/push/push.provider.interface';

export interface SendPushOptions {
	deviceTokens: string[];
	title: string;
	body: string;
	type: PushNotificationType;
	data?: { [key: string]: string };
	options?: PushOptions;
}

export interface PushTemplateData {
	[key: string]: any;
}

@Injectable()
export class PushService {
	private readonly logger = new Logger(PushService.name);

	constructor(private readonly pushProvider: FirebasePushProvider) {}

	async sendPushNotification(
		options: SendPushOptions,
	): Promise<PushSendResult> {
		try {
			// Validate device tokens
			const validTokens = await this.validateTokens(options.deviceTokens);

			if (validTokens.length === 0) {
				this.logger.warn('No valid device tokens provided');
				return {
					success: false,
					error: 'No valid device tokens',
					failureCount: options.deviceTokens.length,
					successCount: 0,
				};
			}

			// Build notification data
			const notification = this.buildNotificationData(
				options.title,
				options.body,
				options.type,
				options.data,
			);

			// Send notification
			const result = await this.pushProvider.sendToDevices(
				validTokens,
				notification,
				options.options,
			);

			if (result.success) {
				this.logger.log(
					`Push notification sent successfully to ${result.successCount} devices`,
				);
			} else {
				this.logger.error(`Failed to send push notification: ${result.error}`);
			}

			return result;
		} catch (error) {
			this.logger.error('Push service error:', error);
			return {
				success: false,
				error: error.message || 'Unknown push service error',
				failureCount: options.deviceTokens.length,
				successCount: 0,
			};
		}
	}

	async sendHabitReminder(
		deviceTokens: string[],
		data: any,
	): Promise<PushSendResult> {
		return this.sendPushNotification({
			deviceTokens,
			title: `🎯 ${data.habitTitle}`,
			body: `Hora de praticar seu hábito! Sequência atual: ${data.currentStreak} dias`,
			type: PushNotificationType.HABIT_REMINDER,
			data: {
				habitId: data.habitId,
				type: 'habit_reminder',
				habitTitle: data.habitTitle,
				currentStreak: data.currentStreak?.toString() || '0',
			},
			options: {
				priority: 'normal',
				analytics: true,
			},
		});
	}

	async sendAchievementUnlocked(
		deviceTokens: string[],
		data: any,
	): Promise<PushSendResult> {
		return this.sendPushNotification({
			deviceTokens,
			title: '🏆 Nova Conquista!',
			body: `Parabéns! Você desbloqueou: ${data.achievementTitle}`,
			type: PushNotificationType.ACHIEVEMENT_UNLOCKED,
			data: {
				achievementId: data.achievementId,
				type: 'achievement_unlocked',
				achievementTitle: data.achievementTitle,
				points: data.points?.toString() || '0',
			},
			options: {
				priority: 'high',
				analytics: true,
			},
		});
	}

	async sendStreakWarning(
		deviceTokens: string[],
		data: any,
	): Promise<PushSendResult> {
		return this.sendPushNotification({
			deviceTokens,
			title: '⚠️ Sequência em Risco',
			body: `Sua sequência de ${data.currentStreak} dias de "${data.habitTitle}" pode ser perdida!`,
			type: PushNotificationType.STREAK_WARNING,
			data: {
				habitId: data.habitId,
				type: 'streak_warning',
				habitTitle: data.habitTitle,
				currentStreak: data.currentStreak?.toString() || '0',
			},
			options: {
				priority: 'high',
				analytics: true,
			},
		});
	}

	async sendWeeklyReport(
		deviceTokens: string[],
		data: any,
	): Promise<PushSendResult> {
		return this.sendPushNotification({
			deviceTokens,
			title: '📊 Relatório Semanal',
			body: `Taxa de conclusão: ${data.completionRate}%. Veja seu progresso!`,
			type: PushNotificationType.WEEKLY_REPORT,
			data: {
				type: 'weekly_report',
				completionRate: data.completionRate?.toString() || '0',
				totalHabits: data.totalHabits?.toString() || '0',
			},
			options: {
				priority: 'normal',
				analytics: true,
			},
		});
	}

	async sendInactivityAlert(
		deviceTokens: string[],
		data: any,
	): Promise<PushSendResult> {
		return this.sendPushNotification({
			deviceTokens,
			title: '😢 Sentimos sua falta!',
			body: `Você não registra progresso há ${data.daysSinceLastActivity} dias. Que tal voltar?`,
			type: PushNotificationType.INACTIVITY_ALERT,
			data: {
				type: 'inactivity_alert',
				daysSinceLastActivity: data.daysSinceLastActivity?.toString() || '0',
			},
			options: {
				priority: 'normal',
				analytics: true,
			},
		});
	}

	async sendGoalDeadline(
		deviceTokens: string[],
		data: any,
	): Promise<PushSendResult> {
		return this.sendPushNotification({
			deviceTokens,
			title: '⏰ Meta se aproximando!',
			body: `Sua meta "${data.goalTitle}" vence em ${data.daysRemaining} dias`,
			type: PushNotificationType.GOAL_DEADLINE,
			data: {
				goalId: data.goalId,
				type: 'goal_deadline',
				goalTitle: data.goalTitle,
				daysRemaining: data.daysRemaining?.toString() || '0',
			},
			options: {
				priority: 'normal',
				analytics: true,
			},
		});
	}

	async sendTestPush(
		deviceTokens: string[],
		type: PushNotificationType,
	): Promise<PushSendResult> {
		const testData = this.getTestData(type);

		return this.sendPushNotification({
			deviceTokens,
			title: `🧪 [TESTE] ${testData.title}`,
			body: testData.body,
			type,
			data: {
				...testData.data,
				isTest: 'true',
			},
			options: {
				priority: 'normal',
				analytics: false,
			},
		});
	}

	async validateDeviceToken(token: string): Promise<boolean> {
		try {
			const result = await this.pushProvider.validateDeviceToken(token);
			return result.isValid;
		} catch (error) {
			this.logger.error(`Token validation failed for ${token}:`, error);
			return false;
		}
	}

	async subscribeToTopic(
		deviceTokens: string[],
		topic: string,
	): Promise<{ success: boolean; errors?: string[] }> {
		try {
			return await this.pushProvider.subscribeToTopic(deviceTokens, topic);
		} catch (error) {
			this.logger.error(`Failed to subscribe to topic ${topic}:`, error);
			return { success: false, errors: [error.message] };
		}
	}

	async unsubscribeFromTopic(
		deviceTokens: string[],
		topic: string,
	): Promise<{ success: boolean; errors?: string[] }> {
		try {
			return await this.pushProvider.unsubscribeFromTopic(deviceTokens, topic);
		} catch (error) {
			this.logger.error(`Failed to unsubscribe from topic ${topic}:`, error);
			return { success: false, errors: [error.message] };
		}
	}

	private async validateTokens(tokens: string[]): Promise<string[]> {
		const validTokens: string[] = [];

		for (const token of tokens) {
			try {
				const isValid = await this.validateDeviceToken(token);
				if (isValid) {
					validTokens.push(token);
				}
			} catch (error) {
				this.logger.warn(`Token validation failed for ${token}:`, error);
			}
		}

		return validTokens;
	}

	private buildNotificationData(
		title: string,
		body: string,
		type: PushNotificationType,
		data?: { [key: string]: string },
	): PushNotificationData {
		const notification: PushNotificationData = {
			title,
			body,
			data: {
				notificationType: type,
				timestamp: new Date().toISOString(),
				...data,
			},
		};

		// Add type-specific styling
		switch (type) {
			case PushNotificationType.ACHIEVEMENT_UNLOCKED:
				notification.icon = '/icons/achievement.png';
				notification.sound = 'achievement.wav';
				notification.badge = '1';
				break;

			case PushNotificationType.STREAK_WARNING:
			case PushNotificationType.GOAL_DEADLINE:
				notification.icon = '/icons/warning.png';
				notification.sound = 'alert.wav';
				notification.requireInteraction = true;
				break;

			case PushNotificationType.HABIT_REMINDER:
				notification.icon = '/icons/reminder.png';
				notification.sound = 'gentle.wav';
				break;

			case PushNotificationType.WEEKLY_REPORT:
				notification.icon = '/icons/report.png';
				notification.sound = 'notification.wav';
				break;

			default:
				notification.icon = '/icons/default.png';
				notification.sound = 'default';
		}

		return notification;
	}

	private getTestData(type: PushNotificationType): {
		title: string;
		body: string;
		data: any;
	} {
		const testDataMap = {
			[PushNotificationType.HABIT_REMINDER]: {
				title: 'Lembrete de Hábito',
				body: 'Hora de praticar exercícios! Sequência atual: 7 dias',
				data: {
					habitId: 'test-habit-123',
					habitTitle: 'Exercitar-se',
					currentStreak: '7',
				},
			},
			[PushNotificationType.ACHIEVEMENT_UNLOCKED]: {
				title: 'Nova Conquista!',
				body: 'Parabéns! Você desbloqueou: Primeira Semana',
				data: {
					achievementId: 'test-achievement-123',
					achievementTitle: 'Primeira Semana',
					points: '100',
				},
			},
			[PushNotificationType.STREAK_WARNING]: {
				title: 'Sequência em Risco',
				body: 'Sua sequência de 14 dias pode ser perdida!',
				data: {
					habitId: 'test-habit-123',
					habitTitle: 'Leitura',
					currentStreak: '14',
				},
			},
			[PushNotificationType.WEEKLY_REPORT]: {
				title: 'Relatório Semanal',
				body: 'Taxa de conclusão: 85%. Veja seu progresso!',
				data: {
					completionRate: '85',
					totalHabits: '5',
				},
			},
			[PushNotificationType.INACTIVITY_ALERT]: {
				title: 'Sentimos sua falta!',
				body: 'Você não registra progresso há 3 dias. Que tal voltar?',
				data: {
					daysSinceLastActivity: '3',
				},
			},
			[PushNotificationType.GOAL_DEADLINE]: {
				title: 'Meta se aproximando!',
				body: 'Sua meta "Exercitar 30 dias" vence em 5 dias',
				data: {
					goalId: 'test-goal-123',
					goalTitle: 'Exercitar 30 dias',
					daysRemaining: '5',
				},
			},
		};

		return (
			testDataMap[type] || testDataMap[PushNotificationType.HABIT_REMINDER]
		);
	}

	isHealthy(): boolean {
		return this.pushProvider.isConfigured();
	}
}
