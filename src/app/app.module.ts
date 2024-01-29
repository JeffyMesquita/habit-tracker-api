import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { PrismaModule } from '@/database/prisma.module';
import { Module } from '@nestjs/common';
import { AppModule as AppClientModule } from '@modules/app/app.module';

import { ConfigModule } from '@nestjs/config';

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: '.env',
			isGlobal: true,
		}),
		PrismaModule,
		AppClientModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
