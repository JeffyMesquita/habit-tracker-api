import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Body,
	Param,
	HttpCode,
	HttpStatus,
	Req,
} from '@nestjs/common';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
	ApiParam,
} from '@nestjs/swagger';
import { Auth } from '@/guards/useAuth';
import { NotificationsService } from './notifications.service';

@ApiTags('📧 Notifications')
@Controller('app/notifications')
@ApiBearerAuth()
@Auth()
export class NotificationsController {
	constructor(private readonly notificationsService: NotificationsService) {}

	@Post('send')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: '📤 Enviar notificação',
		description: 'Envia uma notificação para um usuário específico',
	})
	@ApiResponse({
		status: 200,
		description: 'Notificação enviada com sucesso',
	})
	async sendNotification(@Req() req: any, @Body() body: any) {
		const userId = req.user.sub;
		const { type, data } = body;
		return await this.notificationsService.sendNotification(userId, type, data);
	}

	@Get('preferences')
	@ApiOperation({
		summary: '⚙️ Obter preferências',
		description: 'Retorna as preferências de notificação do usuário',
	})
	@ApiResponse({
		status: 200,
		description: 'Preferências encontradas com sucesso',
	})
	async getPreferences(@Req() req: any) {
		const userId = req.user.sub;
		return await this.notificationsService.getUserPreferences(userId);
	}

	@Put('preferences')
	@ApiOperation({
		summary: '⚙️ Atualizar preferências',
		description: 'Atualiza as preferências de notificação do usuário',
	})
	@ApiResponse({
		status: 200,
		description: 'Preferências atualizadas com sucesso',
	})
	async updatePreferences(@Req() req: any, @Body() updateData: any) {
		const userId = req.user.sub;
		return await this.notificationsService.updateUserPreferences(
			userId,
			updateData,
		);
	}

	@Post('devices')
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({
		summary: '📱 Registrar dispositivo',
		description: 'Registra um dispositivo para receber push notifications',
	})
	@ApiResponse({
		status: 201,
		description: 'Dispositivo registrado com sucesso',
	})
	async registerDevice(@Req() req: any, @Body() deviceData: any) {
		const userId = req.user.sub;
		return await this.notificationsService.registerDevice(userId, deviceData);
	}

	@Delete('devices/:id')
	@ApiOperation({
		summary: '📱 Remover dispositivo',
		description: 'Remove um dispositivo dos push notifications',
	})
	@ApiParam({ name: 'id', description: 'ID do dispositivo' })
	@ApiResponse({
		status: 200,
		description: 'Dispositivo removido com sucesso',
	})
	async removeDevice(@Req() req: any, @Param('id') deviceId: string) {
		const userId = req.user.sub;
		return await this.notificationsService.removeDevice(userId, deviceId);
	}

	@Post('test/:type')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: '🧪 Enviar notificação de teste',
		description: 'Envia uma notificação de teste para o usuário autenticado',
	})
	@ApiParam({ name: 'type', description: 'Tipo da notificação de teste' })
	@ApiResponse({
		status: 200,
		description: 'Notificação de teste enviada com sucesso',
	})
	async sendTestNotification(@Req() req: any, @Param('type') type: string) {
		const userId = req.user.sub;
		return await this.notificationsService.sendTestNotification(userId, type);
	}
}
