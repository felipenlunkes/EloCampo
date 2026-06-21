# EloCampo — Frontend

Interface web do EloCampo, um marketplace agrícola que conecta produtores rurais diretamente a empresas compradoras, sem intermediários.

---

## Sobre a aplicação

O frontend é uma aplicação React com TypeScript que se comunica exclusivamente com o **elogateway** — o ponto de entrada único do backend. O gateway valida o token JWT e roteia cada requisição para o microsserviço correto.

Há dois perfis de usuário:

|          Papel         | Valor na API | O que pode fazer |
|:----------------------:|:------------:|:----------------:|
| **Produtor rural**     | `VENDOR`     | Cadastrar produtos, acompanhar vendas e pedidos recebidos |
| **Empresa compradora** | `BUYER`      | Buscar produtos, criar pedidos e negociar via chat |

---

## Pré-requisitos

|      Ferramenta     |  Versão mínima  |  Para quê  |
|:-------------------:|:---------------:|:----------:|
| Node.js             | 18              | Executar o Vite e instalar dependências |
| npm                 | 9               | Gerenciador de pacotes |
| Backend em execução | —               | A aplicação não funciona sem o elogateway e os microsserviços |

---

## Instalação e execução

### 1. Instale as dependências

```bash
npm install
```

### 2. Suba o backend

Antes de iniciar o frontend, o backend precisa estar rodando. Veja as instruções completas em [`../README.md`](../README.md). O resumo é:

```bash
# 1. Infraestrutura (MongoDB, Redis, Kafka)
cd ../Backend
docker compose up -d

# 2. Publique os módulos de contrato de cada serviço
#    (execute dentro de cada diretório de serviço)
./gradlew :<service>-contract:publishToMavenLocal

# 3. Inicie cada microsserviço com o perfil local
#    (execute dentro de <service>/<service>-impl/)
./gradlew bootRun --args='--spring.profiles.active=local'
```

A ordem recomendada para subir os serviços é:
1. `auth-service` (porta 8080)
2. `account-service` (porta 8081)
3. `product-service` (porta 8082)
4. `order-service` (porta 8083)
5. `file-service` (porta 8084)
6. `message-service` (porta 8085)
7. `chat-service` (porta 8086)
8. `elogateway` (porta 8090) — **inicie por último**

### 3. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em **http://localhost:5173**.

---

## Como o proxy funciona

O Vite redireciona todas as chamadas da aplicação para o gateway:

```
Navegador  →  /api/v1/token
Vite proxy →  http://localhost:8090/rest/v1/token
Gateway    →  auth-service :8080
```

Todas as chamadas axios usam o prefixo `/api`. O Vite reescreve `/api` para `/rest` e encaminha ao gateway na porta `8090`. Não é necessário nenhuma variável de ambiente no frontend.

---

## Scripts disponíveis

|      Comando         | O que faz |
|:--------------------:|-----------|
| `npm run dev`        | Inicia o servidor de desenvolvimento com hot-reload |
| `npm run build`      | Compila TypeScript e gera o bundle de produção em `dist/` |
| `npm run preview`    | Serve o bundle de produção localmente para validação |
| `npm test`           | Executa os testes em modo *watch* (reexecuta a cada alteração) |
| `npm run test:run`   | Executa os testes uma única vez (útil em CI) |
| `npm run test:ui`    | Abre a interface visual do Vitest no navegador |

---

## Testes

### Stack de testes

| Ferramenta | Versão | Uso |
|:----------:|:------:|:----|
| Vitest | 4.1 | Runner e framework de assertions |
| @testing-library/react | 16 | Renderização de componentes em jsdom |
| @testing-library/user-event | 14 | Simulação de interações reais do usuário |
| @testing-library/jest-dom | 6 | Matchers DOM extras (`.toBeInTheDocument()`, etc.) |
| axios-mock-adapter | — | Mock da instância axios para testes de serviço |

O ambiente é **jsdom** (configurado em `vite.config.ts`). O arquivo `src/test/setup.ts` importa o `@testing-library/jest-dom` para disponibilizar os matchers DOM globalmente.

### Executando os testes

```bash
# Modo watch (desenvolvimento)
npm test

# Execução única (CI / pré-commit)
npm run test:run

# Interface visual
npm run test:ui
```

### Arquivos de teste

```
src/
├── utils/
│   └── jwt.test.ts                    # Utilitário de decodificação JWT
├── types/
│   └── index.test.ts                  # Constantes e enums de domínio
├── contexts/
│   └── AuthContext.test.tsx           # Hook useAuth e AuthProvider
├── services/
│   └── api.test.ts                    # Todas as funções de API + interceptores axios
├── components/
│   └── layout/
│       └── Sidebar.test.tsx           # SidebarProdutor e SidebarComprador
└── pages/
    └── auth/
        └── Login.test.tsx             # Página de login e cadastro rápido
```

### Cobertura por arquivo

#### `src/utils/jwt.test.ts`

Testa a função `decodeJwt`, que extrai o payload de um JWT sem verificar a assinatura.

| Caso | Comportamento esperado |
|:-----|:-----------------------|
| Token válido | Retorna o payload decodificado como objeto |
| Token sem ponto | Retorna `null` |
| String vazia | Retorna `null` |
| Payload não-JSON | Retorna `null` |
| Caracteres base64url (`-` e `_`) | Decodifica corretamente |
| `isAdmin: true` / `false` | Preserva o valor booleano |

---

#### `src/types/index.test.ts`

Valida as constantes e enums exportados por `src/types/index.ts`.

**`PRODUCT_CATEGORY`** — 7 categorias: `GRAIN`, `VEGETABLE`, `FRUIT`, `DAIRY`, `ANIMAL_PRODUCTS`, `PROTEINS`, `CONFECTIONERY`. Cada item deve ter as propriedades `v` (string) e `label` (string em português).

**`PRODUCT_SCALE`** — 3 escalas: `KG`, `UNIT`, `LITER`, com seus respectivos labels.

**`OrderStatusEnum`** — verifica que `PENDING`, `ACCEPTED` e `COMPLETED` têm exatamente o mesmo valor string.

---

#### `src/contexts/AuthContext.test.tsx`

Testa o `AuthProvider` usando `renderHook`. O `localStorage` é limpo antes de cada caso.

| Grupo | Casos |
|:------|:------|
| **Estado inicial** | `loading` começa `true` e termina `false`; `session` é `null` sem dados no storage |
| **Restauração do localStorage** | Sessão válida é restaurada; JSON inválido é ignorado sem erro; `isAdmin` é preservado |
| **`setSession`** | Atualiza o contexto; salva `ec_token` e `ec_session` no storage; limpa ambas as chaves ao receber `null` |
| **`logout`** | Zera `session` no contexto; remove `ec_token` e `ec_session` do storage |

---

#### `src/services/api.test.ts`

Usa `axios-mock-adapter` para interceptar chamadas reais ao axios. O mock é restaurado após cada teste.

| Domínio | Funções testadas |
|:--------|:----------------|
| **Autenticação** | `gerarToken` — POST `/v1/token`; `criarUsuario` — POST `/v1/user`; `resetarSenha` — POST com email codificado em URL |
| **Conta** | `buscarContaPorUsuario`, `buscarContaPorId`, `atualizarConta` (GET/PUT nos endpoints corretos) |
| **Produto** | `buscarProdutos` (sem e com filtros de descrição, categoria, cidade e estado); `buscarProdutoPorId`, `buscarProdutosPorVendedor`, `criarProduto`, `atualizarProduto`, `ativarProduto`, `desativarProduto`, `deletarProduto` |
| **Pedido** | `buscarPedidos`, `criarPedido`, `buscarPedidoPorId`, `buscarPedidoPorIdComprador` (com paginação), `buscarPedidoPorIdVendedor`, `finalizarPedidoVendedor` |
| **Chat** | `buscarChats`, `criarChat`, `enviarMensagem` |
| **Avaliações** | `buscarAvaliacoesConta`, `criarAvaliacaoProduto`, `criarAvaliacaoConta` |
| **Arquivos** | `buscarArquivosPorEntidade` (com `entityType` PRODUCT e PROFILE), `deletarArquivo` |
| **Interceptor de request** | Injeta `Authorization: Bearer <token>` nas rotas protegidas; omite o header em `/v1/token` e `/v1/user`; não injeta quando não há token |
| **Interceptor de response** | Ao receber 401: limpa `ec_token` e `ec_session` do storage e redireciona para `/login` |

---

#### `src/components/layout/Sidebar.test.tsx`

Renderiza os componentes dentro de `MemoryRouter`. O `useAuth` é mockado via `vi.mock`.

**`SidebarProdutor`**

| Caso | O que verifica |
|:-----|:--------------|
| Logo | Textos "Elo" e "Campo" presentes |
| Links de navegação | 4 links: Início, Meus Produtos, Minhas Vendas, Perfil |
| Rotas | Cada link aponta para `/produtor/{dashboard,produtos,vendas,perfil}` |
| Nome da conta | Exibe o `name` da conta quando disponível |
| Fallback | Exibe o email quando `account.name` está ausente |
| Botão Sair | Presente e chama `logout` ao clicar |
| Classe CSS | `aside` não contém a classe `buyer` |

**`SidebarComprador`**

| Caso | O que verifica |
|:-----|:--------------|
| Links de navegação | 4 links: Início, Produtos, Meus Pedidos, Perfil |
| Rotas | Cada link aponta para `/comprador/{dashboard,produtos,pedidos,perfil}` |
| Classe CSS | `aside` contém a classe `buyer` |
| Botão Sair | Chama `logout` ao clicar |

---

#### `src/pages/auth/Login.test.tsx`

Renderiza `<Login />` dentro de `MemoryRouter`. As dependências `api`, `AuthContext` e `useNavigate` são todas mockadas.

| Grupo | Casos |
|:------|:------|
| **Renderização** | Título de login, campos de e-mail e senha, botão "Entrar na plataforma", seção de cadastro, opções VENDOR/BUYER, link "Esqueci a senha", texto do marketplace |
| **Modal de recuperação de senha** | Abre ao clicar em "Esqueci a senha"; fecha ao clicar em Cancelar; exibe mensagem de sucesso após `resetarSenha` resolver; exibe erro da API quando `resetarSenha` rejeitar |
| **`handleLogin`** | Chama `gerarToken` com email e senha preenchidos; exibe erro da API quando `gerarToken` rejeitar |
| **Cadastro rápido — validações** | Erro se termos não aceitos; erro se senhas divergirem; erro se senha < 8 caracteres; chama `criarUsuario` com dados corretos quando válido; exibe erro da API quando `criarUsuario` rejeitar |

> **Nota:** os testes de validação do formulário de cadastro usam `fireEvent.submit()` diretamente (em vez de clicar no botão) para contornar a validação nativa HTML5 (`required` / `minLength`) e exercitar apenas a lógica JavaScript de `handleCadastro`.

---

## Fluxo de autenticação

### Login

1. `POST /api/v1/token` com `{ email, password }` → recebe `{ token }`
2. O JWT é decodificado no cliente para extrair `userId`, `email` e `isAdmin`
3. `GET /api/v1/account/user/{userId}` (com o token) → obtém a conta com `role` (VENDOR ou BUYER)
4. A sessão é armazenada no `localStorage` como `ec_session` e `ec_token`
5. Redirecionamento conforme o papel:
   - `VENDOR` → `/produtor/dashboard`
   - `BUYER` → `/comprador/dashboard`
   - `isAdmin: true` → `/admin`
   - Sem conta criada → `/cadastro` (para completar o perfil)

### Cadastro (duas etapas)

**Etapa 1 — Credenciais**
- `POST /api/v1/user` com `{ email, password }` → cria o usuário e retorna o `id`

**Etapa 2 — Perfil**
- `POST /api/v1/account` com todos os dados obrigatórios:

```json
{
  "userId": "uuid-do-usuario",
  "name": "João da Silva",
  "role": "VENDOR",
  "birthdayDate": 694224000000,
  "cpf": "000.000.000-00",
  "phone": { "countryCode": 55, "stateCode": 11, "number": "99999-9999" },
  "address": {
    "street": "Rua das Flores",
    "number": "100",
    "complement": "",
    "district": "Centro",
    "city": "Sorriso",
    "state": "MT",
    "postalCode": "78890-000"
  }
}
```

Após criar a conta, o login é feito automaticamente e o usuário é redirecionado para o dashboard.

### Recuperação de senha

Na tela de login, o link **"Esqueci a senha"** abre uma modal que chama:

```
POST /api/v1/user/reset-password/{email}
```

O e-mail de recuperação é enviado pelo `message-service` via Brevo.

### Sessão persistida

A sessão é salva em `localStorage` e restaurada automaticamente ao recarregar a página. O interceptor do axios injeta o header `Authorization: Bearer <token>` em todas as requisições. Em caso de resposta `401`, a sessão é removida e o usuário é redirecionado para `/login`.

---

## Estrutura do projeto

```
src/
├── contexts/
│   └── AuthContext.tsx      # Contexto de sessão (token, userId, conta)
├── components/
│   └── layout/
│       └── Sidebar.tsx      # Navegação lateral (produtor e comprador)
├── pages/
│   ├── auth/
│   │   ├── Login.tsx        # Login + modal de recuperação de senha
│   │   └── Cadastro.tsx     # Cadastro em duas etapas
│   ├── produtor/
│   │   ├── DashboardProdutor.tsx
│   │   ├── MeusProdutos.tsx
│   │   ├── MinhasVendas.tsx
│   │   └── PerfilProdutor.tsx
│   ├── comprador/
│   │   ├── DashboardComprador.tsx
│   │   ├── BuscarProdutos.tsx
│   │   ├── MeusPedidos.tsx
│   │   └── PerfilEmpresa.tsx
│   └── admin/
│       └── AdminDashboard.tsx
├── services/
│   └── api.ts               # Instância axios + todas as chamadas de API
└── types/
    └── index.ts             # Tipos TypeScript alinhados aos contratos do backend
```

---

## Domínios e endpoints consumidos

|     Domínio      |  Microsserviço  | Endpoints principais |
|:----------------:|:---------------:|:----------------------:|
| **Autenticação** | auth-service    | `POST /v1/token`, `POST /v1/user`, `POST /v1/user/reset-password/{email}` |
| **Conta**        | account-service | `POST /v1/account`, `GET /v1/account/user/{userId}`, `PUT /v1/account/{id}` |
| **Produto**      | product-service | `GET /v1/product`, `POST /v1/product`, `DELETE /v1/product/{id}` |
| **Pedido/Venda** | order-service   | `GET /v1/order`, `POST /v1/order`, `GET /v1/order/{id}` |
| **Chat**         | chat-service    | `GET /v1/chat`, `POST /v1/chat`, `POST /v1/chat/{id}/message` |

---

## Tecnologias

|     Biblioteca   | Versão | Uso |
|:----------------:|:------:|:-----:|
| React            | 18.3   | Interface |
| React Router DOM | 6.26   | Roteamento e proteção de rotas |
| TypeScript       | 5.4    | Tipagem estática |
| Vite             | 5.3    | Build e servidor de desenvolvimento |
| Axios            | 1.7    | Requisições HTTP |

---

## Solução de problemas comuns

**A aplicação carrega mas todas as chamadas de API retornam erro de rede**
→ Verifique se o elogateway está rodando na porta 8090.

**Login retorna 401 ou "Invalid credentials"**
→ Verifique se o `auth-service` está rodando e se o `application-local.yml` do `auth-service` está configurado com o mesmo `TOKEN_SECRET` que o `elogateway`.

**Cadastro falha na etapa 2 com erro de validação**
→ Todos os campos do endereço e do telefone são obrigatórios no `account-service`. Verifique se nenhum campo está vazio.

**Recuperação de senha não envia e-mail**
→ O `message-service` precisa das variáveis `BREVO_SMTP_USERNAME`, `BREVO_SMTP_PASSWORD` e `EMAIL_FROM` configuradas no `application-local.yml`.
