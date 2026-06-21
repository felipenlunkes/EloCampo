# Registro de testes unitários

## O que são testes unitários?

Testes unitários são testes automatizados que verificam o comportamento de uma unidade isolada de código (uma classe ou método) sem depender de recursos externos como banco de dados, rede ou outros serviços. No EloCampo, cada microsserviço possui seu próprio conjunto de testes unitários que cobrem as camadas de serviço, controller e utilitários.

## Ferramentas e bibliotecas utilizadas

| Ferramenta        | Versão   | Finalidade                                                    |
| ----------------- | -------- | ------------------------------------------------------------- |
| **JUnit 5**       | 5.x      | Framework principal de testes — anotações `@Test`, `@BeforeEach`, extensões |
| **Mockito**       | 5.x      | Criação de mocks e verificação de comportamento (`@Mock`, `@InjectMocks`, `when`, `verify`) |
| **AssertJ**       | 3.x      | Asserções fluentes e legíveis (`assertThat`, `assertThatThrownBy`, `assertThatNoException`) |
| **Instancio**     | 5.x      | Geração automática de instâncias de objetos com dados aleatórios para testes |
| **Spring Test**   | —        | `ReflectionTestUtils` para injetar valores em campos privados (`@Value`) em testes |

## Como executar os testes

Para executar todos os testes unitários de um microsserviço, navegue até o diretório do módulo `*-impl` e execute:

```bash
./gradlew test
```

Para executar uma classe de teste específica:

```bash
./gradlew test -Dtest=NomeDaClasseTest
```

Para executar os testes de todos os microsserviços a partir da raiz do backend:

```bash
./gradlew test --projects auth-service/auth-service-impl,account-service/account-service-impl,...
```

## Estrutura de um teste unitário

A estrutura padrão adotada nos testes do projeto segue o padrão **Arrange → Act → Assert** com nomenclatura descritiva dos métodos:

```java
@ExtendWith(MockitoExtension.class)          // (1) Habilita injeção de mocks pelo Mockito
class MeuServiceImplTest {

    @Mock
    private MeuRepository meuRepository;     // (2) Dependência simulada (mock)

    @InjectMocks
    private MeuServiceImpl meuService;       // (3) Instância real com mocks injetados

    private UUID id;

    @BeforeEach
    void setUp() {
        id = UUID.randomUUID();              // (4) Dados compartilhados entre testes
    }

    @Test
    void nomeDoMetodoDeExecutarCondicaoComComportamentoEsperado() {

        // Arrange — configura o comportamento do mock
        when(meuRepository.findById(id.toString()))
            .thenReturn(Optional.of(new MinhaEntidade()));

        // Act — executa o método sob teste
        var resultado = meuService.buscarPorId(id);

        // Assert — verifica o resultado
        assertThat(resultado).isPresent();
        verify(meuRepository).findById(id.toString());
    }

    @Test
    void nomeDoMetodoDeveExecutarCondicaoDeErroComComportamentoDeLancaExcecao() {

        when(meuRepository.findById(id.toString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> meuService.buscarPorId(id))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining("not found");
    }
}
```

**Explicação dos elementos:**

1. `@ExtendWith(MockitoExtension.class)` — integra o Mockito ao JUnit 5, habilitando `@Mock` e `@InjectMocks`
2. `@Mock` — cria um objeto simulado da dependência; todas as chamadas retornam `null`/valores padrão salvo configuração com `when(...)`
3. `@InjectMocks` — instancia a classe sob teste e injeta automaticamente todos os `@Mock` declarados
4. `@BeforeEach` — executado antes de cada teste, ideal para inicializar dados compartilhados

**Uso com Instancio** (para gerar objetos preenchidos automaticamente):

```java
User user = Instancio.of(User.class)
    .set(field(User.class, "email"), "test@example.com")
    .set(field(User.class, "removed"), false)
    .create();
```

---

## Testes por microsserviço

### `auth-service`

Localização: [`src/Backend/auth-service/auth-service-impl/src/test/java/com/elocampo/authservice/`](../src/Backend/auth-service/auth-service-impl/src/test/java/com/elocampo/authservice/)

| Classe de Teste | Camada | Cobertura |
|:---------------:|:------:|:---------:|
| [`UserServiceImplTest`](../src/Backend/auth-service/auth-service-impl/src/test/java/com/elocampo/authservice/user/service/UserServiceImplTest.java) | Service | Criação de usuário, busca por ID e e-mail, desativação, reativação, reset de senha; validação de e-mail duplicado, lançamento de `NotFoundException` e `ValidationErrorException` |
| [`UserControllerTest`](../src/Backend/auth-service/auth-service-impl/src/test/java/com/elocampo/authservice/user/controller/UserControllerTest.java) | Controller | Respostas HTTP (201, 200, 204, 404) para criação, busca, ativação, desativação e reset de senha |
| [`TokenServiceImplTest`](../src/Backend/auth-service/auth-service-impl/src/test/java/com/elocampo/authservice/token/service/TokenServiceImplTest.java) | Service | Geração de JWT com credenciais válidas; rejeição por usuário inexistente ou senha incorreta; validação de tokens válidos, malformados, com assinatura errada e vazios |
| [`TokenControllerTest`](../src/Backend/auth-service/auth-service-impl/src/test/java/com/elocampo/authservice/token/controller/TokenControllerTest.java) | Controller | Respostas HTTP para geração e validação de tokens |
| [`UserMapperTest`](../src/Backend/auth-service/auth-service-impl/src/test/java/com/elocampo/authservice/user/mapper/UserMapperTest.java) | Mapper | Conversão entre entidade `User` e `UserResponse` |
| [`PasswordBuilderTest`](../src/Backend/auth-service/auth-service-impl/src/test/java/com/elocampo/authservice/user/util/PasswordBuilderTest.java) | Util | Geração de senhas temporárias |
| [`UuidV7Test`](../src/Backend/auth-service/auth-service-impl/src/test/java/com/elocampo/authservice/util/UuidV7Test.java) | Util | Geração de UUIDs v7 não nulos, com versão correta, únicos e ordenados cronologicamente |

---

### `account-service`

Localização: [`src/Backend/account-service/account-service-impl/src/test/java/com/elocampo/accountservice/`](../src/Backend/account-service/account-service-impl/src/test/java/com/elocampo/accountservice/)

| Classe de Teste | Camada | Cobertura |
|:---------------:|:------:|:---------:|
| [`AccountServiceImplTest`](../src/Backend/account-service/account-service-impl/src/test/java/com/elocampo/accountservice/account/service/AccountServiceImplTest.java) | Service | Criação de conta com CPF e CNPJ; validação de campos obrigatórios, exclusividade de CPF/CNPJ, conta duplicada por usuário; atualização de conta; busca por ID e por `userId`; ativação e desativação lógica |
| [`AccountControllerTest`](../src/Backend/account-service/account-service-impl/src/test/java/com/elocampo/accountservice/account/controller/AccountControllerTest.java) | Controller | Respostas HTTP para criação, busca, atualização, ativação e desativação de contas |
| [`AccountMapperTest`](../src/Backend/account-service/account-service-impl/src/test/java/com/elocampo/accountservice/account/mapper/AccountMapperTest.java) | Mapper | Conversão entre entidade `Account` e `AccountResponse` |
| [`UuidV7Test`](../src/Backend/account-service/account-service-impl/src/test/java/com/elocampo/accountservice/util/UuidV7Test.java) | Util | Geração de UUIDs v7 não nulos, únicos e ordenados cronologicamente |

---

### `product-service`

Localização: [`src/Backend/product-service/product-service-impl/src/test/java/com/elocampo/productservice/`](../src/Backend/product-service/product-service-impl/src/test/java/com/elocampo/productservice/)

| Classe de Teste | Camada | Cobertura |
|:---------------:|:------:|:---------:|
| [`ProductServiceImplTest`](../src/Backend/product-service/product-service-impl/src/test/java/com/elocampo/productservice/product/service/ProductServiceImplTest.java) | Service | Criação de produto com conta `VENDOR`; rejeição por conta `BUYER`; atualização; busca por ID e por vendedor; listagem de ativos; desativação e reativação lógica; validação de `productId` nulo |
| [`ProductControllerTest`](../src/Backend/product-service/product-service-impl/src/test/java/com/elocampo/productservice/product/controller/ProductControllerTest.java) | Controller | Respostas HTTP para criação, busca, atualização, desativação e ativação de produtos |
| [`ProductMapperTest`](../src/Backend/product-service/product-service-impl/src/test/java/com/elocampo/productservice/product/mapper/ProductMapperTest.java) | Mapper | Conversão entre entidade `Product` e `ProductResponse` |

---

### `order-service`

Localização: [`src/Backend/order-service/order-service-impl/src/test/java/com/elocampo/orderservice/`](../src/Backend/order-service/order-service-impl/src/test/java/com/elocampo/orderservice/)

| Classe de Teste | Camada | Cobertura |
|:---------------:|:------:|:---------:|
| [`OrderServiceImplTest`](../src/Backend/order-service/order-service-impl/src/test/java/com/elocampo/orderservice/order/service/OrderServiceImplTest.java) | Service | Criação de pedido com conta `BUYER`; cálculo correto do valor total; mapeamento de itens; rejeição por conta `VENDOR`; verificação de status inicial `PENDING` |
| [`OrderMapperTest`](../src/Backend/order-service/order-service-impl/src/test/java/com/elocampo/orderservice/order/mapper/OrderMapperTest.java) | Mapper | Conversão entre entidade `Order` e `OrderResponse` |
| [`OrderServiceApplicationTests`](../src/Backend/order-service/order-service-impl/src/test/java/com/elocampo/orderservice/OrderServiceApplicationTests.java) | Spring | Verifica que o contexto da aplicação sobe corretamente |

---

### `message-service`

Localização: [`src/Backend/message-service/message-service-impl/src/test/java/com/elocampo/messageservice/`](../src/Backend/message-service/message-service-impl/src/test/java/com/elocampo/messageservice/)

| Classe de Teste | Camada | Cobertura |
|:---------------:|:------:|:---------:|
| [`EmailServiceImplTest`](../src/Backend/message-service/message-service-impl/src/test/java/com/elocampo/messageservice/email/service/EmailServiceImplTest.java) | Service | Envio de e-mail HTML com `JavaMailSender`; verificação via `ArgumentCaptor`; tratamento de falha no SMTP; garantia de que o envio não é tentado quando a criação da `MimeMessage` falha |
| [`EmailControllerTest`](../src/Backend/message-service/message-service-impl/src/test/java/com/elocampo/messageservice/email/controller/EmailControllerTest.java) | Controller | Resposta HTTP para envio de e-mail |
| [`UuidV7Test`](../src/Backend/message-service/message-service-impl/src/test/java/com/elocampo/messageservice/util/UuidV7Test.java) | Util | Geração de UUIDs v7 |

---

### `chat-service`

Localização: [`src/Backend/chat-service/chat-service-impl/src/test/java/com/elocampo/chatservice/`](../src/Backend/chat-service/chat-service-impl/src/test/java/com/elocampo/chatservice/)

| Classe de Teste | Camada | Cobertura |
|:---------------:|:------:|:---------:|
| [`UuidV7Test`](../src/Backend/chat-service/chat-service-impl/src/test/java/com/elocampo/chatservice/util/UuidV7Test.java) | Util | Geração de UUIDs v7 não nulos, com versão correta, únicos (1000 iterações) e ordenados cronologicamente |

---

### `elogateway`

Localização: [`src/Backend/elogateway/src/test/java/com/elocampo/elogateway/`](../src/Backend/elogateway/src/test/java/com/elocampo/elogateway/)

| Classe de Teste | Camada | Cobertura |
|:---------------:|:------:|:---------:|
| [`JwtFilterTest`](../src/Backend/elogateway/src/test/java/com/elocampo/elogateway/filter/JwtFilterTest.java) | Filter | Passagem sem autenticação quando não há header `Authorization`; passagem sem autenticação para esquema não-Bearer; autenticação bem-sucedida com token válido; injeção correta de `X-User-Id`, `X-User-Email` e `X-User-Admin` na requisição downstream; delegação de headers originais; limpeza do `SecurityContext` para tokens inválidos, expirados ou com assinatura incorreta |

---

## Testes do frontend (React)

### Ferramentas e bibliotecas

| Ferramenta | Versão | Finalidade |
|:----------:|:------:|:----------:|
| **Vitest** | 4.x | Framework principal de testes — `describe`, `it`, `expect`, `vi`, `beforeEach` |
| **@testing-library/react** | 16.x | Renderização e consulta de componentes React (`render`, `screen`, `fireEvent`, `waitFor`, `renderHook`) |
| **@testing-library/user-event** | 14.x | Simulação de interações reais do usuário (`userEvent.click`, `userEvent.type`) |
| **@testing-library/jest-dom** | 6.x | Matchers adicionais para o DOM (`toBeInTheDocument`, `toHaveAttribute`, `toContain`) |
| **axios-mock-adapter** | 2.x | Interceptação e mock de chamadas HTTP do axios (`onGet`, `onPost`, `onPut`, `onDelete`) |
| **jsdom** | — | Simulação do ambiente de navegador (DOM + `localStorage`) durante os testes |

### Como executar os testes

```bash
# Dentro de src/Frontend/

npm test           # modo watch (re-executa ao salvar)
npm run test:run   # execução única (CI)
npm run test:ui    # interface visual interativa (Vitest UI)
```

### Estrutura de um teste de componente

Os testes de componente seguem o padrão **Arrange → Render → Assert**, usando mocks de contextos e serviços externos:

```tsx
vi.mock('../../services/api', () => ({
  gerarToken: vi.fn(),   // (1) Substitui o módulo por mocks controlados
}))

describe('MeuComponente — cenário', () => {
  beforeEach(() => { vi.clearAllMocks() })  // (2) Limpa estado entre testes

  it('deve exibir X ao ocorrer Y', async () => {
    vi.mocked(gerarToken).mockResolvedValueOnce({ token: 'abc' })  // (3) Configura mock

    render(<MemoryRouter><MeuComponente /></MemoryRouter>)          // (4) Renderiza

    await user.click(screen.getByText('Entrar'))                   // (5) Interage

    await waitFor(() => {
      expect(screen.getByText('Sucesso')).toBeInTheDocument()       // (6) Verifica
    })
  })
})
```

### Testes por arquivo

#### [`src/utils/jwt.test.ts`](../src/Frontend/src/utils/jwt.test.ts)

Testa a função utilitária `decodeJwt`, responsável por decodificar o payload de tokens JWT.

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Token JWT válido | Decodifica e retorna o objeto payload corretamente |
| Token sem separador de ponto | Retorna `null` |
| String vazia | Retorna `null` |
| Payload não é JSON válido | Retorna `null` sem lançar exceção |
| Caracteres base64url (`-` e `_`) | Decodificados corretamente como `+` e `/` |
| `isAdmin = true` | Campo booleano preservado como `true` |
| `isAdmin = false` | Campo booleano preservado como `false` |

---

#### [`src/types/index.test.ts`](../src/Frontend/src/types/index.test.ts)

Testa as constantes de tipos exportadas pelo módulo central de tipos.

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| `PRODUCT_CATEGORY` contém 7 itens | Array com exatamente 7 categorias |
| Cada categoria possui `v` e `label` corretos | `GRAIN/Grão`, `VEGETABLE/Vegetal`, `FRUIT/Fruta`, `DAIRY/Laticínio`, `ANIMAL_PRODUCTS/Origem animal`, `PROTEINS/Proteínas`, `CONFECTIONERY/Artesanato` |
| Propriedades `v` e `label` são strings | Verificação de tipo em todas as categorias |
| `PRODUCT_SCALE` contém 3 itens | `KG/Quilograma (kg)`, `UNIT/Unidade`, `LITER/Litro (L)` |
| `OrderStatusEnum.PENDING` | Valor `"PENDING"` |
| `OrderStatusEnum.ACCEPTED` | Valor `"ACCEPTED"` |
| `OrderStatusEnum.COMPLETED` | Valor `"COMPLETED"` |

---

#### [`src/services/api.test.ts`](../src/Frontend/src/services/api.test.ts)

Testa todas as funções da camada de serviço HTTP usando `axios-mock-adapter` para interceptar as chamadas sem realizar requisições reais.

| Função testada | Endpoint | Cobertura |
|:--------------:|:--------:|:---------:|
| `gerarToken` | `POST /v1/token` | Retorna o token da resposta |
| `criarUsuario` | `POST /v1/user` | Envia o payload correto; retorna o usuário criado |
| `resetarSenha` | `POST /v1/user/reset-password/{email}` | Codifica e-mails com `encodeURIComponent`; aceita e-mails simples e com caracteres especiais |
| `buscarContaPorUsuario` | `GET /v1/account/user/{userId}` | Retorna a conta do usuário |
| `buscarContaPorId` | `GET /v1/account/{id}` | Retorna a conta pelo ID |
| `atualizarConta` | `PUT /v1/account/{id}` | Envia a requisição na URL correta |
| `buscarProdutos` | `GET /v1/product/query` | Sem parâmetros; com `description` e `category`; com `vendorCity` e `vendorState` |
| `buscarProdutoPorId` | `GET /v1/product/{id}` | Retorna o produto pelo ID |
| `buscarProdutosPorVendedor` | `GET /v1/product/vendor/{vendorAccountId}` | Retorna lista de produtos do vendedor |
| `criarProduto` | `POST /v1/product` | Envia e retorna o produto criado |
| `atualizarProduto` | `PUT /v1/product/{id}` | Envia a requisição na URL correta |
| `ativarProduto` | `PUT /v1/product/{id}/activate` | Chama o endpoint de ativação |
| `desativarProduto` | `PUT /v1/product/{id}/deactivate` | Chama o endpoint de desativação |
| `deletarProduto` | `DELETE /v1/product/{id}` | Chama o endpoint de exclusão |
| `buscarPedidos` | `GET /v1/order` | Retorna a resposta paginada |
| `criarPedido` | `POST /v1/order` | Envia e retorna o pedido criado |
| `buscarPedidoPorId` | `GET /v1/order/{id}` | Retorna o pedido pelo ID |
| `buscarPedidoPorIdComprador` | `GET /v1/order/buyer/{id}` | Sem parâmetros; com `page` e `size` |
| `buscarPedidoPorIdVendedor` | `GET /v1/order/seller/{id}` | Chama o endpoint correto |
| `finalizarPedidoVendedor` | `PUT /v1/order/{id}/status` | Envia o status `COMPLETED` no corpo |
| `buscarChats` | `GET /v1/chat` | Retorna a lista de chats |
| `criarChat` | `POST /v1/chat` | Envia e retorna o chat criado |
| `enviarMensagem` | `POST /v1/chat/{chatId}/message` | Envia o conteúdo da mensagem no corpo |
| `buscarAvaliacoesConta` | `GET /v1/evaluation/account/{accountId}` | Retorna a lista de avaliações |
| `criarAvaliacaoProduto` | `POST /v1/product/{productId}/evaluate` | Envia `stars` e `reviewerAccountId` |
| `criarAvaliacaoConta` | `POST /v1/account/{accountId}/evaluate` | Envia e retorna a avaliação criada |
| `buscarArquivosPorEntidade` | `GET /v1/file` | Query params `entityType=PRODUCT`; `entityType=PROFILE` |
| `deletarArquivo` | `DELETE /v1/file/{id}` | Chama o endpoint de exclusão |
| Interceptor de request | — | Adiciona `Authorization: Bearer <token>` em rotas protegidas; omite o header em `/v1/token` e `/v1/user`; omite quando não há token no `localStorage` |
| Interceptor de response | — | Ao receber 401, limpa `ec_token` e `ec_session` do `localStorage` e redireciona para `/login` |

---

#### [`src/contexts/AuthContext.test.tsx`](../src/Frontend/src/contexts/AuthContext.test.tsx)

Testa o provider `AuthProvider` e o hook `useAuth`, que gerenciam a sessão autenticada da aplicação.

| Grupo | Caso de teste | Comportamento esperado |
|:-----:|:-------------:|:----------------------:|
| Estado inicial | `loading` começa `true` e resolve para `false` | Transição de loading ao montar o provider |
| Estado inicial | `session` é `null` com `localStorage` vazio | Nenhuma sessão restaurada |
| Carregamento do `localStorage` | Sessão salva em `ec_session` é restaurada | Campos `email`, `isAdmin` etc. disponíveis no contexto |
| Carregamento do `localStorage` | JSON inválido é ignorado sem exceção | `session` permanece `null` |
| Carregamento do `localStorage` | `isAdmin: true` é restaurado corretamente | Campo booleano preservado |
| `setSession` | Atualiza `session` no contexto | Campo `email` refletido imediatamente |
| `setSession` | Salva token em `ec_token` no `localStorage` | `localStorage.getItem('ec_token')` retorna o token |
| `setSession` | Salva sessão serializada em `ec_session` | `JSON.parse` da chave equivale ao objeto original |
| `setSession(null)` | Limpa `ec_token` e `ec_session` do `localStorage` | Ambas as chaves removidas |
| `setSession(null)` | Define `session` como `null` no contexto | Contexto sem sessão ativa |
| `logout` | Limpa `session` do contexto | `session` passa a ser `null` |
| `logout` | Remove `ec_token` e `ec_session` do `localStorage` | Ambas as chaves removidas |

---

#### [`src/components/layout/Sidebar.test.tsx`](../src/Frontend/src/components/layout/Sidebar.test.tsx)

Testa os componentes `SidebarProdutor` e `SidebarComprador`, que compõem a navegação lateral da aplicação. O hook `useAuth` é mockado para injetar uma sessão controlada.

**`SidebarProdutor`**

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Logo EloCampo | Exibe os textos "Elo" e "Campo" |
| 4 links de navegação | "Início", "Meus Produtos", "Minhas Vendas" e "Perfil" presentes |
| Rotas corretas | `/produtor/dashboard`, `/produtor/produtos`, `/produtor/vendas`, `/produtor/perfil` |
| Nome da conta disponível | Exibe `account.name` ("João Silva") |
| Conta sem nome | Exibe o e-mail da sessão como fallback |
| Botão Sair | Presente e visível |
| Clique em Sair | Invoca `logout` do contexto |
| Classe CSS `buyer` | Não aplicada ao elemento `<aside>` |

**`SidebarComprador`**

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| 4 links de navegação | "Início", "Produtos", "Meus Pedidos" e "Perfil" presentes |
| Rotas corretas | `/comprador/dashboard`, `/comprador/produtos`, `/comprador/pedidos`, `/comprador/perfil` |
| Classe CSS `buyer` | Aplicada ao elemento `<aside>` |
| Clique em Sair | Invoca `logout` do contexto |

---

#### [`src/pages/auth/Login.test.tsx`](../src/Frontend/src/pages/auth/Login.test.tsx)

Testa a página `Login`, que concentra o formulário de autenticação, o cadastro rápido e o modal de recuperação de senha. Os módulos `api`, `AuthContext` e `react-router-dom` são mockados.

**Renderização**

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Título de login | Texto "Entrar na sua conta" presente |
| Campos de e-mail e senha | Inputs com os placeholders corretos |
| Botão de submit | Texto "Entrar na plataforma" presente |
| Seção de cadastro rápido | Texto "Criar conta gratuita" presente |
| Opções de perfil | "Produtor rural" e "Empresa compradora" presentes |
| Link de recuperação de senha | Texto "Esqueci a senha" presente |
| Features do marketplace | Texto "Marketplace agrícola brasileiro" presente |

**Modal de recuperação de senha**

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Clicar em "Esqueci a senha" | Modal com "Recuperar senha" e botão de envio aparece |
| Clicar em "Cancelar" | Modal é fechado |
| Envio bem-sucedido | Exibe mensagem de confirmação; `resetarSenha` chamado com o e-mail |
| Falha no envio | Exibe a mensagem de erro retornada pela API |

**Fluxo de login (`handleLogin`)**

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Submissão do formulário | `gerarToken` chamado com e-mail e senha preenchidos |
| Falha na autenticação | Mensagem de erro da API exibida na tela |

**Cadastro rápido (`handleCadastro`) — validações client-side**

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Termos não aceitos | Exibe "Aceite os termos para continuar"; `criarUsuario` não chamado |
| Senhas não coincidem | Exibe "As senhas não coincidem"; `criarUsuario` não chamado |
| Senha com menos de 8 caracteres | Exibe "A senha deve ter ao menos 8 caracteres"; `criarUsuario` não chamado |
| Formulário válido | `criarUsuario` chamado com e-mail, senha e `isAdmin` corretos |
| Falha na criação | Mensagem de erro da API exibida na tela |

---

## Testes do frontend Mobile (React Native)

### Ferramentas e bibliotecas

| Ferramenta | Versão | Finalidade |
|:----------:|:------:|:----------:|
| **Jest** | 29.x | Framework principal de testes — `describe`, `it`, `expect`, `jest.fn`, `beforeEach`, `act` |
| **jest-expo** | 54.x | Preset para Jest configurado para projetos Expo — transforma e emula o ambiente React Native |
| **@testing-library/react-native** | 13.x | Renderização e consulta de componentes (`render`, `fireEvent`, `waitFor`, `renderHook`, `act`) |
| **@testing-library/jest-native** | 5.x | Matchers adicionais para o ambiente React Native (`toBeTruthy`, `toBeNull`) |
| **@react-native-async-storage/async-storage** (mock) | — | Simulação da persistência assíncrona (`getItem`, `setItem`, `removeItem`) |

### Como executar os testes

```bash
# Dentro de src/Mobile/
npm test           # modo watch (re-executa ao salvar)
npm run test:run   # execução única (CI)
```

### Estrutura de um teste de componente

Os testes seguem o padrão **Arrange → Render → Assert**, com mocks de contextos, serviços e navegação:

```tsx
jest.mock('../../../contexts/AuthContext', () => ({ useAuth: jest.fn() }))
jest.mock('../../../services/api')

beforeEach(() => {
  ;(useAuth as jest.Mock).mockReturnValue({ session: mockSession })  // (1) Configura contexto
  ;(api.buscarProdutos as jest.Mock).mockResolvedValue([produto])    // (2) Configura chamadas de API
})

describe('MinhaScreen', () => {
  it('exibe dados após carregamento', async () => {
    const { findByText } = render(<MinhaScreen />)            // (3) Renderiza
    expect(await findByText('Nome do Produto')).toBeTruthy()  // (4) Aguarda e verifica
  })
})
```

### Localização dos testes

[`src/Mobile/src/__tests__/`](../src/Mobile/src/__tests__/)

---

### Testes por arquivo

#### Componentes

##### [`src/__tests__/components/Btn.test.tsx`](../src/Mobile/src/__tests__/components/Btn.test.tsx)

Testa o componente de botão reutilizável `Btn`.

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Renderiza rótulo | Texto da prop `label` visível |
| Pressionar botão | Invoca `onPress` uma vez |
| `disabled=true` | `onPress` não é chamado |
| `loading=true` | Rótulo oculto; `ActivityIndicator` exibido |
| `loading=true` (onPress) | `onPress` não é chamado; estado desabilitado confirmado por snapshot |
| Variante `primary` (padrão) | Snapshot corresponde ao estilo padrão |
| Variante `ghost` | Snapshot corresponde ao estilo ghost |
| Variante `danger` | Snapshot corresponde ao estilo danger |
| Prop `bg` customizada | `backgroundColor` aplicado ao elemento raiz |
| `disabled=true` (estilo) | Opacidade reduzida a `0.6` |
| `loading=true` (estilo) | Opacidade reduzida a `0.6` |

---

##### [`src/__tests__/components/Input.test.tsx`](../src/Mobile/src/__tests__/components/Input.test.tsx)

Testa o componente de campo de texto reutilizável `Input`.

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Rótulo fornecido | Texto da prop `label` visível |
| Sem rótulo | Nenhum elemento de texto extra renderizado |
| `onChangeText` | Chamado com o novo texto ao alterar o campo |
| Placeholder | Elemento com placeholder correto localizado |
| `secureTextEntry=true` | `TextInput` com `secureTextEntry: true` |
| `editable=false` | `TextInput` com `editable: false` |
| Cores customizadas (`bg`, `border`, `textColor`) | Snapshot corresponde ao estilo personalizado |
| `multiline` com `numberOfLines` | Propriedades `multiline: true` e `numberOfLines` corretas no `TextInput` |

---

##### [`src/__tests__/components/Tag.test.tsx`](../src/Mobile/src/__tests__/components/Tag.test.tsx)

Testa o componente `Tag`, que exibe rótulos coloridos de status.

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Renderiza rótulo | Texto da prop `label` visível |
| Variante `green` | `backgroundColor` e `borderColor` corretos (`TAG.green`) |
| Variante `amber` | `backgroundColor`, `borderColor` e `color` do texto corretos (`TAG.amber`) |
| Variante `blue` | `backgroundColor` correto (`TAG.blue`) |
| Variante `red` | `backgroundColor` correto (`TAG.red`) |
| Snapshot de todas as variantes | Cada variante corresponde ao snapshot salvo |

---

#### Contextos

##### [`src/__tests__/contexts/AuthContext.test.tsx`](../src/Mobile/src/__tests__/contexts/AuthContext.test.tsx)

Testa o provider `AuthProvider` e o hook `useAuth`, que gerenciam a sessão autenticada no app. A persistência é feita via `AsyncStorage`.

| Grupo | Caso de teste | Comportamento esperado |
|:-----:|:-------------:|:----------------------:|
| Estado inicial | `loading=true` e `session=null` com AsyncStorage vazio | Transição para `loading=false` e `session=null` após resolução |
| Estado inicial | Sessão salva restaurada do AsyncStorage | `session` contém os dados persistidos |
| Estado inicial | JSON corrompido no AsyncStorage | `session` permanece `null`; sem exceção |
| `setSession` | Sessão definida e persistida | `session` atualizado; `ec_token` e `ec_session` salvos via `AsyncStorage.setItem` |
| `setSession(null)` | Sessão limpa | `session` vira `null`; `ec_token` e `ec_session` removidos via `AsyncStorage.removeItem` |
| `logout` | Sessão e armazenamento limpos | `session` vira `null`; ambas as chaves removidas do AsyncStorage |

---

#### Navegação

##### [`src/__tests__/navigation/RootNavigator.test.tsx`](../src/Mobile/src/__tests__/navigation/RootNavigator.test.tsx)

Testa o `RootNavigator`, que decide qual stack exibir com base no estado de autenticação.

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| `loading=true` | Spinner (`ActivityIndicator`) exibido; confirmado por snapshot |
| Sem sessão | `AuthStack` renderizado |
| Sessão com `isAdmin=true` | `AdminTabs` renderizado |
| Sessão com conta `VENDOR` | `ProdutorTabs` renderizado |
| Sessão com conta `BUYER` | `CompradorTabs` renderizado |
| Sessão sem conta definida | Cai no `AuthStack` como fallback |

---

#### Serviços

##### [`src/__tests__/services/api.test.ts`](../src/Mobile/src/__tests__/services/api.test.ts)

Testa funções da camada de serviço HTTP usando mocks diretos do axios.

| Função testada | Cobertura |
|:--------------:|:---------:|
| `gerarToken` | `POST /v1/token` com e-mail e senha; retorna o token |
| `criarUsuario` | `POST /v1/user` com payload correto; retorna o usuário criado |
| `criarOuBuscarChat` | Retorna novo chat quando `criarChat` tem sucesso; busca chat existente ao receber 422 ou 400; localiza o chat correto em lista com múltiplos itens; encontra chat com sender/receiver invertidos; relança o erro para status ≠ 422/400; relança erro de rede; relança 422 quando nenhum chat da lista corresponde aos IDs |

---

#### Tipos / Constantes

##### [`src/__tests__/types/constants.test.ts`](../src/Mobile/src/__tests__/types/constants.test.ts)

Testa as constantes e enums exportados pelo módulo de tipos.

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| `PRODUCT_CATEGORY` tem 7 itens | Array com exatamente 7 categorias |
| Cada categoria tem `v` e `label` | Propriedades presentes e do tipo `string` |
| Categoria `GRAIN` com rótulo correto | `label` = `"Grão"` |
| Sem valores duplicados | Todos os `v` são únicos |
| `PRODUCT_SCALE` tem 3 itens | `KG`, `UNIT` e `LITER` presentes |
| `ORDER_STATUS_LABEL.PENDING` | `"Pendente"` |
| `ORDER_STATUS_LABEL.ACCEPTED` | `"Aceito"` |
| `ORDER_STATUS_LABEL.COMPLETED` | `"Concluído"` |
| Todos os status cobertos | Cada chave de `OrderStatusEnum` presente em `ORDER_STATUS_LABEL` |

---

#### Utilitários

##### [`src/__tests__/utils/masks.test.ts`](../src/Mobile/src/__tests__/utils/masks.test.ts)

Testa as funções de máscara de formatação de documentos e CEP.

**`maskCpf`**

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| String vazia | Retorna `""` |
| Até 3 dígitos | Sem pontuação |
| 4 dígitos | Primeiro ponto inserido (`"123.4"`) |
| 7 dígitos | Dois pontos (`"123.456.7"`) |
| 11 dígitos (CPF completo) | `"123.456.789-01"` |
| Entrada com caracteres não numéricos | Removidos antes de formatar |
| Mais de 11 dígitos | Limitado a 11 dígitos |

**`maskCnpj`**

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| String vazia | Retorna `""` |
| 14 dígitos (CNPJ completo) | `"12.345.678/0001-95"` |
| Etapas intermediárias (3, 6, 9 dígitos) | Pontuação inserida progressivamente |
| Entrada com caracteres não numéricos | Removidos antes de formatar |
| Mais de 14 dígitos | Limitado a 14 dígitos |

**`maskCep`**

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| String vazia | Retorna `""` |
| Até 5 dígitos | Sem hífen |
| 6 dígitos | Hífen inserido (`"12345-6"`) |
| 8 dígitos (CEP completo) | `"12345-678"` |
| Entrada com hífen | Mantido corretamente |
| Mais de 8 dígitos | Limitado a 8 dígitos |

**`unmask`**

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| CPF formatado | Remove pontos e hífen |
| CNPJ formatado | Remove pontos, barra e hífen |
| CEP formatado | Remove hífen |
| String vazia | Retorna `""` |
| String sem formatação | Retorna inalterada |
| Caracteres mistos não numéricos | Remove todos os não numéricos |

---

#### Telas — Autenticação

##### [`src/__tests__/screens/auth/LoginScreen.test.tsx`](../src/Mobile/src/__tests__/screens/auth/LoginScreen.test.tsx)

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Renderização | Logo, campos de e-mail/senha, botões "Entrar" e "Criar conta grátis" visíveis |
| Campos vazios | `Alert` "Preencha e-mail e senha" |
| Link "Esqueci a senha" | Navega para `RecuperarSenha` |
| Link "Criar conta grátis" | Navega para `CadastroInicial` |
| Submissão válida | `gerarToken` chamado com e-mail e senha |
| Resposta 401 | Modal com "Acesso negado" e mensagem de credenciais incorretas |
| Pressionar OK no modal | Modal fechado |

---

##### [`src/__tests__/screens/auth/CadastroInicialScreen.test.tsx`](../src/Mobile/src/__tests__/screens/auth/CadastroInicialScreen.test.tsx)

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Renderização | Campos de nome, e-mail, senha; indicador de etapa "1"; botão "Continuar →" |
| Nome vazio | `Alert` "Informe seu nome completo" |
| E-mail vazio | `Alert` "Informe seu e-mail" |
| Senha < 6 caracteres | `Alert` "A senha deve ter no mínimo 6 caracteres" |
| Senhas não coincidem | `Alert` "As senhas não coincidem" |
| Termos não aceitos | `Alert` "Aceite os termos para continuar" |
| Formulário válido | Navega para `TipoConta` com `{ nome, email, senha }` |

---

##### [`src/__tests__/screens/auth/TipoContaScreen.test.tsx`](../src/Mobile/src/__tests__/screens/auth/TipoContaScreen.test.tsx)

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Renderização | Opções "Produtor rural" e "Comprador" visíveis |
| Padrão `VENDOR` | Texto descritivo de vendedor exibido |
| Continuar com `VENDOR` | `criarUsuario` chamado; navega para `Cadastro` com `role: "VENDOR"` |
| Selecionar `BUYER` | Navega para `Cadastro` com `role: "BUYER"` |
| Falha na API | `Alert` com a mensagem de erro retornada |

---

##### [`src/__tests__/screens/auth/CadastroScreen.test.tsx`](../src/Mobile/src/__tests__/screens/auth/CadastroScreen.test.tsx)

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Role `VENDOR` | Campo CPF (`000.000.000-00`) exibido |
| Role `BUYER` | Campo CNPJ (`00.000.000/0001-00`) exibido |
| Campos obrigatórios vazios | `Alert` "Preencha os campos obrigatórios" |
| Submissão válida | `criarConta` chamado com os dados corretos |

---

##### [`src/__tests__/screens/auth/RecuperarSenhaScreen.test.tsx`](../src/Mobile/src/__tests__/screens/auth/RecuperarSenhaScreen.test.tsx)

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Renderização | Título, campo de e-mail e botão "Enviar código" visíveis |
| Campo vazio | `Alert` "Informe seu e-mail" |
| Envio bem-sucedido | `resetarSenha` chamado com o e-mail; mensagem de confirmação exibida |
| Falha na API | `Alert` com a mensagem de erro da API |

---

#### Telas — Comprador

##### [`src/__tests__/screens/comprador/HomeCompradorScreen.test.tsx`](../src/Mobile/src/__tests__/screens/comprador/HomeCompradorScreen.test.tsx)

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Saudação | Primeiro nome do comprador exibido ("Olá, Maria") |
| Badge de papel | "Comprador" visível |
| Sem produtos | "Nenhum produto disponível." |
| Estatísticas | Apenas produtos `AVAILABLE` contados |
| Lista de produtos | Produtos recentes exibidos |

---

##### [`src/__tests__/screens/comprador/BuscarProdutosScreen.test.tsx`](../src/Mobile/src/__tests__/screens/comprador/BuscarProdutosScreen.test.tsx)

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Produto carregado | Descrição do produto exibida |
| Sem produtos | "Nenhum produto encontrado." |
| Filtro por status | Apenas produtos `AVAILABLE` visíveis; `UNAVAILABLE` ocultos |
| Pressionar item | Navega para `DetalheProduto` com o produto selecionado |
| Buscar com filtro | `buscarProdutos` chamado com `{ vendorState: "MT" }` |

---

##### [`src/__tests__/screens/comprador/DetalheProdutoScreen.test.tsx`](../src/Mobile/src/__tests__/screens/comprador/DetalheProdutoScreen.test.tsx)

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Informações do produto | Nome e localização (cidade/estado) visíveis |
| Quantidade disponível | "300 un" exibido |
| Quantidade vazia | `Alert` "Informe uma quantidade válida" |
| Quantidade > disponível | `Alert` contendo o limite máximo ("300") |
| Envio válido | `criarPedido` chamado com `buyerAccountId` e `sellerAccountId` corretos |
| Pedido criado | Navega para `PropostaEnviada` com `{ produto, pedido }` |

---

##### [`src/__tests__/screens/comprador/MeusPedidosScreen.test.tsx`](../src/Mobile/src/__tests__/screens/comprador/MeusPedidosScreen.test.tsx)

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Sem pedidos | "Nenhum pedido ainda." |
| Lista de pedidos | Descrições dos itens visíveis |
| Pressionar pedido `COMPLETED` | Navega para `Avaliacoes` |
| Pressionar pedido `PENDING` | Navega para `ChatComprador` |
| Tag de status | Rótulo "Pendente" exibido via `Tag` |

---

##### [`src/__tests__/screens/comprador/AvaliacoesScreen.test.tsx`](../src/Mobile/src/__tests__/screens/comprador/AvaliacoesScreen.test.tsx)

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Seções de avaliação | "Avaliar produto", "Avaliar vendedor" e botão "Enviar avaliações" visíveis |
| 10 estrelas | 5 para produto + 5 para vendedor (padrão: todas preenchidas) |
| Envio | `criarAvaliacaoProduto` e `criarAvaliacaoConta` chamados com `stars: 5` e `reviewerAccountId` corretos |
| Após envio | `goBack` chamado |

---

##### [`src/__tests__/screens/comprador/PropostaEnviadaScreen.test.tsx`](../src/Mobile/src/__tests__/screens/comprador/PropostaEnviadaScreen.test.tsx)

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Mensagem de sucesso | "Proposta enviada!" e descrição exibidas |
| Resumo do produto | Nome e cidade do produto visíveis |
| "Ver meus pedidos" | Navega para `Pedidos > MeusPedidos` |
| "Buscar outros produtos" | Navega para `Produtos > BuscarProdutos` |

---

##### [`src/__tests__/screens/comprador/ChatCompradorScreen.test.tsx`](../src/Mobile/src/__tests__/screens/comprador/ChatCompradorScreen.test.tsx)

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Detalhes do pedido | Descrição dos itens visível |
| Nome do vendedor | "Vendedor: Carlos Vendedor" após carregamento |
| Botão de chat | "Abrir chat com o vendedor" visível |
| Pressionar botão | `criarOuBuscarChat` chamado; navega para `ChatDetail` com `chatId`, `myAccountId` e `theme: "comprador"` |

---

##### [`src/__tests__/screens/comprador/PerfilCompradorScreen.test.tsx`](../src/Mobile/src/__tests__/screens/comprador/PerfilCompradorScreen.test.tsx)

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Título | "Perfil do comprador" visível |
| Badge | "Comprador(a)" visível |
| Carregamento | `buscarContaPorUsuario` chamado com o `userId` da sessão |
| Formulário preenchido | Campos com nome, rua e estado vindos da API |
| Avatar — sem foto | Iniciais do nome ("JS") exibidas |
| Avatar — com foto | Iniciais ocultadas; `buscarArquivosPorEntidade("PROFILE", accountId)` chamado |
| E-mail | E-mail da sessão exibido no campo |
| Nome empresarial | `businessName` exibido |
| Sem sessão | `buscarContaPorUsuario` não chamado |
| Salvar com sucesso | `atualizarConta` chamado; `Alert` "Perfil atualizado!"; sessão atualizada com `setSession` |
| Erro com `message` | `Alert` com a mensagem da API |
| Erro sem `message` | `Alert` "Não foi possível salvar" |
| Sair | `logout` chamado |
| CNPJ desabilitado | `editable: false` quando CPF está preenchido |

---

#### Telas — Produtor

##### [`src/__tests__/screens/produtor/HomeProdutorScreen.test.tsx`](../src/Mobile/src/__tests__/screens/produtor/HomeProdutorScreen.test.tsx)

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Saudação | Primeiro nome do produtor ("Olá, João") |
| Sem avaliações | Média "0.0" exibida |
| Sem produtos | "Nenhum produto ainda. Adicione seu primeiro produto!" |
| Lista de produtos | Produtos da API exibidos |
| Cálculo de média | Média correta para avaliações `[4, 2]` = "3.0" |
| Estatísticas | Apenas produtos `AVAILABLE` contados |

---

##### [`src/__tests__/screens/produtor/MeusProdutosScreen.test.tsx`](../src/Mobile/src/__tests__/screens/produtor/MeusProdutosScreen.test.tsx)

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Sem produtos | "Nenhum produto cadastrado." |
| Lista de produtos | Produto exibido com descrição |
| Botão "Desativar" | `desativarProduto` chamado quando status é `AVAILABLE` |
| Botão "Ativar" | `ativarProduto` chamado quando status é `UNAVAILABLE` |
| Botão "+ Adicionar" | Navega para `NovoProduto` |

---

##### [`src/__tests__/screens/produtor/MinhasVendasScreen.test.tsx`](../src/Mobile/src/__tests__/screens/produtor/MinhasVendasScreen.test.tsx)

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Sem vendas | "Nenhuma venda ainda." |
| Lista de vendas | Itens dos pedidos exibidos |
| Pressionar pedido | Navega para `DetalheVenda` com o pedido |
| Link "Propostas →" | Navega para `PropostasRecebidas` |

---

##### [`src/__tests__/screens/produtor/PropostasRecebidasScreen.test.tsx`](../src/Mobile/src/__tests__/screens/produtor/PropostasRecebidasScreen.test.tsx)

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Sem propostas | "Nenhuma proposta pendente." |
| Lista de propostas | Itens `PENDING` exibidos |
| Aceitar proposta | `atualizarStatusPedido` chamado com `status: ACCEPTED` |
| Após aceitar | Proposta removida da lista |
| Filtro | Apenas pedidos `PENDING` exibidos; `ACCEPTED` ocultos |

---

##### [`src/__tests__/screens/produtor/DetalheVendaScreen.test.tsx`](../src/Mobile/src/__tests__/screens/produtor/DetalheVendaScreen.test.tsx)

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Informações do pedido | Título, itens e nome do comprador visíveis |
| Pedido `PENDING` | Botões "Aceitar proposta" e "Recusar proposta" visíveis |
| Pedido `ACCEPTED` | Botão "Finalizar venda" visível; botões de `PENDING` ausentes |
| Aceitar | `atualizarStatusPedido` chamado com `ACCEPTED` |
| Pressionar "Recusar proposta" | Modal de confirmação exibido |
| Cancelar no modal | Modal fechado; API não chamada |
| Confirmar recusa | `atualizarStatusPedido` chamado com `CANCELLED`; modal fechado |

---

##### [`src/__tests__/screens/produtor/PerfilProdutorScreen.test.tsx`](../src/Mobile/src/__tests__/screens/produtor/PerfilProdutorScreen.test.tsx)

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Título | "Meu Perfil" visível |
| Badge | "Produtor rural" visível |
| Formulário | Nome, nome empresarial, cidade e estado preenchidos via API |
| Carregamento | `buscarContaPorUsuario` chamado com `userId` da sessão |
| Foto de perfil | `buscarArquivosPorEntidade("PROFILE", accountId)` chamado |
| Avatar — sem foto | Iniciais "JS" exibidas |
| Avatar — com foto | Iniciais "JS" ocultadas |
| E-mail | Exibido e não editável |
| Máscara CPF | Entrada `12345678900` formatada como `123.456.789-00` |
| Máscara CEP | Entrada `04538133` formatada como `04538-133` |
| CPF desabilitado | `editable: false` quando CNPJ está preenchido |
| CNPJ desabilitado | `editable: false` quando CPF está preenchido |
| Salvar | `atualizarConta` chamado com dados corretos; `Alert` "Perfil atualizado!"; sessão atualizada com `setSession` |
| Erro com `message` | `Alert` com a mensagem da API |
| Erro sem `message` | `Alert` "Não foi possível salvar" |
| Sair | `logout` chamado |
| Sem sessão | `atualizarConta` não chamado |
| Seções do formulário | "Dados da conta" e "Endereço" visíveis |

---

#### Telas — Compartilhadas

##### [`src/__tests__/screens/shared/ChatsListScreen.test.tsx`](../src/Mobile/src/__tests__/screens/shared/ChatsListScreen.test.tsx)

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Título | "Conversas" visível |
| Sem conversas | "Nenhuma conversa encontrada." |
| Falha na API | "Não foi possível carregar as conversas." e botão "Tentar novamente" |
| Lista de chats | Primeiro nome do outro participante exibido |
| Pressionar chat | Navega para `ChatDetail` com `chatId`, `myAccountId` e `theme` |
| Preview | Conteúdo da última mensagem exibido |

---

##### [`src/__tests__/screens/shared/ChatDetailScreen.test.tsx`](../src/Mobile/src/__tests__/screens/shared/ChatDetailScreen.test.tsx)

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Cabeçalho | "Chat" visível |
| Sem mensagens | "Nenhuma mensagem ainda. Inicie a conversa!" |
| Com mensagens | Conteúdo das mensagens exibido |
| Enviar texto vazio | `enviarMensagem` não chamado |
| Enviar texto válido | `enviarMensagem` chamado com `chatId`, `accountId` e `content` |
| Após envio | Mensagem adicionada à lista |
| Campo limpo | Campo de texto zerado após envio |

---

#### Telas — Admin

##### [`src/__tests__/screens/admin/AdminHomeScreen.test.tsx`](../src/Mobile/src/__tests__/screens/admin/AdminHomeScreen.test.tsx)

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Título e badge | "Painel Admin" e badge "ADMIN" visíveis |
| Labels de estatísticas | "Usuários", "Produtos" e "Pedidos" presentes |
| Valores de estatísticas | 2 usuários, 1 produto, 3 pedidos exibidos corretamente |
| Botão "Sair" | Visível |
| Pressionar "Sair" | `Alert` de confirmação de sessão exibido |
| Seções | "RESUMO GERAL" e "RELATÓRIOS" visíveis após carregamento |

---

##### [`src/__tests__/screens/admin/PedidosAdminScreen.test.tsx`](../src/Mobile/src/__tests__/screens/admin/PedidosAdminScreen.test.tsx)

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Título e badge | "Pedidos" e badge "ADMIN" visíveis |
| Sem pedidos | "Nenhum pedido encontrado." |
| Lista de pedidos | Descrição do item e valor total formatado exibidos |
| Tag `PENDING` | Rótulo "Pendente" |
| Tag `ACCEPTED` | Rótulo "Aceito" |
| Múltiplos pedidos | Todos os itens da lista visíveis |

---

##### [`src/__tests__/screens/admin/ProdutosAdminScreen.test.tsx`](../src/Mobile/src/__tests__/screens/admin/ProdutosAdminScreen.test.tsx)

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Título e badge | "Produtos" e badge "ADMIN" visíveis |
| Sem produtos | "Nenhum produto cadastrado." |
| Lista de produtos | Descrição e categoria exibidas |
| Estado do vendedor | UF do vendedor visível |
| Remover produto | `deletarProduto` chamado ao confirmar; produto removido da lista |

---

##### [`src/__tests__/screens/admin/UsuariosAdminScreen.test.tsx`](../src/Mobile/src/__tests__/screens/admin/UsuariosAdminScreen.test.tsx)

| Caso de teste | Comportamento esperado |
|:-------------:|:----------------------:|
| Título e badge | "Usuários" e badge "ADMIN" visíveis |
| Sem usuários | "Nenhum usuário encontrado." |
| E-mail do usuário | Exibido na lista |
| Badge admin | "Admin" para `isAdmin=true` |
| Badge usuário | "Usuário" para `isAdmin=false` |
| Sem ações para admin | Botões "Desativar"/"Ativar" ocultos para administradores |
| Ações para usuário comum | "Desativar" e "Ativar" visíveis |
| Pressionar "Desativar" | `Alert` com e-mail do usuário |
| Confirmar desativação | `desativarUsuario` chamado com o `id` correto |
