export interface PushNotificationData {
	title: string;
	body: string;
	data?: { [key: string]: string };
	imageUrl?: string;
	icon?: string;
	badge?: string;
	sound?: string;
	clickAction?: string;
	tag?: string;
	requireInteraction?: boolean;
	actions?: PushAction[];
}

export interface PushAction {
	action: string;
	title: string;
	icon?: string;
}

export interface PushTarget {
	deviceTokens?: string[];
	topic?: string;
	condition?: string;
}

export interface PushOptions {
	priority?: 'normal' | 'high';
	timeToLive?: number;
	collapseKey?: string;
	restrictedPackageName?: string;
	dryRun?: boolean;
	analytics?: boolean;
}

export interface PushSendRequest {
	target: PushTarget;
	notification: PushNotificationData;
	options?: PushOptions;
}

export interface PushSendResult {
	success: boolean;
	messageId?: string;
	error?: string;
	failureCount?: number;
	successCount?: number;
	failedTokens?: string[];
	canonicalTokens?: { oldToken: string; newToken: string }[];
}

export interface DeviceTokenValidationResult {
	isValid: boolean;
	canonicalToken?: string;
	error?: string;
}

export interface PushProvider {
	sendNotification(request: PushSendRequest): Promise<PushSendResult>;
	sendToDevice(
		deviceToken: string,
		notification: PushNotificationData,
		options?: PushOptions,
	): Promise<PushSendResult>;
	sendToDevices(
		deviceTokens: string[],
		notification: PushNotificationData,
		options?: PushOptions,
	): Promise<PushSendResult>;
	sendToTopic(
		topic: string,
		notification: PushNotificationData,
		options?: PushOptions,
	): Promise<PushSendResult>;
	validateDeviceToken(token: string): Promise<DeviceTokenValidationResult>;
	subscribeToTopic(
		deviceTokens: string[],
		topic: string,
	): Promise<{ success: boolean; errors?: string[] }>;
	unsubscribeFromTopic(
		deviceTokens: string[],
		topic: string,
	): Promise<{ success: boolean; errors?: string[] }>;
	isConfigured(): boolean;
}

export enum PushNotificationType {
	HABIT_REMINDER = 'habit_reminder',
	ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
	STREAK_WARNING = 'streak_warning',
	WEEKLY_REPORT = 'weekly_report',
	INACTIVITY_ALERT = 'inactivity_alert',
	GOAL_DEADLINE = 'goal_deadline',
	MOTIVATIONAL = 'motivational',
	SYSTEM_UPDATE = 'system_update',
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
	SMARTWATCH = 'smartwatch',
}
