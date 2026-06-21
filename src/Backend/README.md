# Elocampo — Backend

Arquitetura de microsserviços Java para a plataforma Elocampo, construída com Spring Boot 4, MongoDB, Apache Kafka e Spring Cloud Gateway.

---

## Estrutura do Repositório

```
Backend/
├── elogateway/             # API Gateway
├── auth-service/           # Autenticação e usuários
├── account-service/        # Contas e endereços
├── product-service/        # Catálogo de produtos
├── order-service/          # Pedidos
├── file-service/           # Upload de arquivos via Cloudinary
├── message-service/        # Envio de e-mails via Brevo
├── chat-service/           # Mensagens entre usuários
├── Postman/                # Coleções para testes de API
├── docker-compose.yaml     # Infraestrutura local (MongoDB, Kafka, Redis)
└── data/                   # Volume de dados do MongoDB
```

Cada microsserviço é dividido em dois módulos Gradle:

- `*-impl` — implementação (Spring Boot application)
- `*-contract` — DTOs e interfaces exportadas para outros serviços

---

## Stack de Tecnologia

| Camada | Tecnologia |
|---|---|
| Linguagem | Java 25 |
| Framework | Spring Boot 4.0.x |
| API Gateway | Spring Cloud Gateway MVC |
| Banco de dados | MongoDB |
| Mensageria | Apache Kafka (KRaft mode) |
| Cache | Redis |
| Armazenamento de arquivos | Cloudinary CDN |
| E-mail transacional | Brevo (SMTP) |
| Autenticação | JWT (JJWT 0.12.6) |
| Build | Gradle com Kotlin DSL |
| IA Generativa | Spring AI 2.0.0-M2 |

---

## Infraestrutura Local

O arquivo `docker-compose.yaml` sobe os serviços necessários para desenvolvimento local:

| Serviço | Porta | Observações |
|---|---|---|
| MongoDB | 27017 | Usuário: `root`, senha: `admin12345` |
| Redis | 6379 | Senha: `rpasswd` |
| Apache Kafka | 9092 | KRaft mode, criação automática de tópicos |

Para iniciar:
```bash
docker compose up -d
```

Os microsserviços devem ser executados com o perfil `local`:
```
--args='--spring.profiles.active=local'
```

Os arquivos `application-local.yml` contêm credenciais sensíveis e estão no `.gitignore`.

---

## Microsserviços

### 1. elogateway — API Gateway

**Porta:** local 8090

Ponto de entrada único para toda a API. Responsável por rotear requisições aos microsserviços internos e validar tokens JWT em cada chamada.

**Componentes principais:**

| Classe | Responsabilidade |
|---|---|
| `JwtFilter` | Intercepta requisições, valida o JWT e injeta os headers `X-User-Id`, `X-User-Email` e `X-User-Admin` |
| `SecurityConfig` | Define quais rotas exigem autenticação |
| `JwtProperties` | Configurações do JWT (secret, expiração) |

**Roteamento configurado:**

| Rota | Destino |
|---|---|
| `/rest/v1/auth/**`, `/rest/v1/token` | auth-service (8080) |
| `/rest/v1/account/**` | account-service (8081) |
| `/rest/v1/product/**` | product-service (8082) |
| `/rest/v1/order/**` | order-service (8083) |
| `/rest/v1/file/**` | file-service (8084) |

**Rotas públicas (sem autenticação):**
- `POST /rest/v1/token`
- `POST /rest/v1/auth`
- `POST /rest/v1/account`

---

### 2. auth-service — Autenticação e Usuários

**Porta:** local 8080

Gerencia o cadastro de usuários, autenticação e geração/validação de tokens JWT. É o serviço base consultado por todos os demais para verificar a identidade do usuário.

**Entidade principal:**

```
User
├── email
├── password (hash)
├── isAdmin
└── isActive
```

**Banco de dados:** MongoDB — database `elocampo`

**Endpoints:**

| Método | Rota | Descrição |
|---|---|---|
| POST | `/rest/v1/auth` | Registrar novo usuário |
| GET | `/rest/v1/user/{id}` | Buscar usuário por ID |
| GET | `/rest/v1/user/email/{email}` | Buscar usuário por e-mail |
| PUT | `/rest/v1/user/{id}/activate` | Ativar usuário |
| PUT | `/rest/v1/user/{id}/deactivate` | Desativar usuário |
| POST | `/rest/v1/user/reset-password/{email}` | Solicitar redefinição de senha |
| POST | `/rest/v1/token` | Gerar token JWT |
| GET | `/rest/v1/token/validate` | Validar token JWT |

**Comunicação com outros serviços:**
- **message-service** (HTTP) — envio de e-mail de redefinição de senha
- **account-service** (HTTP) — operações relacionadas a contas

**Configuração JWT:**
- Expiração: 3 dias
- Secret configurado via `application-local.yml`

---

### 3. account-service — Contas

**Porta:** local 8081

Gerencia as contas de usuários da plataforma, incluindo dados de endereço e telefone. Cada conta está vinculada a um usuário do `auth-service`.

**Entidade principal:**

```
Account
├── userId
├── businessName
├── state / city
├── isActive
├── addresses[]
│   ├── street, number, complement
│   ├── postalCode, city, state
└── phones[]
    ├── countryCode, areaCode, number
```

**Banco de dados:** MongoDB — database `tenant`

**Endpoints:**

| Método | Rota | Descrição |
|---|---|---|
| POST | `/rest/v1/account` | Criar conta |
| GET | `/rest/v1/account/{id}` | Buscar conta por ID |
| PUT | `/rest/v1/account/{id}` | Atualizar conta |
| GET | `/rest/v1/account/user/{userId}` | Buscar conta por usuário |
| PUT | `/rest/v1/account/{id}/activate` | Ativar conta |
| PUT | `/rest/v1/account/{id}/deactivate` | Desativar conta |

**Comunicação com outros serviços:**
- **auth-service** (HTTP) — valida a existência do usuário antes de criar/operar contas
- **message-service** (HTTP) — envia e-mails transacionais (boas-vindas, desativação)
- **Kafka** — eventos assíncronos

---

### 4. product-service — Catálogo de Produtos

**Porta:** local 8082

Gerencia o catálogo de produtos ofertados pelos vendedores da plataforma.

**Entidade principal:**

```
Product
├── name, description
├── price
├── category (enum)
├── imageUrls[]
├── vendorAccountId
├── vendorCity, vendorState
├── removed
├── createdAt, updatedAt
```

**Categorias disponíveis:** `VEGETABLES`, `FRUITS`, `DAIRY`, `MEAT`, `GRAINS`, entre outras.

**Banco de dados:** MongoDB — database `elocampo`

**Endpoints:**

| Método | Rota | Descrição |
|---|---|---|
| POST | `/rest/v1/product` | Criar produto |
| GET | `/rest/v1/product/{id}` | Buscar produto por ID |
| PUT | `/rest/v1/product/{id}` | Atualizar produto |
| GET | `/rest/v1/product` | Listar todos os produtos ativos |
| GET | `/rest/v1/product/query` | Buscar com filtros (descrição, categoria, cidade, estado) |
| GET | `/rest/v1/product/vendor/{vendorAccountId}` | Listar produtos por vendedor |
| PUT | `/rest/v1/product/{id}/activate` | Ativar produto |
| PUT | `/rest/v1/product/{id}/deactivate` | Desativar produto |

**Comunicação com outros serviços:**
- **account-service** (HTTP) — valida a existência da conta do vendedor
- **Kafka** — eventos assíncronos

---

### 5. order-service — Pedidos

**Porta:** local 8083

Gerencia a criação e o ciclo de vida de pedidos feitos por compradores da plataforma.

**Entidade principal:**

```
Order
├── buyerAccountId
├── status
├── totalPrice
├── createdAt, updatedAt
└── items[]
    ├── productId
    ├── quantity
    └── unitPrice
```

**Banco de dados:** MongoDB — database `tenant`

**Endpoints:**

| Método | Rota | Descrição |
|---|---|---|
| POST | `/rest/v1/order` | Criar pedido |

**Comunicação com outros serviços:**
- **account-service** (HTTP) — valida a conta do comprador
- **product-service** (HTTP) — valida os produtos e obtém preços unitários
- **Kafka** — eventos assíncronos de pedido

---

### 6. file-service — Arquivos e Imagens

**Porta:** local 8084

Realiza upload, armazenamento e exclusão de imagens via Cloudinary CDN. Aplica validações de segurança antes de aceitar qualquer arquivo.

**Entidade principal:**

```
FileRecord
├── publicId, url, secureUrl
├── format, size
├── entityType (PRODUCT | PROFILE)
├── entityId
├── uploadedBy
└── uploadedAt
```

**Banco de dados:** MongoDB — database `elocampo`, coleção `file_record`

**Endpoints:**

| Método | Rota | Descrição |
|---|---|---|
| POST | `/rest/v1/file/upload` | Fazer upload de imagem (`multipart/form-data`) |
| GET | `/rest/v1/file` | Listar arquivos por entidade (`entityType`, `entityId`) |
| DELETE | `/rest/v1/file/{id}` | Excluir arquivo do Cloudinary e do banco |

**Parâmetros do upload:**
- `file` — arquivo de imagem (máx. 10 MB)
- `entityType` — `PRODUCT` ou `PROFILE`
- `entityId` — ID da entidade associada
- Header: `X-User-Id`

**Validações de segurança:**
- Content-Type: apenas `image/jpeg` e `image/png`
- Magic bytes verificados no binário do arquivo:
  - JPEG: `FF D8 FF`
  - PNG: `89 50 4E 47`

**Organização no Cloudinary:**
- Produtos: `elocampo/products/`
- Perfis: `elocampo/profiles/`

**Comunicação com outros serviços:**
- **product-service** (HTTP) — valida a existência do produto antes do upload
- **account-service** (HTTP) — valida a propriedade do perfil

---

### 7. message-service — E-mails Transacionais

**Porta:** local 8085

Envia e-mails transacionais para os usuários da plataforma utilizando o provedor Brevo via SMTP.

**Endpoints:**

| Método | Rota | Descrição |
|---|---|---|
| POST | `/rest/v1/email` | Enviar e-mail (to, subject, body) |

**Configuração SMTP:**
- Host: `smtp-relay.brevo.com`
- Porta: `587` (STARTTLS)
- Credenciais via variáveis de ambiente: `BREVO_SMTP_USERNAME`, `BREVO_SMTP_PASSWORD`, `EMAIL_FROM`

**Banco de dados:** MongoDB — database `elocampo`

**Comunicação com outros serviços:**
- **auth-service** (HTTP) — validação de usuário

---

### 8. chat-service — Mensagens

**Porta:** local 8086

Permite a troca de mensagens em tempo real entre usuários da plataforma.

**Entidades principais:**

```
Chat
├── participantIds[]
├── createdAt, updatedAt
└── messages[]
    ├── senderId
    ├── content
    └── timestamp
```

**Banco de dados:** MongoDB — database `elocampo`

**Endpoints:**

| Método | Rota | Descrição |
|---|---|---|
| POST | `/rest/v1/chat` | Criar conversa |
| GET | `/rest/v1/chat/{id}` | Buscar conversa por ID |
| POST | `/rest/v1/chat/{id}/message` | Enviar mensagem em uma conversa |

**Comunicação com outros serviços:**
- **auth-service** (HTTP) — valida os participantes
- **Kafka** — eventos assíncronos de chat

---

## Mapa de Comunicação entre Serviços

```
                      ┌─────────────┐
                      │ elogateway  │ :8090
                      └──────┬──────┘
              ________________│___________________________
             │           │           │         │          │
        auth-service  account    product    order     file-service
           :8080      :8081      :8082      :8083       :8084
             │           │           │         │
             │◄──────────┤           │         │
             │           │◄──────────┘         │
             │           │◄────────────────────┘
             │           │◄──── file-service
             ▼           │
       message-service   │
          :8085          │
             ▲           │
             └───────────┘

      chat-service ──► auth-service
          :8086

  Todos os serviços ──► Kafka :9092 (eventos assíncronos)
```

| Serviço chamador | Serviço chamado | Motivo |
|---|---|---|
| account-service | auth-service | Validar existência do usuário |
| account-service | message-service | Enviar e-mail transacional |
| product-service | account-service | Validar conta do vendedor |
| order-service | account-service | Validar conta do comprador |
| order-service | product-service | Validar produtos e obter preços |
| file-service | product-service | Validar entidade produto |
| file-service | account-service | Validar propriedade do perfil |
| chat-service | auth-service | Validar participantes da conversa |
| message-service | auth-service | Validar usuário |

---

## Módulos de Contrato

Cada microsserviço publica um módulo `*-contract` contendo DTOs e interfaces compartilhadas. Esses módulos são publicados no Maven Local e importados pelos serviços dependentes.

| Módulo | Conteúdo |
|---|---|
| `auth-service-contract` | DTOs de usuário, token e autenticação |
| `account-service-contract` | DTOs de conta, endereço e telefone |
| `product-service-contract` | DTOs de produto e categorias |
| `order-service-contract` | DTOs de pedido e itens |
| `file-service-contract` | DTOs de upload e `FileEntityType` |
| `chat-service-contract` | DTOs de chat e mensagens |
| `message-service-contract` | DTOs de e-mail |

Para publicar um contrato localmente:
```bash
./gradlew :*-contract:publishToMavenLocal
```
