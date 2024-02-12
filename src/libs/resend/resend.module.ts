import { Module } from '@nestjs/common';
import { ResendEmailService } from './resend.service';

@Module({
	providers: [ResendEmailService],
	exports: [ResendEmailService],
})
export class ResendEmailModule {}
