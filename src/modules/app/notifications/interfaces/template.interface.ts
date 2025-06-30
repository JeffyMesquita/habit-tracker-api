import {
	NotificationChannel,
	NotificationType,
} from './notification.interface';

export interface ITemplateEngine {
	render(templateId: string, data: Record<string, any>): Promise<string>;
	registerTemplate(template: ITemplate): Promise<void>;
	getTemplate(templateId: string): Promise<ITemplate | null>;
	validateTemplate(template: string): boolean;
}

export interface ITemplate {
	id: string;
	name: string;
	type: NotificationType;
	channel: NotificationChannel;
	subject?: string; // for email templates
	content: string;
	variables: ITemplateVariable[];
	metadata?: ITemplateMetadata;
}

export interface ITemplateVariable {
	name: string;
	type: TemplateVariableType;
	required: boolean;
	defaultValue?: any;
	description?: string;
}

export interface ITemplateMetadata {
	version: string;
	author?: string;
	description?: string;
	tags?: string[];
	lastUpdated: Date;
}

export interface ITemplateData {
	// User data
	userId: string;
	firstName?: string;
	lastName?: string;
	email: string;

	// Habit data
	habitId?: string;
	habitTitle?: string;
	habitCategory?: string;
	currentStreak?: number;
	completionRate?: number;

	// Achievement data
	achievementId?: string;
	achievementTitle?: string;
	achievementDescription?: string;
	points?: number;
	rarity?: string;

	// App URLs
	appUrl: string;
	preferencesUrl: string;
	unsubscribeUrl: string;
	supportUrl: string;

	// Dynamic data
	[key: string]: any;
}

export enum TemplateVariableType {
	STRING = 'string',
	NUMBER = 'number',
	BOOLEAN = 'boolean',
	DATE = 'date',
	URL = 'url',
	EMAIL = 'email',
	OBJECT = 'object',
	ARRAY = 'array',
}
