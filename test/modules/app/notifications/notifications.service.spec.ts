import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '@/modules/app/notifications/notifications.service';
import { PrismaService } from '@/database/prisma.service';
import API_CODES from '@/misc/API/codes';
import { vi } from 'vitest';

describe('NotificationsService', () => {
	let service: NotificationsService;

	const mockPrismaService = {
		notificationPreferences: {
			findUnique: vi.fn(),
			create: vi.fn(),
			upsert: vi.fn(),
		},
		notificationLog: {
			create: vi.fn(),
		},
		userDevice: {
			findFirst: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				NotificationsService,
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
			],
		}).compile();

		service = module.get<NotificationsService>(NotificationsService);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('sendNotification', () => {
		it('should send notification successfully', async () => {
			const userId = 'user-123';
			const type = 'habit_reminder';
			const data = { title: 'Test', body: 'Test notification' };

			const mockPreferences = {
				userId,
				habitReminders: true,
				emailEnabled: true,
			};

			mockPrismaService.notificationPreferences.findUnique.mockResolvedValue(
				mockPreferences,
			);
			mockPrismaService.notificationLog.create.mockResolvedValue({
				id: 'log-123',
				userId,
				type,
				status: 'queued',
			});

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
			const data = { title: 'Test', body: 'Test notification' };

			const mockPreferences = {
				userId,
				habitReminders: false,
				emailEnabled: true,
			};

			mockPrismaService.notificationPreferences.findUnique.mockResolvedValue(
				mockPreferences,
			);

			const result = await service.sendNotification(userId, type, data);

			expect(result.success).toBe(false);
			expect(result.message).toContain('desabilitado');
		});
	});

	describe('getUserPreferences', () => {
		it('should return existing preferences', async () => {
			const userId = 'user-123';
			const preferences = {
				userId,
				emailEnabled: true,
				pushEnabled: true,
				habitReminders: true,
			};

			mockPrismaService.notificationPreferences.findUnique.mockResolvedValue(
				preferences,
			);

			const result = await service.getUserPreferences(userId);

			expect(result.success).toBe(true);
			expect(result.code).toBe(
				API_CODES.success.NOTIFICATION_PREFERENCES_FOUND,
			);
			expect(result.data).toEqual(preferences);
		});

		it('should create default preferences if none exist', async () => {
			const userId = 'user-123';
			const defaultPreferences = {
				userId,
				emailEnabled: true,
				pushEnabled: true,
				habitReminders: true,
				achievements: true,
				weeklyReports: true,
				monthlyReports: true,
				inactivityAlerts: true,
				streakWarnings: true,
			};

			mockPrismaService.notificationPreferences.findUnique.mockResolvedValue(
				null,
			);
			mockPrismaService.notificationPreferences.create.mockResolvedValue(
				defaultPreferences,
			);

			const result = await service.getUserPreferences(userId);

			expect(result.success).toBe(true);
			expect(
				mockPrismaService.notificationPreferences.create,
			).toHaveBeenCalledWith({
				data: expect.objectContaining({
					userId,
					emailEnabled: true,
					pushEnabled: true,
				}),
			});
		});
	});

	describe('updateUserPreferences', () => {
		it('should update preferences successfully', async () => {
			const userId = 'user-123';
			const updateData = { emailEnabled: false, habitReminders: false };
			const updatedPreferences = { userId, ...updateData };

			mockPrismaService.notificationPreferences.upsert.mockResolvedValue(
				updatedPreferences,
			);

			const result = await service.updateUserPreferences(userId, updateData);

			expect(result.success).toBe(true);
			expect(result.code).toBe(
				API_CODES.success.NOTIFICATION_PREFERENCES_UPDATED,
			);
			expect(result.data).toEqual(updatedPreferences);
		});
	});

	describe('registerDevice', () => {
		it('should register new device successfully', async () => {
			const userId = 'user-123';
			const deviceData = {
				deviceToken: 'token-123',
				platform: 'android',
				deviceType: 'phone',
			};

			mockPrismaService.userDevice.findFirst.mockResolvedValue(null);
			mockPrismaService.userDevice.create.mockResolvedValue({
				id: 'device-123',
				userId,
				...deviceData,
			});

			const result = await service.registerDevice(userId, deviceData);

			expect(result.success).toBe(true);
			expect(result.code).toBe(
				API_CODES.success.DEVICE_REGISTERED_SUCCESSFULLY,
			);
		});

		it('should update existing device', async () => {
			const userId = 'user-123';
			const deviceData = {
				deviceToken: 'token-123',
				platform: 'android',
				deviceType: 'phone',
			};
			const existingDevice = { id: 'device-123', userId, ...deviceData };

			mockPrismaService.userDevice.findFirst.mockResolvedValue(existingDevice);
			mockPrismaService.userDevice.update.mockResolvedValue(existingDevice);

			const result = await service.registerDevice(userId, deviceData);

			expect(result.success).toBe(true);
			expect(result.message).toContain('atualizado');
		});
	});

	describe('sendTestNotification', () => {
		it('should send test notification successfully', async () => {
			const userId = 'user-123';
			const type = 'habit_reminder';

			mockPrismaService.notificationPreferences.findUnique.mockResolvedValue({
				userId,
				habitReminders: true,
			});
			mockPrismaService.notificationLog.create.mockResolvedValue({
				id: 'log-123',
				userId,
				type,
			});

			const result = await service.sendTestNotification(userId, type);

			expect(result.success).toBe(true);
			expect(result.code).toBe(API_CODES.success.TEST_NOTIFICATION_SENT);
		});
	});
});
