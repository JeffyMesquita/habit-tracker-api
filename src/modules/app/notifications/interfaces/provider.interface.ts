import { INotification, INotificationResult } from './notification.interface';

export interface IEmailProvider {
	sendEmail(notification: IEmailNotification): Promise<INotificationResult>;
	validateEmail(email: string): boolean;
	renderTemplate(
		templateId: string,
		data: Record<string, any>,
	): Promise<string>;
}

export interface IPushProvider {
	sendPush(notification: IPushNotification): Promise<INotificationResult>;
	validateDeviceToken(token: string): boolean;
	registerDevice(deviceInfo: IDeviceRegistration): Promise<boolean>;
	unregisterDevice(token: string): Promise<boolean>;
}

export interface IEmailNotification extends INotification {
	to: string;
	subject: string;
	html?: string;
	text?: string;
	templateId?: string;
	templateData?: Record<string, any>;
	attachments?: IEmailAttachment[];
}

export interface IPushNotification extends INotification {
	deviceTokens: string[];
	badge?: number;
	sound?: string;
	icon?: string;
	image?: string;
	clickAction?: string;
	deepLink?: string;
	actions?: IPushAction[];
}

export interface IEmailAttachment {
	filename: string;
	content: Buffer | string;
	contentType: string;
}

export interface IPushAction {
	id: string;
	title: string;
	icon?: string;
	action: string;
}

export interface IDeviceRegistration {
	userId: string;
	deviceToken: string;
	platform: string;
	deviceType: string;
	appVersion?: string;
	osVersion?: string;
}

export interface INotificationQueue {
	add(notification: INotification, options?: IQueueOptions): Promise<void>;
	process(processor: (notification: INotification) => Promise<void>): void;
	pause(): Promise<void>;
	resume(): Promise<void>;
	getStats(): Promise<IQueueStats>;
}

export interface IQueueOptions {
	delay?: number;
	attempts?: number;
	backoff?: number;
	priority?: number;
}

export interface IQueueStats {
	waiting: number;
	active: number;
	completed: number;
	failed: number;
	delayed: number;
}
