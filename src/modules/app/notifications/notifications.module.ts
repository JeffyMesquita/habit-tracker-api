import { Module } from '@nestjs/common';
import { PrismaModule } from '@/database/prisma.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailService } from './services/email.service';
import { ResendEmailProvider } from './providers/email/resend.provider';

@Module({
	imports: [PrismaModule],
	controllers: [NotificationsController],
	providers: [NotificationsService, EmailService, ResendEmailProvider],
	exports: [NotificationsService, EmailService],
})
export class NotificationsModule {}
