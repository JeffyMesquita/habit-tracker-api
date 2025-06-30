import { Module } from '@nestjs/common';
import { PrismaModule } from '@/database/prisma.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
	imports: [PrismaModule],
	controllers: [NotificationsController],
	providers: [NotificationsService],
	exports: [NotificationsService],
})
export class NotificationsModule {}
