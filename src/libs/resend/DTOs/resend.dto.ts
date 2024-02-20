export interface SendEmailConfirmationDTO {
	userEmail: string;
	code: string;
}

export interface SendEmailForgotPasswordDTO {
	userEmail: string;
	tempPassword: string;
}
