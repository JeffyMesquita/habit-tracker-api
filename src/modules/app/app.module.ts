import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
// import { UserController } from './user/user.controller';
// import { UserService } from './user/user.service';

@Module({
	imports: [UserModule],
	controllers: [AppController],
	providers: [],
	exports: [],
})
export class AppModule {}
