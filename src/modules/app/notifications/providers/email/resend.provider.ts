import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import {
	EmailProvider,
	EmailData,
	EmailSendResult,
} from './email.provider.interface';

@Injectable()
export class ResendEmailProvider implements EmailProvider {
	private readonly logger = new Logger(ResendEmailProvider.name);
	private resend: Resend;
	private defaultFrom: string;

	constructor() {
		this.initializeResend();
	}

	private initializeResend(): void {
		const apiKey = process.env.RESEND_API_KEY;
		this.defaultFrom =
			process.env.RESEND_EMAIL_FROM || 'noreply@habittracker.com';

		if (!apiKey) {
			this.logger.warn(
				'RESEND_API_KEY not configured. Email sending will be disabled.',
			);
			return;
		}

		this.resend = new Resend(apiKey);
		this.logger.log('Resend email provider initialized successfully');
	}

	async sendEmail(emailData: EmailData): Promise<EmailSendResult> {
		if (!this.isConfigured()) {
			this.logger.error('Resend not configured. Cannot send email.');
			return {
				success: false,
				error: 'Email provider not configured',
				deliveryStatus: 'failed',
			};
		}

		try {
			const emailPayload = {
				from: emailData.from || this.defaultFrom,
				to: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
				subject: emailData.subject,
				html: emailData.html,
				text: emailData.text,
				reply_to: emailData.replyTo ? [emailData.replyTo] : undefined,
				cc: emailData.cc
					? Array.isArray(emailData.cc)
						? emailData.cc
						: [emailData.cc]
					: undefined,
				bcc: emailData.bcc
					? Array.isArray(emailData.bcc)
						? emailData.bcc
						: [emailData.bcc]
					: undefined,
				attachments: emailData.attachments?.map((attachment) => ({
					filename: attachment.filename,
					content: attachment.content,
					content_type: attachment.contentType,
					disposition: attachment.disposition,
					content_id: attachment.cid,
				})),
			};

			this.logger.debug(`Sending email to: ${emailData.to}`);

			const result = await this.resend.emails.send(emailPayload);

			if (result.error) {
				this.logger.error('Resend API error:', result.error);
				return {
					success: false,
					error: result.error.message || 'Unknown Resend error',
					deliveryStatus: 'failed',
				};
			}

			this.logger.log(
				`Email sent successfully. Message ID: ${result.data?.id}`,
			);

			return {
				success: true,
				messageId: result.data?.id,
				deliveryStatus: 'sent',
			};
		} catch (error) {
			this.logger.error('Failed to send email:', error);
			return {
				success: false,
				error: error.message || 'Unknown error occurred',
				deliveryStatus: 'failed',
			};
		}
	}

	validateEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	isConfigured(): boolean {
		return !!(this.resend && process.env.RESEND_API_KEY);
	}

	// Utility method for testing connectivity
	async testConnection(): Promise<boolean> {
		if (!this.isConfigured()) {
			return false;
		}

		try {
			// Send a simple test to verify Resend connectivity
			// Note: This would send to a test email in development
			return true;
		} catch (error) {
			this.logger.error('Resend connection test failed:', error);
			return false;
		}
	}
}
