export interface EmailData {
	to: string | string[];
	from?: string;
	subject: string;
	html: string;
	text?: string;
	replyTo?: string;
	cc?: string | string[];
	bcc?: string | string[];
	attachments?: EmailAttachment[];
}

export interface EmailAttachment {
	filename: string;
	content: Buffer | string;
	contentType?: string;
	disposition?: 'attachment' | 'inline';
	cid?: string;
}

export interface EmailSendResult {
	success: boolean;
	messageId?: string;
	error?: string;
	deliveryStatus?: 'sent' | 'queued' | 'failed';
}

export interface EmailProvider {
	sendEmail(emailData: EmailData): Promise<EmailSendResult>;
	validateEmail(email: string): boolean;
	isConfigured(): boolean;
}
