# README - Estrutura do Banco de Dados

Este documento descreve a estrutura do banco de dados utilizado no projeto. As tabelas foram projetadas para fornecer uma base sólida para coleta de dados e geração de métricas relevantes.

## Tabelas

### User

A tabela `User` armazena informações básicas do usuário:

- **id:** Identificador único do usuário.
- **email:** E-mail único associado ao usuário.
- **password:** Senha do usuário.
- **createdAt:** Data de criação do usuário.
- **updatedAt:** Data da última atualização do usuário.
- **role:** Relacionamento com a tabela `Role`.
- **profile:** Relacionamento com a tabela `Profile`.
- **address:** Relacionamento com a tabela `Address`.
- **habits:** Relacionamento com a tabela `Habit`.

### Role

A tabela `Role` define funções do usuário:

- **id:** Identificador único da função.
- **name:** Nome da função, único.
- **createdAt:** Data de criação da função.
- **updatedAt:** Data da última atualização da função.
- **users:** Relacionamento com a tabela `User`.

### Profile

A tabela `Profile` contém detalhes adicionais do usuário:

- **id:** Identificador único do perfil.
- **firstName:** Primeiro nome do usuário.
- **lastName:** Sobrenome do usuário.
- **avatarUrl:** URL do avatar do usuário.
- **bio:** Biografia do usuário.
- **occupation:** Ocupação do usuário.
- **birthdate:** Data de nascimento do usuário.
- **createdAt:** Data de criação do perfil.
- **updatedAt:** Data da última atualização do perfil.
- **user:** Relacionamento com a tabela `User`.

### Address

A tabela `Address` armazena informações de endereço do usuário:

- **id:** Identificador único do endereço.
- **city:** Cidade do endereço.
- **state:** Estado do endereço.
- **country:** País do endereço.
- **createdAt:** Data de criação do endereço.
- **updatedAt:** Data da última atualização do endereço.
- **user:** Relacionamento com a tabela `User`.

### Habit

A tabela `Habit` registra os hábitos de cada usuário:

- **id:** Identificador único do hábito.
- **title:** Título do hábito.
- **frequency:** Frequência do hábito.
- **moment:** Momento específico do hábito.
- **createdAt:** Data de criação do hábito.
- **updatedAt:** Data da última atualização do hábito.
- **dayHabits:** Relacionamento com a tabela `DayHabit`.
- **weekDays:** Relacionamento com a tabela `HabitWeekDays`.
- **user:** Relacionamento com a tabela `User`.

...

### Achievements

A tabela `Achievements` registra conquistas desbloqueadas pelos usuários:

- **id:** Identificador único da conquista.
- **user:** Relacionamento com a tabela `User`.
- **userId:** Chave estrangeira relacionada ao ID do usuário.
- **achievementType:** Tipo de conquista desbloqueada.
- **timestamp:** Data e hora do desbloqueio da conquista.

### UserPreferences

A tabela `UserPreferences` armazena preferências individuais dos usuários:

- **id:** Identificador único das preferências.
- **user:** Relacionamento com a tabela `User`.
- **userId:** Chave estrangeira relacionada ao ID do usuário.
- **notificationSettings:** Configurações de notificação em formato JSON.
- **theme:** Tema escolhido pelo usuário.

## Utilização Futura

Essas tabelas foram projetadas para permitir uma coleta abrangente de dados e oferecem a flexibilidade necessária para gerar diversas métricas e insights futuramente. Aqui estão alguns possíveis casos de uso:

- **Análise de Hábitos:** Utilize a tabela `DailyHabitProgress` para acompanhar o progresso diário dos usuários em relação aos seus hábitos. Calcule estatísticas como a média de conclusão diária, identifique padrões e forneça feedback personalizado.

- **Monitoramento de Conquistas:** A tabela `Achievements` permite rastrear as conquistas dos usuários ao longo do tempo. Crie sistemas de recompensas ou destaque usuários que alcançaram certos marcos.

- **Feedback do Usuário:** Utilize a tabela `UserFeedback` para coletar feedback direto dos usuários. Analise as respostas para identificar áreas de melhoria no aplicativo.

- **Personalização da Experiência:** Com a tabela `UserPreferences`, ofereça uma experiência personalizada aos usuários, permitindo que escolham temas e configurem notificações de acordo com suas preferências.

Essas são apenas algumas sugestões, e as possibilidades são vastas com essa estrutura de banco de dados. Adapte conforme necessário para atender às necessidades específicas do seu projeto.
