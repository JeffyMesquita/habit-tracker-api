import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PrismaModule } from '@/database/prisma.module';
import { EmailService } from './services/email.service';
import { PushService } from './services/push.service';
import { ResendEmailProvider } from './providers/email/resend.provider';
import { FirebasePushProvider } from './providers/push/firebase.provider';

@Module({
	imports: [PrismaModule],
	controllers: [NotificationsController],
	providers: [
		NotificationsService,
		EmailService,
		PushService,
		ResendEmailProvider,
		FirebasePushProvider,
	],
	exports: [NotificationsService, EmailService, PushService],
})
export class NotificationsModule {}
