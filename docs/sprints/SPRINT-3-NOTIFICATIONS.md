# 📧 **Sprint 3: Sistema de Notificações - Detalhamento Completo**

> **Status**: 📋 Planning | **Duration**: 4 semanas | **Start**: Fev 2025 | **Team**: Backend + DevOps

---

## 🎯 **Objetivos do Sprint**

### **📊 Métricas de Sucesso**

- **8-10 APIs novas** implementadas
- **Sistema completo** de email + push funcionando
- **+20 testes** adicionais (total: 80+)
- **>98% delivery rate** para emails
- **>40% open rate** para emails
- **>50% engagement** para push notifications
- **LGPD/GDPR compliance** 100%

### **🏆 Principais Entregáveis**

1. **Core Notification System** - Infraestrutura completa
2. **Email Notifications** - Templates ricos e personalizados
3. **Push Notifications** - Real-time com deep links
4. **User Preferences** - Controle granular
5. **Analytics Dashboard** - Métricas de performance
6. **Compliance System** - LGPD/GDPR ready

---

## 📅 **Cronograma Detalhado**

### **🔥 Semana 1: Infraestrutura Core (5 dias)**

#### **Dia 1-2: Setup Base**

- [ ] Criar módulo de notificações
- [ ] Setup Redis + Bull Queue
- [ ] Configurar providers (Email/Push)
- [ ] Schema do banco (preferences, logs, devices)

#### **Dia 3-4: Core Services**

- [ ] NotificationsService principal
- [ ] Queue processor básico
- [ ] Template engine setup
- [ ] Logging e audit trail

#### **Dia 5: APIs Base**

- [ ] POST /app/notifications/send
- [ ] GET /app/notifications/preferences
- [ ] PUT /app/notifications/preferences
- [ ] Testes unitários básicos

### **🔥 Semana 2: Email System (5 dias)**

#### **Dia 1-2: Email Provider**

- [ ] Integração Resend
- [ ] Templates Handlebars
- [ ] Email validation
- [ ] Bounce handling

#### **Dia 3-4: Email Templates**

- [ ] Habit reminder template
- [ ] Achievement unlock template
- [ ] Weekly summary template
- [ ] Responsive design

#### **Dia 5: Email APIs**

- [ ] POST /app/notifications/test/email
- [ ] Email scheduling
- [ ] Unsubscribe system
- [ ] Testes de integração

### **🔥 Semana 3: Push System (5 dias)**

#### **Dia 1-2: Push Provider**

- [ ] Firebase FCM setup
- [ ] Device token management
- [ ] Push validation
- [ ] Deep links

#### **Dia 3-4: Push Features**

- [ ] Rich notifications
- [ ] Action buttons
- [ ] Badge updates
- [ ] Sound/vibration config

#### **Dia 5: Push APIs**

- [ ] POST /app/notifications/devices
- [ ] POST /app/notifications/test/push
- [ ] Push scheduling
- [ ] Testes end-to-end

### **🔥 Semana 4: Advanced Features (5 dias)**

#### **Dia 1-2: Scheduler System**

- [ ] Cron jobs para lembretes
- [ ] Habit reminder scheduler
- [ ] Report scheduler
- [ ] Timezone handling

#### **Dia 3-4: Analytics & Compliance**

- [ ] Analytics dashboard
- [ ] Delivery tracking
- [ ] LGPD compliance
- [ ] Admin APIs

#### **Dia 5: Final Integration**

- [ ] Integration com Achievement system
- [ ] Integration com Goals system
- [ ] Performance testing
- [ ] Documentation final

---

## 🏗️ **Arquitetura Técnica Detalhada**

### **📦 Estrutura de Módulos**

```
src/modules/notifications/
├── notifications.module.ts
├── notifications.service.ts
├── notifications.controller.ts
├── interfaces/
│   ├── notification.interface.ts
│   ├── provider.interface.ts
│   └── template.interface.ts
├── providers/
│   ├── email/
│   │   ├── resend.provider.ts
│   │   └── email.provider.interface.ts
│   └── push/
│       ├── firebase.provider.ts
│       └── push.provider.interface.ts
├── queues/
│   ├── notification.queue.ts
│   ├── notification.processor.ts
│   └── scheduler.service.ts
├── templates/
│   ├── email/
│   │   ├── habit-reminder.hbs
│   │   ├── achievement-unlocked.hbs
│   │   ├── weekly-summary.hbs
│   │   └── layout.hbs
│   └── push/
│       ├── habit-reminder.json
│       └── achievement.json
├── dtos/
│   ├── send-notification.dto.ts
│   ├── schedule-notification.dto.ts
│   ├── notification-preferences.dto.ts
│   └── register-device.dto.ts
└── entities/
    ├── notification-log.entity.ts
    ├── user-preferences.entity.ts
    └── user-device.entity.ts
```

### **🔧 Configuração de Environment**

```env
# Email Provider (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=Habit Tracker <notifications@habittracker.com>

# Push Provider (Firebase)
FIREBASE_PROJECT_ID=habit-tracker-api
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@habit-tracker-api.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Queue System (Redis)
REDIS_URL=redis://localhost:6379
NOTIFICATION_QUEUE_NAME=notification-queue

# Notification Settings
NOTIFICATION_MAX_RETRIES=3
NOTIFICATION_RETRY_DELAY=60000
QUIET_HOURS_START=22:00
QUIET_HOURS_END=08:00
```

---

## 📧 **Sistema de Email Detalhado**

### **🎨 Templates HTML**

#### **Habit Reminder Template**

```handlebars
<html>
	<head>
		<meta charset='utf-8' />
		<meta name='viewport' content='width=device-width, initial-scale=1' />
		<title>🎯 {{habitTitle}} - Lembrete</title>
		<style>
			/* Mobile-first responsive styles */
			@media (max-width: 600px) {
				.container {
					padding: 10px !important;
				}
				.button {
					width: 100% !important;
				}
			}
		</style>
	</head>
	<body
		style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f8fafc;"
	>
		<div
			class='container'
			style='max-width: 600px; margin: 0 auto; padding: 20px;'
		>

			<!-- Header -->
			<div style='text-align: center; margin-bottom: 30px;'>
				<div
					style='background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 30px; border-radius: 15px;'
				>
					<h1 style='color: white; margin: 0; font-size: 28px;'>🎯 Hora do
						Hábito!</h1>
					<p style='color: #E0E7FF; margin: 10px 0 0 0; font-size: 16px;'>
						{{habitTitle}}
					</p>
				</div>
			</div>

			<!-- Progress Section -->
			<div
				style='background: white; padding: 25px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);'
			>
				<div
					style='display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;'
				>
					<div style='text-align: center;'>
						<div
							style='font-size: 32px; font-weight: bold; color: #4F46E5;'
						>{{currentStreak}}</div>
						<div style='color: #64748b; font-size: 14px;'>Dias Seguidos</div>
					</div>
					<div style='text-align: center;'>
						<div
							style='font-size: 32px; font-weight: bold; color: #059669;'
						>{{completionRate}}%</div>
						<div style='color: #64748b; font-size: 14px;'>Taxa de Conclusão</div>
					</div>
				</div>

				<!-- Progress Bar -->
				<div
					style='background: #E5E7EB; height: 8px; border-radius: 4px; margin: 20px 0;'
				>
					<div
						style='background: linear-gradient(90deg, #4F46E5, #7C3AED); height: 8px; border-radius: 4px; width: {{progressPercentage}}%;'
					></div>
				</div>

				<p style='color: #374151; text-align: center; margin: 15px 0;'>
					{{motivationalMessage}}
				</p>
			</div>

			<!-- Action Button -->
			<div style='text-align: center; margin: 30px 0;'>
				<a
					href='{{appUrl}}/habits/{{habitId}}'
					class='button'
					style='background: linear-gradient(135deg, #4F46E5, #7C3AED);
                      color: white;
                      padding: 15px 40px;
                      text-decoration: none;
                      border-radius: 10px;
                      font-weight: bold;
                      font-size: 16px;
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);'
				>
					✅ Marcar como Concluído
				</a>
			</div>

			<!-- Stats Section -->
			<div
				style='background: #F8FAFC; padding: 20px; border-radius: 10px; margin: 20px 0;'
			>
				<h3 style='color: #1E293B; margin-top: 0;'>📊 Suas Estatísticas</h3>
				<div
					style='display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;'
				>
					<div style='text-align: center;'>
						<div
							style='font-weight: bold; color: #4F46E5;'
						>{{totalHabits}}</div>
						<div style='font-size: 12px; color: #64748b;'>Hábitos Ativos</div>
					</div>
					<div style='text-align: center;'>
						<div
							style='font-weight: bold; color: #059669;'
						>{{achievements}}</div>
						<div style='font-size: 12px; color: #64748b;'>Conquistas</div>
					</div>
				</div>
			</div>

			<!-- Footer -->
			<div
				style='text-align: center; color: #64748b; font-size: 12px; margin-top: 30px;'
			>
				<p>Você pode
					<a href='{{preferencesUrl}}' style='color: #4F46E5;'>gerenciar suas
						notificações</a>
					a qualquer momento.</p>
				<p>
					<a href='{{unsubscribeUrl}}' style='color: #64748b;'>Cancelar
						inscrição</a>
					|
					<a href='{{supportUrl}}' style='color: #64748b;'>Suporte</a>
				</p>
			</div>
		</div>
	</body>
</html>
```

### **📊 Email Analytics**

```typescript
interface EmailAnalytics {
	// Delivery Metrics
	sent: number;
	delivered: number;
	bounced: number;

	// Engagement Metrics
	opened: number;
	clicked: number;
	unsubscribed: number;

	// Calculated Rates
	deliveryRate: number; // delivered/sent
	openRate: number; // opened/delivered
	clickRate: number; // clicked/opened
	unsubscribeRate: number; // unsubscribed/sent

	// Time-based Analysis
	bestSendTime: string;
	avgOpenTime: number; // minutes after send

	// Content Performance
	subjectLinePerformance: {
		subject: string;
		openRate: number;
		clickRate: number;
	}[];
}
```

---

## 📱 **Sistema de Push Detalhado**

### **🔥 Firebase FCM Configuration**

```typescript
// firebase-config.ts
import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseConfig {
	private app: admin.app.App;

	constructor() {
		this.app = admin.initializeApp({
			credential: admin.credential.cert({
				projectId: process.env.FIREBASE_PROJECT_ID,
				clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
				privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
			}),
		});
	}

	getMessaging() {
		return this.app.messaging();
	}
}
```

### **📱 Push Notification Templates**

```json
{
	"habit_reminder": {
		"notification": {
			"title": "🎯 {{habitTitle}}",
			"body": "Vamos manter a sequência de {{streak}} dias! {{remaining}} restantes para hoje.",
			"icon": "/icons/habit-icon.png",
			"badge": "/icons/badge.png",
			"image": "{{habitImage}}"
		},
		"data": {
			"type": "habit_reminder",
			"habitId": "{{habitId}}",
			"deepLink": "/habits/{{habitId}}",
			"actionable": "true"
		},
		"android": {
			"notification": {
				"icon": "ic_notification",
				"color": "#4F46E5",
				"sound": "default",
				"clickAction": "FLUTTER_NOTIFICATION_CLICK"
			}
		},
		"apns": {
			"payload": {
				"aps": {
					"sound": "default",
					"badge": "{{badgeCount}}",
					"category": "HABIT_REMINDER"
				}
			}
		}
	},

	"achievement_unlocked": {
		"notification": {
			"title": "🏆 Nova Conquista!",
			"body": "Parabéns! Você desbloqueou: {{achievementTitle}}",
			"icon": "/icons/achievement-icon.png",
			"image": "{{achievementImage}}"
		},
		"data": {
			"type": "achievement_unlocked",
			"achievementId": "{{achievementId}}",
			"deepLink": "/achievements/{{achievementId}}",
			"points": "{{points}}",
			"rarity": "{{rarity}}"
		},
		"android": {
			"notification": {
				"icon": "ic_achievement",
				"color": "#FFD700",
				"sound": "achievement_sound",
				"vibrationPattern": [200, 100, 200, 100, 200]
			}
		}
	}
}
```

---

## ⚙️ **Sistema de Preferências**

### **🎛️ Schema de Preferências**

```prisma
model NotificationPreferences {
  id     String @id @default(cuid())
  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Canais habilitados
  emailEnabled Boolean @default(true)
  pushEnabled  Boolean @default(true)
  smsEnabled   Boolean @default(false)

  // Tipos de notificação
  habitReminders     Boolean @default(true)
  achievements       Boolean @default(true)
  weeklyReports      Boolean @default(true)
  monthlyReports     Boolean @default(true)
  inactivityAlerts   Boolean @default(true)
  streakWarnings     Boolean @default(true)

  // Configurações avançadas
  quietHoursStart String  @default("22:00")
  quietHoursEnd   String  @default("08:00")
  timezone        String  @default("America/Sao_Paulo")
  language        String  @default("pt-BR")
  frequency       String  @default("immediate") // immediate, batched, digest

  // Configurações específicas
  habitReminderFrequency String @default("once") // once, twice, multiple
  inactivityThreshold    Int    @default(3) // dias
  streakWarningHours     Int    @default(6) // horas antes do deadline

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("notification_preferences")
}

model UserDevice {
  id       String @id @default(cuid())
  userId   String
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Device Info
  deviceToken String @unique
  platform    String // ios, android, web
  deviceType  String // phone, tablet, desktop
  appVersion  String?
  osVersion   String?

  // Status
  isActive    Boolean @default(true)
  lastUsed    DateTime @default(now())

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("user_devices")
}

model NotificationLog {
  id String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Notification Info
  type        String // habit_reminder, achievement_unlocked, etc.
  channel     String // email, push, sms
  status      String // queued, sent, delivered, opened, clicked, failed

  // Content
  title       String?
  body        String?
  templateId  String?

  // Delivery Info
  providerMessageId String?
  errorMessage      String?

  // Tracking
  sentAt     DateTime?
  deliveredAt DateTime?
  openedAt   DateTime?
  clickedAt  DateTime?

  createdAt DateTime @default(now())

  @@map("notification_logs")
}
```

---

## 🧪 **Estratégia de Testes**

### **📋 Cobertura de Testes**

#### **Unit Tests (60% do total)**

```typescript
// notifications.service.spec.ts
describe('NotificationsService', () => {
	it('should send habit reminder notification', async () => {
		const result = await service.sendNotification(
			userId,
			'habit_reminder',
			data,
		);
		expect(result.success).toBe(true);
		expect(mockQueue.add).toHaveBeenCalled();
	});

	it('should respect user preferences', async () => {
		mockPreferences.emailEnabled = false;
		await service.sendNotification(userId, 'habit_reminder', data);
		expect(mockEmailProvider.send).not.toHaveBeenCalled();
	});

	it('should handle quiet hours', async () => {
		mockCurrentTime = '23:00';
		await service.sendNotification(userId, 'habit_reminder', data);
		expect(mockQueue.add).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ delay: expect.any(Number) }),
		);
	});
});
```

#### **Integration Tests (30% do total)**

```typescript
describe('Notification Flow Integration', () => {
	it('should trigger achievement notification when unlocked', async () => {
		// Complete habit that unlocks achievement
		await completeHabit(habitId);

		// Wait for processing
		await waitForQueue();

		// Check notification was sent
		const logs = await getNotificationLogs(userId, 'achievement_unlocked');
		expect(logs).toHaveLength(1);
	});
});
```

#### **E2E Tests (10% do total)**

```typescript
describe('Notification API E2E', () => {
	it('should send test notification', async () => {
		return request(app)
			.post('/app/notifications/test/habit_reminder')
			.set('Authorization', `Bearer ${token}`)
			.expect(200)
			.expect((res) => {
				expect(res.body.message).toContain('enviada');
			});
	});
});
```

---

## 📊 **Métricas & KPIs**

### **🎯 KPIs Técnicos**

- **Queue Processing Time**: < 30s para 1000 notificações
- **Email Delivery Rate**: > 98%
- **Push Delivery Rate**: > 95%
- **Template Render Time**: < 100ms
- **Database Query Time**: < 50ms

### **🎯 KPIs de Negócio**

- **User Engagement**: +25% habit completion após notificações
- **Retention**: +20% retenção 30-day
- **Open Rate**: > 40% emails, > 50% push
- **Click Through Rate**: > 15%
- **Unsubscribe Rate**: < 2%

### **📊 Dashboard Metrics**

```typescript
interface NotificationDashboard {
	overview: {
		totalSent: number;
		successRate: number;
		engagementRate: number;
		activeUsers: number;
	};

	byChannel: {
		email: ChannelMetrics;
		push: ChannelMetrics;
	};

	byType: {
		habitReminders: TypeMetrics;
		achievements: TypeMetrics;
		reports: TypeMetrics;
	};

	trends: {
		daily: DailyTrend[];
		weekly: WeeklyTrend[];
	};
}
```

---

## 🔒 **Compliance & Segurança**

### **⚖️ LGPD Compliance**

#### **Consentimento**

```typescript
interface UserConsent {
	userId: string;
	emailNotifications: boolean;
	pushNotifications: boolean;
	marketingEmails: boolean;
	consentDate: Date;
	consentVersion: string;
	ipAddress: string;
	userAgent: string;
}
```

#### **Direitos do Usuário**

- **Acesso**: API para visualizar todas as notificações enviadas
- **Retificação**: Atualização de preferências
- **Cancelamento**: Unsubscribe com um clique
- **Portabilidade**: Export de dados de notificação
- **Esquecimento**: Deleção completa dos dados

### **🛡️ Segurança**

#### **Proteções Implementadas**

- **Rate Limiting**: 10 notificações/minuto por usuário
- **Input Validation**: Sanitização de todos os inputs
- **Template Security**: Prevenção de XSS em templates
- **Token Security**: Criptografia de device tokens
- **Audit Trail**: Log completo de todas as operações

---

## 💰 **Análise de Custos**

### **💸 Breakdown Mensal**

#### **Email Provider (Resend)**

- **Free Tier**: 3,000 emails/mês
- **Pro Plan**: $20/mês (50,000 emails)
- **Scale Plan**: $85/mês (500,000 emails)

#### **Push Provider (Firebase FCM)**

- **Gratuito**: 20M mensagens/mês
- **Custo adicional**: $0 para maioria dos casos

#### **Infrastructure**

- **Redis Cloud**: $15-30/mês
- **Additional Workers**: $20-40/mês
- **Monitoring**: $10-20/mês

#### **Projeção por Usuários**

| Usuários Ativos | Emails/Mês | Push/Mês | Custo Total |
| --------------- | ---------- | -------- | ----------- |
| 100             | 3,000      | 5,000    | $15-25      |
| 500             | 15,000     | 25,000   | $35-55      |
| 1,000           | 30,000     | 50,000   | $65-95      |
| 5,000           | 150,000    | 250,000  | $145-200    |

---

## 🚀 **Plano de Deploy**

### **🔄 Pipeline CI/CD**

#### **Stages**

1. **Build & Test**: Unit tests + Integration tests
2. **Security Scan**: Vulnerability assessment
3. **Deploy Staging**: Environment de teste
4. **E2E Tests**: Testes completos de fluxo
5. **Deploy Production**: Deployment gradual

#### **Feature Flags**

```typescript
const NOTIFICATION_FEATURES = {
	EMAIL_NOTIFICATIONS: process.env.ENABLE_EMAIL === 'true',
	PUSH_NOTIFICATIONS: process.env.ENABLE_PUSH === 'true',
	ADVANCED_SCHEDULING: process.env.ENABLE_SCHEDULING === 'true',
	ANALYTICS_DASHBOARD: process.env.ENABLE_ANALYTICS === 'true',
};
```

### **📊 Monitoring & Alerting**

#### **Health Checks**

- Queue health (Redis connection)
- Provider health (Resend/Firebase status)
- Database connection
- Template compilation

#### **Alerts**

- Delivery rate < 95%
- Queue backlog > 1000 items
- Error rate > 5%
- Response time > 2s

---

**🎯 Este documento será atualizado semanalmente durante a execução do Sprint 3**

**📧 Para dúvidas técnicas, consulte a equipe de backend**
