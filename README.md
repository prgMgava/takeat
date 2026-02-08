# 🍔 Takeat - Sistema de Pedidos para Restaurantes

Sistema full-stack para gerenciamento de pedidos de restaurantes, desenvolvido como desafio técnico para a posição de Full Stack Developer (Pleno) na Takeat.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Executando o Projeto](#executando-o-projeto)
- [API Endpoints](#api-endpoints)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Credenciais de Demo](#credenciais-de-demo)
- [Critérios de Avaliação](#critérios-de-avaliação)

## 🎯 Visão Geral

O Takeat é um sistema completo para gerenciamento de pedidos de restaurantes, incluindo:

- **Gestão de Restaurantes**: Cadastro e gerenciamento de restaurantes
- **Cardápio Digital**: Gerenciamento de produtos, categorias e opções de personalização
- **Sistema de Pedidos**: Criação, acompanhamento e gerenciamento de pedidos
- **Autenticação**: Sistema seguro com JWT e refresh tokens
- **Dashboard para Restaurantes**: Painel para gestão de pedidos e status

## 🛠️ Tecnologias

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **ORM**: Sequelize
- **Banco de Dados**: PostgreSQL 15
- **Autenticação**: JWT (jsonwebtoken)
- **Validação**: express-validator
- **Segurança**: helmet, cors, express-rate-limit
- **Logs**: Winston + Morgan

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS v4
- **State Management**: Zustand
- **Forms**: React Hook Form
- **HTTP Client**: Axios
- **Server State**: TanStack Query
- **Routing**: React Router v7
- **Notificações**: React Hot Toast
- **Ícones**: Lucide React

### DevOps
- **Containerização**: Docker + Docker Compose

## 🏗️ Arquitetura

### Backend - Arquitetura em Camadas

O backend segue uma arquitetura limpa com separação clara de responsabilidades:

```
┌─────────────────────────────────────────────────────────────┐
│                        Routes                                │
│  (Definição de endpoints e middlewares)                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                     Controllers                              │
│  - Extrair dados da requisição HTTP                         │
│  - Validar parâmetros básicos                               │
│  - Chamar Services apropriados                              │
│  - Formatar resposta HTTP                                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      Services                                │
│  - Lógica de negócio                                        │
│  - Validações complexas                                     │
│  - Transações de banco de dados                             │
│  - Orquestração entre múltiplos models                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                       Models                                 │
│  - Definição de entidades (Sequelize)                       │
│  - Relacionamentos (belongsTo, hasMany, N:N)                │
│  - Validações de campo                                      │
└─────────────────────────────────────────────────────────────┘
```

#### Services Implementados

| Service | Responsabilidade |
|---------|------------------|
| **StockService** | Validação e decremento atômico de estoque de insumos |
| **OrderService** | Criação de pedidos com transações, validação de estoque |
| **AuthService** | Autenticação, tokens JWT, gerenciamento de sessão |

### Sequelize - Relacionamentos

#### Relacionamento N:N (Produto ↔ Insumo)

Implementado através da tabela intermediária `ProductInput` (ficha técnica):

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│   Product   │───────│  ProductInput   │───────│    Input    │
│             │  1:N  │                 │  N:1  │             │
│ - id        │       │ - product_id    │       │ - id        │
│ - name      │       │ - input_id      │       │ - name      │
│ - price     │       │ - quantity      │       │ - quantity  │
└─────────────┘       │ - unit          │       │ - unit      │
                      └─────────────────┘       └─────────────┘
```

#### Transações (ACID)

A criação de pedidos usa transações para garantir atomicidade:

```typescript
// services/order.service.ts
const transaction = await sequelize.transaction();
try {
  // 1. Validar estoque
  await stockService.validateAndDecrementStock(items, transaction);
  // 2. Criar pedido
  const order = await Order.create({...}, { transaction });
  // 3. Criar itens
  await OrderItem.bulkCreate([...], { transaction });
  // Commit apenas se tudo der certo
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

### Frontend - Componentização React

```
src/
├── components/           # Componentes reutilizáveis
│   ├── Layout.tsx        # Layout com header e navegação
│   ├── ProductCard.tsx   # Card de produto (usa em várias telas)
│   ├── RestaurantCard.tsx# Card de restaurante
│   ├── StockAlert.tsx    # Modal de erro de estoque
│   ├── LoadingSpinner.tsx# Indicador de loading
│   └── OfflineQueueNotification.tsx  # Notificação de fila offline
├── pages/                # Páginas (composição de components)
├── store/                # Estado global (Zustand)
│   ├── authStore.ts      # Autenticação
│   ├── cartStore.ts      # Carrinho de compras
│   └── offlineStore.ts   # Fila de pedidos offline
├── hooks/                # Custom hooks
└── services/             # Comunicação com API
```

## 📋 Pré-requisitos

- Node.js 18+
- npm 9+ ou yarn 1.22+
- Docker e Docker Compose (opcional)
- PostgreSQL 15+ (ou use Docker)

## ⚡ Quick Start (Avaliação Rápida)

A forma mais rápida de rodar o projeto é usando Docker:

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/takeat.git
cd takeat

# 2. Inicie todos os serviços com um comando
docker-compose up -d --build

# 3. Aguarde ~30 segundos para as migrations e seeds rodarem
docker-compose logs -f backend  # Para ver o progresso

# 4. Acesse o sistema
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
# Adminer:  http://localhost:8080
```

**Pronto!** O sistema estará funcionando com dados de demonstração (3 restaurantes, 19 produtos, 37 insumos).

## 🎯 Guia de Avaliação - Como Testar os Requisitos

### Credencial Recomendada para Testes
```
Email: cliente@takeat.com
Senha: 123456
```

### Parte 1: Backend - Testando a Lógica de Negócio

#### ✅ Modelagem de Dados
O sistema implementa a estrutura sugerida:
- **Products**: Itens vendáveis (ex: "Classic Burger", "Pizza Margherita")
- **Inputs**: Insumos físicos (ex: "Pão Brioche", "Blend Bovino", "Mussarela")
- **ProductInputs**: Ficha técnica definindo quanto de cada insumo cada produto consome

**Para verificar no banco (Adminer http://localhost:8080):**
- Servidor: `postgres`, Usuário: `takeat`, Senha: `takeat123`, DB: `takeat_db`

#### ✅ Seed de Dados
Os seeders populam automaticamente:
- 3 restaurantes com cardápios completos
- 19 produtos com fichas técnicas
- 37 insumos com estoque inicial

#### ✅ Endpoint de Pedido (POST /orders)
Login como cliente e adicione produtos ao carrinho para testar.

#### ✅ Validação de Estoque + Atomicidade (Rollback)
**Como testar:**
1. Faça login como `cliente@takeat.com`
2. Acesse "Burguer Artesanal"
3. Adicione vários "Classic Burger" ao carrinho (mais que o estoque de pão disponível)
4. Tente finalizar o pedido
5. O sistema deve mostrar modal com os produtos sem estoque
6. Nenhum estoque é decrementado (rollback total)

### Parte 2: Frontend - Testando a Experiência do Usuário

#### ✅ Cardápio
1. Acesse http://localhost:3000
2. Clique em "Ver Restaurantes"
3. Selecione qualquer restaurante para ver o cardápio

#### ✅ Carrinho
1. Adicione produtos ao carrinho clicando no "+"
2. Visualize o resumo no carrinho (ícone superior direito ou botão flutuante mobile)

#### ✅ Feedback de Erro de Estoque
1. Tente fazer pedido com itens sem estoque
2. O modal StockAlert aparece mostrando:
   - Quais produtos têm estoque insuficiente
   - Quais ingredientes estão faltando
   - Botão para remover itens problemáticos
   - Opção de tentar novamente com itens válidos

### Parte 3: Diferencial - Testando Resiliência Offline

#### ✅ Estratégia Offline-First/Queue
**Como testar:**
1. Faça login e adicione produtos ao carrinho
2. Abra DevTools (F12) → Network → Selecione "Offline"
3. Clique em "Finalizar Pedido"
4. O sistema vai:
   - Detectar que está offline
   - Salvar o pedido na fila local (localStorage)
   - Mostrar notificação: "Sem conexão. Pedido salvo na fila"
5. Desmarque "Offline" no DevTools
6. O sistema automaticamente:
   - Detecta conexão restaurada
   - Processa a fila de pedidos
   - Notifica sucesso ou erro de estoque

#### ✅ Tratamento de Conflito Tardio
Se ao sincronizar o estoque já tiver sido consumido:
- O pedido é removido da fila
- Usuário é notificado do erro de estoque
- Opção de refazer o pedido com itens disponíveis

## 🚀 Instalação Detalhada

### Clone o repositório
```bash
git clone https://github.com/seu-usuario/takeat.git
cd takeat
```

### Opção 1: Docker (Recomendado)
```bash
# Inicia todos os serviços (PostgreSQL, Backend, Frontend, Adminer)
docker-compose up -d

# Verifica os logs
docker-compose logs -f

# As migrações e seeds rodam automaticamente
```

Acesse:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Adminer (DB): http://localhost:8080

### Opção 2: Instalação Manual (Sem Docker)

#### 1. Configurar PostgreSQL
```bash
# Crie um banco de dados PostgreSQL
createdb takeat_dev

# Ou via psql
psql -U postgres -c "CREATE DATABASE takeat_dev;"
```

#### 2. Backend
```bash
cd backend
npm install

# Copie e configure o arquivo de ambiente
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
DATABASE_URL=postgres://postgres:senha@localhost:5432/takeat_dev
JWT_SECRET=sua_chave_secreta_aqui
JWT_REFRESH_SECRET=outra_chave_secreta
```

```bash
# Executar migrations
npx sequelize-cli db:migrate

# Popular banco com dados de demo
npx sequelize-cli db:seed:all

# Iniciar servidor de desenvolvimento
npm run dev
```

#### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🏃 Executando o Projeto

### Com Docker
```bash
docker-compose up -d
```

### Sem Docker
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### URLs de Acesso
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Adminer (DB)**: http://localhost:8080

## 📚 API Endpoints

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Registro de usuário |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh-token` | Refresh token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Usuário autenticado |
| PATCH | `/api/auth/profile` | Atualizar perfil |
| POST | `/api/auth/change-password` | Alterar senha |

### Restaurantes
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/restaurants` | Lista restaurantes |
| GET | `/api/restaurants/:id` | Detalhes do restaurante |
| POST | `/api/restaurants` | Cria restaurante (owner) |
| PUT | `/api/restaurants/:id` | Atualiza restaurante |
| DELETE | `/api/restaurants/:id` | Remove restaurante |

### Categorias
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/categories` | Lista categorias |
| POST | `/api/categories` | Cria categoria |
| PUT | `/api/categories/:id` | Atualiza categoria |
| DELETE | `/api/categories/:id` | Remove categoria |

### Produtos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/products` | Lista produtos |
| GET | `/api/products/:id` | Detalhes do produto |
| POST | `/api/products` | Cria produto |
| PUT | `/api/products/:id` | Atualiza produto |
| DELETE | `/api/products/:id` | Remove produto |

### Pedidos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/orders` | Lista pedidos |
| GET | `/api/orders/:id` | Detalhes do pedido |
| POST | `/api/orders` | Cria pedido (valida estoque) |
| PATCH | `/api/orders/:id/status` | Atualiza status |
| POST | `/api/orders/:id/cancel` | Cancela pedido |

### Insumos e Estoque
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/inputs` | Lista insumos do restaurante |
| POST | `/api/inputs` | Cria insumo |
| PUT | `/api/inputs/:id` | Atualiza insumo/estoque |
| DELETE | `/api/inputs/:id` | Remove insumo |
| POST | `/api/inputs/:id/adjust` | Ajusta quantidade em estoque |
| POST | `/api/stock/check` | Verifica disponibilidade de estoque |

## 📁 Estrutura do Projeto

```
takeat/
├── backend/
│   ├── src/
│   │   ├── config/           # Configuração Sequelize
│   │   ├── controllers/      # Controllers Express (HTTP handling)
│   │   ├── services/         # Lógica de negócio
│   │   │   ├── stock.service.ts    # Gestão de estoque
│   │   │   ├── order.service.ts    # Criação de pedidos
│   │   │   └── auth.service.ts     # Autenticação
│   │   ├── database/
│   │   │   ├── migrations/   # Migrations Sequelize
│   │   │   └── seeders/      # Seeders com dados demo
│   │   ├── middlewares/      # Middlewares (auth, error, etc)
│   │   ├── models/           # Modelos Sequelize com relacionamentos
│   │   ├── routes/           # Rotas Express
│   │   ├── types/            # TypeScript types
│   │   ├── utils/            # Utilitários (logger, etc)
│   │   └── server.ts         # Entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # Componentes React reutilizáveis
│   │   │   ├── ProductCard.tsx
│   │   │   ├── StockAlert.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── OfflineQueueNotification.tsx
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilitários (api client)
│   │   ├── pages/            # Páginas da aplicação
│   │   ├── store/            # Zustand stores
│   │   │   ├── authStore.ts
│   │   │   ├── cartStore.ts
│   │   │   └── offlineStore.ts
│   │   ├── types/            # TypeScript types
│   │   ├── App.tsx           # App com rotas
│   │   └── main.tsx          # Entry point
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🔑 Credenciais de Demo

Após executar os seeders, você pode usar estas credenciais:

### Administrador
| Email | Senha | Role |
|-------|-------|------|
| admin@takeat.com | 123456 | ADMIN |

### Donos de Restaurante
| Restaurante | Email | Senha |
|-------------|-------|-------|
| Burguer Artesanal | restaurante@takeat.com | 123456 |
| Pizzaria Bella Napoli | pizzaria@takeat.com | 123456 |
| Sushi Zen | japonesa@takeat.com | 123456 |

### Clientes
| Nome | Email | Senha |
|------|-------|-------|
| Maria Santos | cliente@takeat.com | 123456 |
| Pedro Almeida | cliente2@takeat.com | 123456 |

### Dados de Teste Disponíveis

| Restaurante | Categorias | Produtos | Insumos |
|-------------|------------|----------|---------|
| Burguer Artesanal | 3 | 7 | 16 |
| Pizzaria Bella Napoli | 3 | 6 | 13 |
| Sushi Zen | 4 | 6 | 8 |

## 🔒 Segurança

- Autenticação JWT com refresh tokens
- Rate limiting para proteção contra ataques
- Helmet para headers de segurança
- Validação de entrada com express-validator
- CORS configurado
- Senhas hasheadas com bcrypt

## 📈 Features

- Lazy loading de componentes React
- Compressão de resposta (compression)
- Índices otimizados no banco (Sequelize)
- Paginação em todas as listagens
- Tratamento centralizado de erros
- Logs estruturados com Winston

## ✅ Critérios de Avaliação

### 1. Arquitetura e Organização

| Aspecto | Implementação |
|---------|---------------|
| **Controllers** | Responsáveis apenas por HTTP handling, delegam lógica para Services |
| **Services** | Camada de negócios isolada (`StockService`, `OrderService`, `AuthService`) |
| **Models** | Definições Sequelize com relacionamentos e validações |
| **Separação** | Cada camada tem responsabilidade única e bem definida |

### 2. Uso do Sequelize

| Aspecto | Implementação |
|---------|---------------|
| **Relacionamentos N:N** | `Product` ↔ `Input` via tabela `ProductInput` (ficha técnica) |
| **Transactions** | Usadas em criação de pedidos para atomicidade (estoque + pedido) |
| **Associations** | `belongsTo`, `hasMany`, `hasOne` configurados em `models/index.ts` |
| **Migrations** | Versionamento completo do schema do banco |

### 3. Código Limpo

| Aspecto | Implementação |
|---------|---------------|
| **Nomenclatura** | Nomes descritivos em camelCase (JS) e snake_case (DB) |
| **Componentização React** | Components reutilizáveis (`ProductCard`, `StockAlert`, `LoadingSpinner`) |
| **CSS** | Tailwind CSS com classes utilitárias + animações customizadas |
| **TypeScript** | Tipagem forte em todo frontend e backend |

### 4. UX/UI

| Aspecto | Implementação |
|---------|---------------|
| **Responsividade** | Mobile-first com breakpoints para tablet e desktop |
| **Feedback Visual** | Toasts de sucesso/erro, loading spinners, animações |
| **Sistema Intuitivo** | Fluxo claro: navegar → adicionar ao carrinho → finalizar pedido |
| **Acessibilidade** | Touch targets de 44px mínimo, fonte 16px para evitar zoom iOS |

### 5. Resiliência

| Cenário | Tratamento |
|---------|------------|
| **Estoque Insuficiente** | Validação atômica ANTES do pedido + modal com produtos problemáticos |
| **Falha de Rede** | Sistema de fila offline (Zustand + localStorage) |
| **Conexão Restaurada** | Reprocessamento automático da fila com retry |
| **Transações DB** | Rollback automático em caso de erro |
| **Erros de API** | Middleware centralizado + mensagens amigáveis ao usuário |

### Exemplo de Fluxo de Resiliência (Estoque)

```
Cliente adiciona items → Clica "Finalizar"
    │
    ▼
Backend valida estoque (DENTRO de transação)
    │
    ├─► Estoque OK → Decrementa → Cria pedido → Commit → Sucesso ✅
    │
    └─► Estoque INSUFICIENTE → Rollback → Retorna lista de produtos
                                          com estoque insuficiente
                                              │
                                              ▼
                              Frontend exibe modal StockAlert
                              com opção de remover items
```

### Exemplo de Fluxo Offline

```
Cliente sem internet → Tenta fazer pedido
    │
    ▼
Pedido salvo na fila offline (localStorage)
    │
    ▼
Notificação: "Pedido salvo. Será enviado quando conectar."
    │
    ▼
Internet volta → Sistema detecta → Processa fila automaticamente
    │
    ├─► Sucesso → Remove da fila → Notifica usuário ✅
    │
    └─► Falha → Mantém na fila → Retry com backoff exponencial
```
