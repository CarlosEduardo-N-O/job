# JOB — Plataforma de Intermediação de Serviços

Plataforma web para **intermediação de serviços entre usuários**, permitindo que qualquer usuário publique uma necessidade, encontre oportunidades, envie propostas, negocie valores e condições e participe de contratações.

O **JOB** não trabalha com a ideia de usuários permanentemente classificados como "cliente" ou "prestador". **Todos os usuários possuem os mesmos recursos dentro da plataforma** e podem assumir diferentes papéis de acordo com a ação realizada.

Um usuário pode, por exemplo:

* Publicar uma necessidade de serviço;
* Receber propostas de outros usuários;
* Enviar propostas para publicações de outros usuários;
* Negociar valores, prazos e condições;
* Prestar um serviço;
* Contratar outro usuário;
* Avaliar um serviço realizado;
* Vincular categorias ao próprio perfil.

O projeto utiliza uma arquitetura baseada em **API REST**, frontend separado, banco de dados PostgreSQL e infraestrutura executada através do Docker.

---

# 1. Conceito do Projeto

O JOB funciona como uma plataforma de intermediação onde os usuários se encontram através de uma **timeline de publicações**.

A ideia principal é eliminar a necessidade de definir antecipadamente quem é "cliente" e quem é "prestador".

O papel de cada usuário surge de acordo com a operação:

```text
Usuário
   │
   ├── Publica um serviço
   │       │
   │       └── Está procurando alguém para realizar o trabalho
   │
   └── Envia uma proposta
           │
           └── Está disposto a realizar o trabalho
```

Assim, o mesmo usuário pode publicar um serviço hoje e prestar um serviço para outra pessoa amanhã.

---

# 2. Fluxo Principal da Plataforma

O fluxo geral do JOB será:

```text
                    USUÁRIOS
                       │
                       ▼
                    TIMELINE
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
       PUBLICAR POST       VISUALIZAR POSTS
              │                 │
              │                 ▼
              │          ENVIAR PROPOSTA
              │                 │
              │                 ▼
              │          NEGOCIAÇÃO
              │                 │
              └────────┬────────┘
                       │
                       ▼
                PROPOSTA ACEITA
                       │
                       ▼
                  CONTRATAÇÃO
                       │
                       ▼
                    PAGAMENTO
                       │
                       ▼
             PAGAMENTO CONFIRMADO
                       │
                       ▼
              SERVIÇO AGENDADO
                       │
                       ▼
              EXECUÇÃO DO SERVIÇO
                       │
                       ▼
              PRESTADOR FINALIZA
                       │
                       ▼
          AGUARDANDO CONFIRMAÇÃO
                       │
                       ▼
            CONTRATANTE CONFIRMA
                       │
                       ▼
             REPASSE AO EXECUTOR
                       │
                       ▼
                  AVALIAÇÃO
```

---

# 3. Usuários

Todos os usuários possuem a mesma estrutura básica.

Não haverá mais o campo `tipo` para diferenciar cliente, prestador ou administrador.

O comportamento do usuário será determinado pelas ações realizadas dentro da plataforma.

## Dados do usuário

O cadastro poderá possuir:

* Nome
* E-mail
* Senha
* Telefone
* Foto
* Cidade
* Estado
* Status

Exemplo:

```text
Usuário
│
├── Nome
├── E-mail
├── Senha
├── Telefone
├── Foto
├── Cidade
├── Estado
└── Status
```

O usuário poderá alterar seus próprios dados através da área de **Perfil**.

---

# 4. Perfil do Usuário

O perfil será uma das principais áreas da aplicação.

Cada usuário poderá visualizar e editar suas próprias informações.

## Informações editáveis

* Nome
* E-mail
* Telefone
* Foto
* Cidade
* Estado
* Senha

O usuário também poderá selecionar as **categorias com as quais trabalha ou possui interesse**.

Exemplo:

```text
Meu Perfil

Carlos Eduardo
Rio do Sul - SC

Categorias:

[x] Informática
[x] Manutenção
[ ] Pintura
[ ] Jardinagem
[ ] Elétrica
```

As categorias selecionadas ficarão vinculadas ao usuário através de uma relação entre usuários e categorias.

---

# 5. Categorias

As categorias servem para organizar os tipos de serviços existentes na plataforma.

Exemplos:

```text
Elétrica
Encanamento
Pintura
Jardinagem
Limpeza
Manutenção
Informática
Construção
Marcenaria
Automotivo
Design
Fotografia
```

O usuário poderá vincular uma ou mais categorias ao seu perfil.

## Operações

```text
GET     /api/categorias
POST    /api/categorias
GET     /api/categorias/{id}
PUT     /api/categorias/{id}
DELETE  /api/categorias/{id}
```

---

# 6. Timeline / Home

A **Home** será a timeline principal da plataforma.

Todos os usuários poderão publicar posts.

Não existe uma timeline exclusiva para clientes ou prestadores.

A Home apresentará as publicações disponíveis e permitirá interação entre os usuários.

Exemplo:

```text
HOME

┌──────────────────────────────────────┐
│ Carlos                               │
│ Preciso de alguém para pintar uma    │
│ sala.                                │
│                                      │
│ Categoria: Pintura                   │
│ Cidade: Rio do Sul                   │
│                                      │
│ [ Fazer proposta ]                   │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ João                                 │
│ Preciso instalar alguns pontos       │
│ elétricos em minha residência.       │
│                                      │
│ Categoria: Elétrica                  │
│                                      │
│ [ Fazer proposta ]                   │
└──────────────────────────────────────┘
```

---

# 7. Publicações

Qualquer usuário poderá criar uma publicação.

A publicação representa uma necessidade, oportunidade ou solicitação de serviço.

## Informações previstas

* Usuário que publicou
* Título
* Descrição
* Categoria
* Cidade
* Estado
* Data desejada
* Valor mínimo
* Valor máximo
* Status
* Data de criação
* Data de atualização

## Status da publicação

```text
publicado
em_negociacao
contratado
em_execucao
concluido
cancelado
encerrado
```

---

# 8. Privacidade das Publicações

A plataforma terá uma preocupação importante com a privacidade dos usuários.

Durante a fase de publicação e negociação, **dados sensíveis não serão expostos publicamente**.

A timeline não deverá apresentar informações como:

* Endereço completo;
* Número da residência;
* Horário exato do serviço;
* Outras informações privadas desnecessárias.

A publicação poderá apresentar apenas informações gerais necessárias para que outros usuários avaliem se possuem interesse em realizar o trabalho.

Exemplo:

```text
Cidade: Rio do Sul - SC
Categoria: Pintura
Data desejada: 15/09

Endereço completo:
NÃO EXIBIDO

Horário:
NÃO EXIBIDO
```

---

# 9. Propostas

Qualquer usuário poderá enviar uma proposta para uma publicação.

Não é necessário que o usuário tenha um "tipo prestador".

Ao enviar uma proposta, ele demonstra interesse em realizar aquele trabalho.

Uma proposta poderá possuir:

* Usuário que enviou;
* Publicação relacionada;
* Valor proposto;
* Prazo;
* Mensagem;
* Condições;
* Status.

## Status

```text
enviada
em_negociacao
contraproposta
aceita
recusada
cancelada
nao_selecionada
```

---

# 10. Negociação

Após uma proposta ser enviada, inicia-se uma negociação entre:

```text
Usuário que publicou
        │
        │
        ▼
Usuário interessado em realizar
```

A negociação funcionará através de interações.

Uma negociação poderá conter:

```text
Mensagem
    │
    ▼
Proposta
    │
    ▼
Contraproposta
    │
    ▼
Mensagem
    │
    ▼
Nova proposta
    │
    ▼
Aceitação
```

O objetivo é permitir que os usuários negociem:

* Valor;
* Prazo;
* Data;
* Horário;
* Condições;
* Detalhes da execução.

---

# 11. Negociação entre os Usuários

A negociação ficará vinculada à proposta e à publicação.

Exemplo:

```text
PUBLICAÇÃO
"Preciso pintar minha sala"

        │
        ▼

PROPOSTA
"Faço por R$ 500"

        │
        ▼

NEGOCIAÇÃO

Contratante:
"Consigo pagar R$ 400."

        │

Executor:
"Posso fazer por R$ 450."

        │

Contratante:
"Fechado."

        │
        ▼

PROPOSTA ACEITA
```

O histórico das interações deverá ser preservado para manter a rastreabilidade da negociação.

---

# 12. Contratação

Quando os usuários chegam a um acordo e a proposta é aceita, a negociação gera uma **contratação**.

A contratação representa o compromisso entre:

```text
Quem solicitou o serviço
        │
        │
        ▼
Quem irá realizar o serviço
```

A contratação deverá armazenar informações como:

* Usuário contratante;
* Usuário executor;
* Publicação;
* Proposta;
* Valor final;
* Taxa da plataforma;
* Valor destinado ao executor;
* Data;
* Horário;
* Local;
* Status.

---

# 13. Privacidade após a Contratação

Mesmo depois da proposta ser aceita, os dados privados não deverão ser disponibilizados imediatamente.

O endereço e o horário combinados serão divulgados **somente após a contratação estar confirmada e as condições necessárias terem sido cumpridas**, principalmente o pagamento da plataforma.

Fluxo:

```text
Publicação
    │
    ▼
Proposta
    │
    ▼
Negociação
    │
    ▼
Acordo
    │
    ▼
Contratação
    │
    ▼
Pagamento
    │
    ▼
Pagamento confirmado
    │
    ▼
Dados completos liberados
```

Somente nesse momento os envolvidos poderão ter acesso às informações necessárias para execução do serviço.

---

# 14. Pagamento

Após a contratação ser criada, o usuário que solicitou o serviço deverá realizar o pagamento através da plataforma.

O método inicial previsto será:

```text
PIX
```

Fluxo:

```text
Contratação criada
        │
        ▼
Aguardando pagamento
        │
        ▼
Pagamento realizado
        │
        ▼
Plataforma confirma pagamento
        │
        ▼
Serviço liberado para execução
```

A plataforma poderá armazenar:

* Valor bruto;
* Taxa da plataforma;
* Valor destinado ao executor;
* Método de pagamento;
* Identificador da transação;
* Data;
* Status.

---

# 15. Execução do Serviço

Depois que o pagamento for confirmado, o usuário responsável pela execução poderá realizar o serviço.

Fluxo:

```text
Pagamento confirmado
        │
        ▼
Agendado
        │
        ▼
Em execução
        │
        ▼
Executor informa conclusão
        │
        ▼
Aguardando confirmação
        │
        ▼
Contratante confirma
        │
        ▼
Concluído
```

---

# 16. Confirmação do Serviço

Quando o serviço for realizado, o executor deverá informar que concluiu o trabalho.

O sistema não deverá considerar o serviço definitivamente concluído imediatamente.

Será criado um estado de:

```text
aguardando_confirmacao
```

O usuário que contratou deverá confirmar que o serviço foi realizado.

Somente após a confirmação será liberado o repasse ao executor.

```text
Executor informa conclusão
          │
          ▼
Aguardando confirmação
          │
          ▼
Contratante confirma
          │
          ▼
Serviço concluído
          │
          ▼
Repasse ao executor
```

---

# 17. Repasse ao Executor

Depois que o contratante confirmar a conclusão do serviço, a plataforma realizará o repasse ao usuário que executou o trabalho.

Exemplo:

```text
Valor contratado: R$ 500,00

Taxa da plataforma: R$ 50,00

Repasse ao executor: R$ 450,00
```

Os valores e regras da taxa poderão ser configurados posteriormente.

---

# 18. Avaliações

Após a conclusão da contratação, os usuários poderão avaliar a experiência.

A avaliação poderá conter:

* Nota de 1 a 5;
* Comentário;
* Usuário avaliador;
* Usuário avaliado;
* Contratação relacionada;
* Data.

As avaliações poderão futuramente ser utilizadas para formar a reputação dos usuários.

---

# 19. Notificações

O sistema terá suporte a notificações para informar eventos importantes.

Exemplos:

```text
Nova proposta recebida
Nova mensagem na negociação
Nova contraproposta
Proposta aceita
Proposta recusada
Pagamento realizado
Pagamento confirmado
Serviço agendado
Serviço liberado
Serviço concluído
Confirmação solicitada
Serviço confirmado
Repasse realizado
Nova avaliação
```

---

# 20. Auditoria

A plataforma deverá manter registros de operações importantes para permitir rastreabilidade.

Exemplos:

```text
Criação de publicação
Criação de proposta
Alteração de proposta
Criação de contraproposta
Aceitação de proposta
Recusa de proposta
Criação de contratação
Pagamento confirmado
Alteração de status
Conclusão do serviço
Confirmação do contratante
Repasse realizado
Cancelamento
```

---

# 21. Segurança e Privacidade

A segurança é uma parte importante da plataforma.

O projeto deverá considerar:

* Senhas armazenadas utilizando hash;
* Autenticação utilizando Laravel Sanctum;
* Validação dos dados recebidos;
* Autorização das operações;
* Middleware;
* Proteção contra Mass Assignment;
* Proteção contra SQL Injection através do Eloquent;
* CORS configurado;
* Rate Limiting;
* Não exposição de senhas nas respostas;
* Controle de acesso aos recursos;
* Proteção das informações privadas;
* Controle sobre endereço e horário;
* Registro de operações através da auditoria.

## Regra de privacidade

A plataforma não deverá expor publicamente os dados necessários para execução do serviço.

O objetivo é:

```text
Timeline
   │
   └── Informações gerais

Negociação
   │
   └── Informações necessárias para acordo

Contratação + Pagamento
   │
   └── Liberação das informações privadas

Execução
   │
   └── Endereço e horário disponíveis aos envolvidos
```

---

# 22. Arquitetura

O projeto utiliza uma arquitetura separando frontend, backend e banco de dados.

```text
                         JOB
                          │
                   Docker Compose
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
      Frontend          Backend       PostgreSQL
      React/Vite        Laravel            17
        :5173            :8000           :5432
          │               │
          └────── HTTP/REST ──────────────┘
```

---

# 23. Stack Tecnológica

## Backend

### Laravel

Framework utilizado para construção da API REST.

Responsável por:

* Rotas;
* Controllers;
* Models;
* Eloquent ORM;
* Migrations;
* Validações;
* Autenticação;
* Middleware;
* Regras de negócio;
* Controle de acesso.

---

## PHP

Linguagem utilizada no backend.

Versão utilizada no ambiente Docker:

```text
PHP 8.3
```

---

## Laravel Sanctum

Utilizado para autenticação da API através de tokens.

Fluxo:

```text
Frontend
   │
   │ Login
   ▼
Laravel
   │
   ▼
Sanctum
   │
   ▼
Token
   │
   ▼
Frontend
```

As requisições protegidas utilizam:

```http
Authorization: Bearer TOKEN
```

---

# 24. PostgreSQL

Banco de dados relacional utilizado pelo projeto.

Versão:

```text
PostgreSQL 17
```

---

# 25. Frontend

## React

Biblioteca utilizada para construção da interface.

O frontend será desenvolvido com foco em:

* Mobile-first;
* Responsividade;
* Componentização;
* Navegação por rotas;
* Comunicação com API;
* PWA futuramente.

---

## Vite

Ferramenta utilizada para desenvolvimento e build do frontend.

Porta:

```text
5173
```

---

## Axios

Utilizado para comunicação entre React e API Laravel.

```text
React
  │
  │ Axios
  ▼
Laravel API
  │
  ▼
PostgreSQL
```

---

# 26. Docker

A infraestrutura principal é executada através do Docker.

Serviços:

```text
job_backend
job_frontend
job_postgres
```

---

# 27. Docker Compose

Utilizado para orquestrar os containers.

Com um único comando é possível iniciar:

```text
Frontend
Backend
PostgreSQL
```

---

# 28. Swagger / OpenAPI

O projeto utiliza Swagger / OpenAPI para documentação e testes da API.

A documentação permite:

* Visualizar endpoints;
* Visualizar parâmetros;
* Visualizar respostas;
* Testar requisições;
* Testar autenticação;
* Consultar a documentação da API.

URL:

```text
http://localhost:8000/api/documentation
```

---

# 29. Estrutura do Banco

O modelo previsto possui as seguintes entidades:

```text
users

categorias

usuario_categoria

post_servicos

anexos_post

propostas

proposta_interacoes

contratacoes

pagamentos

execucoes_servico

repasses_prestador

avaliacoes

notificacoes

auditoria
```

Relacionamento simplificado:

```text
users
 │
 ├──────────────► usuario_categoria
 │                       │
 │                       └──► categorias
 │
 ├──────────────► post_servicos
 │                       │
 │                       ├──► categorias
 │                       │
 │                       ├──► anexos_post
 │                       │
 │                       └──► propostas
 │                               │
 │                               └──► proposta_interacoes
 │
 ├──────────────► propostas
 │
 ├──────────────► contratacoes
 │                       │
 │                       ├──► pagamentos
 │                       ├──► execucoes_servico
 │                       ├──► repasses_prestador
 │                       └──► avaliacoes
 │
 ├──────────────► notificacoes
 │
 └──────────────► auditoria
```

---

# 30. Estrutura do Projeto

```text
job/
│
├── docker-compose.yml
├── README.md
├── .gitignore
│
├── backend/
│   │
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   └── Requests/
│   │   │
│   │   └── Models/
│   │
│   ├── bootstrap/
│   ├── config/
│   │
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   │
│   ├── routes/
│   │   ├── api.php
│   │   └── web.php
│   │
│   ├── Dockerfile
│   ├── artisan
│   ├── composer.json
│   └── .env
│
└── frontend/
    │
    ├── src/
    │   ├── components/
    │   ├── contexts/
    │   ├── pages/
    │   ├── services/
    │   └── ...
    │
    ├── public/
    ├── Dockerfile
    ├── package.json
    └── vite.config.js
```

---

# 31. Pré-requisitos

Para executar o projeto é necessário ter instalado:

* Docker Desktop;
* Git.

O Node.js e o PHP **não precisam estar instalados diretamente no Windows**, pois serão executados através dos containers Docker.

---

# 32. Clonar o Projeto

Clone o repositório:

```bash
git clone https://github.com/CarlosEduardo-N-O/job.git
```

Entre na pasta:

```bash
cd job
```

---

# 33. Configuração do Backend

Entre na pasta:

```bash
cd backend
```

Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

No Windows CMD:

```cmd
copy .env.example .env
```

Configure o banco:

```env
DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=job
DB_USERNAME=job
DB_PASSWORD=job
```

Volte para a raiz:

```bash
cd ..
```

---

# 34. Configuração do Frontend

Entre na pasta:

```bash
cd frontend
```

Crie o arquivo `.env`:

```bash
cp .env.example .env
```

No Windows CMD:

```cmd
copy .env.example .env
```

Configure:

```env
VITE_API_URL=http://localhost:8000/api
```

Volte para a raiz:

```bash
cd ..
```

---

# 35. Subir o Projeto com Docker

Na raiz do projeto:

```bash
docker compose up -d --build
```

Esse comando irá:

1. Construir o backend;
2. Construir o frontend;
3. Baixar a imagem do PostgreSQL;
4. Criar os containers;
5. Criar a rede Docker;
6. Iniciar os serviços.

---

# 36. Verificar os Containers

Execute:

```bash
docker compose ps
```

O esperado é:

```text
job_backend
job_frontend
job_postgres
```

Os serviços devem estar com status semelhante a:

```text
Up
```

ou:

```text
Up (healthy)
```

---

# 37. Executar as Migrations

Depois que o PostgreSQL estiver disponível:

```bash
docker compose exec backend php artisan migrate
```

Para verificar:

```bash
docker compose exec backend php artisan migrate:status
```

---

# 38. Gerar Documentação Swagger

Execute:

```bash
docker compose exec backend php artisan l5-swagger:generate
```

A documentação estará disponível em:

```text
http://localhost:8000/api/documentation
```

---

# 39. URLs do Projeto

## Frontend

```text
http://localhost:5173
```

## Backend

```text
http://localhost:8000
```

## Swagger

```text
http://localhost:8000/api/documentation
```

---

# 40. Rotas Principais da API

## Autenticação

```http
POST /api/login
POST /api/logout
GET  /api/logon
```

## Usuário autenticado

```http
POST   /api/users
GET    /api/users
PUT    /api/users
DELETE /api/users
```

## Categorias

```http
GET    /api/categorias
POST   /api/categorias
GET    /api/categorias/{id}
PUT    /api/categorias/{id}
DELETE /api/categorias/{id}
```

As demais rotas serão implementadas conforme o desenvolvimento das funcionalidades de:

```text
Posts
Categorias do usuário
Propostas
Negociação
Contratações
Pagamentos
Execução
Confirmação
Repasses
Avaliações
Notificações
Auditoria
```

---

# 41. Comandos Docker Úteis

## Iniciar

```bash
docker compose up -d
```

## Iniciar reconstruindo as imagens

```bash
docker compose up -d --build
```

## Parar

```bash
docker compose stop
```

## Parar e remover os containers

```bash
docker compose down
```

## Ver containers

```bash
docker compose ps
```

## Ver logs

```bash
docker compose logs -f
```

## Logs do backend

```bash
docker compose logs -f backend
```

## Logs do frontend

```bash
docker compose logs -f frontend
```

## Reiniciar

```bash
docker compose restart
```

---

# 42. Comandos Laravel

## Listar rotas

```bash
docker compose exec backend php artisan route:list
```

## Criar Model

```bash
docker compose exec backend php artisan make:model NomeDoModel
```

## Criar Migration

```bash
docker compose exec backend php artisan make:migration create_nome_table
```

## Criar Controller

```bash
docker compose exec backend php artisan make:controller NomeController
```

## Criar Model + Migration + Controller

```bash
docker compose exec backend php artisan make:model Nome -mc
```

## Executar migrations

```bash
docker compose exec backend php artisan migrate
```

## Ver status das migrations

```bash
docker compose exec backend php artisan migrate:status
```

## Recriar banco

```bash
docker compose exec backend php artisan migrate:fresh
```

> `migrate:fresh` apaga todas as tabelas existentes. Utilize somente durante o desenvolvimento quando não houver dados importantes.

## Limpar cache

```bash
docker compose exec backend php artisan optimize:clear
```

---

# 43. Desenvolvimento da API

A API seguirá o padrão:

```text
Route
   ↓
Controller
   ↓
Request / Validation
   ↓
Model
   ↓
Eloquent
   ↓
PostgreSQL
```

Exemplo:

```text
POST /api/categorias
        │
        ▼
CategoriaController
        │
        ▼
Validation
        │
        ▼
Categoria
        │
        ▼
PostgreSQL
```

---

# 44. Padrão REST

Os endpoints utilizarão HTTP REST.

## GET

Consultar:

```http
GET /api/categorias
```

## POST

Criar:

```http
POST /api/categorias
```

## PUT

Atualizar:

```http
PUT /api/categorias/1
```

## DELETE

Excluir:

```http
DELETE /api/categorias/1
```

As respostas serão fornecidas em JSON.

---

# 45. Regras de Negócio Principais

As principais regras previstas para a plataforma são:

### Regra 1 — Todos os usuários são iguais

Não haverá diferenciação de usuário através de `tipo`.

```text
Usuário
   │
   ├── Pode publicar
   ├── Pode propor
   ├── Pode negociar
   ├── Pode contratar
   └── Pode prestar serviços
```

### Regra 2 — Categorias pertencem ao perfil

O usuário poderá selecionar as categorias que deseja vincular ao seu perfil.

### Regra 3 — Qualquer usuário pode publicar

Não existe necessidade de ser "cliente" para criar uma publicação.

### Regra 4 — Qualquer usuário pode enviar propostas

Não existe necessidade de ser "prestador" para enviar uma proposta.

### Regra 5 — A negociação acontece antes da contratação

Uma proposta pode receber mensagens, contrapropostas e alterações até que os envolvidos cheguem a um acordo.

### Regra 6 — A contratação nasce de uma negociação aceita

Somente após a aceitação de uma proposta será criada a contratação.

### Regra 7 — O pagamento acontece antes da execução

O serviço somente será liberado para execução após a confirmação do pagamento exigido pela plataforma.

### Regra 8 — Dados privados não ficam expostos na timeline

Endereço completo e horário não serão exibidos publicamente.

### Regra 9 — Dados de execução são liberados somente aos envolvidos

Após a contratação e confirmação das condições necessárias, os dados necessários para realização do serviço serão disponibilizados aos envolvidos.

### Regra 10 — O executor informa a conclusão

Quem realizou o serviço deverá informar que terminou.

### Regra 11 — O contratante confirma

O usuário que contratou deverá confirmar a realização.

### Regra 12 — O repasse ocorre após a confirmação

Somente após a confirmação do contratante o valor será liberado para o executor, respeitando as regras financeiras da plataforma.

---

# 46. Roadmap

## Fase 1 — Infraestrutura

* [x] Docker
* [x] Docker Compose
* [x] PostgreSQL
* [x] Laravel
* [x] React
* [x] Vite
* [x] Axios
* [x] Swagger / OpenAPI

## Fase 2 — Autenticação

* [x] Cadastro
* [x] Login
* [x] Logout
* [x] Token
* [x] Laravel Sanctum
* [x] Middleware
* [x] Recuperação do usuário autenticado

## Fase 3 — Usuário

* [x] Cadastro de usuário
* [x] Visualização do perfil
* [x] Alteração do perfil
* [x] Alteração de senha
* [ ] Upload de foto
* [ ] Vinculação de categorias
* [ ] Visualização das categorias vinculadas

## Fase 4 — Categorias

* [x] CRUD de categorias
* [ ] Vincular categoria ao usuário
* [ ] Remover categoria do usuário
* [ ] Listar categorias do usuário

## Fase 5 — Timeline

* [ ] Criar publicação
* [ ] Editar publicação
* [ ] Excluir publicação
* [ ] Listar publicações
* [ ] Visualizar publicação
* [ ] Filtrar por categoria
* [ ] Filtrar por cidade
* [ ] Timeline da Home

## Fase 6 — Propostas

* [ ] Criar proposta
* [ ] Visualizar propostas
* [ ] Editar proposta
* [ ] Recusar proposta
* [ ] Aceitar proposta
* [ ] Contraproposta

## Fase 7 — Negociação

* [ ] Mensagens
* [ ] Histórico da negociação
* [ ] Propostas dentro da negociação
* [ ] Contrapropostas
* [ ] Aceitação
* [ ] Recusa
* [ ] Encerramento da negociação

## Fase 8 — Contratação

* [ ] Criar contratação
* [ ] Definir valor final
* [ ] Definir data
* [ ] Definir horário
* [ ] Definir endereço
* [ ] Controle de status
* [ ] Proteção das informações privadas

## Fase 9 — Pagamento

* [ ] Criar pagamento
* [ ] PIX
* [ ] Confirmação do pagamento
* [ ] Taxa da plataforma
* [ ] Controle financeiro
* [ ] Estorno/cancelamento

## Fase 10 — Execução

* [ ] Serviço agendado
* [ ] Serviço em execução
* [ ] Executor informa conclusão
* [ ] Aguardando confirmação
* [ ] Contratante confirma
* [ ] Serviço concluído

## Fase 11 — Repasse

* [ ] Calcular taxa da plataforma
* [ ] Calcular valor do executor
* [ ] Criar repasse
* [ ] Processar repasse
* [ ] Histórico financeiro

## Fase 12 — Avaliações

* [ ] Avaliar usuário
* [ ] Nota de 1 a 5
* [ ] Comentário
* [ ] Histórico de avaliações
* [ ] Média das avaliações

## Fase 13 — Notificações

* [ ] Nova proposta
* [ ] Nova mensagem
* [ ] Contraproposta
* [ ] Proposta aceita
* [ ] Pagamento
* [ ] Agendamento
* [ ] Conclusão
* [ ] Confirmação
* [ ] Repasse
* [ ] Avaliação

## Fase 14 — Auditoria

* [ ] Registrar operações
* [ ] Registrar alterações de status
* [ ] Registrar pagamentos
* [ ] Registrar contratações
* [ ] Registrar confirmações
* [ ] Registrar repasses

## Fase 15 — Frontend

* [x] Login
* [ ] Cadastro
* [x] Home
* [x] Bottom Navigation
* [x] Perfil
* [ ] Categorias do perfil
* [ ] Timeline
* [ ] Criar publicação
* [ ] Visualizar publicação
* [ ] Criar proposta
* [ ] Negociação
* [ ] Contratação
* [ ] Pagamento
* [ ] Execução
* [ ] Confirmação
* [ ] Avaliações
* [ ] Notificações

---

# 47. Status Atual

O projeto encontra-se em desenvolvimento.

A infraestrutura atual utiliza:

```text
Docker
│
├── Laravel API
├── React + Vite
└── PostgreSQL 17
```

As funcionalidades básicas de autenticação, API, documentação Swagger, frontend e perfil estão sendo desenvolvidas inicialmente.

A próxima evolução da aplicação será concentrada no fluxo principal da plataforma:

```text
Perfil
   ↓
Categorias
   ↓
Timeline
   ↓
Publicação
   ↓
Proposta
   ↓
Negociação
   ↓
Contratação
   ↓
Pagamento
   ↓
Execução
   ↓
Confirmação
   ↓
Repasse
   ↓
Avaliação
```

---

# 48. Objetivo do Projeto

O JOB tem como objetivo desenvolver uma plataforma de intermediação de serviços que permita conectar pessoas que precisam realizar trabalhos com pessoas dispostas a executá-los.

Além da implementação de uma plataforma funcional, o projeto busca demonstrar na prática conceitos de:

* Engenharia de Software;
* Desenvolvimento Web;
* APIs REST;
* Banco de Dados;
* Modelagem Relacional;
* ORM;
* Docker;
* Arquitetura de Software;
* Autenticação;
* Segurança;
* Desenvolvimento Frontend;
* Desenvolvimento Backend;
* Integração entre sistemas;
* Regras de negócio;
* Processamento de pagamentos;
* Controle de transações;
* Privacidade de dados.

---

# JOB

**Plataforma de Intermediação de Serviços**

```text
Backend:       Laravel + PHP
Frontend:      React + Vite
Banco:         PostgreSQL 17
Autenticação:  Laravel Sanctum
Comunicação:   Axios
Infraestrutura: Docker + Docker Compose
Documentação:  Swagger / OpenAPI
```

O JOB está sendo desenvolvido de forma incremental, começando pela infraestrutura, autenticação e perfil dos usuários e evoluindo para o fluxo completo de publicação, proposta, negociação, contratação, pagamento, execução, confirmação e repasse.
