import { ValidationPipe } from '@nestjs/common';
import {
	FastifyAdapter,
	NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCors from '@fastify/cors';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter({
			logger: true,
		}),
	);

	// Habilitar CORS
	await app.register(fastifyCors, {
		origin: true,
		credentials: true,
	});

	app.useGlobalPipes(new ValidationPipe());

	// Escutar em todas as interfaces (0.0.0.0) para aceitar conexões externas
	await app.listen(3000, '0.0.0.0');
	console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
