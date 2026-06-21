# `message-service`

## Sobre esta aplicação

O `message-service` é a aplicação responsável pelo envio de emails transacionais na plataforma, com integração ao Brevo via SMTP.

## Pré-requisitos

Para trabalhar nesta aplicação, você precisa estar familiarizado com as seguintes tecnologias:

* **Java 25**;
* **Spring Framework**;
* **Protocolo HTTP**;
* **Padrão RESTful**.

## Estrutura da aplicação

A aplicação é estruturada seguindo um racional. Na raiz do projeto, temos dois pacotes:

* `message-service-contract`: aqui, temos classes comuns, que serão utilizadas dentro da implementação, mas que também podem
  ser exportadas e importadas em outros projetos que queiram utilizar a API disponibilizada pelo `message-service`. Fazemos isso
  para poder versionalizar o contrato e permitir reuso;
* `message-service-impl`: neste pacote, está a implementação de fato da aplicação, assim como seus testes unitários e de integração.

### O pacote de contrato

O pacote de contrato (`message-service-contract`) é subdividido em domínios, e tem código utilizado dentro e fora da aplicação,
permitindo requisições REST.

### O pacote de implementação

Neste pacote temos a implementação de fato, também dividida em seus respectivos domínios, `chat` e `email`.

Veja a seguir os pacotes e suas responsabilidades:

* `config`: aqui estão configurações da aplicação, que vão desde o mapeamento de exceções até as configurações de segurança e de clientes externos. Toda configuração
  da aplicação que deva ser feita na sua inicialização deve estar aqui;
* `contract`: aqui temos as classes de contrato exclusivas da implementação que não são exportadas;
* `email`: domínio de email, responsável pelo envio de emails transacionais via Brevo;
    - `controller`: classe que define o endpoint de envio de email, com os mapeamentos dentro da semântica HTTP;
    - `service`: interface e implementação concreta do serviço de envio de email via SMTP;
* `util`: classes utilitárias gerais disponíveis globalmente, dentro da aplicação.

## Executando a aplicação localmente

Para começar, você precisa ter o Docker instalado em sua máquina (respeitando seu sistema operacional), e um `docker-compose.yml` que
descreva as dependências da aplicação. Crie em seu computador, em um local de fácil acesso, um arquivo `docker-compose.yml`, com o seguinte conteúdo:

```yaml
services:

  mongo:
    image: mongo
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: admin12345
      MONGO_INITDB_DATABASE: database
    ports:
      - "27017:27017"
    volumes:
      - ./data:/data/db
    
  redis:
    image: redis
    ports:
      - "6379:6379"
    environment:
      - REDIS_PASSWORD=rpasswd
    networks:
      - elocampo_local
    volumes:
      - redis_data:/bitnami/redis/data
    restart: unless-stopped
    
  kafka:
    image: apache/kafka:latest
    ports:
      - 9092:9092
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: 'CONTROLLER:PLAINTEXT,DOCKER:PLAINTEXT,LOCAL:PLAINTEXT'
      KAFKA_PROCESS_ROLES: 'broker,controller'
      KAFKA_ADVERTISED_LISTENERS: LOCAL://localhost:9092,DOCKER://kafka:29092
      KAFKA_LISTENERS: DOCKER://0.0.0.0:29092,CONTROLLER://0.0.0.0:29093,LOCAL://0.0.0.0:9092
      KAFKA_CONTROLLER_QUORUM_VOTERS: '1@kafka:29093'
      KAFKA_INTER_BROKER_LISTENER_NAME: 'DOCKER'
      KAFKA_CONTROLLER_LISTENER_NAMES: 'CONTROLLER'
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: true
      CLUSTER_ID: 'MkU3OEVBNTcwNTJENDM2Qk'
      
networks:
  elocampo_local:
    driver: bridge

volumes:
  redis_data:
  mongodb_data:
```

Pronto! Agora você deve subir os contêiners com as dependências, utilizando, no terminal:

```shell
docker compose up
``` 

> Lembre-se de estar no mesmo diretório do `docker-compose.yml`.

Para finalizar os contêiners, utilize, no terminal:

```shell
docker compose down
```

Para executar a aplicação localmente, você deve definir o profile. O Spring trabalha com diferentes profiles para diferentes
ambientes onde a aplicação possa estar hospedada. Localmente, usamos o profile `local`.
Na task `ChatServiceApplication` do Gradle, adicione no campo `Run` o argumento a seguir:

```shell
--args='--spring.profiles.active=local'
```

> Caso tenha o IntelliJ Ultimate, nas configurações de execução, passe o profile local.

## Variáveis de ambiente

O domínio de email requer as seguintes variáveis de ambiente para o envio via Brevo:

| Variável              | Descrição                                      |
|-----------------------|------------------------------------------------|
| `BREVO_SMTP_USERNAME` | Usuário SMTP fornecido pelo Brevo              |
| `BREVO_SMTP_PASSWORD` | Senha SMTP fornecida pelo Brevo                |
| `EMAIL_FROM`          | Endereço de email remetente (ex: `noreply@elocampo.com.br`) |

Para ambiente local, defina esses valores diretamente no `application-local.yml`.

## Gerar contratos localmente

As aplicações realizam comunicação síncrona, via endpoints REST. Para isso, se utilizam das classes de contrato umas das outras.
Você deve gerar os contratos manualmente, que serão exportados para um diretório comum. Desta forma, as aplicações poderão importar
o contrato umas das outras.

Para gerar os contratos localmente para importação entre as aplicações, use:

```shell
./gradlew :message-service-contract:publishToMavenLocal
``` 
