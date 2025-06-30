import { Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import { readFileSync } from 'fs';
import * as Handlebars from 'handlebars';
import { ResendEmailProvider } from '../providers/email/resend.provider';
import {
	EmailData,
	EmailSendResult,
} from '../providers/email/email.provider.interface';

export interface EmailTemplateData {
	[key: string]: any;
}

export interface SendEmailOptions {
	to: string | string[];
	subject: string;
	template: string;
	data: EmailTemplateData;
	from?: string;
}

@Injectable()
export class EmailService {
	private readonly logger = new Logger(EmailService.name);
	private templatesPath: string;

	constructor(private readonly emailProvider: ResendEmailProvider) {
		this.templatesPath = join(
			process.cwd(),
			'src/modules/app/notifications/templates/email',
		);
		this.registerHelpers();
	}

	async sendEmail(options: SendEmailOptions): Promise<EmailSendResult> {
		try {
			// Validate email addresses
			const recipients = Array.isArray(options.to) ? options.to : [options.to];
			for (const email of recipients) {
				if (!this.emailProvider.validateEmail(email)) {
					this.logger.error(`Invalid email address: ${email}`);
					return {
						success: false,
						error: `Invalid email address: ${email}`,
						deliveryStatus: 'failed',
					};
				}
			}

			// Render template
			const html = await this.renderTemplate(options.template, options.data);
			const text = this.htmlToText(html);

			// Prepare email data
			const emailData: EmailData = {
				to: options.to,
				from: options.from,
				subject: options.subject,
				html,
				text,
			};

			// Send email
			const result = await this.emailProvider.sendEmail(emailData);

			if (result.success) {
				this.logger.log(`Email sent successfully to ${options.to}`);
			} else {
				this.logger.error(
					`Failed to send email to ${options.to}: ${result.error}`,
				);
			}

			return result;
		} catch (error) {
			this.logger.error('Email service error:', error);
			return {
				success: false,
				error: error.message || 'Unknown email service error',
				deliveryStatus: 'failed',
			};
		}
	}

	async sendHabitReminder(
		userEmail: string,
		data: any,
	): Promise<EmailSendResult> {
		return this.sendEmail({
			to: userEmail,
			subject: `🎯 Lembrete: ${data.habitTitle}`,
			template: 'habit-reminder',
			data,
		});
	}

	async sendAchievementUnlocked(
		userEmail: string,
		data: any,
	): Promise<EmailSendResult> {
		return this.sendEmail({
			to: userEmail,
			subject: `🏆 Nova Conquista Desbloqueada!`,
			template: 'achievement-unlocked',
			data,
		});
	}

	async sendWeeklyReport(
		userEmail: string,
		data: any,
	): Promise<EmailSendResult> {
		return this.sendEmail({
			to: userEmail,
			subject: `📊 Seu Relatório Semanal - Habit Tracker`,
			template: 'weekly-report',
			data,
		});
	}

	async sendTestEmail(
		userEmail: string,
		type: string,
	): Promise<EmailSendResult> {
		const testData = this.getTestData(type);

		return this.sendEmail({
			to: userEmail,
			subject: `🧪 [TESTE] ${testData.subject}`,
			template: testData.template,
			data: testData.data,
		});
	}

	private async renderTemplate(
		templateName: string,
		data: EmailTemplateData,
	): Promise<string> {
		try {
			const templatePath = join(this.templatesPath, `${templateName}.hbs`);
			const templateContent = readFileSync(templatePath, 'utf-8');

			const template = Handlebars.compile(templateContent);
			return template(data);
		} catch (error) {
			this.logger.error(`Failed to render template ${templateName}:`, error);
			throw new Error(`Template rendering failed: ${error.message}`);
		}
	}

	private htmlToText(html: string): string {
		// Simple HTML to text conversion
		return html
			.replace(/<[^>]*>/g, '') // Remove HTML tags
			.replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
			.replace(/&amp;/g, '&') // Replace &amp; with &
			.replace(/&lt;/g, '<') // Replace &lt; with <
			.replace(/&gt;/g, '>') // Replace &gt; with >
			.replace(/\s+/g, ' ') // Replace multiple spaces with single space
			.trim();
	}

	private registerHelpers(): void {
		// Register Handlebars helpers
		Handlebars.registerHelper('formatDate', (date: Date) => {
			return new Intl.DateTimeFormat('pt-BR', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
			}).format(new Date(date));
		});

		Handlebars.registerHelper('percentage', (value: number) => {
			return `${Math.round(value)}%`;
		});

		Handlebars.registerHelper('eq', (a: any, b: any) => {
			return a === b;
		});

		Handlebars.registerHelper('gt', (a: number, b: number) => {
			return a > b;
		});
	}

	private getTestData(type: string): {
		subject: string;
		template: string;
		data: any;
	} {
		const testDataMap = {
			habit_reminder: {
				subject: 'Lembrete de Hábito',
				template: 'habit-reminder',
				data: {
					habitTitle: 'Exercitar-se',
					currentStreak: 7,
					completionRate: 85,
					progressPercentage: 85,
					motivationalMessage: 'Você está indo muito bem! Continue assim! 💪',
					totalHabits: 5,
					achievements: 12,
					habitId: 'test-habit-123',
					appUrl: process.env.FRONTEND_URL || 'https://habittracker.com',
					preferencesUrl:
						process.env.FRONTEND_URL + '/preferences' ||
						'https://habittracker.com/preferences',
					unsubscribeUrl:
						process.env.FRONTEND_URL + '/unsubscribe' ||
						'https://habittracker.com/unsubscribe',
					supportUrl:
						process.env.FRONTEND_URL + '/support' ||
						'https://habittracker.com/support',
				},
			},
			achievement_unlocked: {
				subject: 'Nova Conquista!',
				template: 'achievement-unlocked',
				data: {
					achievementTitle: 'Primeira Semana',
					achievementDescription: 'Complete 7 dias consecutivos de exercícios',
					points: 100,
					rarity: 'bronze',
					achievementId: 'test-achievement-123',
					appUrl: process.env.FRONTEND_URL || 'https://habittracker.com',
				},
			},
			weekly_report: {
				subject: 'Relatório Semanal',
				template: 'weekly-report',
				data: {
					weekStart: new Date(),
					weekEnd: new Date(),
					totalHabits: 5,
					completedHabits: 28,
					completionRate: 80,
					bestHabit: 'Leitura',
					longestStreak: 14,
					appUrl: process.env.FRONTEND_URL || 'https://habittracker.com',
				},
			},
		};

		return testDataMap[type] || testDataMap['habit_reminder'];
	}

	// Health check method
	isHealthy(): boolean {
		return this.emailProvider.isConfigured();
	}
}
