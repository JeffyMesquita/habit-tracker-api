import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaModule } from '@/database/prisma.module';

@Module({
	imports: [PrismaModule],
	controllers: [ReportsController],
	providers: [ReportsService],
	exports: [ReportsService],
})
export class ReportsModule {}
