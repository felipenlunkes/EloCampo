# Programação de funcionalidades

Esta seção descreve as funcionalidades implementadas nos microsserviços do backend do EloCampo, relacionando cada implementação aos requisitos funcionais definidos na especificação do projeto.

O backend é composto pelos seguintes microsserviços:

| Microsserviço     | Porta  | Responsabilidade                                          |
| ----------------- | ------ | --------------------------------------------------------- |
| `elogateway`      | 8090   | API Gateway — roteamento e validação JWT                  |
| `auth-service`    | 8081   | Autenticação — criação e gestão de usuários e tokens JWT  |
| `account-service` | 8082   | Perfis de conta (comprador/vendedor)                      |
| `product-service` | 8083   | Cadastro e consulta de produtos                           |
| `order-service`   | 8084   | Criação e acompanhamento de pedidos                       |
| `message-service` | 8085   | Envio de e-mails transacionais                            |
| `chat-service`    | 8086   | Conversas entre comprador e vendedor                      |
| `file-service`    | 8087   | Upload e gerenciamento de arquivos/imagens                |

---

## RF-001 — Criação de conta de usuário

> **Responsável:** Felipe Lunkes

O sistema permite que qualquer usuário se cadastre informando e-mail, senha e tipo de conta (comprador ou vendedor). A funcionalidade é dividida em dois microsserviços que trabalham em conjunto:

- **`auth-service`** — gerencia as credenciais de acesso (e-mail e senha). A senha é armazenada com hash via `BCryptPasswordEncoder`. O serviço expõe o endpoint `POST /users` e valida se o e-mail já está em uso antes de persistir.
- **`account-service`** — gerencia os dados de perfil do usuário (nome, CPF ou CNPJ, data de nascimento, endereço e telefone). O serviço expõe o endpoint `POST /accounts` e valida duplicidade de CPF/CNPJ, exigindo que o usuário associado já exista no `auth-service` (via chamada Feign).

Ao criar uma conta, o `account-service` aciona o `message-service` para enviar um e-mail de boas-vindas ao novo usuário.

**Artefatos principais:**

- [`auth-service-impl/.../user/service/UserServiceImpl.java`](../src/Backend/auth-service/auth-service-impl/src/main/java/com/elocampo/authservice/user/service/UserServiceImpl.java)
- [`auth-service-impl/.../user/controller/UserController.java`](../src/Backend/auth-service/auth-service-impl/src/main/java/com/elocampo/authservice/user/controller/UserController.java)
- [`account-service-impl/.../account/service/AccountServiceImpl.java`](../src/Backend/account-service/account-service-impl/src/main/java/com/elocampo/accountservice/account/service/AccountServiceImpl.java)
- [`account-service-impl/.../account/controller/AccountController.java`](../src/Backend/account-service/account-service-impl/src/main/java/com/elocampo/accountservice/account/controller/AccountController.java)

---

## RF-002 — Login com JWT

> **Responsável:** Felipe Lunkes

O sistema permite que o usuário realize login com e-mail e senha, recebendo um token JWT em caso de sucesso. A autenticação é realizada pelo **`auth-service`** por meio do endpoint `POST /tokens`.

O serviço verifica se o e-mail existe e se a senha fornecida corresponde ao hash armazenado (`PasswordEncoder.matches`). Em caso positivo, gera um JWT assinado com HMAC-SHA256, contendo as claims `sub` (user ID), `email` e `isAdmin`, com validade configurável.

O **`elogateway`** intercepta todas as requisições protegidas, extrai e valida o JWT do header `Authorization: Bearer <token>`, e injeta os headers internos `X-User-Id`, `X-User-Email` e `X-User-Admin` na requisição antes de roteá-la aos microsserviços downstream.

**Artefatos principais:**

- [`auth-service-impl/.../token/service/TokenServiceImpl.java`](../src/Backend/auth-service/auth-service-impl/src/main/java/com/elocampo/authservice/token/service/TokenServiceImpl.java)
- [`auth-service-impl/.../token/controller/TokenController.java`](../src/Backend/auth-service/auth-service-impl/src/main/java/com/elocampo/authservice/token/controller/TokenController.java)
- [`elogateway/.../filter/JwtFilter.java`](../src/Backend/elogateway/src/main/java/com/elocampo/elogateway/filter/JwtFilter.java)

---

## RF-003 — Recuperação de senha por e-mail

> **Responsável:** Felipe Lunkes

O sistema permite que o usuário solicite a redefinição de senha informando seu e-mail cadastrado. O endpoint `DELETE /users/password?email=` no **`auth-service`** localiza o usuário, gera uma nova senha temporária, persiste o novo hash e aciona o **`message-service`** para enviar o e-mail de redefinição ao usuário.

O **`message-service`** utiliza o `JavaMailSender` do Spring para construir e enviar mensagens HTML via SMTP.

**Artefatos principais:**

- [`auth-service-impl/.../user/service/UserServiceImpl.java`](../src/Backend/auth-service/auth-service-impl/src/main/java/com/elocampo/authservice/user/service/UserServiceImpl.java) — método `resetPassword`
- [`message-service-impl/.../email/service/EmailServiceImpl.java`](../src/Backend/message-service/message-service-impl/src/main/java/com/elocampo/messageservice/email/service/EmailServiceImpl.java)
- [`message-service-impl/.../email/controller/EmailController.java`](../src/Backend/message-service/message-service-impl/src/main/java/com/elocampo/messageservice/email/controller/EmailController.java)

---

## RF-004 — Cadastro de produtos pelo vendedor

> **Responsável:** João Paulo

O sistema permite que contas com papel `VENDOR` cadastrem produtos com descrição, categoria, unidade de medida (escala), preço, data de disponibilidade e URLs de imagens. O endpoint `POST /products` no **`product-service`** valida que a conta informada existe e possui o papel de vendedor (consulta ao `account-service` via Feign) antes de persistir o produto.

O produto é salvo com status `AVAILABLE` e as informações de cidade e estado do vendedor são copiadas do perfil de conta para facilitar buscas por localização.

**Artefatos principais:**

- [`product-service-impl/.../product/service/ProductServiceImpl.java`](../src/Backend/product-service/product-service-impl/src/main/java/com/elocampo/productservice/product/service/ProductServiceImpl.java)
- [`product-service-impl/.../product/controller/ProductController.java`](../src/Backend/product-service/product-service-impl/src/main/java/com/elocampo/productservice/product/controller/ProductController.java)
- [`product-service-contract/.../product/ProductCategory.java`](../src/Backend/product-service/product-service-contract/src/main/java/com/elocampo/productservice/product/ProductCategory.java)
- [`product-service-contract/.../product/ProductScale.java`](../src/Backend/product-service/product-service-contract/src/main/java/com/elocampo/productservice/product/ProductScale.java)

---

## RF-005 — Edição e remoção de produtos

> **Responsável:** João Paulo

O sistema permite que o vendedor edite (`PUT /products/{id}`) ou remova (`DELETE /products/{id}`) produtos previamente cadastrados. A remoção é implementada como **exclusão lógica**: o campo `removed` é definido como `true` e o produto deixa de aparecer nas listagens. O serviço também expõe um endpoint de reativação (`PATCH /products/{id}/activate`).

**Artefatos principais:**

- [`product-service-impl/.../product/service/ProductServiceImpl.java`](../src/Backend/product-service/product-service-impl/src/main/java/com/elocampo/productservice/product/service/ProductServiceImpl.java) — métodos `update`, `deactivate` e `activate`

---

## RF-006 — Pesquisa de produtos

> **Responsável:** Diovane

O sistema permite que compradores pesquisem produtos disponíveis por nome, categoria ou localização (cidade/estado) do produtor. O **`product-service`** expõe os endpoints:

- `GET /products` — lista todos os produtos ativos
- `GET /products/{id}` — consulta um produto pelo ID
- `GET /products/vendor/{vendorAccountId}` — lista produtos de um vendedor específico
- `GET /products/filter` — filtragem dinâmica por descrição, categoria, cidade e estado via `ProductQueryRepository`

**Artefatos principais:**

- [`product-service-impl/.../product/repository/ProductQueryRepository.java`](../src/Backend/product-service/product-service-impl/src/main/java/com/elocampo/productservice/product/repository/ProductQueryRepository.java)
- [`product-service-contract/.../dto/ProductFilter.java`](../src/Backend/product-service/product-service-contract/src/main/java/com/elocampo/productservice/dto/ProductFilter.java)

---

## RF-008, RF-009 e RF-010 — Criação e acompanhamento de pedidos

> **Responsável:** Diovane (RF-008, RF-010), Bruno Figueiredo (RF-009)

O sistema permite que compradores criem pedidos selecionando produtos de um vendedor. O endpoint `POST /orders` no **`order-service`** valida que a conta informada existe e possui o papel `BUYER` (consulta ao `account-service`), registra os itens do pedido com seus preços unitários e calcula o valor total automaticamente.

O pedido é criado com status `PENDING`. O vendedor pode alterar o status do pedido para `ACCEPTED`, `IN_PREPARATION` ou `FINISHED`, e o comprador pode acompanhar essas transições.

**Artefatos principais:**

- [`order-service-impl/.../order/service/OrderServiceImpl.java`](../src/Backend/order-service/order-service-impl/src/main/java/com/elocampo/orderservice/order/service/OrderServiceImpl.java)
- [`order-service-contract/.../order/OrderStatus.java`](../src/Backend/order-service/order-service-contract/src/main/java/com.elocampo.orderservice/order/OrderStatus.java)
- [`order-service-impl/.../order/entity/OrderItemEmbedded.java`](../src/Backend/order-service/order-service-impl/src/main/java/com/elocampo/orderservice/order/entity/OrderItemEmbedded.java)

---

## RF-011 — Chat em tempo real entre comprador e vendedor

> **Responsável:** Lucas

O sistema disponibiliza um chat para negociação direta entre comprador e vendedor. O **`chat-service`** gerencia conversas (`Chat`) e mensagens trocadas (`Message`). As operações disponíveis incluem criação de conversa, envio de mensagens e listagem do histórico.

**Artefatos principais:**

- [`chat-service-impl/.../chat/service/ChatServiceImpl.java`](../src/Backend/chat-service/chat-service-impl/src/main/java/com/elocampo/chatservice/chat/service/ChatServiceImpl.java)
- [`chat-service-impl/.../chat/controller/ChatController.java`](../src/Backend/chat-service/chat-service-impl/src/main/java/com/elocampo/chatservice/chat/controller/ChatController.java)
- [`chat-service-impl/.../chat/entity/Chat.java`](../src/Backend/chat-service/chat-service-impl/src/main/java/com/elocampo/chatservice/chat/entity/Chat.java)
- [`chat-service-impl/.../chat/entity/Message.java`](../src/Backend/chat-service/chat-service-impl/src/main/java/com/elocampo/chatservice/chat/entity/Message.java)

---

## RF-014 — Gerenciamento de contas pelo administrador

> **Responsável:** Bruno Figueiredo

O sistema permite que administradores ativem e desativem contas de usuários. A funcionalidade está implementada tanto no **`auth-service`** (ativar/desativar credenciais) quanto no **`account-service`** (ativar/desativar perfil). A desativação é lógica: o campo `removed` é definido como `true` e a conta deixa de participar de consultas normais.

**Artefatos principais:**

- [`auth-service-impl/.../user/service/UserServiceImpl.java`](../src/Backend/auth-service/auth-service-impl/src/main/java/com/elocampo/authservice/user/service/UserServiceImpl.java) — métodos `activate` e `deactivate`
- [`account-service-impl/.../account/service/AccountServiceImpl.java`](../src/Backend/account-service/account-service-impl/src/main/java/com/elocampo/accountservice/account/service/AccountServiceImpl.java) — métodos `activate` e `deactivate`

---

## Infraestrutura e recursos transversais

Além dos requisitos funcionais, foram implementados os seguintes recursos de infraestrutura presentes em todos os microsserviços:

| Recurso                     | Descrição                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------- |
| **UUIDv7**                  | Geração de identificadores ordenados por tempo, utilizada em todas as entidades       |
| **Exclusão lógica**         | Campo `removed` em todas as entidades, evitando deleção física de registros           |
| **Tratamento de exceções**  | Mappers globais para `NotFoundException`, `ValidationErrorException` e erros de Bean Validation |
| **Segurança por serviço**   | Cada microsserviço possui configuração Spring Security para proteção dos endpoints    |
| **Comunicação via Feign**   | Clientes Feign tipados para comunicação interna entre microsserviços                  |
| **File Service**            | Microsserviço dedicado ao upload de imagens de produtos                               |
