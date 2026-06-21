# EloCampo Mobile

Aplicação móvel do EloCampo.

---

## Sobre a aplicação

O app mobile é construído com React Native e Expo, e se comunica exclusivamente com o **elogateway**, o ponto de entrada único do backend. O gateway valida o token JWT e roteia cada requisição para o microsserviço correto.

Há dois perfis de usuário:

|          Papel         | Valor na API | O que pode fazer |
|:----------------------:|:------------:|:----------------:|
| **Produtor rural**     | `VENDOR`     | Cadastrar produtos, acompanhar propostas e vendas recebidas, gerenciar perfil |
| **Empresa compradora** | `BUYER`      | Buscar produtos, enviar propostas, acompanhar pedidos, negociar via chat |

Administradores (`isAdmin: true`) têm acesso a uma área exclusiva para gerenciar usuários, produtos e pedidos de toda a plataforma.

---

## Pré-requisitos

|      Ferramenta      |  Versão mínima  |  Para quê  |
|:--------------------:|:---------------:|:----------:|
| Node.js              | 18              | Executar o Metro Bundler e instalar dependências |
| npm                  | 9               | Gerenciador de pacotes |
| Expo CLI             | —               | `npx expo` (não requer instalação global) |
| Expo Go              | SDK 54          | Rodar o app em dispositivo físico durante o desenvolvimento |
| Backend em execução  | —               | O app não funciona sem o elogateway e os microsserviços |

Para instalar o Expo Go no dispositivo, acesse a App Store (iOS) ou a Play Store (Android) e busque por **Expo Go**.

---

## Instalação e execução

### 1. Instale as dependências

```bash
npm install
```

### 2. Suba o backend

Antes de iniciar o app, o backend precisa estar rodando. Veja as instruções completas em [`../Backend/README.md`](../Backend/README.md). O resumo é:

```bash
# 1. Infraestrutura (MongoDB)
cd ../Backend
docker compose up -d

# 2. Publique os módulos de contrato de cada serviço
#    (execute dentro de cada diretório de serviço)
./gradlew :<service>-contract:publishToMavenLocal

# 3. Inicie cada microsserviço com o perfil local
./gradlew bootRun --args='--spring.profiles.active=local'
```

A ordem recomendada para subir os serviços é:
1. `auth-service` (porta 8080);
2. `account-service` (porta 8081);
3. `product-service` (porta 8082);
4. `order-service` (porta 8083);
5. `file-service` (porta 8084);
6. `message-service` (porta 8085);
7. `chat-service` (porta 8086);
8. `elogateway` (porta 8090): **inicie por último**.

### 3. Inicie o servidor de desenvolvimento

```bash
npx expo start
```

O Metro Bundler abrirá um QR Code no terminal. Escaneie-o com o aplicativo **Expo Go** no celular para abrir o app.

Para rodar em plataformas específicas:

```bash
npx expo start --android   # Android (emulador ou dispositivo)
npx expo start --ios       # iOS (somente macOS)
npx expo start --web       # Navegador (útil para debug de layout e chamadas de API)
```

---

## Como a API funciona

O app se comunica diretamente com o elogateway hospedado na Azure. A URL base está definida em `src/config.ts`:

```
App  →  /v1/token
axios →  https://elogateway.../rest/v1/token
Gateway →  auth-service :8080
```

Todas as chamadas usam a instância axios configurada em `src/services/api.ts`. O interceptor de request injeta automaticamente o header `Authorization: Bearer <token>` em todas as rotas protegidas (exceto `/v1/token` e `/v1/user`). O token é lido do `AsyncStorage` a cada requisição.

> **Exceção: upload de arquivos:** a função `uploadArquivo` usa o `fetch` nativo do React Native em vez do axios, pois o axios tem incompatibilidade conhecida com `FormData` + URIs de arquivo nativo no iOS/Android.

Para rodar o app apontando para o backend local em vez do gateway na nuvem, altere `API_BASE_URL` em `src/config.ts`:

```ts
export const API_BASE_URL = 'http://<seu-ip-local>:8090/rest'
```

Use o IP local da sua máquina na rede (não `localhost`), pois o dispositivo físico precisa acessar sua máquina.

---

## Scripts disponíveis

|           Comando              | O que faz |
|:------------------------------:|-----------|
| `npx expo start`               | Inicia o Metro Bundler com QR Code para Expo Go |
| `npx expo start --android`     | Inicia e abre no Android |
| `npx expo start --ios`         | Inicia e abre no iOS (macOS) |
| `npx expo start --web`         | Inicia no navegador |
| `npx expo start --reset-cache` | Reinicia o Metro descartando o cache do bundle |
| `npm test`                     | Executa todos os testes uma única vez |
| `npm run test:watch`           | Executa os testes em modo *watch* |
| `npm run test:coverage`        | Executa os testes e gera relatório de cobertura |

---

## Testes

### Stack de testes

| Ferramenta | Versão | Uso |
|:----------:|:------:|:----|
| Jest | 29 | Runner e framework de assertions |
| jest-expo | 54 | Preset Jest com transformações para Expo/React Native |
| @testing-library/react-native | 13 | Renderização de componentes e simulação de interações |
| @testing-library/jest-native | 5 | Matchers extras (`.toBeVisible()`, `.toHaveTextContent()`, etc.) |

O ambiente de testes é configurado pelo preset `jest-expo`. O `AsyncStorage` é automaticamente substituído pelo mock oficial (`@react-native-async-storage/async-storage/jest/async-storage-mock`).

### Executando os testes

```bash
# Execução única
npm test

# Modo watch (desenvolvimento)
npm run test:watch

# Com cobertura
npm run test:coverage
```

### Visão geral da suíte

33 arquivos de teste · **265 testes**

```
src/__tests__/
├── components/
│   ├── Btn.test.tsx
│   ├── Input.test.tsx
│   └── Tag.test.tsx
├── contexts/
│   └── AuthContext.test.tsx
├── navigation/
│   └── RootNavigator.test.tsx
├── services/
│   └── api.test.ts
├── types/
│   └── constants.test.ts
├── utils/
│   └── masks.test.ts
└── screens/
    ├── auth/          (5 arquivos)
    ├── produtor/      (7 arquivos)
    ├── comprador/     (8 arquivos)
    ├── shared/        (2 arquivos)
    └── admin/         (4 arquivos)
```

### Cobertura por grupo

#### Componentes

**`Btn.test.tsx`** — Botão reutilizável com variantes e estado de carregamento.

| Caso | Comportamento esperado |
|:-----|:-----------------------|
| Renderização | Exibe o label e chama `onPress` ao pressionar |
| Variante `danger` | Aplica estilo visual de destruição |
| `loading: true` | Exibe `ActivityIndicator` e desabilita o toque |

**`Input.test.tsx`** — Campo de texto com label flutuante.

| Caso | Comportamento esperado |
|:-----|:-----------------------|
| Renderização | Exibe label e aceita texto |
| `editable: false` | Campo não responde a entrada |
| Props de estilo | Aplica cores customizadas de fundo, borda e texto |

**`Tag.test.tsx`** — Chip de categoria/status.

| Caso | Comportamento esperado |
|:-----|:-----------------------|
| Renderização | Exibe o texto da tag |
| Variante de cor | Aplica a cor correta ao fundo |

---

#### `AuthContext.test.tsx`

Testa o `AuthProvider` e o hook `useAuth`.

| Grupo | Casos |
|:------|:------|
| **Estado inicial** | `loading` começa `true` e termina `false`; `session` é `null` sem dados no storage |
| **Restauração do AsyncStorage** | Sessão válida é restaurada ao recarregar; JSON inválido é ignorado sem erro |
| **`setSession`** | Atualiza o contexto; salva `ec_token` e `ec_session` no AsyncStorage; limpa ambas as chaves ao receber `null` |
| **`logout`** | Zera `session` no contexto e remove as chaves do AsyncStorage |

---

#### `RootNavigator.test.tsx`

Verifica o roteamento raiz conforme o estado da sessão.

| Estado da sessão | Navegador exibido |
|:-----------------|:------------------|
| Sem sessão (`null`) | `AuthStack` |
| `isAdmin: true` | `AdminTabs` |
| `role: VENDOR` | `ProdutorTabs` |
| `role: BUYER` | `CompradorTabs` |
| Carregando | Indicador de carregamento |

---

#### `api.test.ts`

Usa mock da instância axios para verificar paths, métodos HTTP e parâmetros de todas as funções de API.

| Domínio | Funções testadas |
|:--------|:----------------|
| **Autenticação** | `gerarToken` — POST `/v1/token`; `criarUsuario` — POST `/v1/user`; `resetarSenha` — POST com email codificado em URL |
| **Conta** | `buscarContaPorUsuario`, `buscarContaPorId`, `buscarTodasContas`, `atualizarConta` |
| **Produto** | `buscarProdutos` (sem e com filtros), `buscarProdutoPorId`, `buscarProdutosPorVendedor`, `criarProduto`, `atualizarProduto`, `ativarProduto`, `desativarProduto`, `deletarProduto` |
| **Pedido** | `buscarPedidos`, `criarPedido`, `buscarPedidoPorIdComprador`, `buscarPedidoPorIdVendedor`, `atualizarStatusPedido` |
| **Arquivo** | `buscarArquivosPorEntidade` (com `entityType` PRODUCT e PROFILE), `deletarArquivo` |
| **Chat** | `buscarChatsPorConta`, `criarChat`, `criarOuBuscarChat` (criação bem-sucedida; fallback para busca em caso de 422/400), `enviarMensagem` |

---

#### `constants.test.ts`

Valida as constantes de domínio exportadas por `src/types/index.ts`.

- **`PRODUCT_CATEGORY`** — 7 categorias com `value` e `label` em português
- **`PRODUCT_SCALE`** — 3 escalas (`KG`, `UNIT`, `LITER`) com labels
- **`ORDER_STATUS`** — status de pedido com os valores corretos da API

---

#### `masks.test.ts`

Testa as funções utilitárias de formatação de entrada.

| Função | Casos cobertos |
|:-------|:--------------|
| `maskCpf` | Aplica máscara `000.000.000-00`; trunca excedente |
| `maskCnpj` | Aplica máscara `00.000.000/0001-00`; trunca excedente |
| `maskCep` | Aplica máscara `00000-000` |
| `unmask` | Remove todos os caracteres não numéricos |

---

#### Telas de autenticação (5 arquivos)

| Tela | Casos principais |
|:-----|:----------------|
| `LoginScreen` | Renderização, chamada a `gerarToken`, erro da API, navegação para recuperação de senha |
| `CadastroInicialScreen` | Validação de e-mail, chamada a `criarUsuario`, erro da API |
| `CadastroScreen` | Formulário de perfil completo, máscara de campos, chamada a `criarConta`, redirecionamento |
| `TipoContaScreen` | Seleção entre VENDOR e BUYER, navegação para cadastro |
| `RecuperarSenhaScreen` | Chamada a `resetarSenha`, mensagem de sucesso, tratamento de erro |

---

#### Telas do produtor (7 arquivos)

| Tela | Casos principais |
|:-----|:----------------|
| `HomeProdutorScreen` | Carregamento de dados do dashboard, exibição de métricas |
| `MeusProdutosScreen` | Listagem de produtos, ativação/desativação, navegação para novo produto |
| `NovoProdutoScreen` | Formulário de cadastro de produto, seleção de categoria e escala, chamada a `criarProduto` |
| `MinhasVendasScreen` | Listagem de pedidos recebidos, filtro por status |
| `DetalheVendaScreen` | Exibição de detalhes do pedido, atualização de status |
| `PropostasRecebidasScreen` | Listagem de propostas com status, aceite e recusa |
| `PerfilProdutorScreen` | Carregamento e edição do perfil, troca de foto (galeria + upload), logout |

---

#### Telas do comprador (8 arquivos)

| Tela | Casos principais |
|:-----|:----------------|
| `HomeCompradorScreen` | Dashboard com resumo de pedidos e atividade recente |
| `BuscarProdutosScreen` | Busca com filtros por descrição, categoria e estado, listagem de resultados |
| `DetalheProdutoScreen` | Exibição de detalhes do produto, foto, avaliações, botão de proposta |
| `MeusPedidosScreen` | Listagem de pedidos enviados e seus status |
| `PropostaEnviadaScreen` | Confirmação de proposta enviada com resumo |
| `ChatCompradorScreen` | Abertura de chat com o produtor de um pedido |
| `AvaliacoesScreen` | Envio de avaliação de conta |
| `PerfilCompradorScreen` | Carregamento e edição do perfil, troca de foto (galeria + upload), logout |

---

#### Telas compartilhadas (2 arquivos)

| Tela | Casos principais |
|:-----|:----------------|
| `ChatsListScreen` | Listagem de conversas ativas com nome do interlocutor |
| `ChatDetailScreen` | Histórico de mensagens, envio de nova mensagem, scroll para última mensagem |

---

#### Telas de administração (4 arquivos)

| Tela | Casos principais |
|:-----|:----------------|
| `AdminHomeScreen` | Painel com totais de usuários, produtos e pedidos |
| `UsuariosAdminScreen` | Listagem de usuários, ativação e desativação de contas |
| `ProdutosAdminScreen` | Listagem de todos os produtos da plataforma |
| `PedidosAdminScreen` | Listagem de todos os pedidos da plataforma |

---

## Fluxo de autenticação

### Login

1. `POST /v1/token` com `{ email, password }` → recebe `{ token }`
2. O JWT é decodificado no cliente para extrair `userId`, `email` e `isAdmin`
3. `GET /v1/account/user/{userId}` (com o token) → obtém a conta com `role` (`VENDOR` ou `BUYER`)
4. A sessão é persistida no `AsyncStorage` como `ec_session` (objeto completo) e `ec_token` (JWT)
5. O `RootNavigator` redireciona conforme o papel:
   - `VENDOR` → `ProdutorTabs`
   - `BUYER` → `CompradorTabs`
   - `isAdmin: true` → `AdminTabs`
   - Sem conta criada → `AuthStack` (para completar o cadastro)

### Cadastro (duas etapas)

**Etapa 1 — Credenciais** (`CadastroInicialScreen`)

```
POST /v1/user  →  { email, password, isAdmin: false }
```

**Etapa 2 — Tipo de conta** (`TipoContaScreen`) → **Perfil** (`CadastroScreen`)

```
POST /v1/account  →  { userId, name, role, birthdayDate, cpf/cnpj, phone, address }
```

Após criar a conta, o login é feito automaticamente e o usuário é redirecionado para o dashboard correspondente ao seu papel.

### Recuperação de senha

Na tela de login, o botão **"Esqueci minha senha"** navega para `RecuperarSenhaScreen`, que chama:

```
POST /v1/user/reset-password/{email}
```

O e-mail de recuperação é enviado pelo `message-service` via Brevo.

### Sessão persistida

A sessão é salva no `AsyncStorage` e restaurada automaticamente na próxima abertura do app. Enquanto a sessão está sendo restaurada, o `RootNavigator` exibe um `ActivityIndicator`. Ao fazer logout, `ec_token` e `ec_session` são removidos do `AsyncStorage`.

---

## Estrutura do projeto

```
src/
├── components/
│   ├── Btn.tsx              # Botão reutilizável com variantes e estado de loading
│   ├── CustomTabBar.tsx     # Barra de navegação inferior customizada
│   ├── Input.tsx            # Campo de texto com label flutuante
│   └── Tag.tsx              # Chip de categoria/status
├── contexts/
│   └── AuthContext.tsx      # Contexto de sessão (token, userId, conta, logout)
├── navigation/
│   ├── RootNavigator.tsx    # Roteamento raiz por papel do usuário
│   ├── AuthStack.tsx        # Stack de telas de autenticação
│   ├── ProdutorTabs.tsx     # Tabs do produtor (Home, Produtos, Vendas, Chat, Perfil)
│   ├── CompradorTabs.tsx    # Tabs do comprador (Home, Buscar, Pedidos, Chat, Perfil)
│   └── AdminTabs.tsx        # Tabs do administrador
├── screens/
│   ├── auth/                # Login, cadastro, recuperação de senha
│   ├── produtor/            # Dashboard, produtos, vendas, propostas, perfil
│   ├── comprador/           # Dashboard, busca, pedidos, chat, avaliações, perfil
│   ├── shared/              # Lista de chats e detalhe de conversa (compartilhadas)
│   └── admin/               # Painel, usuários, produtos, pedidos
├── services/
│   └── api.ts               # Instância axios + todas as funções de API
├── theme/
│   └── colors.ts            # Paletas de cores por tema (G = verde produtor, B = azul comprador)
├── types/
│   └── index.ts             # Tipos TypeScript alinhados aos contratos do backend
├── utils/
│   └── masks.ts             # Funções de máscara e desmascaramento de campos
└── config.ts                # URL base da API
```

---

## Domínios e endpoints consumidos

|     Domínio      |  Microsserviço  | Endpoints principais |
|:----------------:|:---------------:|:--------------------:|
| **Autenticação** | auth-service    | `POST /v1/token`, `POST /v1/user`, `POST /v1/user/reset-password/{email}` |
| **Conta**        | account-service | `POST /v1/account`, `GET /v1/account/user/{userId}`, `PUT /v1/account/{id}`, `POST /v1/account/{id}/evaluate` |
| **Produto**      | product-service | `GET /v1/product/query`, `POST /v1/product`, `PUT /v1/product/{id}`, `DELETE /v1/product/{id}`, `POST /v1/product/{id}/evaluate` |
| **Pedido**       | order-service   | `GET /v1/order/buyer/{id}`, `GET /v1/order/seller/{id}`, `POST /v1/order`, `PUT /v1/order/{id}/status` |
| **Arquivo**      | file-service    | `POST /v1/file/upload`, `GET /v1/file`, `DELETE /v1/file/{id}` |
| **Chat**         | chat-service    | `GET /v1/chat/{accountId}/chats`, `POST /v1/chat`, `GET /v1/chat/{id}`, `POST /v1/chat/{id}/message` |

---

## Tecnologias

|         Biblioteca         | Versão | Uso |
|:--------------------------:|:------:|:---:|
| React Native               | 0.81   | Framework mobile |
| Expo                       | 54     | Toolchain, build e módulos nativos |
| TypeScript                 | 5.3    | Tipagem estática |
| React Navigation           | 6      | Navegação entre telas (stack e tabs) |
| Axios                      | 1.7    | Requisições HTTP |
| expo-image-picker          | 17     | Seleção de imagem da galeria para foto de perfil |
| @expo/vector-icons         | 15     | Ícones (Ionicons) |
| react-native-safe-area-context | 5  | Margens seguras em notch e barra de status |
| @react-native-async-storage | 2.2   | Persistência da sessão no dispositivo |

---

## Solução de problemas comuns

**O app abre e fecha imediatamente**
→ Verifique se a versão do `expo-image-picker` instalada é compatível com o SDK 54. Use `npx expo install expo-image-picker` para garantir a versão correta.

**Todas as chamadas de API retornam erro de rede**
→ Verifique se o elogateway está rodando. Se estiver testando com backend local, certifique-se de que `API_BASE_URL` em `src/config.ts` aponta para o IP local da sua máquina (não `localhost`) e que o dispositivo está na mesma rede.

**Login retorna 401**
→ Verifique se o `auth-service` está rodando e se o `TOKEN_SECRET` configurado no `auth-service` é o mesmo do `elogateway`.

**Upload de foto de perfil falha com "Network Error"**
→ Esse erro ocorre quando o axios tenta enviar um `FormData` com URI de arquivo nativo. A função `uploadArquivo` já usa `fetch` nativo para contornar esse problema. Se o erro persistir, verifique se as permissões de galeria foram concedidas no dispositivo.

**Upload de foto retorna 400 "Tipo de arquivo não suportado"**
→ O backend aceita apenas `image/jpeg` e `image/png`. O app já normaliza `image/jpg` e `image/heic` para `image/jpeg` automaticamente. Se o problema persistir, verifique o formato da imagem selecionada.

**QR Code não aparece ou Expo Go não conecta**
→ Execute `npx expo start --reset-cache` para limpar o cache do Metro Bundler.
