import {
	IsString,
	IsEnum,
	IsOptional,
	IsObject,
	IsDateString,
	IsArray,
	ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	NotificationType,
	NotificationChannel,
} from '../interfaces/notification.interface';

export class SendNotificationDTO {
	@ApiProperty({
		description: 'ID do usuário que receberá a notificação',
		example: 'user-uuid-123',
	})
	@IsString()
	userId: string;

	@ApiProperty({
		description: 'Tipo da notificação',
		enum: NotificationType,
		example: NotificationType.HABIT_REMINDER,
	})
	@IsEnum(NotificationType)
	type: NotificationType;

	@ApiProperty({
		description: 'Canal de entrega da notificação',
		enum: NotificationChannel,
		example: NotificationChannel.EMAIL,
	})
	@IsEnum(NotificationChannel)
	channel: NotificationChannel;

	@ApiProperty({
		description: 'Título da notificação',
		example: '🎯 Lembrete do seu hábito!',
	})
	@IsString()
	title: string;

	@ApiProperty({
		description: 'Corpo da mensagem da notificação',
		example:
			'Não esqueça de praticar exercícios hoje. Você está indo muito bem!',
	})
	@IsString()
	body: string;

	@ApiPropertyOptional({
		description: 'Dados adicionais para a notificação',
		example: { habitId: 'habit-123', streak: 5 },
	})
	@IsOptional()
	@IsObject()
	data?: Record<string, any>;

	@ApiPropertyOptional({
		description: 'Data para agendar a notificação (ISO string)',
		example: '2025-01-30T10:00:00Z',
	})
	@IsOptional()
	@IsDateString()
	scheduledFor?: string;
}

export class BulkSendNotificationDTO {
	@ApiProperty({
		description: 'Lista de IDs de usuários',
		type: [String],
		example: ['user-1', 'user-2', 'user-3'],
	})
	@IsArray()
	@IsString({ each: true })
	userIds: string[];

	@ApiProperty({
		description: 'Tipo da notificação',
		enum: NotificationType,
	})
	@IsEnum(NotificationType)
	type: NotificationType;

	@ApiProperty({
		description: 'Canal de entrega',
		enum: NotificationChannel,
	})
	@IsEnum(NotificationChannel)
	channel: NotificationChannel;

	@ApiProperty({
		description: 'Título da notificação',
	})
	@IsString()
	title: string;

	@ApiProperty({
		description: 'Corpo da mensagem',
	})
	@IsString()
	body: string;

	@ApiPropertyOptional({
		description: 'Dados dinâmicos por usuário',
	})
	@IsOptional()
	@IsObject()
	dynamicData?: Record<string, Record<string, any>>;

	@ApiPropertyOptional({
		description: 'Data para agendamento',
	})
	@IsOptional()
	@IsDateString()
	scheduledFor?: string;
}
