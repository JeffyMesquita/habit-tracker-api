# 📋 Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.2.0] - 2025-01-29

### 🎨 **Sistema de Categorias e Reports Avançados**

#### **✨ Adicionado**

- **Sistema de Categorias para Hábitos**
  - Campo `category` no modelo Habit para melhor organização
  - Categorização flexível (Saúde, Trabalho, Fitness, Estudos, etc.)
  - Suporte a categoria "Geral" como fallback
  - Base para filtros e analytics por categoria

- **Tracking Individual de Streaks**
  - Relação `habitId` no modelo HabitStreak
  - Tracking preciso de streaks por hábito específico
  - Histórico detalhado de sequências por hábito
  - Melhoria na precisão dos relatórios de streak

- **Reports Avançados com Análise por Categoria**
  - `categoryBreakdown`: Estatísticas completas por categoria
  - `topCategories`: Ranking das 3 melhores categorias
  - Métricas de completion rate por categoria
  - Insights automáticos sobre performance por área

#### **🔧 Database Schema Atualizado**

- **Migration**: `add_habit_category_and_streak_relation`
  - `ALTER TABLE "habits" ADD COLUMN "category" TEXT`
  - `ALTER TABLE "habit_streaks" ADD COLUMN "habitId" TEXT`
  - `ADD FOREIGN KEY (habitId) REFERENCES habits(id)`
  - Relacionamento opcional para backward compatibility

#### **⚡ Reports Service - Enhanced**

- **Novas Funcionalidades:**
  - Category breakdown com completion rates
  - Top performing categories ranking
  - Individual habit streak tracking
  - Enhanced weekly trends analysis
  - Comprehensive habit metrics with category support

- **Response Structure Melhorada:**
  ```json
  {
  	"summary": {
  		"categoryBreakdown": {
  			"Saúde": { "completionRate": 85.2, "totalHabits": 2 },
  			"Fitness": { "completionRate": 72.1, "totalHabits": 2 }
  		}
  	},
  	"insights": {
  		"topCategories": [{ "category": "Saúde", "completionRate": 85.2 }]
  	}
  }
  ```

#### **🐛 Corrigido**

- **Schema Compliance**: Reports service alinhado 100% com Prisma schema
- **Linter Errors**: Zero erros após correções completas
- **Type Safety**: Todos os campos usando tipos corretos do schema
- **Relations**: Uso correto de `DailyHabitProgress` e `HabitStreak`

#### **📊 Impacto nas Métricas**

- **APIs**: Mantidas 35+ endpoints
- **Funcionalidades**: +3 novas features (categorias, tracking individual, enhanced reports)
- **Performance**: Mantida < 500ms resposta média
- **Tests**: 62 testes mantidos, 100% pass rate
- **Code Quality**: Zero linter errors, TypeScript strict compliance

#### **🎯 Benefícios para UX**

- **Melhor Organização**: Hábitos categorizados por área da vida
- **Analytics Premium**: Insights detalhados por categoria
- **Tracking Preciso**: Streaks individuais por hábito
- **Reports Inteligentes**: Análise automática de performance
- **Base para Gamification**: Foundation para achievements por categoria

#### **📚 Documentação Atualizada**

- **ROADMAP.md**: Sprint 2 atualizado com novas funcionalidades
- **docs/api/ENDPOINTS.md**: Enhanced reports documentados
- **Migration files**: Database schema evolution documented

---

## [1.1.1] - 2025-01-29

### 🔧 **Finalização do Sistema de Metas**

#### **✨ Adicionado**

- **Nova API de Conclusão Manual de Metas**
  - `POST /app/goals/:id/complete` - Marcar meta como completa manualmente
  - Validações robustas (meta existe, não está completa, pertence ao usuário)
  - Timestamp automático de conclusão (`completedAt`)
  - Integração automática com sistema de achievements
  - Response com confirmação e dados da meta atualizada

#### **🔧 Modificado**

- **Database Schema Aprimorado**
  - Campo `completedAt: DateTime?` adicionado ao modelo `UserGoals`
  - Campo `createdAt: DateTime @default(now())` adicionado
  - Campo `updatedAt: DateTime @updatedAt` adicionado
  - Melhor tracking temporal das metas

- **GoalsService - Implementação Real**
  - `checkIfGoalWasCompleted()`: Implementação real com query database
  - `markGoalAsCompleted()`: Persistência real com timestamp
  - `completeGoal()`: Nova função para conclusão manual
  - Logs detalhados para debugging e monitoramento
  - Error handling aprimorado com códigos específicos

#### **📊 Impacto nas Métricas**

- **APIs**: Atualizada de 33+ para **34+ endpoints**
- **Funcionalidades**: Sistema de metas 100% funcional
- **Database**: Schema completo com tracking temporal
- **Performance**: Mantida < 500ms resposta média

#### **🐛 Corrigido**

- **Placeholders Removidos**: Funções stub substituídas por implementação real
- **Database Persistence**: Conclusão de metas agora persiste corretamente
- **Achievement Integration**: Fluxo automático funcionando 100%
- **Timestamp Tracking**: Histórico preciso de quando metas foram completadas

#### **📚 Documentação Atualizada**

- **ROADMAP.md**: Status Sprint 2 atualizado (7 APIs, sistema de conclusão real)
- **docs/api/ENDPOINTS.md**: Nova API documentada, count atualizado para 34+
- **Requirements.md**: Funcionalidades validadas e documentadas
- **CHANGELOG.md**: Este documento atualizado

#### **⚡ Performance & Qualidade**

- **Zero Breaking Changes**: Implementação backward-compatible
- **Database Migrations**: Schema update sem perda de dados
- **Code Coverage**: Mantida cobertura de funcionalidades core
- **TypeScript**: 100% tipado, sem erros de compilação

---

## [1.1.0] - 2025-01-29

### 🎉 **Sprint 2 - Gamificação e Relatórios**

#### **✨ Adicionado**

- **Sistema de Metas Personalizadas (6 APIs)**
  - CRUD completo de metas com validação avançada
  - Tipos de meta: habit_completion, streak_days, consistency_percentage
  - Progresso automático baseado nos hábitos
  - Filtros por status (active, completed, paused, cancelled)
  - Priorização de metas (1-10)
  - Datas de início e fim flexíveis
  - Cálculo automático de progresso em tempo real

- **Sistema de Achievements Completo (4 APIs)**
  - 12 achievements pré-definidos categorizados
  - Desbloqueio automático baseado em progresso
  - Sistema de pontuação e raridade
  - Estatísticas detalhadas por categoria
  - Achievements manuais para casos especiais
  - Integração com sistema de hábitos e metas

- **Módulo de Relatórios Avançados (3+ APIs)**
  - Relatórios semanais e mensais automatizados
  - Geração customizada com múltiplos filtros
  - Exportação em 3 formatos (JSON, CSV, PDF)
  - Análise de tendências e padrões
  - Métricas avançadas de consistency e completion
  - Integração com achievements nos relatórios

- **Sistema de Integração Automática**
  - Fluxo Habits → Achievements → Goals totalmente automatizado
  - Verificação automática de achievements após progresso
  - Atualização automática de metas baseada em hábitos
  - Cálculo de streaks em tempo real
  - Sistema de notificação de conquistas
  - Error handling robusto para não quebrar funcionalidades core

- **Expansão Arquitetural**
  - 3 novos módulos completamente testados
  - Estrutura hierárquica sem circular dependencies
  - 36 novos testes automatizados (total: 62)
  - Documentação Swagger expandida
  - API codes padronizados para todos os módulos

#### **🔧 APIs Implementadas**

**Metas (6 endpoints):**

- `POST /app/goals` - Criar meta personalizada
- `GET /app/goals` - Listar metas com filtros avançados
- `GET /app/goals/:id` - Buscar meta específica
- `PUT /app/goals/:id` - Atualizar meta
- `DELETE /app/goals/:id` - Deletar meta
- `GET /app/goals/:id/progress` - Progresso detalhado da meta

**Achievements (4 endpoints):**

- `POST /app/achievements/unlock` - Desbloquear achievement manual
- `GET /app/achievements` - Listar achievements com filtros
- `GET /app/achievements/stats` - Estatísticas por categoria
- `GET /app/achievements/:id` - Detalhes do achievement

**Relatórios (3+ endpoints):**

- `POST /app/reports/generate` - Gerar relatório customizado
- `GET /app/reports/weekly` - Relatório semanal automatizado
- `GET /app/reports/monthly` - Relatório mensal automatizado

#### **🏆 Sistema de Achievements**

- **12 Achievements Implementados:**
  - First Steps (primeiro hábito)
  - Consistency Master (7 dias seguidos)
  - Marathon Runner (30 dias seguidos)
  - Goal Achiever (primeira meta completa)
  - Perfectionist (100% completion)
  - Early Bird (hábito antes das 8h)
  - Night Owl (hábito após 22h)
  - Weekend Warrior (hábito no fim de semana)
  - Multitasker (5+ hábitos ativos)
  - Dedicated (100+ progresso total)
  - Champion (50 dias seguidos)
  - Legendary (365 dias seguidos)

#### **📊 Métricas de Qualidade**

- **Testes**: 62 testes (↑136% vs v1.0.0), 100% aprovação
- **APIs**: 33+ endpoints (↑57% vs v1.0.0)
- **Módulos**: 7 módulos ativos (↑75% vs v1.0.0)
- **Cobertura**: 100% funcionalidades core + integração
- **Performance**: Mantida < 500ms resposta média
- **TypeScript**: 0 erros, strict mode 100%

#### **🔧 Modificado**

- **HabitsService**: Integração automática com achievements e goals
- **GoalsService**: Integração automática com achievements
- **Arquitetura**: Dependency injection sem circular dependencies
- **Testes**: Mocks atualizados para todas as integrações
- **API Codes**: Padronização SUCCESS/ERROR → success/error

#### **📚 Documentação**

- README.md completamente atualizado
- Roadmap atualizado com Sprint 2 concluído
- Documentação Swagger para todas as novas APIs
- Exemplos de uso para integração automática
- Estrutura de testes documentada

---

## [1.0.0] - 2025-01-29

### 🎉 **Sprint 1 - Lançamento Inicial**

#### **✨ Adicionado**

- **Sistema de Autenticação Completo**
  - Registro de usuário com validação de email
  - Login com JWT (access + refresh tokens)
  - Confirmação de email com códigos temporários
  - Recuperação de senha segura
  - Sistema de roles (USER/ADMIN)
  - Logout com invalidação de tokens

- **Módulo de Hábitos Completo**
  - CRUD completo de hábitos
  - Validação de títulos únicos por usuário
  - Configuração de frequência (1-10 vezes/dia)
  - Dias da semana específicos (0-6)
  - Progresso diário com prevenção de duplicatas
  - Filtros avançados (hoje, semana, mês, trimestre, ano)
  - Estatísticas detalhadas por hábito

- **Analytics Dashboard**
  - Dashboard consolidado com métricas gerais
  - Sistema de streaks automático
  - Cálculo de taxa de conclusão
  - Filtros por período customizável
  - Análise de tendências semanais
  - Histórico completo de atividades

- **Gestão de Perfil**
  - Visualização de dados do usuário
  - Atualização de informações pessoais
  - Validação de dados de entrada
  - Avatar, bio, ocupação, data de nascimento

- **Infraestrutura e Qualidade**
  - Arquitetura modular com NestJS
  - Banco PostgreSQL com Prisma ORM
  - 26 testes automatizados (100% pass rate)
  - Documentação Swagger completa
  - Docker containerization
  - TypeScript strict mode
  - ESLint + Prettier configurados

#### **🔧 APIs Implementadas (21 endpoints)**

**Autenticação (8 endpoints):**

- `POST /app/user/register` - Registro de usuário
- `POST /app/user/login` - Login com JWT
- `POST /app/user/confirm-email` - Confirmação de email
- `POST /app/user/resend-email` - Reenvio de confirmação
- `POST /app/user/forgot-password` - Solicitação de reset
- `POST /app/user/reset-password` - Reset de senha
- `POST /app/user/refresh-token` - Renovação de token
- `POST /app/user/logout` - Logout

**Hábitos (8 endpoints):**

- `POST /app/habits` - Criar hábito
- `GET /app/habits` - Listar com filtros
- `GET /app/habits/today` - Hábitos de hoje
- `GET /app/habits/:id` - Buscar específico
- `PUT /app/habits/:id` - Atualizar hábito
- `DELETE /app/habits/:id` - Deletar hábito
- `POST /app/habits/:id/progress` - Registrar progresso
- `GET /app/habits/:id/progress` - Histórico e estatísticas

**Analytics (2 endpoints):**

- `GET /app/analytics/dashboard` - Dashboard consolidado
- `GET /app/analytics/streaks` - Sistema de streaks

**Perfil (3 endpoints):**

- `GET /app/user/me` - Visualizar perfil
- `PUT /app/user/profile` - Atualizar perfil

#### **🛡️ Segurança**

- Hash bcrypt para senhas
- JWT com rotação de tokens
- Guards de autenticação em todas as rotas protegidas
- Validação rigorosa de entrada
- Isolamento de dados por usuário
- Rate limiting implementado

#### **📊 Métricas de Qualidade**

- **Performance**: < 500ms resposta média
- **Testes**: 26 testes, 100% aprovação
- **Cobertura**: 100% funcionalidades core
- **Linting**: 0 erros ESLint
- **TypeScript**: Strict mode, 100% tipado

#### **📚 Documentação**

- README.md profissional completo
- Requirements.md atualizado com roadmap
- Swagger/OpenAPI para todas as APIs
- CONTRIBUTING.md com diretrizes
- Estrutura de projeto documentada

---

## [0.1.0] - 2025-01-15

### 🚧 **Setup Inicial**

#### **✨ Adicionado**

- Configuração inicial do projeto NestJS
- Estrutura básica de módulos
- Configuração do PostgreSQL com Prisma
- Schema inicial do banco de dados
- Configuração do Docker
- Setup de testes com Vitest
- Configuração de linting e formatting

---

## 🛣️ **Próximas Versões Planejadas**

### [1.1.0] - Sprint 2 (Fevereiro 2025)

#### **🎯 Planejado**

- Sistema de metas pessoais
- Achievements e gamificação básica
- Relatórios semanais e mensais
- Notificações por email

### [1.2.0] - Sprint 3 (Março 2025)

#### **🚀 Planejado**

- Notificações push
- Preferências avançadas do usuário
- Sistema de backup e sincronização
- Performance otimizations

### [2.0.0] - Sprint 4+ (Futuro)

#### **🌟 Planejado**

- Integração com wearables
- Features sociais
- IA e insights personalizados
- App mobile companion

---

## 📋 **Convenções de Versioning**

- **MAJOR** (X.0.0): Breaking changes ou funcionalidades principais
- **MINOR** (0.X.0): Novas funcionalidades compatíveis
- **PATCH** (0.0.X): Bug fixes e melhorias menores

## 🏷️ **Tags de Mudanças**

- `✨ Adicionado` - Novas funcionalidades
- `🔧 Modificado` - Mudanças em funcionalidades existentes
- `🐛 Corrigido` - Bug fixes
- `🗑️ Removido` - Funcionalidades removidas
- `🔒 Segurança` - Correções de segurança
- `⚡ Performance` - Melhorias de performance
- `📚 Documentação` - Mudanças na documentação

---

**📝 Nota**: Este changelog é mantido manualmente e documenta apenas as mudanças mais significativas. Para um histórico completo, consulte o [log de commits](https://github.com/seu-usuario/habit-tracker-api/commits).
