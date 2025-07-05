import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
import { HabitsModule } from './habits/habits.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { GoalsModule } from './goals/goals.module';
import { AchievementsModule } from './achievements/achievements.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
	imports: [
		UserModule,
		HabitsModule,
		AnalyticsModule,
		GoalsModule,
		AchievementsModule,
		ReportsModule,
		NotificationsModule,
	],
	controllers: [AppController],
	providers: [],
	exports: [],
})
export class AppModule {}
