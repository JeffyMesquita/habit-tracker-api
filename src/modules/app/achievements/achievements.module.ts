import { Module } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { AchievementsController } from './achievements.controller';
import { PrismaModule } from '@/database/prisma.module';

@Module({
	imports: [PrismaModule],
	controllers: [AchievementsController],
	providers: [AchievementsService],
	exports: [AchievementsService],
})
export class AchievementsModule {}
