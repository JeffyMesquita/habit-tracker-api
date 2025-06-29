import { Module } from '@nestjs/common';
import { GoalsService } from '@/modules/app/goals/goals.service';
import { GoalsController } from '@/modules/app/goals/goals.controller';
import { PrismaModule } from '@/database/prisma.module';
import { AchievementsModule } from '@/modules/app/achievements/achievements.module';

@Module({
	imports: [PrismaModule, AchievementsModule],
	controllers: [GoalsController],
	providers: [GoalsService],
	exports: [GoalsService],
})
export class GoalsModule {}
