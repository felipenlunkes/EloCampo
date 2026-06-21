# `file-service`

## Sobre esta aplicação

O `file-service` é a aplicação responsável pelo upload e armazenamento de arquivos de imagem na plataforma.
Ele recebe a imagem enviada pelo cliente, valida o conteúdo binário do arquivo, faz o upload para o
[Cloudinary](https://cloudinary.com) (CDN de imagens) e retorna a URL pública permanente da imagem. Essa
URL é então armazenada pelo serviço que precisar dela — por exemplo, o `product-service` a guarda no
campo `imageUrls` de um produto.

## Pré-requisitos

Para trabalhar nesta aplicação, você precisa estar familiarizado com as seguintes tecnologias:

* **Java 25**;
* **Spring Framework**;
* **Upload de arquivos com `multipart/form-data`**;
* **Cloudinary SDK para Java**;
* **Protocolo HTTP**;
* **Padrão RESTful**.

## Estrutura da aplicação

A aplicação segue o mesmo padrão dos demais serviços do projeto. Na raiz, temos dois módulos:

* `file-service-contract`: DTO de resposta do upload (`FileUploadResponse`), utilizado internamente
  pelo módulo de implementação para tipagem da resposta da API;
* `file-service-impl`: a implementação de fato da aplicação Spring Boot.

### O módulo de contrato

Contém apenas o DTO de resposta do upload:

* `file/FileUploadResponse`: retornado após um upload bem-sucedido, com os campos `id`, `publicId`,
  `url`, `secureUrl`, `format`, `size`, `entityType`, `entityId`, `uploadedBy` e `uploadedAt`;
* `file/FileEntityType`: enum que indica a qual tipo de entidade o arquivo pertence — `PRODUCT` ou
  `PROFILE`.

### O módulo de implementação

Organizado nos seguintes pacotes:

* `config`: configuração do bean `Cloudinary`, que lê as credenciais do `application-local.yml` via `@Value`;
* `config/client`: clientes HTTP declarativos (`ProductServiceClient` e `AccountServiceClient`) usados
  para validar que a entidade associada ao arquivo existe antes do upload;
* `file`: domínio de arquivos:
  * `controller`: define os endpoints `POST /v1/file/upload` e `GET /v1/file`;
  * `entity`: `FileRecord` — documento MongoDB que persiste os metadados de cada upload (publicId, URL, formato, tamanho, tipo de entidade, entityId, uploadedBy, data);
  * `repository`: interface `FileRecordRepository`, estende `MongoRepository`, com consultas por `entityType` e `entityId`;
  * `service`: interface `FileService` e implementação `FileServiceImpl`, que orquestra validação da entidade, upload e persistência;
  * `validator`: `FileValidator` — valida o arquivo em duas camadas antes de qualquer I/O (descrito abaixo).

## Integração com o gateway

O `file-service` está registrado no `elogateway` (porta `8090`), que é o ponto de entrada único da plataforma.
Em desenvolvimento com o gateway ativo, todas as requisições devem passar por ele:

```http
POST http://localhost:8090/rest/v1/file/upload
Authorization: Bearer <token>
```

O upload de arquivo **requer autenticação** — o gateway valida o token JWT antes de encaminhar a requisição.
O endpoint não está na lista de endpoints públicos (`token.public-endpoints`), portanto um token válido
obtido via `POST /rest/v1/token` é obrigatório.

Ao executar os serviços diretamente (sem o gateway), o `file-service` escuta na porta `8084`.

---

## Fluxo de upload

O caso de uso principal é o vendedor cadastrando um produto com foto. O upload agora exige que o
arquivo seja associado a uma entidade existente (`PRODUCT` ou `PROFILE`). O `file-service` valida
a existência da entidade chamando o serviço correspondente (`product-service` ou `account-service`)
antes de aceitar o arquivo.

```text
Passo 1 — Cliente envia a imagem para o file-service, informando a entidade
  POST /rest/v1/file/upload
  Content-Type: multipart/form-data
  X-User-Id: <id do usuário autenticado>
  Body: campo "file" com os bytes da imagem
        campo "entityType" = PRODUCT | PROFILE
        campo "entityId" = <UUID da entidade>

  ← Resposta: { "secureUrl": "https://res.cloudinary.com/...", "entityType": "PRODUCT", "entityId": "...", ... }

Passo 2 — Cliente consulta os arquivos associados a uma entidade
  GET /rest/v1/file?entityType=PRODUCT&entityId=<UUID>

  ← Resposta: [ { "secureUrl": "...", "entityType": "PRODUCT", "entityId": "...", ... }, ... ]
```

O `product-service` **não chama o `file-service`**. A associação entre arquivo e entidade é mantida
pelo `file-service` através dos campos `entityType` e `entityId` no documento MongoDB. Quando um
comprador visualiza o produto, o frontend pode consultar as imagens via `GET /v1/file` ou usar as
URLs diretamente via CDN do Cloudinary — sem passar pelo backend.

## Validação de segurança dos arquivos

O `FileValidator` aplica **defesa em profundidade** para evitar que arquivos maliciosos sejam aceitos:

1. **Verificação do `Content-Type`** declarado pelo cliente — rejeita imediatamente se não for
   `image/jpeg` ou `image/png`;
2. **Verificação dos magic bytes** — lê os primeiros bytes do conteúdo binário e confirma a assinatura
   real do formato (JPEG começa com `FF D8 FF`; PNG começa com `89 50 4E 47`). Um atacante pode mentir
   no `Content-Type`, mas não consegue falsificar a assinatura binária sem corromper o arquivo.

Apenas arquivos que passam pelas duas verificações são enviados ao Cloudinary.

## Cloudinary

Após a validação, o arquivo é enviado para o Cloudinary via SDK oficial. O Cloudinary:

* Armazena o arquivo original;
* Gera uma URL pública permanente servida via CDN global — não expira, não precisa de token;
* Organiza os arquivos nas pastas `elocampo/products` (para `PRODUCT`) ou `elocampo/profiles` (para `PROFILE`).

Os metadados retornados (`publicId`, `secureUrl`, `format`, `size`, `entityType`, `entityId`,
`uploadedBy`, `uploadedAt`) são persistidos em uma coleção `file_record` no MongoDB. O `id` desse
documento é o identificador usado para deletar o arquivo:

```http
DELETE /rest/v1/file/{id}
```

A deleção remove a imagem do Cloudinary e o documento do MongoDB. O `id` a ser passado é o campo `id`
retornado no upload — não o `publicId`.

> **Atenção — URL órfã no product-service:** a deleção de uma imagem não atualiza automaticamente os
> produtos que referenciam aquela URL em `imageUrls`. O `product-service` não tem conhecimento da
> deleção e continua armazenando a URL, que passa a apontar para um recurso inexistente.
>
> A solução planejada é publicar um evento Kafka (`FileDeletedEvent`) no momento da deleção, para que
> o `product-service` consuma o evento e remova a URL de todos os produtos afetados. Essa integração
> ainda não foi implementada — depende da configuração dos consumidores Kafka nos serviços envolvidos.

## Executando a aplicação localmente

Para começar, você precisa ter o Docker instalado e subir as dependências com o `docker-compose.yml`
disponível na raiz do diretório `Backend`:

```shell
docker compose up
```

> Lembre-se de estar no mesmo diretório do `docker-compose.yml`.

Para finalizar os contêineres:

```shell
docker compose down
```

Para executar a aplicação localmente, defina o profile `local`. Na task `FileServiceApplication` do
Gradle, adicione no campo `Run` o argumento:

```shell
--args='--spring.profiles.active=local'
```

> Caso tenha o IntelliJ Ultimate, nas configurações de execução, passe o profile local.

O arquivo `application-local.yml` contém as credenciais do Cloudinary e a URI do MongoDB. Ele está
incluído no `.gitignore` e **nunca deve ser commitado**.
