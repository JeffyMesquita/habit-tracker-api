import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
import { HabitsModule } from './habits/habits.module';
import { AnalyticsModule } from './analytics/analytics.module';
// import { UserController } from './user/user.controller';
// import { UserService } from './user/user.service';

@Module({
	imports: [UserModule, HabitsModule, AnalyticsModule],
	controllers: [AppController],
	providers: [],
	exports: [],
})
export class AppModule {}
