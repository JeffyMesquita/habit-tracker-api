import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ResendEmailModule } from '@/libs/resend/resend.module';

@Module({
	imports: [ResendEmailModule],
	controllers: [UserController],
	providers: [UserService],
	exports: [UserService],
})
export class UserModule {}
