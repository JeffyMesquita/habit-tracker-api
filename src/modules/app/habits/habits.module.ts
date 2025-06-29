import { Module } from '@nestjs/common';
import { HabitsController } from './habits.controller';
import { HabitsService } from './habits.service';

@Module({
	imports: [],
	controllers: [HabitsController],
	providers: [HabitsService],
	exports: [HabitsService],
})
export class HabitsModule {}
