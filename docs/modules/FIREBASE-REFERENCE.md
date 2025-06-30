# 🔥 Firebase FCM - Referência Rápida

## 📖 Conceitos Essenciais

### O que é Firebase FCM?

**Firebase Cloud Messaging (FCM)** é o serviço gratuito do Google para enviar push notifications para dispositivos móveis e web.

### Termos Importantes

| Termo            | Significado             | Exemplo                                   |
| ---------------- | ----------------------- | ----------------------------------------- |
| **Device Token** | ID único do dispositivo | `dA1B2c3D4e5F6g7H8i9J...`                 |
| **Topic**        | Canal de notificação    | `'news'`, `'sports'`, `'updates'`         |
| **Payload**      | Dados da notificação    | `{ title: "Oi!", body: "Nova mensagem" }` |
| **Priority**     | Urgência da mensagem    | `'high'` ou `'normal'`                    |
| **TTL**          | Time to Live            | Quanto tempo tentar entregar              |

---

## ⚙️ Configuração Rápida

### 1. Variáveis de Ambiente Necessárias

```bash
FIREBASE_PROJECT_ID="seu-projeto-id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@seu-projeto.iam.gserviceaccount.com"
```

### 2. Como Obter Credenciais

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto
3. Configurações ⚙️ → Service accounts
4. Generate new private key
5. Baixe o JSON e extraia as 3 informações acima

---

## 🚀 Uso Básico

### Enviar para Um Dispositivo

```typescript
await this.firebaseProvider.sendToDevice('device-token-aqui', {
	title: 'Olá! 👋',
	body: 'Esta é uma notificação de teste',
	data: { tipo: 'teste' },
});
```

### Enviar para Múltiplos Dispositivos

```typescript
await this.firebaseProvider.sendToDevices(['token1', 'token2', 'token3'], {
	title: 'Notificação em Massa',
	body: 'Mensagem para todos',
	data: { evento: 'promocao' },
});
```

### Enviar para Tópico

```typescript
await this.firebaseProvider.sendToTopic('noticias', {
	title: 'Breaking News! 📰',
	body: 'Algo importante aconteceu',
	data: { categoria: 'urgente' },
});
```

---

## 📱 Plataformas Suportadas

### iOS (Apple Push Notification Service - APNS)

```typescript
// Configuração automática no nosso provider
apns: {
  headers: {
    'apns-priority': '10', // Alta prioridade
    'apns-expiration': '1234567890'
  },
  payload: {
    aps: {
      alert: { title: 'Título', body: 'Mensagem' },
      badge: 1,
      sound: 'default'
    }
  }
}
```

### Android

```typescript
// Configuração automática no nosso provider
android: {
  priority: 'high',
  ttl: 3600000, // 1 hora em ms
  notification: {
    icon: 'ic_notification',
    channelId: 'habit_tracker_notifications',
    sound: 'default'
  }
}
```

### Web (WebPush)

```typescript
// Configuração automática no nosso provider
webpush: {
  headers: { TTL: '86400' }, // 24 horas
  notification: {
    title: 'Título',
    body: 'Mensagem',
    icon: '/icon.png',
    requireInteraction: true
  }
}
```

---

## 🔧 Códigos de Erro Comuns

### Erros de Token

```typescript
// ❌ Token inválido
'messaging/invalid-registration-token';
// ❌ Token não registrado (usuário desinstalou app)
'messaging/registration-token-not-registered';
// ❌ Projeto errado
'messaging/sender-id-mismatch';
```

### Erros de Rate Limit

```typescript
// ❌ Muitas mensagens para um dispositivo
'messaging/device-message-rate-exceeded';
// ❌ Muitas mensagens no geral
'messaging/message-rate-exceeded';
// ❌ Muitas mensagens para um tópico
'messaging/topics-message-rate-exceeded';
```

### Erros de Servidor

```typescript
// ❌ Servidor Firebase indisponível
'messaging/server-unavailable';
// ❌ Erro interno do Firebase
'messaging/internal-error';
// ❌ Argumento inválido
'messaging/invalid-argument';
```

---

## 🩺 Troubleshooting

### 1. Notificação Não Aparece

**Checklist:**

- [ ] Token do dispositivo é válido?
- [ ] App está registrado no Firebase?
- [ ] Usuário permitiu notificações?
- [ ] Mensagem tem formato correto?
- [ ] Dispositivo está online?

**Debug:**

```typescript
// Validar token
const isValid = await this.firebaseProvider.validateDeviceToken(token);
console.log('Token válido?', isValid);

// Teste com dry run
await admin.messaging().send(message, true); // dry run = true
```

### 2. Rate Limit Atingido

**Soluções:**

```typescript
// Implementar delay entre envios
await new Promise((resolve) => setTimeout(resolve, 1000));

// Enviar em lotes menores
const batches = chunk(tokens, 100); // 100 por vez
for (const batch of batches) {
	await sendToBatch(batch);
	await delay(500); // 500ms entre lotes
}
```

### 3. Tokens Inválidos

**Limpeza automática:**

```typescript
// Job para limpar tokens inválidos
@Cron('0 2 * * *') // Todo dia às 2h
async cleanInvalidTokens() {
  const devices = await this.prisma.userDevice.findMany({
    where: { isActive: true }
  });

  for (const device of devices) {
    const isValid = await this.validateToken(device.deviceToken);
    if (!isValid) {
      await this.deactivateDevice(device.id);
    }
  }
}
```

---

## 📊 Limites e Quotas

### Gratuitos (Firebase Spark Plan)

- **Mensagens**: Ilimitadas
- **Tópicos**: 2.000 por projeto
- **Rate Limit**: 600.000 msg/min

### Pagos (Firebase Blaze Plan)

- **Mensagens**: Ilimitadas
- **Tópicos**: Ilimitados
- **Rate Limit**: Maior

### Boas Práticas

```typescript
// ✅ Bom: Enviar em lotes
await sendInBatches(tokens, 500); // 500 por vez

// ❌ Ruim: Enviar todos de uma vez
await sendToAll(tokens); // Pode dar rate limit

// ✅ Bom: Validar tokens periodicamente
await validateTokensPeriodically();

// ❌ Ruim: Nunca limpar tokens inválidos
// Tokens acumulam e gastam quota desnecessariamente
```

---

## 🔐 Segurança

### Credenciais

```bash
# ✅ Bom: Variáveis de ambiente
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# ❌ Ruim: Hardcoded no código
const privateKey = "-----BEGIN PRIVATE KEY-----\n..."; // NUNCA!
```

### Validação

```typescript
// ✅ Sempre validar entrada do usuário
if (!deviceToken || deviceToken.length < 10) {
	throw new Error('Token inválido');
}

// ✅ Sanitizar dados
const cleanData = {
	title: sanitize(title),
	body: sanitize(body),
};
```

---

## 📈 Monitoramento

### Métricas Importantes

- **Taxa de Entrega**: `successCount / totalSent`
- **Tokens Inválidos**: Quantos por dia
- **Tempo de Resposta**: Latência do Firebase
- **Tipos de Erro**: Categorização

### Logs Úteis

```typescript
// ✅ Log estruturado
this.logger.log('Push sent', {
	userId,
	deviceCount: tokens.length,
	type: notificationType,
	success: result.successCount,
	failures: result.failureCount,
	timestamp: new Date().toISOString(),
});

// ❌ Log não estruturado
console.log('enviou push'); // Não ajuda em nada
```

---

## 🔗 Links Úteis

### Documentação Oficial

- [Firebase FCM Docs](https://firebase.google.com/docs/cloud-messaging)
- [Admin SDK Node.js](https://firebase.google.com/docs/admin/setup)
- [Error Codes](https://firebase.google.com/docs/cloud-messaging/send-message#admin_error_codes)

### Ferramentas

- [Firebase Console](https://console.firebase.google.com)
- [FCM Test Tool](https://fcm-test.web.app/)
- [Push Tester](https://web-push-testing.web.app/)

### Nossa Implementação

- `src/modules/app/notifications/providers/push/firebase.provider.ts`
- `src/modules/app/notifications/services/push.service.ts`
- `docs/modules/PUSH-NOTIFICATIONS-COMPLETE-GUIDE.md`

---

## ⚡ Comandos Rápidos

### Testar Sistema

```bash
# Via API REST
curl -X POST http://localhost:3000/notifications/push/test \
  -H "Content-Type: application/json" \
  -d '{
    "deviceTokens": ["seu-token-aqui"],
    "type": "habit_reminder"
  }'
```

### Verificar Health

```bash
curl http://localhost:3000/notifications/health
# Resposta esperada: {"email": true, "push": true, "database": true}
```

### Registrar Dispositivo

```bash
curl -X POST http://localhost:3000/notifications/devices/register \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "uuid-do-usuario",
    "deviceToken": "token-do-firebase",
    "deviceType": "phone",
    "platform": "ios"
  }'
```

---

**🎯 Dica Final**: Mantenha este arquivo como referência rápida. Para documentação completa, consulte `PUSH-NOTIFICATIONS-COMPLETE-GUIDE.md`!
