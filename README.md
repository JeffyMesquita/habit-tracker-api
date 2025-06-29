# Habit Tracker API

Este é um projeto de API REST construído com NestJS para gerenciamento de hábitos e tracking de progresso.

## 🚀 Quick Start

### Configuração Inicial

1. **Clone o repositório e instale dependências:**

```bash
npm install
```

2. **Configure variáveis de ambiente:**

```bash
# Crie um arquivo .env baseado no exemplo:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/habit-tracker-db"
NODE_ENV=development
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-here
```

### 🐳 Usando Docker (Recomendado)

```bash
# Subir banco e aplicação
npm run docker:up

# Aguardar banco inicializar e configurar
npm run docker:setup

# Ver logs em tempo real
npm run docker:logs

# Parar serviços
npm run docker:down
```

### 💻 Desenvolvimento Local

```bash
# Aplicar schema ao banco
npm run db:push

# Gerar cliente Prisma
npm run db:generate

# Popular com dados de teste
npm run db:seed

# Iniciar aplicação
npm run start:dev
```

### Usuários de Teste

Após executar o seed, você pode usar os seguintes usuários:

- **Admin:** admin@habittracker.com (senha: 123456)
- **João Silva:** joao.silva@email.com - Usuário ativo (senha: 123456)
- **Maria Santos:** maria.santos@email.com - Usuário premium (senha: 123456)
- **Pedro Costa:** pedro.costa@email.com - Usuário iniciante (senha: 123456)
- **Ana Oliveira:** ana.oliveira@email.com - Usuário não verificado (senha: 123456)

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run start:dev

# Build
npm run build

# Produção
npm run start:prod

# Docker
npm run docker:up       # Subir containers
npm run docker:down     # Parar containers
npm run docker:build    # Rebuild da aplicação
npm run docker:logs     # Ver logs em tempo real
npm run docker:restart  # Reiniciar apenas a API
npm run docker:setup    # Configuração inicial completa

# Database
npm run db:seed         # Popular banco com dados de teste
npm run db:reset        # Resetar e popular banco
npm run db:push         # Aplicar schema
npm run db:generate     # Gerar cliente Prisma
```

## 📊 Dados Incluídos no Seed

- **5 usuários** com diferentes perfis (admin, regulares, premium)
- **9 hábitos** distribuídos entre os usuários
- **30 dias** de progresso simulado realista
- **Conquistas** e sequências (streaks)
- **Métricas** e preferências personalizadas
- **Feedback** e interações de usuários

## 📖 Documentação

- **[Tables.md](./Tables.md)** - Documentação completa da estrutura do banco de dados
- **[Requiments.md](./Requiments.md)** - Requisitos do projeto

## 🛠️ Tecnologias

- **NestJS** - Framework Node.js
- **Prisma** - ORM e gerenciamento de banco
- **PostgreSQL** - Banco de dados
- **TypeScript** - Linguagem
- **bcrypt** - Hash de senhas
- **JWT** - Autenticação

## 📂 Estrutura do Projeto

```
src/
├── modules/        # Módulos da aplicação
├── database/       # Configuração do Prisma
├── guards/         # Guards de autenticação
├── libs/           # Bibliotecas compartilhadas
└── misc/           # Utilitários e helpers

prisma/
├── schema.prisma   # Schema do banco
└── seed.ts         # Dados de seed
```
