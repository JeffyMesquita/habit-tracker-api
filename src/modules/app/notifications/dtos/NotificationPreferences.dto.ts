import {
	IsBoolean,
	IsString,
	IsOptional,
	IsEnum,
	IsInt,
	Min,
	Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNotificationPreferencesDTO {
	@ApiPropertyOptional({
		description: 'Habilitar notificações por email',
		example: true,
	})
	@IsOptional()
	@IsBoolean()
	emailEnabled?: boolean;

	@ApiPropertyOptional({
		description: 'Habilitar notificações push',
		example: true,
	})
	@IsOptional()
	@IsBoolean()
	pushEnabled?: boolean;

	@ApiPropertyOptional({
		description: 'Habilitar notificações SMS',
		example: false,
	})
	@IsOptional()
	@IsBoolean()
	smsEnabled?: boolean;

	@ApiPropertyOptional({
		description: 'Lembretes de hábitos',
		example: true,
	})
	@IsOptional()
	@IsBoolean()
	habitReminders?: boolean;

	@ApiPropertyOptional({
		description: 'Notificações de conquistas',
		example: true,
	})
	@IsOptional()
	@IsBoolean()
	achievements?: boolean;

	@ApiPropertyOptional({
		description: 'Relatórios semanais',
		example: true,
	})
	@IsOptional()
	@IsBoolean()
	weeklyReports?: boolean;

	@ApiPropertyOptional({
		description: 'Relatórios mensais',
		example: true,
	})
	@IsOptional()
	@IsBoolean()
	monthlyReports?: boolean;

	@ApiPropertyOptional({
		description: 'Alertas de inatividade',
		example: true,
	})
	@IsOptional()
	@IsBoolean()
	inactivityAlerts?: boolean;

	@ApiPropertyOptional({
		description: 'Avisos de sequência em risco',
		example: true,
	})
	@IsOptional()
	@IsBoolean()
	streakWarnings?: boolean;

	@ApiPropertyOptional({
		description: 'Início do horário de silêncio (HH:mm)',
		example: '22:00',
	})
	@IsOptional()
	@IsString()
	quietHoursStart?: string;

	@ApiPropertyOptional({
		description: 'Fim do horário de silêncio (HH:mm)',
		example: '08:00',
	})
	@IsOptional()
	@IsString()
	quietHoursEnd?: string;

	@ApiPropertyOptional({
		description: 'Timezone do usuário',
		example: 'America/Sao_Paulo',
	})
	@IsOptional()
	@IsString()
	timezone?: string;

	@ApiPropertyOptional({
		description: 'Idioma preferido',
		example: 'pt-BR',
	})
	@IsOptional()
	@IsString()
	language?: string;

	@ApiPropertyOptional({
		description: 'Frequência de notificações',
		enum: ['immediate', 'batched', 'digest'],
		example: 'immediate',
	})
	@IsOptional()
	@IsEnum(['immediate', 'batched', 'digest'])
	frequency?: string;

	@ApiPropertyOptional({
		description: 'Frequência de lembretes de hábitos',
		enum: ['once', 'twice', 'multiple'],
		example: 'once',
	})
	@IsOptional()
	@IsEnum(['once', 'twice', 'multiple'])
	habitReminderFrequency?: string;

	@ApiPropertyOptional({
		description: 'Limite de inatividade em dias',
		example: 3,
		minimum: 1,
		maximum: 30,
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(30)
	inactivityThreshold?: number;

	@ApiPropertyOptional({
		description: 'Horas antes do deadline para avisar sobre sequência',
		example: 6,
		minimum: 1,
		maximum: 24,
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(24)
	streakWarningHours?: number;
}
