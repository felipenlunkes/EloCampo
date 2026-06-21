# Registro de testes de integração

<!-- <span style="color:red">Pré-requisitos: <a href="02-Especificação do Projeto.md"> Especificação do Projeto</a></span>, <a href="07-Programação de Funcionalidades.md"> Programação de Funcionalidades</a>, <a href="08-Registro de Testes Unitários.md"> Testes Unitários</a> -->

## O que são testes de integração?

Testes de integração verificam se diferentes componentes do sistema funcionam corretamente quando combinados. Enquanto os testes unitários isolam uma classe usando mocks, os testes de integração exercitam o fluxo real: controller → service → repositório → banco de dados. Também cobrem a comunicação entre microsserviços.

## Por que são importantes?

- Detectam problemas que só aparecem quando os componentes interagem (mapeamento de entidades, queries reais, serialização JSON)
- Validam a configuração de segurança (`SecurityConfig`) e o roteamento do gateway
- Garantem que a comunicação entre microsserviços via Feign está correta
- Expõem falhas de schema que testes unitários com mocks jamais revelariam

## Ferramentas e bibliotecas

| Ferramenta | Finalidade |
| ---------- | ---------- |
| **Spring Boot Test** (`@SpringBootTest`) | Sobe o contexto completo da aplicação para os testes |
| **MockMvc** (`@AutoConfigureMockMvc`) | Simula requisições HTTP sem precisar de um servidor em execução |
| **Testcontainers** | Sobe instâncias reais do MongoDB em container Docker durante os testes |
| **WireMock** | Simula respostas de microsserviços externos chamados via Feign |
| **AssertJ** | Asserções fluentes sobre o resultado das requisições |
| **JUnit 5** | Framework base para execução dos testes |

## Dependências necessárias

Para escrever testes de integração nos módulos `*-impl`, adicione as seguintes dependências ao `build.gradle` de cada microsserviço:

```groovy
testImplementation 'org.springframework.boot:spring-boot-starter-test'
testImplementation 'org.testcontainers:junit-jupiter'
testImplementation 'org.testcontainers:mongodb'
testImplementation 'org.wiremock:wiremock-standalone:3.x'
```

## Configuração do ambiente

### 1. Testcontainers com MongoDB

O Testcontainers inicia um container MongoDB real antes dos testes e o destrói ao final. Isso elimina a necessidade de um banco de dados externo e garante isolamento entre execuções.

Crie uma classe base anotada que todos os testes de integração podem herdar:

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
public abstract class IntegrationTestBase {

    @Container
    static MongoDBContainer mongoDBContainer =
        new MongoDBContainer("mongo:7.0").withReuse(true);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.mongodb.uri", mongoDBContainer::getReplicaSetUrl);
    }
}
```

### 2. WireMock para clientes Feign

Quando um microsserviço chama outro via Feign (por exemplo, o `account-service` chamando o `auth-service`), o WireMock intercepta essa chamada e retorna uma resposta simulada, sem precisar que o serviço externo esteja rodando.

```java
@WireMockTest(httpPort = 8080)
class AccountServiceIntegrationTest extends IntegrationTestBase {

    @BeforeEach
    void stubAuthService() {
        stubFor(get(urlEqualTo("/users/" + userId))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("""
                    {"id": "%s", "email": "test@example.com", "isAdmin": false}
                    """.formatted(userId))));
    }
}
```

### 3. Estrutura de diretórios

Os testes de integração ficam no mesmo source set de testes (`src/test/java`) que os testes unitários, diferenciados pelo sufixo `IT` no nome da classe:

```
account-service-impl/
└── src/
    └── test/
        └── java/
            └── com/elocampo/accountservice/
                ├── account/
                │   ├── service/
                │   │   └── AccountServiceImplTest.java     ← unitário
                │   └── controller/
                │       ├── AccountControllerTest.java      ← unitário
                │       └── AccountControllerIT.java        ← integração
                └── IntegrationTestBase.java
```

## Exemplo de teste de integração

O exemplo abaixo testa o endpoint `POST /accounts` do `account-service` com uma requisição HTTP real, banco MongoDB em container e o `auth-service` simulado pelo WireMock:

```java
@WireMockTest(httpPort = 9090)
class AccountControllerIT extends IntegrationTestBase {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AccountRepository accountRepository;

    private UUID userId;

    @BeforeEach
    void setUp() {
        accountRepository.deleteAll();                          // (1) estado limpo
        userId = UUID.randomUUID();

        stubFor(get(urlEqualTo("/users/" + userId))            // (2) simula auth-service
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("""
                    {"id":"%s","email":"test@example.com","isAdmin":false}
                    """.formatted(userId))));
    }

    @Test
    void createAccountShouldReturn201AndPersistInDatabase() throws Exception {

        var input = buildValidInput(userId);                   // (3) monta o payload

        mockMvc.perform(post("/accounts")                      // (4) requisição HTTP
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(input)))
            .andExpect(status().isCreated())                   // (5) verifica HTTP 201
            .andExpect(jsonPath("$.name").value("João Silva"))
            .andExpect(jsonPath("$.role").value("BUYER"));

        assertThat(accountRepository.count()).isEqualTo(1);    // (6) verifica banco
    }

    @Test
    void createAccountShouldReturn422WhenCpfAlreadyExists() throws Exception {

        // persiste uma conta com o mesmo CPF previamente
        accountRepository.save(existingAccountWithCpf("123.456.789-00"));

        var input = buildValidInput(userId);

        mockMvc.perform(post("/accounts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(input)))
            .andExpect(status().isUnprocessableEntity());
    }
}
```

**Explicação dos pontos numerados:**

1. `accountRepository.deleteAll()` — limpa o banco antes de cada teste para evitar interferência entre casos
2. `stubFor(...)` — configura o WireMock para responder ao Feign client que chama o `auth-service`
3. Monta o objeto de entrada equivalente ao corpo da requisição
4. `mockMvc.perform(post(...))` — executa a requisição HTTP real contra o controller
5. `andExpect(status().isCreated())` — verifica o código HTTP e o corpo JSON da resposta
6. `accountRepository.count()` — verifica diretamente no MongoDB se o registro foi persistido

## Como Executar os testes de integração

Os testes de integração requerem que o **Docker** esteja rodando para que o Testcontainers possa iniciar o container MongoDB.

```bash
# Dentro do módulo *-impl
./gradlew test

# Apenas os testes de integração (sufixo IT)
./gradlew test --tests "*IT"

# Apenas os testes unitários
./gradlew test --tests "*Test"
```

> **Atenção:** Os testes de integração são significativamente mais lentos que os unitários por envolverem containers Docker e contexto Spring completo. Recomenda-se mantê-los em pipelines de CI separados ou configurar o Gradle para executá-los sob demanda.

## Testes de integração por microsserviço

Os testes de integração ainda não foram implementados no projeto. A tabela abaixo registra o planejamento de cobertura para cada microsserviço, seguindo a mesma estrutura dos testes unitários já existentes:

| Microsserviço | Classe Planejada | Endpoints / Fluxos a Cobrir |
| ------------- | ---------------- | --------------------------- |
| `auth-service` | `UserControllerIT` | `POST /users`, `GET /users/{id}`, `PATCH /users/{id}/activate`, `DELETE /users/{id}` |
| `auth-service` | `TokenControllerIT` | `POST /tokens` (credenciais válidas e inválidas), `GET /tokens/validate` |
| `account-service` | `AccountControllerIT` | `POST /accounts` (CPF e CNPJ), `PUT /accounts/{id}`, `GET /accounts/{id}`, duplicidade de CPF/CNPJ |
| `product-service` | `ProductControllerIT` | `POST /products` (validação de papel VENDOR), `PUT /products/{id}`, `GET /products/filter` com filtros |
| `order-service` | `OrderControllerIT` | `POST /orders` com cálculo de total, `PATCH /orders/{id}/status` |
| `message-service` | `EmailControllerIT` | `POST /emails` com SMTP mockado |
| `chat-service` | `ChatControllerIT` | `POST /chats`, `POST /chats/{id}/messages`, `GET /chats/{id}` |
| `elogateway` | `JwtFilterIT` | Roteamento com token válido, rejeição sem token, rejeição com token expirado |
