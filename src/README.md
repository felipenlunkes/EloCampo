# Instruções de utilização

## Backend

O backend é composto por uma arquitetura de microsserviços Java com Spring Boot. Para executá-lo localmente, siga os passos abaixo:

### Pré-requisitos

- Java 25
- Docker e Docker Compose
- Gradle

### Subindo a infraestrutura

Na pasta `Backend/`, execute:

```bash
docker compose up -d
```

Isso irá subir o MongoDB (porta 27017), Redis (porta 6379) e Apache Kafka (porta 9092).

### Publicando os módulos de contrato

Cada microsserviço possui um módulo `*-contract` que deve ser publicado no Maven Local antes de compilar os serviços dependentes:

```bash
./gradlew :*-contract:publishToMavenLocal
```

### Executando os microsserviços

Todos os microsserviços devem ser iniciados com o perfil `local`:

```
--args='--spring.profiles.active=local'
```

Os arquivos `application-local.yml` contêm credenciais sensíveis e estão no `.gitignore` — configure-os localmente antes de iniciar cada serviço.

### Microsserviços disponíveis

| Serviço | Porta | Descrição |
|---|---|---|
| `elogateway` | 8090 | API Gateway — ponto de entrada único, roteamento e validação JWT |
| `auth-service` | 8080 | Autenticação, cadastro de usuários e geração de tokens JWT |
| `account-service` | 8081 | Contas de usuários, endereços e telefones |
| `product-service` | 8082 | Catálogo de produtos ofertados pelos vendedores |
| `order-service` | 8083 | Criação e ciclo de vida de pedidos |
| `file-service` | 8084 | Upload e gerenciamento de imagens via Cloudinary CDN |
| `message-service` | 8085 | Envio de e-mails transacionais via Brevo |
| `chat-service` | 8086 | Troca de mensagens em tempo real entre usuários |

Para mais detalhes sobre cada microsserviço, consulte o [`Backend/README.md`](Backend/README.md).

---

## Frontend

A interface web é uma aplicação React 18 + TypeScript + Vite. Para executá-la, o backend precisa estar rodando (gateway na porta 8090).

### Execução local

Para executar a aplicação localmente, use:

```bash
cd Frontend
npm install
npm run dev
```

A aplicação estará disponível em **http://localhost:5173**.

Para instruções detalhadas, consulte o [`Frontend/README.md`](Frontend/README.md).

### Execução hospedada

O EloCampo está hospedado no Render e pode ser acessado por [este](https://pmv-ads-2026-1-e4-infra-t1-elocampo.onrender.com/) link.

--

## Frontend mobile

O app mobile é construído com React Native e Expo, e se comunica exclusivamente com o **elogateway**, o ponto de entrada único do backend. O gateway valida o token JWT e roteia cada requisição para o microsserviço correto.

Para executar a aplicação localmente, consulte a [documentação](Mobile/README.md).

---

## Histórico de versões

### Backend

#### elogateway

##### [0.0.1-SNAPSHOT] - Em desenvolvimento
###### Adicionado
- API Gateway com roteamento para todos os microsserviços
- Validação de tokens JWT via `JwtFilter`
- Injeção dos headers `X-User-Id`, `X-User-Email` e `X-User-Admin`

---

#### auth-service

##### [0.0.1-SNAPSHOT] - Em desenvolvimento
###### Adicionado
- Cadastro e autenticação de usuários
- Geração e validação de tokens JWT
- Redefinição de senha via e-mail

---

#### account-service

##### [0.0.1-SNAPSHOT] - Em desenvolvimento
###### Adicionado
- Gerenciamento de contas, endereços e telefones
- Integração com auth-service e message-service

---

#### product-service

##### [0.0.1-SNAPSHOT] - Em desenvolvimento
###### Adicionado
- Catálogo de produtos com filtros por categoria, cidade e estado
- Integração com account-service para validação de vendedor

---

#### order-service

##### [0.0.1-SNAPSHOT] - Em desenvolvimento
###### Adicionado
- Criação de pedidos com validação de produtos e comprador
- Integração com account-service e product-service

---

#### file-service

##### [0.0.1-SNAPSHOT] - Em desenvolvimento
###### Adicionado
- Upload de imagens para Cloudinary com validação de magic bytes
- Suporte a entidades do tipo `PRODUCT` e `PROFILE`

---

#### message-service

##### [0.0.1-SNAPSHOT] - Em desenvolvimento
###### Adicionado
- Envio de e-mails transacionais via Brevo (SMTP)

---

#### chat-service

##### [0.0.1-SNAPSHOT] - Em desenvolvimento
###### Adicionado
- Criação de conversas e troca de mensagens entre usuários

---