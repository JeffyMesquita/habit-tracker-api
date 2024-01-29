import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
	async onModuleInit() {
		this.$connect().then(() => {
			console.count(`Conexão com o banco de dados iniciada`);
		});
	}

	async enableShutdownHooks(app: INestApplication) {
		process.on('beforeExit', async () => {
			await this.$disconnect();
			await app.close();
		});
	}
}
