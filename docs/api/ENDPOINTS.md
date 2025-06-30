# 📡 **API ENDPOINTS - DOCUMENTAÇÃO COMPLETA**

> **Lista consolidada** de todas as APIs do Habit Tracker - Status atual, funcionalidades e exemplos de uso.

---

## 🎯 **Status Geral das APIs**

### **📊 Resumo por Módulo**

| Módulo         | APIs    | Status      | Testes      | Documentation |
| -------------- | ------- | ----------- | ----------- | ------------- |
| Authentication | 8       | ✅ Complete | ✅ 12 tests | ✅ Full       |
| Habits         | 8       | ✅ Complete | ✅ 15 tests | ✅ Full       |
| Goals          | 7       | ✅ Complete | ✅ 22 tests | ✅ Full       |
| Achievements   | 4       | ✅ Complete | ✅ 14 tests | ✅ Full       |
| Analytics      | 2       | ✅ Complete | ✅ 11 tests | ✅ Full       |
| Reports        | 3+      | ✅ Complete | ❌ 0 tests  | ✅ Full       |
| User Profile   | 3       | ✅ Complete | ✅ 6 tests  | ✅ Full       |
| Notifications  | 0       | 📋 Sprint 3 | ❌ 0 tests  | 📋 Planning   |
| **TOTAL**      | **34+** | **✅ 94%**  | **✅ 62**   | **✅ 94%**    |

---

## 🔐 **Authentication APIs (8 endpoints)**

### **POST /app/user/register**

- **Função**: Registro de novo usuário
- **Status**: ✅ Complete
- **Body**: `{ email, password, firstName, lastName?, occupation?, bio? }`
- **Response**: `{ message, code, data: { user, accessToken, refreshToken } }`
- **Validações**: Email único, senha segura, campos obrigatórios

### **POST /app/user/login**

- **Função**: Autenticação de usuário
- **Status**: ✅ Complete
- **Body**: `{ email, password }`
- **Response**: `{ message, code, data: { user, accessToken, refreshToken } }`
- **Features**: JWT + Refresh Token, rate limiting

### **POST /app/user/confirm-email**

- **Função**: Confirmação de email com código
- **Status**: ✅ Complete
- **Body**: `{ email, confirmationCode }`
- **Response**: `{ message, code }`
- **Security**: Código temporário (15min), rate limiting

### **POST /app/user/resend-email**

- **Função**: Reenvio de código de confirmação
- **Status**: ✅ Complete
- **Body**: `{ email }`
- **Response**: `{ message, code }`
- **Limits**: 3 tentativas por hora

### **POST /app/user/forgot-password**

- **Função**: Solicitação de reset de senha
- **Status**: ✅ Complete
- **Body**: `{ email }`
- **Response**: `{ message, code }`
- **Flow**: Email → Código → Reset

### **POST /app/user/reset-password**

- **Função**: Reset de senha com código
- **Status**: ✅ Complete
- **Body**: `{ email, resetCode, newPassword }`
- **Response**: `{ message, code }`
- **Security**: Código único, expiração 30min

### **POST /app/user/refresh-token**

- **Função**: Renovação de access token
- **Status**: ✅ Complete
- **Body**: `{ refreshToken }`
- **Response**: `{ message, code, data: { accessToken, refreshToken } }`
- **Security**: Rotação de refresh tokens

### **POST /app/user/logout**

- **Função**: Logout com invalidação de tokens
- **Status**: ✅ Complete
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `{ message, code }`
- **Action**: Invalidates all user tokens

---

## 📋 **Habits Management APIs (8 endpoints)**

### **POST /app/habits**

- **Função**: Criar novo hábito
- **Status**: ✅ Complete
- **Auth**: Required (JWT)
- **Body**: `{ title, frequency, weekDays, moment? }`
- **Validations**: Título único por usuário, frequência 1-10
- **Response**: Hábito criado com validações

### **GET /app/habits**

- **Função**: Listar hábitos com filtros
- **Status**: ✅ Complete
- **Auth**: Required
- **Query**: `period, includeProgress, limit, offset`
- **Filters**: hoje, semana, mês, trimestre, ano, personalizado
- **Response**: Lista paginada com progresso opcional

### **GET /app/habits/today**

- **Função**: Hábitos específicos de hoje
- **Status**: ✅ Complete
- **Auth**: Required
- **Response**: Hábitos com progresso do dia atual
- **Features**: Otimizado para dashboard

### **GET /app/habits/:id**

- **Função**: Buscar hábito específico
- **Status**: ✅ Complete
- **Auth**: Required
- **Params**: `habitId`
- **Response**: Hábito completo com relacionamentos
- **Includes**: weekDays, progresso recente

### **PUT /app/habits/:id**

- **Função**: Atualizar hábito
- **Status**: ✅ Complete
- **Auth**: Required
- **Body**: `{ title?, frequency?, weekDays?, moment? }`
- **Validations**: Mesmas do create, título único
- **Response**: Hábito atualizado

### **DELETE /app/habits/:id**

- **Função**: Deletar hábito
- **Status**: ✅ Complete
- **Auth**: Required
- **Action**: Soft delete + cascata (progresso, weekDays)
- **Response**: Confirmação de deleção

### **POST /app/habits/:id/progress**

- **Função**: Registrar progresso diário
- **Status**: ✅ Complete
- **Auth**: Required
- **Body**: `{ completedCount, date }`
- **Logic**: Upsert automático, validação de limites
- **Integration**: Triggers achievements + goals

### **GET /app/habits/:id/progress**

- **Função**: Histórico e estatísticas
- **Status**: ✅ Complete
- **Auth**: Required
- **Query**: `period, includeStats`
- **Response**: Histórico + taxa conclusão + streaks
- **Analytics**: 30 dias de histórico detalhado

---

## 🎯 **Goals System APIs (7 endpoints)**

### **POST /app/goals**

- **Função**: Criar meta personalizada
- **Status**: ✅ Complete
- **Auth**: Required
- **Body**: `{ goalType, targetValue, startDate, endDate, title, description?, priority?, habitId? }`
- **Types**: habit_completion, streak_days, consistency_percentage
- **Validations**: Datas válidas, conflitos, habit existence

### **GET /app/goals**

- **Função**: Listar metas com filtros
- **Status**: ✅ Complete
- **Auth**: Required
- **Query**: `status, goalType, priority, limit, offset`
- **Filters**: active, completed, paused, cancelled
- **Response**: Metas com progresso calculado

### **GET /app/goals/:id**

- **Função**: Buscar meta específica
- **Status**: ✅ Complete
- **Auth**: Required
- **Response**: Meta completa com progresso detalhado
- **Calculations**: Progresso real-time baseado em hábitos

### **PUT /app/goals/:id**

- **Função**: Atualizar meta
- **Status**: ✅ Complete
- **Auth**: Required
- **Body**: Campos opcionais da meta
- **Validations**: Datas consistentes, lógica de negócio
- **Response**: Meta atualizada

### **DELETE /app/goals/:id**

- **Função**: Deletar meta
- **Status**: ✅ Complete
- **Auth**: Required
- **Action**: Soft delete, mantém histórico
- **Response**: Confirmação

### **GET /app/goals/:id/progress**

- **Função**: Progresso detalhado da meta
- **Status**: ✅ Complete
- **Auth**: Required
- **Response**: Progresso com métricas e timeline
- **Features**: Cálculo automático baseado em hábitos

### **POST /app/goals/:id/complete**

- **Função**: Marcar meta como completa manualmente
- **Status**: ✅ Complete
- **Auth**: Required
- **Body**: Não requer body
- **Features**: Timestamp automático, integração com achievements
- **Validations**: Meta existe, não está completa, pertence ao usuário
- **Response**: Confirmação com timestamp de conclusão

---

## 🏆 **Achievements System APIs (4 endpoints)**

### **POST /app/achievements/unlock**

- **Função**: Desbloquear achievement manual
- **Status**: ✅ Complete
- **Auth**: Required
- **Body**: `{ achievementCode, userId? }`
- **Use Cases**: Admin unlock, special events
- **Response**: Achievement desbloqueado

### **GET /app/achievements**

- **Função**: Listar achievements do usuário
- **Status**: ✅ Complete
- **Auth**: Required
- **Query**: `status, category, rarity, limit, offset`
- **Filters**: unlocked, locked, category filtering
- **Response**: Lista com progresso e stats

### **GET /app/achievements/stats**

- **Função**: Estatísticas de achievements
- **Status**: ✅ Complete
- **Auth**: Required
- **Response**: Stats por categoria, total points, progress
- **Analytics**: Performance metrics

### **GET /app/achievements/:id**

- **Função**: Detalhes do achievement
- **Status**: ✅ Complete
- **Auth**: Required
- **Response**: Achievement completo com requirements
- **Includes**: Unlock history, related achievements

---

## 📊 **Analytics APIs (2 endpoints)**

### **GET /app/analytics/dashboard**

- **Função**: Dashboard consolidado
- **Status**: ✅ Complete
- **Auth**: Required
- **Query**: `period, includeHabitDetails, includeComparisons`
- **Response**: Métricas consolidadas com trends
- **Features**: Filtros flexíveis, comparações

### **GET /app/analytics/streaks**

- **Função**: Sistema de streaks
- **Status**: ✅ Complete
- **Auth**: Required
- **Query**: `type, limit, includeHistory`
- **Response**: Streaks atuais + histórico + best
- **Types**: all, habit-specific, global

---

## 📈 **Reports APIs (3+ endpoints)**

### **POST /app/reports/generate**

- **Função**: Gerar relatório customizado avançado
- **Status**: ✅ Complete with Enhanced Features
- **Auth**: Required
- **Body**: `{ type, period, format, filters, includeAchievements? }`
- **Types**: weekly, monthly, custom, quarterly, yearly
- **Formats**: JSON, CSV, PDF
- **🆕 Enhanced Features**:
  - **Category Breakdown**: Análise por categoria de hábito
  - **Top Categories**: Ranking das 3 melhores categorias
  - **Individual Streak Tracking**: Streaks específicos por hábito
  - **Advanced Insights**: Análise automática de performance
- **Response Structure**:

```json
{
  "data": {
    "period": { "startDate": "2025-01-01", "endDate": "2025-01-29" },
    "summary": {
      "totalHabits": 5,
      "totalCompletions": 85,
      "overallCompletionRate": 78.5,
      "activeDays": 22,
      "categoryBreakdown": {
        "Saúde": { "completionRate": 85.2, "totalHabits": 2, "completedDays": 23, "totalDays": 27 },
        "Fitness": { "completionRate": 72.1, "totalHabits": 2, "completedDays": 39, "totalDays": 54 },
        "Trabalho": { "completionRate": 90.3, "totalHabits": 1, "completedDays": 28, "totalDays": 31 }
      }
    },
    "habits": [
      {
        "id": "habit-123",
        "name": "Exercitar-se",
        "category": "Fitness",
        "daysCompleted": 20,
        "totalDays": 29,
        "completionRate": 68.97,
        "currentStreak": 5,
        "longestStreak": 12
      }
    ],
    "insights": {
      "bestPerformingHabits": [...],
      "needsAttentionHabits": [...],
      "topCategories": [
        { "category": "Trabalho", "completionRate": 90.3, "totalHabits": 1 },
        { "category": "Saúde", "completionRate": 85.2, "totalHabits": 2 },
        { "category": "Fitness", "completionRate": 72.1, "totalHabits": 2 }
      ],
      "weeklyTrends": [...]
    }
  }
}
```

### **GET /app/reports/weekly**

- **Função**: Relatório semanal automatizado com categoria analysis
- **Status**: ✅ Complete with Enhanced Analytics
- **Auth**: Required
- **Query**: `format, includeInsights, weekOffset?`
- **Response**: Relatório da semana atual/específica
- **🆕 Features**:
  - Category performance por semana
  - Individual habit streak tracking
  - Week number e comparações
  - Top categories da semana

### **GET /app/reports/monthly**

- **Função**: Relatório mensal automatizado com insights avançados
- **Status**: ✅ Complete with Enhanced Analytics
- **Auth**: Required
- **Query**: `format, includeYearComparison, monthOffset?`
- **Response**: Relatório do mês atual/específico
- **🆕 Features**:
  - Monthly category breakdown
  - Month-over-month comparisons
  - Localized month names (pt-BR)
  - Enhanced habit analytics per category

---

## 👤 **User Profile APIs (3 endpoints)**

### **GET /app/user/me**

- **Função**: Visualizar perfil completo
- **Status**: ✅ Complete
- **Auth**: Required
- **Response**: Dados do usuário + perfil + stats
- **Includes**: Account info, preferences, statistics

### **PUT /app/user/profile**

- **Função**: Atualizar dados pessoais
- **Status**: ✅ Complete
- **Auth**: Required
- **Body**: `{ firstName?, lastName?, bio?, occupation?, birthDate?, avatar? }`
- **Validations**: Data formats, string lengths
- **Response**: Perfil atualizado

---

## 🚀 **Próximas APIs (Sprint 3)**

### **📧 Notifications APIs (8-10 endpoints)**

- **POST /app/notifications/send** - Enviar notificação manual
- **POST /app/notifications/schedule** - Agendar notificação
- **GET /app/notifications/preferences** - Ver preferências
- **PUT /app/notifications/preferences** - Atualizar preferências
- **POST /app/notifications/test/:type** - Teste de notificação
- **POST /app/notifications/devices** - Registrar dispositivo
- **DELETE /app/notifications/devices/:id** - Remover dispositivo
- **GET /app/notifications/analytics** - Métricas (Admin)
- **GET /app/notifications/logs** - Logs (Admin)

---

## 🔧 **Padrões das APIs**

### **🔐 Autenticação**

```typescript
Headers: {
  'Authorization': 'Bearer {accessToken}',
  'Content-Type': 'application/json'
}
```

### **📝 Response Format**

```typescript
{
  message: string;
  code: string;
  data?: any;
  error?: string;
  timestamp: string;
}
```

### **❌ Error Handling**

```typescript
{
  message: "Error description",
  code: "ERROR_CODE",
  error: "Detailed error message",
  statusCode: 400,
  timestamp: "2025-01-29T19:30:00Z"
}
```

### **📊 Pagination**

```typescript
{
  data: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrevious: boolean;
  }
}
```

---

## 📋 **API Testing Status**

### **✅ Testados (62 testes)**

- Authentication: 12 testes
- Habits: 15 testes
- Goals: 22 testes
- Achievements: 14 testes
- Analytics: 11 testes
- User Profile: 6 testes

### **📋 Pendentes**

- Reports: 0 testes (funcional mas sem cobertura)
- Notifications: Sprint 3

---

## 📞 **Suporte & Documentação**

### **🔗 Links Úteis**

- **Swagger UI**: http://localhost:3333/api
- **Postman Collection**: Em desenvolvimento
- **API Tests**: `/test` directory
- **Error Codes**: `src/misc/API/codes/`

### **👥 Responsáveis**

- **Backend APIs**: Backend Team
- **Documentation**: Tech Lead
- **Testing**: QA + Dev Team

---

**📅 Última atualização**: Janeiro 2025 | **Total APIs**: 34+ funcionais

**🎯 Próxima atualização**: Sprint 3 - Notifications APIs\*\*
