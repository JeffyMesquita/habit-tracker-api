import { PrismaModule } from '@/database/prisma.module';
import { AppModule as AppClientModule } from '@modules/app/app.module';
import { Module } from '@nestjs/common';

import { UserModule } from '@/modules/app/user/user.module';
import { ConfigModule } from '@nestjs/config';

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: '.env',
			isGlobal: true,
		}),
		PrismaModule,
		AppClientModule,
		UserModule,
	],
	providers: [],
	controllers: [],
})
export class AppModule {}
