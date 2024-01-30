import API_CODES from '@/misc/API/codes';
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller('/app')
export class AppController {
	constructor() {}

	@Get('/server')
	getApp() {
		return {
			message: 'Server is running',
			code: API_CODES.success.SERVER_IS_RUNNING,
		};
	}
}
