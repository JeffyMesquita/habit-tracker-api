import { Module } from '@nestjs/common';
import { PrismaModule } from '@/database/prisma.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
	imports: [PrismaModule],
	controllers: [AnalyticsController],
	providers: [AnalyticsService],
	exports: [AnalyticsService],
})
export class AnalyticsModule {}
