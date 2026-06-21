# Registro de testes de sistema

<!-- <span style="color:red">Pré-requisitos: <a href="02-Especificação do Projeto.md"> Especificação do Projeto</a></span>, <a href="07-Programação de Funcionalidades.md"> Programação de Funcionalidades</a>, <a href="09-Registro de Testes de Integração.md"> Testes de Integração</a> -->

## O que são testes de sistema?

Testes de sistema validam o comportamento completo da aplicação em um ambiente próximo ao de produção, exercitando todos os microsserviços em conjunto — do gateway ao banco de dados. Diferentemente dos testes de integração, que testam um microsserviço por vez, os testes de sistema verificam fluxos de ponta a ponta (end-to-end), como o ciclo completo de criação de conta → login → cadastro de produto → realização de pedido.

## Por que são importantes?

- Garantem que os requisitos funcionais são atendidos pelo sistema como um todo
- Detectam falhas de contrato entre microsserviços que testes isolados não revelam
- Validam o roteamento e a autenticação JWT no `elogateway` em cenários reais
- Servem como evidência de conformidade com os requisitos para fins de entrega

## Ferramentas e bibliotecas

| Ferramenta | Finalidade |
| ---------- | ---------- |
| **REST Assured** | Biblioteca Java para testes E2E via HTTP — sintaxe fluente `given/when/then` para requisições REST |
| **Testcontainers** | Orquestra todos os microsserviços e o MongoDB em containers Docker durante os testes |
| **Docker Compose** | Alternativa ao Testcontainers para subir o ambiente completo antes da suíte de testes |
| **JUnit 5** | Framework de execução dos testes |
| **AssertJ** | Asserções sobre o corpo das respostas já desserializadas |

## Dependências necessárias

Crie um módulo Gradle separado (ex: `system-tests`) para isolar os testes de sistema do código de produção:

```groovy
// system-tests/build.gradle
dependencies {
    testImplementation 'io.rest-assured:rest-assured:5.x'
    testImplementation 'io.rest-assured:json-path:5.x'
    testImplementation 'org.junit.jupiter:junit-jupiter:5.x'
    testImplementation 'org.testcontainers:junit-jupiter'
    testImplementation 'org.testcontainers:mongodb'
    testImplementation 'org.assertj:assertj-core:3.x'
}
```

## Configuração do ambiente

### Abordagem 1 — Docker Compose (recomendada para execução local)

Suba todos os microsserviços com o `docker-compose.yml` existente no projeto antes de executar os testes:

```bash
# Raiz do projeto
docker compose up -d

# Execute os testes de sistema
./gradlew :system-tests:test

# Derrube o ambiente
docker compose down
```

### Abordagem 2 — Testcontainers com Docker Compose no JUnit

Para execução automática em CI, o Testcontainers pode subir o `docker-compose.yml` como parte da suíte:

```java
@Testcontainers
public abstract class SystemTestBase {

    @Container
    static DockerComposeContainer<?> environment =
        new DockerComposeContainer<>(new File("../../docker-compose.yml"))
            .withExposedService("elogateway", 8090,
                Wait.forHttp("/actuator/health").forStatusCode(200))
            .withExposedService("auth-service", 8081,
                Wait.forHttp("/actuator/health").forStatusCode(200))
            .withLocalCompose(true);

    protected static String gatewayUrl() {
        return "http://" + environment.getServiceHost("elogateway", 8090)
             + ":" + environment.getServicePort("elogateway", 8090);
    }
}
```

### Estrutura de diretórios

```
system-tests/
└── src/
    └── test/
        └── java/
            └── com/elocampo/systemtest/
                ├── SystemTestBase.java          ← configuração base
                ├── auth/
                │   └── AuthFlowST.java          ← fluxo de autenticação
                ├── product/
                │   └── ProductFlowST.java       ← fluxo de produtos
                ├── order/
                │   └── OrderFlowST.java         ← fluxo de pedidos
                └── chat/
                    └── ChatFlowST.java          ← fluxo de chat
```

## Exemplo de teste de sistema

O exemplo abaixo testa o fluxo completo de criação de conta e login usando REST Assured contra o `elogateway` real:

```java
class AuthFlowST extends SystemTestBase {

    @Test
    void completeSignupAndLoginFlow() {

        // 1. Cria as credenciais no auth-service
        var userId = given()
            .baseUri(gatewayUrl())
            .contentType(ContentType.JSON)
            .body("""
                {"email": "joao@example.com", "password": "Senha@123", "admin": false}
                """)
        .when()
            .post("/auth/users")
        .then()
            .statusCode(201)
            .extract().jsonPath().getUUID("id");

        // 2. Cria o perfil de conta no account-service
        given()
            .baseUri(gatewayUrl())
            .contentType(ContentType.JSON)
            .body(buildAccountPayload(userId))
        .when()
            .post("/accounts")
        .then()
            .statusCode(201)
            .body("name", equalTo("João Silva"))
            .body("role", equalTo("BUYER"));

        // 3. Realiza o login e obtém o JWT
        var token = given()
            .baseUri(gatewayUrl())
            .contentType(ContentType.JSON)
            .body("""
                {"email": "joao@example.com", "password": "Senha@123"}
                """)
        .when()
            .post("/auth/tokens")
        .then()
            .statusCode(200)
            .body("token", notNullValue())
            .extract().jsonPath().getString("token");

        // 4. Acessa um endpoint protegido com o token obtido
        given()
            .baseUri(gatewayUrl())
            .header("Authorization", "Bearer " + token)
        .when()
            .get("/accounts/user/" + userId)
        .then()
            .statusCode(200)
            .body("name", equalTo("João Silva"));
    }
}
```

**Convenções adotadas:**

- Classes de testes de sistema usam o sufixo `ST` para diferenciá-las de testes unitários (`Test`) e de integração (`IT`)
- Cada fluxo de negócio tem sua própria classe, facilitando a leitura como documentação executável
- As chamadas passam obrigatoriamente pelo `elogateway` — nunca direto ao microsserviço — para validar autenticação e roteamento

## Como executar

```bash
# Requer Docker em execução

# Sobe o ambiente e executa os testes de sistema
docker compose up -d && ./gradlew :system-tests:test

# Apenas os testes de sistema (sufixo ST)
./gradlew :system-tests:test --tests "*ST"
```

## Registro de testes de sistema planejados

Os testes de sistema ainda não foram implementados no projeto. A tabela abaixo registra o planejamento de cobertura por fluxo de negócio, alinhado aos requisitos funcionais:

| ID     | Fluxo | Classe Planejada | Cenários |
| ------ | ----- | ---------------- | -------- |
| RF-001 / RF-002 | Cadastro e login | `AuthFlowST` | Cadastro com CPF, cadastro com CNPJ, login válido, login com senha errada, login com e-mail inexistente |
| RF-003 | Recuperação de senha | `PasswordResetFlowST` | Solicitação de reset, tentativa com e-mail não cadastrado |
| RF-004 / RF-005 | Gestão de produtos | `ProductFlowST` | Cadastro de produto por VENDOR, edição, remoção lógica, tentativa por BUYER |
| RF-006 | Pesquisa de produtos | `ProductSearchFlowST` | Busca por categoria, por cidade, por descrição, sem resultados |
| RF-008 / RF-009 / RF-010 | Pedidos | `OrderFlowST` | Criação de pedido, aceitação pelo vendedor, acompanhamento pelo comprador, tentativa por VENDOR |
| RF-011 | Chat | `ChatFlowST` | Criação de conversa, envio de mensagem, histórico |
| RF-014 | Administração | `AdminFlowST` | Desativação de conta, reativação, acesso negado sem papel de admin |
