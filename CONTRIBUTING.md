# 🤝 Contribuindo para o Habit Tracker API

Obrigado por considerar contribuir para o Habit Tracker API! Este documento fornece diretrizes para contribuições.

## 📋 **Código de Conduta**

Este projeto adere a um código de conduta respeitoso e inclusivo. Ao participar, você concorda em manter um ambiente acolhedor para todos.

## 🚀 **Como Contribuir**

### **1. Reportar Bugs**

Antes de reportar um bug, verifique se já existe uma issue sobre o problema.

**Para reportar um bug:**

- Use o template de issue para bugs
- Descreva os passos para reproduzir
- Inclua versões de software relevantes
- Adicione screenshots se aplicável

### **2. Sugerir Funcionalidades**

**Para sugerir uma nova funcionalidade:**

- Verifique se já existe uma issue similar
- Descreva claramente o problema que a funcionalidade resolve
- Explique por que a funcionalidade seria útil
- Considere implementações alternativas

### **3. Contribuir com Código**

#### **Fork e Clone**

```bash
# Fork o repositório no GitHub
git clone https://github.com/seu-usuario/habit-tracker-api.git
cd habit-tracker-api
git remote add upstream https://github.com/original-owner/habit-tracker-api.git
```

#### **Configurar Ambiente**

```bash
# Instalar dependências
npm install

# Configurar banco de dados
docker-compose up -d postgres
npx prisma migrate deploy
npx prisma db seed

# Executar testes
npm test
```

#### **Criar Branch**

```bash
# Criar branch para sua funcionalidade
git checkout -b feature/nova-funcionalidade

# Ou para correção de bug
git checkout -b fix/correcao-bug
```

#### **Fazer Changes**

- Siga os padrões de código existentes
- Adicione testes para novas funcionalidades
- Mantenha a cobertura de testes acima de 95%
- Atualize documentação se necessário

#### **Commit**

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Funcionalidades
git commit -m "feat: adiciona endpoint de relatórios mensais"

# Correções
git commit -m "fix: corrige cálculo de streaks"

# Documentação
git commit -m "docs: atualiza README com novos endpoints"

# Testes
git commit -m "test: adiciona testes para módulo de analytics"

# Refatoração
git commit -m "refactor: melhora estrutura do service de hábitos"
```

#### **Pull Request**

```bash
# Push para seu fork
git push origin feature/nova-funcionalidade

# Criar Pull Request no GitHub
```

## 📝 **Padrões de Código**

### **TypeScript**

- Use TypeScript strict mode
- Defina tipos explícitos sempre que possível
- Evite `any` - use `unknown` quando necessário

### **NestJS**

- Siga os padrões de arquitetura do NestJS
- Use decorators apropriados
- Implemente guards para autenticação/autorização

### **Testes**

- Escreva testes unitários para services
- Escreva testes de integração para controllers
- Use mocks para dependências externas
- Mantenha testes isolados e determinísticos

### **Database**

- Use migrations para mudanças de schema
- Siga convenções de nomenclatura do Prisma
- Adicione índices quando apropriado

### **Documentação**

- Documente APIs com Swagger/OpenAPI
- Atualize README para novas funcionalidades
- Inclua exemplos de uso

## 🧪 **Executando Testes**

```bash
# Todos os testes
npm test

# Testes com watch mode
npm run test:watch

# Testes com coverage
npm run test:coverage

# Testes específicos
npm test -- habits.service.spec.ts
```

## 📚 **Estrutura do Projeto**

```
src/
├── modules/          # Módulos da aplicação
│   └── app/
│       ├── habits/   # CRUD de hábitos
│       ├── analytics/# Dashboard e métricas
│       └── user/     # Autenticação e perfil
├── database/         # Configuração Prisma
├── guards/           # Autenticação/Autorização
├── misc/             # Utilitários e códigos
└── @types/           # Definições de tipos
```

## 🐛 **Debugging**

### **Logs**

```typescript
// Use o logger do NestJS
import { Logger } from '@nestjs/common';

const logger = new Logger('ServiceName');
logger.log('Informação importante');
logger.error('Erro ocorreu', error.stack);
```

### **Database Debugging**

```bash
# Visualizar dados
npx prisma studio

# Debug queries
# Adicione em src/database/prisma.service.ts:
// log: ['query', 'info', 'warn', 'error'],
```

## 📊 **Métricas de Qualidade**

Antes de submeter PR, verifique:

- [ ] Todos os testes passam
- [ ] Cobertura de testes > 95%
- [ ] Linting sem erros (`npm run lint`)
- [ ] Build bem-sucedido (`npm run build`)
- [ ] Documentação atualizada
- [ ] Migrations aplicadas corretamente

## 🔄 **Process de Review**

1. **Automated Checks**: GitHub Actions executam testes
2. **Code Review**: Maintainer revisa o código
3. **Testing**: Verificação manual se necessário
4. **Merge**: Após aprovação, PR é mergeado

## 📋 **Templates**

### **Pull Request Template**

```markdown
## Descrição

Breve descrição das mudanças

## Tipo de Mudança

- [ ] Bug fix
- [ ] Nova funcionalidade
- [ ] Breaking change
- [ ] Documentação

## Testes

- [ ] Testes passam localmente
- [ ] Novos testes adicionados
- [ ] Cobertura mantida

## Checklist

- [ ] Código segue padrões do projeto
- [ ] Self-review realizado
- [ ] Documentação atualizada
```

### **Issue Template (Bug)**

```markdown
## Descrição do Bug

Descrição clara do problema

## Reproduzir

Passos para reproduzir:

1. Vá para '...'
2. Clique em '...'
3. Veja o erro

## Comportamento Esperado

O que deveria acontecer

## Screenshots

Se aplicável

## Ambiente

- OS: [ex: Windows 10]
- Node: [ex: 18.17.0]
- Browser: [ex: Chrome 91]
```

## 🎯 **Áreas que Precisam de Ajuda**

- [ ] Testes E2E mais robustos
- [ ] Documentação de APIs em português
- [ ] Performance optimization
- [ ] Features de gamificação
- [ ] Integração com wearables

## 📞 **Contato**

Se tiver dúvidas sobre contribuições:

- Abra uma issue com label `question`
- Entre em contato via email: [seu-email@example.com]

---

**Obrigado por contribuir! 🚀**
