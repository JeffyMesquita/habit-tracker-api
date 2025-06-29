# README - Estrutura do Banco de Dados

Este documento descreve a estrutura completa do banco de dados utilizado no projeto Habit Tracker. As tabelas foram projetadas para fornecer uma base sólida para coleta de dados, autenticação, gerenciamento de hábitos e geração de métricas relevantes.

## Tabelas por Categoria

### 🔐 Usuários e Autenticação

#### User

A tabela `User` armazena informações básicas do usuário:

- **id:** Identificador único do usuário (UUID).
- **email:** E-mail único associado ao usuário.
- **password:** Senha do usuário (hash).
- **verified:** Status de verificação do email (padrão: false).
- **createdAt:** Data de criação do usuário.
- **updatedAt:** Data da última atualização do usuário.
- **roleId:** Chave estrangeira para a tabela Role.

**Relacionamentos:**

- **role:** Relacionamento com a tabela `Role`.
- **profile:** Relacionamento 1:1 com a tabela `Profile`.
- **address:** Relacionamento 1:1 com a tabela `Address`.
- **habits:** Relacionamento 1:N com a tabela `Habit`.
- Diversos outros relacionamentos com tabelas de métricas e progresso.

#### Role

A tabela `Role` define funções e permissões do usuário:

- **id:** Identificador único da função (UUID).
- **name:** Nome da função, único (ex: "admin", "user", "premium").
- **createdAt:** Data de criação da função.
- **updatedAt:** Data da última atualização da função.

**Relacionamentos:**

- **users:** Relacionamento 1:N com a tabela `User`.

#### Profile

A tabela `Profile` contém detalhes adicionais do perfil do usuário:

- **id:** Identificador único do perfil (UUID).
- **firstName:** Primeiro nome do usuário (opcional).
- **lastName:** Sobrenome do usuário (opcional).
- **avatarUrl:** URL do avatar do usuário (opcional).
- **bio:** Biografia do usuário (opcional).
- **occupation:** Ocupação do usuário (opcional).
- **birthdate:** Data de nascimento do usuário (opcional).
- **createdAt:** Data de criação do perfil.
- **updatedAt:** Data da última atualização do perfil.
- **userId:** Chave estrangeira única para a tabela User.

#### Address

A tabela `Address` armazena informações de localização do usuário:

- **id:** Identificador único do endereço (UUID).
- **city:** Cidade do endereço (opcional).
- **state:** Estado/província do endereço (opcional).
- **country:** País do endereço (opcional).
- **createdAt:** Data de criação do endereço.
- **updatedAt:** Data da última atualização do endereço.
- **userId:** Chave estrangeira única para a tabela User.

#### ConfirmEmail

A tabela `ConfirmEmail` gerencia o processo de confirmação de email:

- **id:** Identificador único (UUID).
- **userId:** Identificador do usuário relacionado.
- **token:** Token de confirmação de email.
- **code:** Código numérico para confirmação.
- **attempts:** Número de tentativas de confirmação (padrão: 0).
- **createdAt:** Data de criação do registro.
- **expiresAt:** Data de expiração do token/código.

#### ResetPassword

A tabela `ResetPassword` gerencia o processo de redefinição de senha:

- **id:** Identificador único (UUID).
- **userId:** Identificador do usuário relacionado.
- **email:** Email do usuário para reset.
- **tempPassword:** Senha temporária gerada.
- **createdAt:** Data de criação do registro.

#### RefreshToken

A tabela `RefreshToken` gerencia tokens de renovação de autenticação:

- **id:** Identificador único (UUID).
- **userId:** Identificador do usuário relacionado.
- **token:** Token de refresh JWT.
- **createdAt:** Data de criação do token.
- **expiresAt:** Data de expiração do token.

### 💎 Assinaturas

#### PremiumSubscription

A tabela `PremiumSubscription` gerencia assinaturas premium dos usuários:

- **id:** Identificador único (UUID).
- **userId:** Chave estrangeira única para a tabela User.
- **startDate:** Data de início da assinatura (padrão: now()).
- **months:** Duração da assinatura em meses (padrão: 1).
- **renewalDate:** Data de renovação da assinatura.
- **lastRenewal:** Data da última renovação (opcional).

### 📋 Hábitos e Progresso

#### Habit

A tabela `Habit` registra os hábitos criados pelos usuários:

- **id:** Identificador único do hábito (UUID).
- **title:** Título/nome do hábito.
- **frequency:** Frequência desejada do hábito (opcional).
- **moment:** Momento específico para realizar o hábito (opcional).
- **createdAt:** Data de criação do hábito.
- **updatedAt:** Data da última atualização do hábito.
- **userId:** Chave estrangeira para a tabela User.

**Relacionamentos:**

- **dayHabits:** Relacionamento com a tabela `DayHabit`.
- **weekDays:** Relacionamento com a tabela `HabitWeekDays`.
- **DailyHabitProgress:** Relacionamento com progresso diário.

**Constraints:**

- Unique constraint em (userId, title) - usuário não pode ter hábitos com mesmo nome.

#### HabitWeekDays

A tabela `HabitWeekDays` define em quais dias da semana cada hábito deve ser executado:

- **id:** Identificador único (UUID).
- **habitId:** Chave estrangeira para a tabela Habit.
- **weekDay:** Dia da semana (0-6, onde 0 = domingo).

**Constraints:**

- Unique constraint em (habitId, weekDay) - evita duplicatas.

#### Day

A tabela `Day` registra dias específicos do calendário:

- **id:** Identificador único (UUID).
- **date:** Data específica do dia.

**Constraints:**

- Unique constraint em date - apenas um registro por data.

#### DayHabit

A tabela `DayHabit` registra quando um hábito foi completado em um dia específico:

- **id:** Identificador único (UUID).
- **dayId:** Chave estrangeira para a tabela Day.
- **habitId:** Chave estrangeira para a tabela Habit.

**Constraints:**

- Unique constraint em (dayId, habitId) - um hábito só pode ser marcado uma vez por dia.

#### DailyHabitProgress

A tabela `DailyHabitProgress` registra o progresso diário detalhado de cada hábito:

- **id:** Identificador único (UUID).
- **userId:** Chave estrangeira para a tabela User.
- **habitId:** Chave estrangeira para a tabela Habit.
- **date:** Data do progresso.
- **completedCount:** Número de vezes que o hábito foi completado no dia.

#### DailyProgressSummary

A tabela `DailyProgressSummary` armazena um resumo do progresso geral diário do usuário:

- **id:** Identificador único (UUID).
- **userId:** Chave estrangeira para a tabela User.
- **date:** Data do resumo.
- **totalHabits:** Total de hábitos ativos do usuário.
- **completedHabits:** Número de hábitos completados no dia.

#### HabitStreak

A tabela `HabitStreak` registra sequências (streaks) de hábitos dos usuários:

- **id:** Identificador único (UUID).
- **userId:** Chave estrangeira para a tabela User.
- **startDate:** Data de início da sequência.
- **endDate:** Data de fim da sequência.

### 📊 Métricas e Análise

#### UserMetrics

A tabela `UserMetrics` armazena métricas calculadas dos usuários:

- **id:** Identificador único (UUID).
- **userId:** Chave estrangeira para a tabela User.
- **averageCompletionRate:** Taxa média de conclusão de hábitos (0.0-1.0).
- **longestStreak:** Maior sequência de dias consecutivos.

#### UserGoals

A tabela `UserGoals` registra objetivos definidos pelos usuários:

- **id:** Identificador único (UUID).
- **userId:** Chave estrangeira para a tabela User.
- **goalType:** Tipo de objetivo (ex: "daily_completion", "streak", "habit_count").
- **targetValue:** Valor alvo do objetivo.
- **startDate:** Data de início do objetivo.
- **endDate:** Data de fim do objetivo.

#### UserActivityLog

A tabela `UserActivityLog` registra atividades importantes dos usuários:

- **id:** Identificador único (UUID).
- **userId:** Chave estrangeira para a tabela User.
- **activityType:** Tipo de atividade (ex: "habit_created", "goal_achieved", "streak_broken").
- **timestamp:** Data e hora da atividade (padrão: now()).
- **details:** Detalhes adicionais da atividade (opcional, JSON).

#### Achievements

A tabela `Achievements` registra conquistas desbloqueadas pelos usuários:

- **id:** Identificador único (UUID).
- **userId:** Chave estrangeira para a tabela User.
- **achievementType:** Tipo de conquista (ex: "first_habit", "week_streak", "month_streak").
- **timestamp:** Data e hora do desbloqueio (padrão: now()).

### 💬 Interações e Feedback

#### UserFeedback

A tabela `UserFeedback` coleta feedback direto dos usuários:

- **id:** Identificador único (UUID).
- **userId:** Identificador do usuário (opcional - permite feedback anônimo).
- **feedbackType:** Tipo de feedback (ex: "bug_report", "feature_request", "general").
- **timestamp:** Data e hora do feedback (padrão: now()).
- **comments:** Comentários detalhados do feedback (opcional).

#### UserInteractions

A tabela `UserInteractions` registra interações dos usuários com o sistema:

- **id:** Identificador único (UUID).
- **userId:** Chave estrangeira para a tabela User.
- **interactionType:** Tipo de interação (ex: "button_click", "page_view", "feature_used").
- **timestamp:** Data e hora da interação (padrão: now()).
- **details:** Detalhes da interação (opcional, JSON).

#### UserSurveyResponses

A tabela `UserSurveyResponses` armazena respostas de pesquisas e surveys:

- **id:** Identificador único (UUID).
- **userId:** Identificador do usuário (opcional - permite respostas anônimas).
- **surveyType:** Tipo de pesquisa (ex: "satisfaction", "usage_patterns", "feature_feedback").
- **questionId:** Identificador da questão específica.
- **response:** Resposta do usuário.
- **timestamp:** Data e hora da resposta (padrão: now()).

#### UserPreferences

A tabela `UserPreferences` armazena preferências personalizadas dos usuários:

- **id:** Identificador único (UUID).
- **userId:** Chave estrangeira para a tabela User.
- **notificationSettings:** Configurações de notificação em formato JSON (opcional).
- **theme:** Tema escolhido pelo usuário (ex: "light", "dark", "auto") (opcional).

## Casos de Uso e Utilização das Tabelas

### 🔐 Autenticação e Segurança

- **Registro e Login:** Use `User`, `Role`, `ConfirmEmail` para criar contas seguras com verificação de email
- **Recuperação de Senha:** Utilize `ResetPassword` para processos seguros de redefinição
- **Sessões Persistentes:** Implemente `RefreshToken` para manter usuários logados com segurança
- **Perfis Completos:** Combine `Profile` e `Address` para experiências personalizadas

### 💎 Monetização

- **Assinaturas Premium:** Use `PremiumSubscription` para gerenciar upgrades e renovações automáticas
- **Controle de Acesso:** Combine com `Role` para liberar funcionalidades premium

### 📈 Tracking de Hábitos

- **Criação de Hábitos:** Use `Habit` e `HabitWeekDays` para hábitos personalizados por dias da semana
- **Execução Diária:** Registre conclusões via `Day`, `DayHabit` e `DailyHabitProgress`
- **Resumos Automáticos:** Gere `DailyProgressSummary` para dashboards e relatórios
- **Gamificação:** Calcule `HabitStreak` para motivar usuários com sequências

### 📊 Analytics e Insights

- **Métricas Pessoais:** Calcule `UserMetrics` para mostrar progresso ao longo do tempo
- **Objetivos:** Implemente `UserGoals` para metas personalizadas e acompanhamento
- **Conquistas:** Use `Achievements` para sistema de badges e recompensas
- **Auditoria:** Registre todas as ações em `UserActivityLog` para análise comportamental

### 💡 Experiência do Usuário

- **Personalização:** Use `UserPreferences` para temas, notificações e configurações
- **Feedback Contínuo:** Colete `UserFeedback` e `UserSurveyResponses` para melhorias
- **Análise de Uso:** Registre `UserInteractions` para otimizar UX e identificar padrões

### 🔍 Análises Avançadas Possíveis

#### Análise de Retenção

- Combine `UserActivityLog` com `DailyProgressSummary` para identificar padrões de abandono
- Use `HabitStreak` para correlacionar sequências com retenção de usuários

#### Análise de Engajamento

- Analise `UserInteractions` para identificar funcionalidades mais/menos utilizadas
- Correlacione `UserPreferences` com padrões de uso

#### Insights de Produto

- Use `UserFeedback` e `UserSurveyResponses` para roadmap de funcionalidades
- Analise `Achievements` para entender quais recompensas motivam mais

#### Personalização Inteligente

- Combine `UserMetrics` com `UserGoals` para sugerir objetivos realistas
- Use histórico de `DailyHabitProgress` para recomendar melhores horários para hábitos

### 🎯 Funcionalidades Futuras Suportadas

Esta estrutura robusta permite implementar:

- **Machine Learning:** Para recomendações de hábitos e previsão de sucesso
- **Social Features:** Compartilhamento de conquistas e competições entre amigos
- **Coaching Inteligente:** Insights automáticos baseados em padrões de comportamento
- **Integração com Wearables:** Sincronização com dispositivos para tracking automático
- **API Analytics:** Endpoints para relatórios detalhados e exportação de dados

A arquitetura foi projetada para escalar e evoluir, suportando desde funcionalidades básicas de tracking até análises comportamentais avançadas e sistemas de recomendação inteligentes.
