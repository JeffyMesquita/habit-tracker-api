import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller('/app')
export class AppController {
	constructor() {}

	@Get('/server')
	getApp() {
		return 'Server is running!';
	}
}
