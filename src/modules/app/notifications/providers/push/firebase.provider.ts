import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import {
	PushProvider,
	PushSendRequest,
	PushSendResult,
	PushNotificationData,
	PushOptions,
	DeviceTokenValidationResult,
} from './push.provider.interface';

@Injectable()
export class FirebasePushProvider implements PushProvider {
	private readonly logger = new Logger(FirebasePushProvider.name);
	private app: admin.app.App | null = null;
	private messaging: admin.messaging.Messaging | null = null;

	constructor() {
		this.initializeFirebase();
	}

	private initializeFirebase(): void {
		try {
			const projectId = process.env.FIREBASE_PROJECT_ID;
			const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(
				/\\n/g,
				'\n',
			);
			const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

			if (!projectId || !privateKey || !clientEmail) {
				this.logger.warn(
					'Firebase credentials not configured. Push notifications will be disabled.',
				);
				return;
			}

			// Check if Firebase app is already initialized
			try {
				this.app = admin.app('habit-tracker');
			} catch {
				// App doesn't exist, create it
				this.app = admin.initializeApp(
					{
						credential: admin.credential.cert({
							projectId,
							privateKey,
							clientEmail,
						}),
						projectId,
					},
					'habit-tracker',
				);
			}

			this.messaging = this.app.messaging();
			this.logger.log('Firebase Push Provider initialized successfully');
		} catch (error) {
			this.logger.error('Failed to initialize Firebase:', error);
		}
	}

	async sendNotification(request: PushSendRequest): Promise<PushSendResult> {
		if (!this.isConfigured()) {
			return {
				success: false,
				error: 'Firebase not configured',
				failureCount: 1,
				successCount: 0,
			};
		}

		try {
			if (
				request.target.deviceTokens &&
				request.target.deviceTokens.length > 0
			) {
				if (request.target.deviceTokens.length === 1) {
					const message = this.buildSingleMessage(
						request.target.deviceTokens[0],
						request.notification,
						request.options,
					);
					const singleResult = await this.messaging!.send(message);
					return {
						success: true,
						messageId: singleResult,
						successCount: 1,
						failureCount: 0,
					};
				} else {
					const multicastMessage = this.buildMulticastMessage(
						request.target.deviceTokens,
						request.notification,
						request.options,
					);
					const result =
						await this.messaging!.sendEachForMulticast(multicastMessage);
					return this.processMulticastResult(result);
				}
			} else if (request.target.topic) {
				const message = this.buildTopicMessage(
					request.target.topic,
					request.notification,
				);
				const result = await this.messaging!.send(message);
				return {
					success: true,
					messageId: result,
					successCount: 1,
					failureCount: 0,
				};
			} else if (request.target.condition) {
				const message = this.buildConditionMessage(
					request.target.condition,
					request.notification,
				);
				const result = await this.messaging!.send(message);
				return {
					success: true,
					messageId: result,
					successCount: 1,
					failureCount: 0,
				};
			}

			return {
				success: false,
				error: 'No valid target specified',
				failureCount: 1,
				successCount: 0,
			};
		} catch (error) {
			this.logger.error('Failed to send push notification:', error);
			return {
				success: false,
				error: error.message || 'Unknown Firebase error',
				failureCount: 1,
				successCount: 0,
			};
		}
	}

	async sendToDevice(
		deviceToken: string,
		notification: PushNotificationData,
		options?: PushOptions,
	): Promise<PushSendResult> {
		return this.sendNotification({
			target: { deviceTokens: [deviceToken] },
			notification,
			options,
		});
	}

	async sendToDevices(
		deviceTokens: string[],
		notification: PushNotificationData,
		options?: PushOptions,
	): Promise<PushSendResult> {
		return this.sendNotification({
			target: { deviceTokens },
			notification,
			options,
		});
	}

	async sendToTopic(
		topic: string,
		notification: PushNotificationData,
		options?: PushOptions,
	): Promise<PushSendResult> {
		return this.sendNotification({
			target: { topic },
			notification,
			options,
		});
	}

	async validateDeviceToken(
		token: string,
	): Promise<DeviceTokenValidationResult> {
		if (!this.isConfigured()) {
			return { isValid: false, error: 'Firebase not configured' };
		}

		try {
			// Try to send a dry run to validate the token
			await this.messaging!.send(
				{
					token,
					notification: {
						title: 'Test',
						body: 'Test',
					},
				},
				true,
			); // dry run

			return { isValid: true };
		} catch (error) {
			this.logger.warn(`Invalid device token: ${token}`, error.message);
			return {
				isValid: false,
				error: error.message || 'Token validation failed',
			};
		}
	}

	async subscribeToTopic(
		deviceTokens: string[],
		topic: string,
	): Promise<{ success: boolean; errors?: string[] }> {
		if (!this.isConfigured()) {
			return { success: false, errors: ['Firebase not configured'] };
		}

		try {
			const result = await this.messaging!.subscribeToTopic(
				deviceTokens,
				topic,
			);

			if (result.failureCount > 0) {
				const errors = result.errors?.map((error) => error.error.message) || [];
				return {
					success: result.successCount > 0,
					errors,
				};
			}

			return { success: true };
		} catch (error) {
			this.logger.error(`Failed to subscribe to topic ${topic}:`, error);
			return {
				success: false,
				errors: [error.message || 'Topic subscription failed'],
			};
		}
	}

	async unsubscribeFromTopic(
		deviceTokens: string[],
		topic: string,
	): Promise<{ success: boolean; errors?: string[] }> {
		if (!this.isConfigured()) {
			return { success: false, errors: ['Firebase not configured'] };
		}

		try {
			const result = await this.messaging!.unsubscribeFromTopic(
				deviceTokens,
				topic,
			);

			if (result.failureCount > 0) {
				const errors = result.errors?.map((error) => error.error.message) || [];
				return {
					success: result.successCount > 0,
					errors,
				};
			}

			return { success: true };
		} catch (error) {
			this.logger.error(`Failed to unsubscribe from topic ${topic}:`, error);
			return {
				success: false,
				errors: [error.message || 'Topic unsubscription failed'],
			};
		}
	}

	isConfigured(): boolean {
		return !!(
			this.app &&
			this.messaging &&
			process.env.FIREBASE_PROJECT_ID &&
			process.env.FIREBASE_PRIVATE_KEY &&
			process.env.FIREBASE_CLIENT_EMAIL
		);
	}

	private buildSingleMessage(
		token: string,
		notification: PushNotificationData,
		options?: PushOptions,
	): admin.messaging.Message {
		return {
			token,
			notification: {
				title: notification.title,
				body: notification.body,
				imageUrl: notification.imageUrl,
			},
			data: notification.data || {},
			android: {
				priority: options?.priority === 'high' ? 'high' : 'normal',
				ttl: options?.timeToLive ? options.timeToLive * 1000 : undefined,
				collapseKey: options?.collapseKey,
				restrictedPackageName: options?.restrictedPackageName,
				notification: {
					icon: notification.icon,
					sound: notification.sound,
					tag: notification.tag,
					clickAction: notification.clickAction,
					channelId: 'habit_tracker_notifications',
					priority: options?.priority === 'high' ? 'high' : 'default',
				},
			},
			apns: {
				headers: {
					'apns-priority': options?.priority === 'high' ? '10' : '5',
					'apns-expiration': options?.timeToLive
						? (Math.floor(Date.now() / 1000) + options.timeToLive).toString()
						: undefined,
				},
				payload: {
					aps: {
						alert: {
							title: notification.title,
							body: notification.body,
						},
						badge: notification.badge
							? parseInt(notification.badge)
							: undefined,
						sound: notification.sound || 'default',
						category: notification.clickAction,
						threadId: notification.tag,
					},
				},
			},
			webpush: {
				headers: {
					TTL: options?.timeToLive?.toString() || '86400',
				},
				notification: {
					title: notification.title,
					body: notification.body,
					icon: notification.icon,
					image: notification.imageUrl,
					badge: notification.badge,
					sound: notification.sound,
					tag: notification.tag,
					requireInteraction: notification.requireInteraction,
					actions: notification.actions,
					data: notification.data,
				},
			},
		};
	}

	private buildMulticastMessage(
		tokens: string[],
		notification: PushNotificationData,
		options?: PushOptions,
	): admin.messaging.MulticastMessage {
		return {
			tokens,
			notification: {
				title: notification.title,
				body: notification.body,
				imageUrl: notification.imageUrl,
			},
			data: notification.data || {},
			android: {
				priority: options?.priority === 'high' ? 'high' : 'normal',
				ttl: options?.timeToLive ? options.timeToLive * 1000 : undefined,
				collapseKey: options?.collapseKey,
				restrictedPackageName: options?.restrictedPackageName,
				notification: {
					icon: notification.icon,
					sound: notification.sound,
					tag: notification.tag,
					clickAction: notification.clickAction,
					channelId: 'habit_tracker_notifications',
					priority: options?.priority === 'high' ? 'high' : 'default',
				},
			},
			apns: {
				headers: {
					'apns-priority': options?.priority === 'high' ? '10' : '5',
					'apns-expiration': options?.timeToLive
						? (Math.floor(Date.now() / 1000) + options.timeToLive).toString()
						: undefined,
				},
				payload: {
					aps: {
						alert: {
							title: notification.title,
							body: notification.body,
						},
						badge: notification.badge
							? parseInt(notification.badge)
							: undefined,
						sound: notification.sound || 'default',
						category: notification.clickAction,
						threadId: notification.tag,
					},
				},
			},
			webpush: {
				headers: {
					TTL: options?.timeToLive?.toString() || '86400',
				},
				notification: {
					title: notification.title,
					body: notification.body,
					icon: notification.icon,
					image: notification.imageUrl,
					badge: notification.badge,
					sound: notification.sound,
					tag: notification.tag,
					requireInteraction: notification.requireInteraction,
					actions: notification.actions,
					data: notification.data,
				},
			},
		};
	}

	private buildTopicMessage(
		topic: string,
		notification: PushNotificationData,
	): admin.messaging.Message {
		return {
			topic,
			notification: {
				title: notification.title,
				body: notification.body,
				imageUrl: notification.imageUrl,
			},
			data: notification.data || {},
		};
	}

	private buildConditionMessage(
		condition: string,
		notification: PushNotificationData,
	): admin.messaging.Message {
		return {
			condition,
			notification: {
				title: notification.title,
				body: notification.body,
				imageUrl: notification.imageUrl,
			},
			data: notification.data || {},
		};
	}

	private processMulticastResult(
		result: admin.messaging.BatchResponse,
	): PushSendResult {
		const failedTokens: string[] = [];
		const canonicalTokens: { oldToken: string; newToken: string }[] = [];

		result.responses.forEach((res, index) => {
			if (!res.success && res.error) {
				this.logger.warn(
					`Failed to send to device at index ${index}:`,
					res.error.message,
				);
			}
		});

		return {
			success: result.successCount > 0,
			successCount: result.successCount,
			failureCount: result.failureCount,
			failedTokens,
			canonicalTokens,
		};
	}

	async testConnection(): Promise<boolean> {
		if (!this.isConfigured()) {
			return false;
		}

		try {
			return true;
		} catch (error) {
			this.logger.error('Firebase connection test failed:', error);
			return false;
		}
	}
}
