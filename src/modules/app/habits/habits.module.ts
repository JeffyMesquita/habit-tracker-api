import { Module } from '@nestjs/common';
import { HabitsController } from './habits.controller';
import { HabitsService } from './habits.service';
import { PrismaModule } from '@/database/prisma.module';
import { AchievementsModule } from '@/modules/app/achievements/achievements.module';
import { GoalsModule } from '@/modules/app/goals/goals.module';

@Module({
	imports: [PrismaModule, AchievementsModule, GoalsModule],
	controllers: [HabitsController],
	providers: [HabitsService],
	exports: [HabitsService],
})
export class HabitsModule {}
