# 📋 Task Manager API

Uma API RESTful completa para gerenciamento de tarefas com suporte a colaboração entre usuários, construída com Fastify, TypeScript e PostgreSQL.

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+
- Docker e Docker Compose (para banco de dados)
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone https://github.com/FlavioMann/task-manager.git
cd task-manager

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
```

### Com Docker (Recomendado)

```bash
# Inicie o PostgreSQL com Docker Compose
docker-compose up -d

# Execute as migrations
npm run migrate:dev

# Inicie o servidor
npm run dev
```

O servidor estará rodando em `http://localhost:3333`

Acesse a documentação Swagger em `http://localhost:3333/docs`

### Sem Docker

Se preferir usar um PostgreSQL local:

```bash
# Configure o DATABASE_URL no .env apontando para seu PostgreSQL local

# Execute as migrations
npm run migrate:dev

# Inicie o servidor
npm run dev
```

### Docker Compose

O projeto inclui um `docker-compose.yml` pré-configurado:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: task_manager
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Comandos úteis:**

```bash
# Iniciar banco de dados
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar banco de dados
docker-compose down

# Limpar volumes (CUIDADO: apaga dados)
docker-compose down -v
```

## 📦 Variáveis de Ambiente

```env
# Servidor
PORT=3333
NODE_ENV=development

# Banco de Dados
DATABASE_URL=postgresql://user:password@localhost:5432/task_manager

# JWT
JWT_SECRET=sua_chave_secreta_aqui
```

## 🔌 Endpoints Principais

### Autenticação

- `POST /users` - Criar novo usuário
- `POST /sessions` - Fazer login

### Tarefas

- `POST /tasks` - Criar tarefa
- `GET /tasks` - Listar tarefas
- `PATCH /tasks/:id/status` - Atualizar status
- `POST /tasks/:id/share` - Compartilhar tarefa

### Categorias

- `POST /categories` - Criar categoria

### Métricas

- `GET /metrics` - Obter estatísticas

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Modo watch
npm run test:watch

# Com cobertura
npm run test:cov
```

## 🏗️ Arquitetura

```
Fastify Server
    ↓
Routes (Handlers)
    ↓
Zod Validation
    ↓
Prisma ORM
    ↓
PostgreSQL Database
```

### Stack Tecnológico

| Componente       | Tecnologia           |
| ---------------- | -------------------- |
| **Runtime**      | Node.js + TypeScript |
| **Framework**    | Fastify              |
| **Database**     | PostgreSQL           |
| **ORM**          | Prisma               |
| **Autenticação** | JWT (@fastify/jwt)   |
| **Validação**    | Zod                  |
| **Hashing**      | bcryptjs             |
| **Testes**       | Jest + Supertest     |

## 📊 Modelo de Dados

### User

- id (UUID)
- email (unique)
- name
- password (hashed)

### Task

- id (UUID)
- title
- description
- status (PENDING, IN_PROGRESS, COMPLETED)
- ownerId (FK)
- categoryId (FK, optional)
- collaborators (many-to-many)

### Category

- id (UUID)
- name
- ownerId (FK)

## 🔒 Segurança

- Senhas hasheadas com bcryptjs
- JWT com expiração de 4 dias
- Validação em todas as rotas
- Autorização por recurso
- Proteção contra SQL injection (Prisma)

## 🚢 Deploy

### AWS Lambda

O projeto suporta deploy em AWS Lambda:

```bash
npm run build
serverless deploy
```

Configure suas credenciais AWS antes de fazer deploy.

## 👨‍💻 Autor

**Flavio Mann**

- GitHub: [@FlavioMann](https://github.com/FlavioMann)
