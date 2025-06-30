export interface INotification {
	id?: string;
	userId: string;
	type: NotificationType;
	channel: NotificationChannel;
	title: string;
	body: string;
	data?: Record<string, any>;
	scheduledFor?: Date;
	status: NotificationStatus;
}

export interface INotificationProvider {
	send(notification: INotification): Promise<INotificationResult>;
	validate(notification: INotification): Promise<boolean>;
}

export interface INotificationResult {
	success: boolean;
	messageId?: string;
	error?: string;
	deliveredAt?: Date;
}

export interface INotificationTemplate {
	id: string;
	type: NotificationType;
	channel: NotificationChannel;
	template: string;
	variables: string[];
}

export interface INotificationPreferences {
	userId: string;
	emailEnabled: boolean;
	pushEnabled: boolean;
	habitReminders: boolean;
	achievements: boolean;
	weeklyReports: boolean;
	monthlyReports: boolean;
	quietHoursStart: string;
	quietHoursEnd: string;
	timezone: string;
	language: string;
}

export interface IUserDevice {
	id?: string;
	userId: string;
	deviceToken: string;
	platform: DevicePlatform;
	deviceType: DeviceType;
	isActive: boolean;
}

export interface INotificationAnalytics {
	totalSent: number;
	delivered: number;
	opened: number;
	clicked: number;
	failed: number;
	deliveryRate: number;
	openRate: number;
	clickRate: number;
}

export enum NotificationType {
	HABIT_REMINDER = 'habit_reminder',
	ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
	WEEKLY_REPORT = 'weekly_report',
	MONTHLY_REPORT = 'monthly_report',
	STREAK_WARNING = 'streak_warning',
	INACTIVITY_ALERT = 'inactivity_alert',
	GOAL_DEADLINE = 'goal_deadline',
	CUSTOM = 'custom',
}

export enum NotificationChannel {
	EMAIL = 'email',
	PUSH = 'push',
	SMS = 'sms',
}

export enum NotificationStatus {
	QUEUED = 'queued',
	SENT = 'sent',
	DELIVERED = 'delivered',
	OPENED = 'opened',
	CLICKED = 'clicked',
	FAILED = 'failed',
	CANCELLED = 'cancelled',
}

export enum DevicePlatform {
	IOS = 'ios',
	ANDROID = 'android',
	WEB = 'web',
}

export enum DeviceType {
	PHONE = 'phone',
	TABLET = 'tablet',
	DESKTOP = 'desktop',
}
