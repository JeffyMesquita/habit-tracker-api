import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	DevicePlatform,
	DeviceType,
} from '../interfaces/notification.interface';

export class RegisterDeviceDTO {
	@ApiProperty({
		description: 'Token único do dispositivo para push notifications',
		example: 'fcm-token-xyz123...',
	})
	@IsString()
	deviceToken: string;

	@ApiProperty({
		description: 'Plataforma do dispositivo',
		enum: DevicePlatform,
		example: DevicePlatform.ANDROID,
	})
	@IsEnum(DevicePlatform)
	platform: DevicePlatform;

	@ApiProperty({
		description: 'Tipo do dispositivo',
		enum: DeviceType,
		example: DeviceType.PHONE,
	})
	@IsEnum(DeviceType)
	deviceType: DeviceType;

	@ApiPropertyOptional({
		description: 'Versão do aplicativo',
		example: '1.0.0',
	})
	@IsOptional()
	@IsString()
	appVersion?: string;

	@ApiPropertyOptional({
		description: 'Versão do sistema operacional',
		example: 'Android 14',
	})
	@IsOptional()
	@IsString()
	osVersion?: string;
}

export class UpdateDeviceDTO {
	@ApiPropertyOptional({
		description: 'Novo token do dispositivo',
	})
	@IsOptional()
	@IsString()
	deviceToken?: string;

	@ApiPropertyOptional({
		description: 'Status ativo do dispositivo',
		example: true,
	})
	@IsOptional()
	@IsString()
	isActive?: boolean;

	@ApiPropertyOptional({
		description: 'Nova versão do app',
	})
	@IsOptional()
	@IsString()
	appVersion?: string;

	@ApiPropertyOptional({
		description: 'Nova versão do OS',
	})
	@IsOptional()
	@IsString()
	osVersion?: string;
}
