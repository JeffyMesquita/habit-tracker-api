import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';

@Module({
	controllers: [AppController, UserController],
	providers: [UserService],
	exports: [UserService],
})
export class AppModule {}
