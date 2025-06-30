import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '@/modules/app/notifications/notifications.service';
import { EmailService } from '@/modules/app/notifications/services/email.service';
import { PrismaService } from '@/database/prisma.service';
import API_CODES from '@/misc/API/codes';
import { vi } from 'vitest';

describe('NotificationsService', () => {
	let service: NotificationsService;
	let prismaService: PrismaService;
	let emailService: EmailService;

	beforeEach(async () => {
		const mockEmailService = {
			sendHabitReminder: vi
				.fn()
				.mockResolvedValue({ success: true, messageId: 'test-123' }),
			sendAchievementUnlocked: vi
				.fn()
				.mockResolvedValue({ success: true, messageId: 'test-456' }),
			sendWeeklyReport: vi
				.fn()
				.mockResolvedValue({ success: true, messageId: 'test-789' }),
			sendEmail: vi
				.fn()
				.mockResolvedValue({ success: true, messageId: 'test-generic' }),
			sendTestEmail: vi
				.fn()
				.mockResolvedValue({ success: true, messageId: 'test-email' }),
			isHealthy: vi.fn().mockReturnValue(true),
		};

		const mockPrismaService = {
			notificationPreferences: {
				findUnique: vi.fn(),
				create: vi.fn(),
				upsert: vi.fn(),
			},
			userDevice: {
				findFirst: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn(),
			},
			notificationLog: {
				create: vi.fn(),
				update: vi.fn(),
			},
			user: {
				findUnique: vi.fn(),
			},
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				NotificationsService,
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
				{
					provide: EmailService,
					useValue: mockEmailService,
				},
			],
		}).compile();

		service = module.get<NotificationsService>(NotificationsService);
		prismaService = module.get<PrismaService>(PrismaService);
		emailService = module.get<EmailService>(EmailService);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('sendNotification', () => {
		it('should send notification successfully', async () => {
			const userId = 'user-123';
			const type = 'habit_reminder';
			const data = {
				title: 'Test Notification',
				body: 'Test body',
				habitTitle: 'Exercise',
			};

			const mockPreferences = {
				success: true,
				message: 'Preferences found',
				code: API_CODES.success.NOTIFICATION_PREFERENCES_FOUND,
				data: {
					emailEnabled: true,
					habitReminders: true,
				},
			};

			const mockNotificationLog = {
				id: 'log-123',
				userId,
				type,
				channel: 'email',
				status: 'queued',
			};

			const mockUser = {
				email: 'test@example.com',
				profile: { firstName: 'Test' },
			};

			vi.spyOn(service, 'getUserPreferences').mockResolvedValue(
				mockPreferences,
			);
			(prismaService.notificationLog.create as any).mockResolvedValue(
				mockNotificationLog,
			);
			(prismaService.user.findUnique as any).mockResolvedValue(mockUser);
			(prismaService.notificationLog.update as any).mockResolvedValue({});

			const result = await service.sendNotification(userId, type, data);

			expect(result.success).toBe(true);
			expect(result.code).toBe(
				API_CODES.success.NOTIFICATION_SENT_SUCCESSFULLY,
			);
			expect(result.data.notificationId).toBe('log-123');
		});

		it('should not send notification if type is disabled', async () => {
			const userId = 'user-123';
			const type = 'habit_reminder';
			const data = { title: 'Test' };

			const mockPreferences = {
				success: true,
				message: 'Preferences found',
				code: API_CODES.success.NOTIFICATION_PREFERENCES_FOUND,
				data: {
					emailEnabled: true,
					habitReminders: false,
				},
			};

			vi.spyOn(service, 'getUserPreferences').mockResolvedValue(
				mockPreferences,
			);

			const result = await service.sendNotification(userId, type, data);

			expect(result.success).toBe(false);
			expect(result.message).toBe(
				'Tipo de notificação desabilitado para este usuário',
			);
		});
	});

	describe('getUserPreferences', () => {
		it('should return existing preferences', async () => {
			const userId = 'user-123';
			const mockPreferences = {
				id: 'pref-123',
				userId,
				emailEnabled: true,
				pushEnabled: true,
			};

			(
				prismaService.notificationPreferences.findUnique as any
			).mockResolvedValue(mockPreferences);

			const result = await service.getUserPreferences(userId);

			expect(result.success).toBe(true);
			expect(result.code).toBe(
				API_CODES.success.NOTIFICATION_PREFERENCES_FOUND,
			);
			expect(result.data).toEqual(mockPreferences);
		});

		it('should create default preferences if none exist', async () => {
			const userId = 'user-123';
			const mockCreatedPreferences = {
				id: 'pref-123',
				userId,
				emailEnabled: true,
				pushEnabled: true,
				habitReminders: true,
			};

			(
				prismaService.notificationPreferences.findUnique as any
			).mockResolvedValue(null);
			(prismaService.notificationPreferences.create as any).mockResolvedValue(
				mockCreatedPreferences,
			);

			const result = await service.getUserPreferences(userId);

			expect(result.success).toBe(true);
			expect(result.data).toEqual(mockCreatedPreferences);
			expect(prismaService.notificationPreferences.create).toHaveBeenCalledWith(
				{
					data: {
						userId,
						emailEnabled: true,
						pushEnabled: true,
						habitReminders: true,
						achievements: true,
						weeklyReports: true,
						monthlyReports: true,
						inactivityAlerts: true,
						streakWarnings: true,
					},
				},
			);
		});
	});

	describe('updateUserPreferences', () => {
		it('should update preferences successfully', async () => {
			const userId = 'user-123';
			const updateData = { emailEnabled: false };
			const mockUpdatedPreferences = {
				id: 'pref-123',
				userId,
				emailEnabled: false,
			};

			(prismaService.notificationPreferences.upsert as any).mockResolvedValue(
				mockUpdatedPreferences,
			);

			const result = await service.updateUserPreferences(userId, updateData);

			expect(result.success).toBe(true);
			expect(result.code).toBe(
				API_CODES.success.NOTIFICATION_PREFERENCES_UPDATED,
			);
			expect(result.data).toEqual(mockUpdatedPreferences);
		});
	});

	describe('registerDevice', () => {
		it('should register new device successfully', async () => {
			const userId = 'user-123';
			const deviceData = {
				deviceToken: 'token-123',
				platform: 'ios',
				deviceType: 'phone',
			};
			const mockDevice = {
				id: 'device-123',
				userId,
				...deviceData,
			};

			(prismaService.userDevice.findFirst as any).mockResolvedValue(null);
			(prismaService.userDevice.create as any).mockResolvedValue(mockDevice);

			const result = await service.registerDevice(userId, deviceData);

			expect(result.success).toBe(true);
			expect(result.code).toBe(
				API_CODES.success.DEVICE_REGISTERED_SUCCESSFULLY,
			);
			expect(result.data).toEqual(mockDevice);
		});

		it('should update existing device', async () => {
			const userId = 'user-123';
			const deviceData = {
				deviceToken: 'token-123',
				platform: 'ios',
				deviceType: 'phone',
			};
			const existingDevice = {
				id: 'device-123',
				userId,
				deviceToken: 'token-123',
			};
			const updatedDevice = { ...existingDevice, ...deviceData };

			(prismaService.userDevice.findFirst as any).mockResolvedValue(
				existingDevice,
			);
			(prismaService.userDevice.update as any).mockResolvedValue(updatedDevice);

			const result = await service.registerDevice(userId, deviceData);

			expect(result.success).toBe(true);
			expect(result.data).toEqual(updatedDevice);
		});
	});

	describe('sendTestNotification', () => {
		it('should send test notification successfully', async () => {
			const userId = 'user-123';
			const type = 'habit_reminder';
			const mockUser = {
				email: 'test@example.com',
				profile: { firstName: 'Test' },
			};
			const mockLog = {
				id: 'log-123',
				userId,
				type: `test_${type}`,
			};

			(prismaService.user.findUnique as any).mockResolvedValue(mockUser);
			(prismaService.notificationLog.create as any).mockResolvedValue(mockLog);

			const result = await service.sendTestNotification(userId, type);

			expect(result.success).toBe(true);
			expect(result.code).toBe(API_CODES.success.TEST_NOTIFICATION_SENT);
			expect(result.data.notificationId).toBe('log-123');
			expect(emailService.sendTestEmail).toHaveBeenCalledWith(
				'test@example.com',
				type,
			);
		});
	});
});
