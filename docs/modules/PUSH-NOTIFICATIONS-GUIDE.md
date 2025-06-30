# 📱 Guia Completo: Sistema de Push Notifications - Habit Tracker API

## 📋 Índice

1. [Conceitos Fundamentais](#conceitos-fundamentais)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Componentes Implementados](#componentes-implementados)
4. [Firebase: Nossa Escolha](#firebase-nossa-escolha)
5. [Configuração e Setup](#configuração-e-setup)
6. [Como Usar o Sistema](#como-usar-o-sistema)
7. [Tipos de Notificações](#tipos-de-notificações)
8. [Troubleshooting](#troubleshooting)
9. [Manutenção e Monitoramento](#manutenção-e-monitoramento)
10. [Próximos Passos](#próximos-passos)

---

## 📚 Conceitos Fundamentais

### O que são Push Notifications?

**Push Notifications** são mensagens enviadas diretamente para dispositivos móveis (iOS, Android) ou browsers web, mesmo quando o app não está aberto. Elas aparecem na tela do usuário como notificações do sistema.

**Exemplos práticos:**

- 📱 WhatsApp te notifica sobre nova mensagem
- 🎯 App de exercícios lembra de treinar
- 📊 App bancário avisa sobre transação
- 🏆 Jogo notifica sobre conquista

### Por que são Importantes?

1. **Re-engajamento**: Trazem usuários de volta ao app
2. **Informações em Tempo Real**: Atualizações instantâneas
3. **Personalização**: Mensagens específicas para cada usuário
4. **Automação**: Funcionam sem intervenção manual

### Como Funcionam Tecnicamente?

```
[Seu Servidor] → [Provedor Push] → [Dispositivo do Usuário]
     ↑              ↑                    ↑
   API Call      Firebase FCM         Notificação
```

**Fluxo Detalhado:**

1. **Registro**: App no dispositivo registra com o provedor (Firebase)
2. **Token**: Dispositivo recebe um "token" único de identificação
3. **Armazenamento**: Seu servidor salva este token no banco de dados
4. **Envio**: Quando quer notificar, seu servidor envia para o Firebase
5. **Entrega**: Firebase entrega a notificação para o dispositivo específico

---

## 🏗️ Arquitetura do Sistema

### Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    HABIT TRACKER API                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Notifications   │  │   Push Service  │  │ Email Service│ │
│  │   Controller    │◄─┤   (Business)    │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│           │                     │                           │
│           ▼                     ▼                           │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ Notifications   │  │ Firebase Push   │                  │
│  │    Service      │◄─┤    Provider     │                  │
│  │  (Orchestrator) │  │  (FCM Interface)│                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
           │                     │
           ▼                     ▼
┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │  Firebase FCM   │
│   (UserDevice   │    │   (Google)      │
│    tokens)      │    │                 │
└─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Dispositivos  │
                    │ iOS/Android/Web │
                    └─────────────────┘
```

### Componentes Principais

1. **NotificationsController**: Recebe requisições HTTP
2. **NotificationsService**: Orquestra email + push
3. **PushService**: Lógica específica de push notifications
4. **FirebasePushProvider**: Interface com Firebase FCM
5. **Database**: Armazena tokens dos dispositivos

---

## 🔧 Componentes Implementados

### 1. NotificationsController (`notifications.controller.ts`)

**O que faz**: Ponto de entrada HTTP para o sistema de notificações

```typescript
@Controller('notifications')
export class NotificationsController {
  // Envia notificação (email + push)
  @Post('send')
  async sendNotification(@Body() dto: SendNotificationDTO)

  // Registra dispositivo para push
  @Post('devices/register')
  async registerDevice(@Body() dto: RegisterDeviceDTO)

  // Envia push de teste
  @Post('push/test')
  async sendTestPush(@Body() dto: any)
}
```

**Endpoints Disponíveis:**

- `POST /notifications/send` - Envia notificação completa
- `POST /notifications/devices/register` - Registra dispositivo
- `POST /notifications/push/test` - Teste de push notification

### 2. NotificationsService (`notifications.service.ts`)

**O que faz**: Orquestra o envio de notificações (email + push)

```typescript
@Injectable()
export class NotificationsService {
	constructor(
		private emailService: EmailService,
		private pushService: PushService,
		private prisma: PrismaService,
	) {}

	async sendNotification(data: SendNotificationDTO) {
		// 1. Busca dados do usuário
		// 2. Envia email (se configurado)
		// 3. Envia push (se tem dispositivos)
		// 4. Registra no banco de dados
	}
}
```

**Responsabilidades:**

- Coordenar envio multi-canal (email + push)
- Buscar tokens de dispositivos do usuário
- Registrar logs no banco de dados
- Gerenciar preferências de notificação

### 3. PushService (`services/push.service.ts`)

**O que faz**: Lógica de negócio específica para push notifications

```typescript
@Injectable()
export class PushService {
	constructor(private pushProvider: FirebasePushProvider) {}

	// Métodos especializados por tipo de notificação
	async sendHabitReminder(deviceTokens: string[], data: any);
	async sendAchievementUnlocked(deviceTokens: string[], data: any);
	async sendStreakWarning(deviceTokens: string[], data: any);
	async sendWeeklyReport(deviceTokens: string[], data: any);
	async sendInactivityAlert(deviceTokens: string[], data: any);
	async sendGoalDeadline(deviceTokens: string[], data: any);
}
```

**Tipos de Notificação Implementados:**

- 🎯 **Habit Reminder**: Lembra de praticar hábito
- 🏆 **Achievement Unlocked**: Nova conquista desbloqueada
- ⚠️ **Streak Warning**: Sequência em risco
- 📊 **Weekly Report**: Relatório semanal de progresso
- 😢 **Inactivity Alert**: Usuário inativo há dias
- ⏰ **Goal Deadline**: Meta próxima do prazo

### 4. FirebasePushProvider (`providers/push/firebase.provider.ts`)

**O que faz**: Interface técnica direta com Firebase FCM

```typescript
@Injectable()
export class FirebasePushProvider implements PushProvider {
	// Inicialização do Firebase
	private initializeFirebase(): void;

	// Envio para dispositivo único
	async sendToDevice(token: string, notification: PushNotificationData);

	// Envio para múltiplos dispositivos
	async sendToDevices(tokens: string[], notification: PushNotificationData);

	// Envio para tópico
	async sendToTopic(topic: string, notification: PushNotificationData);

	// Validação de token
	async validateDeviceToken(token: string);

	// Gerenciamento de tópicos
	async subscribeToTopic(tokens: string[], topic: string);
	async unsubscribeFromTopic(tokens: string[], topic: string);
}
```

**Recursos Implementados:**

- ✅ Envio para dispositivo único
- ✅ Envio em lote (até 500 dispositivos)
- ✅ Envio para tópicos
- ✅ Validação de tokens
- ✅ Suporte multi-plataforma (iOS/Android/Web)
- ✅ Tratamento de erros avançado
- ✅ Gerenciamento de tópicos

---

## 🔥 Firebase: Nossa Escolha

### Por que Firebase FCM?

**Firebase Cloud Messaging (FCM)** é o serviço de push notifications do Google.

**Vantagens:**

1. **Gratuito**: Até 2 milhões de mensagens/mês
2. **Confiável**: Infraestrutura do Google
3. **Multi-plataforma**: iOS, Android, Web
4. **Escalável**: Bilhões de mensagens processadas
5. **Recursos Avançados**: Tópicos, agendamento, analytics

### Alternativas Consideradas

| Serviço          | Prós                          | Contras                      | Custo         |
| ---------------- | ----------------------------- | ---------------------------- | ------------- |
| **Firebase FCM** | Gratuito, confiável, completo | Dependência do Google        | Gratuito      |
| OneSignal        | Interface amigável, analytics | Pago para recursos avançados | $9/mês        |
| Pusher           | API simples                   | Limitado, caro               | $49/mês       |
| Amazon SNS       | Integração AWS                | Complexo, caro               | $0.50/1M msgs |

### Como Firebase Funciona

```
1. APP REGISTRA:
   App → Firebase → Recebe TOKEN único

2. SERVIDOR ENVIA:
   API → Firebase FCM → Dispositivo

3. DISPOSITIVO RECEBE:
   Sistema Operacional → Mostra Notificação
```

---

## ⚙️ Configuração e Setup

### 1. Variáveis de Ambiente

Adicione no seu `.env`:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@your-project.iam.gserviceaccount.com"
```

### 2. Como Obter as Credenciais Firebase

**Passo a Passo:**

1. **Acesse**: [Firebase Console](https://console.firebase.google.com)
2. **Crie projeto** ou selecione existente
3. **Vá em**: Settings ⚙️ → Service Accounts
4. **Clique**: "Generate New Private Key"
5. **Baixe**: O arquivo JSON com as credenciais
6. **Extraia**: As 3 informações necessárias do JSON:

```json
{
	"project_id": "seu-project-id",
	"private_key": "-----BEGIN PRIVATE KEY-----\n...",
	"client_email": "firebase-adminsdk@..."
}
```

### 3. Banco de Dados

**Tabela UserDevice** (já implementada):

```sql
CREATE TABLE UserDevice (
  id UUID PRIMARY KEY,
  userId UUID REFERENCES User(id),
  deviceToken VARCHAR NOT NULL,
  deviceType VARCHAR,
  platform VARCHAR,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Para que serve:**

- Armazena tokens de dispositivos dos usuários
- Permite enviar notificações personalizadas
- Gerencia dispositivos ativos/inativos

---

## 🚀 Como Usar o Sistema

### 1. Registro de Dispositivo

**Quando**: Quando usuário instala/abre o app

```typescript
// Frontend (React Native/Flutter)
const deviceToken = await getDeviceToken(); // FCM SDK

// Chamada para API
POST /notifications/devices/register
{
  "userId": "uuid-do-usuario",
  "deviceToken": "token-do-firebase",
  "deviceType": "phone",
  "platform": "ios" // ou "android", "web"
}
```

### 2. Envio de Notificação Simples

```typescript
// No seu código backend
await this.notificationsService.sendNotification({
	userId: 'uuid-do-usuario',
	type: 'habit_reminder',
	title: 'Hora de exercitar! 💪',
	body: 'Sua sequência atual: 7 dias',
	channels: ['push'], // ou ['email', 'push']
	data: {
		habitId: 'habit-123',
		currentStreak: '7',
	},
});
```

### 3. Envio de Push Específico

```typescript
// Push de conquista desbloqueada
await this.pushService.sendAchievementUnlocked(deviceTokens, {
	achievementId: 'achievement-123',
	achievementTitle: 'Primeira Semana',
	points: 100,
});
```

### 4. Teste do Sistema

```bash
# Teste rápido via API
POST /notifications/push/test
{
  "deviceTokens": ["token-do-dispositivo"],
  "type": "habit_reminder"
}
```

---

## 📱 Tipos de Notificações

### 1. 🎯 Habit Reminder (Lembrete de Hábito)

**Quando**: Usuário não registrou progresso no horário
**Aparência**: "🎯 Exercitar-se - Hora de praticar seu hábito! Sequência atual: 7 dias"

```typescript
await pushService.sendHabitReminder(tokens, {
	habitId: 'habit-123',
	habitTitle: 'Exercitar-se',
	currentStreak: 7,
});
```

### 2. 🏆 Achievement Unlocked (Conquista)

**Quando**: Usuário atinge milestone
**Aparência**: "🏆 Nova Conquista! - Parabéns! Você desbloqueou: Primeira Semana"

```typescript
await pushService.sendAchievementUnlocked(tokens, {
	achievementId: 'achievement-123',
	achievementTitle: 'Primeira Semana',
	points: 100,
});
```

### 3. ⚠️ Streak Warning (Sequência em Risco)

**Quando**: Sequência pode ser perdida
**Aparência**: "⚠️ Sequência em Risco - Sua sequência de 14 dias pode ser perdida!"
**Prioridade**: Alta (aparece mesmo em modo silencioso)

```typescript
await pushService.sendStreakWarning(tokens, {
	habitId: 'habit-123',
	habitTitle: 'Leitura',
	currentStreak: 14,
});
```

### 4. 📊 Weekly Report (Relatório Semanal)

**Quando**: Todo domingo
**Aparência**: "📊 Relatório Semanal - Taxa de conclusão: 85%. Veja seu progresso!"

```typescript
await pushService.sendWeeklyReport(tokens, {
	completionRate: 85,
	totalHabits: 5,
});
```

### 5. 😢 Inactivity Alert (Alerta de Inatividade)

**Quando**: Usuário inativo por X dias
**Aparência**: "😢 Sentimos sua falta! - Você não registra progresso há 3 dias. Que tal voltar?"

```typescript
await pushService.sendInactivityAlert(tokens, {
	daysSinceLastActivity: 3,
});
```

### 6. ⏰ Goal Deadline (Prazo de Meta)

**Quando**: Meta próxima do vencimento
**Aparência**: "⏰ Meta se aproximando! - Sua meta 'Exercitar 30 dias' vence em 5 dias"

```typescript
await pushService.sendGoalDeadline(tokens, {
	goalId: 'goal-123',
	goalTitle: 'Exercitar 30 dias',
	daysRemaining: 5,
});
```

---

## 🔍 Troubleshooting

### Problemas Comuns e Soluções

#### 1. "Firebase not configured"

**Erro**: `Firebase not configured`
**Causa**: Variáveis de ambiente não definidas
**Solução**:

```bash
# Verifique se todas estão definidas:
echo $FIREBASE_PROJECT_ID
echo $FIREBASE_CLIENT_EMAIL
# FIREBASE_PRIVATE_KEY contém \n? Deve ter!
```

#### 2. "Invalid registration token"

**Erro**: `messaging/invalid-registration-token`
**Causa**: Token do dispositivo inválido/expirado
**Solução**:

```typescript
// O sistema automaticamente remove tokens inválidos
// Mas você pode forçar a limpeza:
await this.pushService.validateDeviceToken(token);
```

#### 3. "Rate limit exceeded"

**Erro**: `messaging/message-rate-exceeded`
**Causa**: Muitas mensagens enviadas rapidamente
**Solução**:

```typescript
// Implementar delay entre envios
await new Promise((resolve) => setTimeout(resolve, 1000));
```

#### 4. Notificação não aparece

**Possíveis Causas:**

- App não registrou corretamente
- Usuário desabilitou notificações
- Token inválido
- Formato da mensagem incorreto

**Debug:**

```typescript
// 1. Verifique se token é válido
const isValid = await this.pushService.validateDeviceToken(token);

// 2. Teste com notificação simples
await this.pushService.sendTestPush([token], 'habit_reminder');

// 3. Verifique logs do Firebase
this.logger.log('Push result:', result);
```

### Logs e Monitoramento

#### Verificar Saúde do Sistema

```typescript
// Endpoint de health check
GET /notifications/health

// Resposta esperada:
{
  "email": true,
  "push": true,
  "database": true
}
```

#### Logs Importantes

```typescript
// Sucesso
'Push notification sent successfully to 5 devices';

// Erro
'Failed to send push notification: Invalid token';

// Rate limit
'Rate limit exceeded for device at index 2';
```

---

## 📊 Manutenção e Monitoramento

### 1. Limpeza de Tokens Inválidos

**Por que**: Tokens podem expirar quando:

- Usuário desinstala app
- App é atualizado
- Sistema operacional muda

**Como fazer**:

```typescript
// Job diário para limpar tokens inválidos
@Cron('0 2 * * *') // Todo dia às 2h
async cleanInvalidTokens() {
  const devices = await this.prisma.userDevice.findMany({
    where: { isActive: true }
  });

  for (const device of devices) {
    const isValid = await this.pushService.validateDeviceToken(device.deviceToken);
    if (!isValid) {
      await this.prisma.userDevice.update({
        where: { id: device.id },
        data: { isActive: false }
      });
    }
  }
}
```

### 2. Métricas Importantes

**Monitore**:

- Taxa de entrega (`successCount / totalSent`)
- Tokens inválidos por dia
- Tempo de resposta do Firebase
- Erros por tipo

```typescript
// Exemplo de coleta de métricas
const result = await this.pushService.sendPushNotification(options);

await this.prisma.notificationLog.create({
	data: {
		type: 'push',
		status: result.success ? 'delivered' : 'failed',
		recipientCount: options.deviceTokens.length,
		successCount: result.successCount,
		failureCount: result.failureCount,
		provider: 'firebase',
		createdAt: new Date(),
	},
});
```

### 3. Backup e Disaster Recovery

**Tokens de Dispositivos**:

```sql
-- Backup diário dos tokens ativos
CREATE TABLE UserDeviceBackup AS
SELECT * FROM UserDevice
WHERE isActive = true
AND updatedAt >= NOW() - INTERVAL '1 day';
```

**Configuração Firebase**:

- Mantenha credenciais Firebase em local seguro
- Tenha projeto Firebase de backup para testes
- Documente process de criação de novo projeto

---

## 🚀 Próximos Passos

### Funcionalidades Futuras

#### 1. Agendamento de Notificações

```typescript
// Agendar notificação para futuro
await this.notificationsService.scheduleNotification({
	userId: 'user-123',
	type: 'habit_reminder',
	scheduledFor: new Date('2024-01-15T08:00:00Z'),
	recurrence: 'daily', // daily, weekly, custom
});
```

#### 2. Notificações Baseadas em Localização

```typescript
// Notificar quando usuário chega na academia
await this.pushService.sendLocationReminder({
	location: 'gym',
	message: 'Você chegou na academia! Hora de treinar! 💪',
});
```

#### 3. A/B Testing de Mensagens

```typescript
// Testar diferentes versões da mensagem
await this.pushService.sendWithABTest({
	variant_a: { title: 'Hora de exercitar!', body: '💪 Vamos lá!' },
	variant_b: { title: 'Treino agora!', body: '🏃‍♂️ Não desista!' },
	userId: 'user-123',
});
```

#### 4. Rich Notifications

```typescript
// Notificações com botões de ação
await this.pushService.sendWithActions({
	title: 'Registrar exercício?',
	body: 'Você está na academia',
	actions: [
		{ id: 'yes', title: 'Sim, comecei!' },
		{ id: 'later', title: 'Mais tarde' },
		{ id: 'skip', title: 'Pular hoje' },
	],
});
```

#### 5. Analytics Avançado

```typescript
// Tracking de engajamento
await this.analytics.trackNotificationEngagement({
	notificationId: 'notif-123',
	userId: 'user-123',
	action: 'opened', // opened, dismissed, clicked
	timestamp: new Date(),
});
```

### Otimizações Técnicas

#### 1. Implementar Queue System

```typescript
// Para envios em massa
import { Queue } from 'bull';

const pushQueue = new Queue('push notifications');

pushQueue.process('send-push', async (job) => {
	const { deviceTokens, notification } = job.data;
	return await this.pushService.sendPushNotification({
		deviceTokens,
		...notification,
	});
});
```

#### 2. Cache de Tokens

```typescript
// Redis cache para tokens frequentes
import { Redis } from 'ioredis';

async getUserDeviceTokens(userId: string): Promise<string[]> {
  const cacheKey = `user:${userId}:tokens`;
  let tokens = await this.redis.get(cacheKey);

  if (!tokens) {
    tokens = await this.prisma.userDevice.findMany({
      where: { userId, isActive: true },
      select: { deviceToken: true }
    });
    await this.redis.setex(cacheKey, 300, JSON.stringify(tokens)); // 5min cache
  }

  return JSON.parse(tokens);
}
```

#### 3. Retry Logic Avançado

```typescript
// Exponential backoff para falhas
async sendWithRetry(options: SendPushOptions, maxRetries = 3): Promise<PushSendResult> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await this.sendPushNotification(options);
      if (result.success) return result;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

## 📚 Recursos Adicionais

### Documentação Externa

- [Firebase FCM Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Push API Specification](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Apple Push Notification Service](https://developer.apple.com/documentation/usernotifications)
- [Android Notification Guide](https://developer.android.com/guide/topics/ui/notifiers/notifications)

### Ferramentas Úteis

- [FCM Testing Tool](https://firebase.google.com/docs/cloud-messaging/js/client#test-your-client-app-implementation)
- [Push Notification Tester](https://pusher.vercel.app/)
- [Firebase Console](https://console.firebase.google.com)

### Contatos de Suporte

- **Firebase Support**: [Firebase Support](https://firebase.google.com/support)
- **Documentação Interna**: Este arquivo! 📖

---

## ✅ Checklist de Implementação

- [x] ✅ Firebase FCM configurado
- [x] ✅ Provider de push notifications
- [x] ✅ Service layer implementado
- [x] ✅ 6 tipos de notificações
- [x] ✅ Validação de tokens
- [x] ✅ Tratamento de erros
- [x] ✅ Logging completo
- [x] ✅ Multi-plataforma (iOS/Android/Web)
- [x] ✅ Testes unitários
- [x] ✅ Endpoints HTTP
- [x] ✅ Documentação completa
- [ ] ⏳ Agendamento de notificações
- [ ] ⏳ Queue system para envios em massa
- [ ] ⏳ Analytics de engajamento
- [ ] ⏳ A/B testing de mensagens

---

**🎉 Parabéns! Você agora tem um sistema completo de push notifications funcionando!**

_Criado em: Junho 2024 | Última atualização: Junho 2024_
