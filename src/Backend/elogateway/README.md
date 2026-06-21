# `elogateway`

## Sobre esta aplicação

O `elogateway` é o gateway central da plataforma, responsável por receber todas as requisições externas e roteá-las
para os serviços internos corretos. Além do roteamento, ele realiza a validação do token JWT em todas as requisições
que exigem autenticação, garantindo que os serviços internos não precisem se preocupar com essa responsabilidade.

## Pré-requisitos

Para trabalhar nesta aplicação, você precisa estar familiarizado com as seguintes tecnologias:

* **Java 25**;
* **Spring Framework**;
* **Spring Cloud Gateway (MVC)**;
* **Spring Security**;
* **Protocolo HTTP**;
* **Padrão RESTful**.

## Estrutura da aplicação

A aplicação é estruturada de forma simples, com dois pacotes principais dentro de `elogateway`:

* `config`: configurações da aplicação, incluindo a leitura das propriedades do token JWT (`JwtProperties`) e
  a configuração da cadeia de segurança (`SecurityConfig`);
* `filter`: contém o filtro de validação JWT (`JwtFilter`), que intercepta todas as requisições, valida o token
  quando necessário, e injeta informações do usuário autenticado como headers para os serviços downstream.

## Roteamento

O gateway roteia as requisições com base no caminho da URL. A tabela abaixo descreve as rotas configuradas:

| Prefixo                         | Serviço           | Porta |
|---------------------------------|-------------------|-------|
| `/rest/v1/auth/**`, `/rest/v1/token` | `auth-service`    | 8080  |
| `/rest/v1/account/**`           | `account-service` | 8081  |
| `/rest/v1/product/**`           | `product-service` | 8082  |
| `/rest/v1/order/**`             | `order-service`   | 8083  |
| `/rest/v1/file/**`              | `file-service`    | 8084  |

O gateway expõe todos os serviços na porta **8090**.

## Autenticação e autorização

Todas as requisições passam pelo `JwtFilter`, que verifica a presença e validade do header `Authorization: Bearer <token>`.
Endpoints públicos (configurados em `token.public-endpoints` no `application.yaml`) são liberados sem validação.
Qualquer outro endpoint exige um token JWT válido — caso contrário, a requisição é rejeitada com `401 Unauthorized`.

### Endpoints públicos

Por padrão, os seguintes endpoints não exigem token:

| Método | Caminho             | Descrição                        |
|--------|---------------------|----------------------------------|
| `POST` | `/rest/v1/token`    | Geração de token de autenticação |
| `POST` | `/rest/v1/auth`     | Cadastro de usuário              |
| `POST` | `/rest/v1/account`  | Cadastro de conta                |

Para adicionar ou remover um endpoint público, edite `token.public-endpoints` no `application.yaml`:

```yaml
token:
  public-endpoints:
    - method: POST
      path: /rest/v1/token
    - method: POST
      path: /rest/v1/auth
    - method: POST
      path: /rest/v1/account
```

### Headers injetados nos serviços internos

Quando um token válido é apresentado, o gateway injeta automaticamente as seguintes informações como headers
nas requisições encaminhadas aos serviços internos:

| Header          | Conteúdo                         |
|-----------------|----------------------------------|
| `X-User-Id`     | Id do usuário autenticado        |
| `X-User-Email`  | Email do usuário autenticado     |
| `X-User-Admin`  | Se o usuário possui perfil admin |

## Fluxo de uma requisição

```
Cliente
  │
  │  HTTP Request (porta 8090)
  ▼
elogateway
  │
  ├─► JwtFilter
  │     │
  │     ├─ Sem header Authorization?
  │     │     └─► Deixa passar (Spring Security bloqueia se o endpoint for protegido → HTTP 401 Unauthorized)
  │     │
  │     ├─ Header presente e token válido?
  │     │     ├─ Registra o usuário no SecurityContextHolder
  │     │     └─► Cria UserHeaderRequestWrapper com X-User-Id, X-User-Email, X-User-Admin
  │     │
  │     └─ Token inválido ou expirado?
  │           └─► Limpa o contexto (Spring Security bloqueia se o endpoint for protegido → 401)
  │
  ├─► SecurityConfig (avalia se o endpoint exige autenticação)
  │     ├─ Endpoint público (token.public-endpoints) → permite
  │     └─ Qualquer outro endpoint sem autenticação → HTTP 401 Unauthorized
  │
  └─► Spring Cloud Gateway (roteamento por prefixo de URL - ip do serviço e porta configurados)
        └─► Serviço interno (auth-service, account-service, product-service, order-service, file-service, message-service, etc)
              │
              │  Recebe os headers X-User-* injetados pelo gateway (não precisa validar o token novamente)
              │  
              ▼
            Resposta retorna ao cliente
```

## Executando a aplicação localmente

Para começar, você precisa ter o Docker instalado em sua máquina e subir as dependências da plataforma com o
`docker-compose.yml` disponível na raiz do diretório `Backend`:

```shell
docker compose up
```

> Lembre-se de estar no mesmo diretório do `docker-compose.yml`.

Para finalizar os contêiners, utilize:

```shell
docker compose down
```

Para executar o gateway localmente, defina o profile `local`. Na task `ElogatewayApplication` do Gradle,
adicione no campo `Run` o argumento a seguir:

```shell
--args='--spring.profiles.active=local'
```

> Caso tenha o IntelliJ Ultimate, nas configurações de execução, passe o profile local.

Com o gateway em execução, todas as requisições devem ser feitas para `http://localhost:8090`.
