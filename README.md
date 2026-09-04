# JOB — Plataforma de Intermediação de Serviços

Plataforma web para intermediação de serviços entre **clientes** que precisam contratar um serviço e **prestadores** que oferecem seus serviços.

O projeto está sendo desenvolvido como uma aplicação web moderna, utilizando uma arquitetura baseada em API REST, frontend separado e banco de dados PostgreSQL, com todos os principais serviços executados através do Docker.

---

## 1. Escopo do Projeto

O **JOB** tem como objetivo facilitar a contratação de profissionais autônomos, permitindo que clientes publiquem necessidades de serviços e que prestadores possam enviar propostas.

### Fluxo principal

```text
Cliente
   │
   ├── Cria uma solicitação de serviço
   │
   ▼
Post de Serviço
   │
   ├── Categoria
   ├── Descrição
   ├── Localização
   ├── Data desejada
   └── Faixa de valor
   │
   ▼
Prestadores visualizam a solicitação
   │
   ├── Enviam proposta
   ├── Definem valor
   └── Definem prazo
   │
   ▼
Cliente analisa as propostas
   │
   ▼
Proposta aceita
   │
   ▼
Contratação
   │
   ├── Pagamento
   ├── Agendamento
   ├── Execução
   ├── Confirmação
   └── Avaliação
   │
   ▼
Repasse ao prestador
```

---

# 2. Principais Funcionalidades

## Autenticação

* Cadastro de usuários
* Login
* Logout
* Autenticação por token
* Controle de acesso
* Perfis de usuário

### Tipos de usuário

```text
cliente
prestador
administrador
```

---

## Usuários

Cadastro e gerenciamento das informações dos usuários:

* Nome
* E-mail
* Senha
* Telefone
* Tipo de usuário
* Foto
* Cidade
* Estado
* Status

---

## Perfil do Prestador

Prestadores poderão possuir informações adicionais:

* Descrição profissional
* Experiência
* Avaliação média
* Quantidade de serviços realizados
* Taxa de conclusão

---

## Categorias

As categorias permitem organizar os serviços disponíveis na plataforma.

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
```

Operações previstas:

```text
GET     /api/categorias
POST    /api/categorias
GET     /api/categorias/{id}
PUT     /api/categorias/{id}
DELETE  /api/categorias/{id}
```

---

## Publicação de Serviços

Clientes poderão publicar solicitações contendo:

* Título
* Descrição
* Categoria
* Localização
* Cidade
* Estado
* Data desejada
* Valor mínimo
* Valor máximo
* Status

Estados possíveis:

```text
publicado
em_negociacao
contratado
encerrado
cancelado
```

---

## Propostas

Prestadores poderão enviar propostas para os serviços publicados.

Uma proposta possui:

* Valor proposto
* Prazo
* Mensagem
* Status

Status previstos:

```text
enviada
em_negociacao
contraproposta
aceita
recusada
nao_selecionada
```

---

## Negociação

A plataforma permitirá interações entre cliente e prestador.

Tipos de interação:

```text
mensagem
proposta
contraproposta
aceitacao
recusa
```

---

## Contratações

Quando uma proposta for aceita, será criada uma contratação.

A contratação armazenará:

* Cliente
* Prestador
* Serviço
* Proposta
* Valor do serviço
* Taxa da plataforma
* Valor destinado ao prestador
* Data
* Horário
* Status

---

## Pagamentos

O sistema terá estrutura para gerenciamento dos pagamentos.

Método inicial:

```text
PIX
```

Status:

```text
aguardando
pago
recebido
estornado
```

---

## Execução do Serviço

A execução permitirá controlar o ciclo do serviço:

```text
agendado
     ↓
em_execucao
     ↓
aguardando_confirmacao
     ↓
concluido
```

Também serão registradas as confirmações do cliente e do prestador.

---

## Avaliações

Após a conclusão do serviço, cliente e prestador poderão realizar avaliações.

A avaliação possuirá:

* Nota de 1 a 5
* Comentário
* Avaliador
* Avaliado
* Contratação relacionada

---

## Notificações

O sistema terá suporte a notificações para informar eventos importantes aos usuários.

Exemplos:

```text
Nova proposta recebida
Proposta aceita
Pagamento confirmado
Serviço agendado
Serviço concluído
Nova avaliação
```

---

## Auditoria

A plataforma manterá registros de operações importantes para permitir rastreabilidade.

Exemplos:

```text
Criação de contratação
Alteração de status
Confirmação de pagamento
Conclusão de serviço
Cancelamento
```

---

# 3. Arquitetura

O projeto utiliza uma arquitetura separando frontend, backend e banco de dados.

```text
                    JOB
                     │
             Docker Compose
                     │
       ┌─────────────┼─────────────┐
       │             │             │
       ▼             ▼             ▼
   Frontend        Backend      PostgreSQL
   React/Vite      Laravel          17
     :5173          :8000          :5432
       │             │
       └─────────────┘
          HTTP/REST
```

---

# 4. Stack Tecnológica

## Backend

### Laravel

Framework PHP utilizado para construção da API REST.

Responsável por:

* Rotas
* Controllers
* Models
* Eloquent ORM
* Migrations
* Validações
* Autenticação
* Middleware
* Regras de negócio

---

## PHP

Linguagem utilizada no desenvolvimento do backend.

Versão utilizada no ambiente Docker:

```text
PHP 8.3
```

---

## PostgreSQL

Banco de dados relacional utilizado pelo projeto.

Versão:

```text
PostgreSQL 17
```

---

## Frontend

### React

Biblioteca utilizada para construção da interface da aplicação.

### Vite

Ferramenta utilizada para desenvolvimento e build do frontend.

Porta:

```text
5173
```

---

## Axios

Utilizado pelo frontend para comunicação com a API Laravel.

Exemplo:

```text
React
  │
  │ Axios
  ▼
Laravel API
```

---

## Docker

Toda a infraestrutura principal é executada utilizando Docker.

Serviços:

```text
job_backend
job_frontend
job_postgres
```

---

## Docker Compose

Utilizado para orquestrar todos os containers.

Com um único comando é possível iniciar:

```text
Frontend
Backend
PostgreSQL
```

---

## Swagger / OpenAPI

Utilizado para documentação e testes da API.

A documentação permite:

* Visualizar endpoints
* Visualizar parâmetros
* Visualizar respostas
* Testar requisições
* Testar autenticação
* Consultar a documentação da API

URL:

```text
http://localhost:8000/api/documentation
```

---

# 5. Estrutura do Banco

O modelo inicial possui as seguintes entidades:

```text
users
prestador_perfis
categorias
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
 ├──────────────► prestador_perfis
 │
 ├──────────────► post_servicos
 │                      │
 │                      ├──► categorias
 │                      │
 │                      ├──► anexos_post
 │                      │
 │                      └──► propostas
 │                              │
 │                              └──► proposta_interacoes
 │
 ├──────────────► propostas
 │
 ├──────────────► contratacoes
 │                      │
 │                      ├──► pagamentos
 │                      ├──► execucoes_servico
 │                      ├──► repasses_prestador
 │                      └──► avaliacoes
 │
 ├──────────────► notificacoes
 │
 └──────────────► auditoria
```

---

# 6. Estrutura do Projeto

```text
job/
│
├── docker-compose.yml
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
│   │
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

# 7. Pré-requisitos

Para executar o projeto é necessário ter instalado:

* Docker Desktop
* Git

O Node.js e o PHP **não precisam estar instalados diretamente no Windows**, pois serão executados pelos containers Docker.

---

# 8. Clonar o projeto

Clone o repositório:

```bash
git clone URL_DO_REPOSITORIO
```

Entre na pasta:

```bash
cd job
```

---

# 9. Configuração do Backend

Entre na pasta:

```bash
cd backend
```

Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

No Windows CMD, caso o comando acima não funcione:

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

# 10. Subir o projeto com Docker

Na raiz do projeto:

```bash
docker compose up -d --build
```

Esse comando irá:

1. Construir o backend
2. Construir o frontend
3. Baixar a imagem do PostgreSQL
4. Criar os containers
5. Criar a rede Docker
6. Iniciar os serviços

---

# 11. Verificar os containers

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

Os serviços devem estar com status:

```text
Up
```

ou, no PostgreSQL:

```text
Up (healthy)
```

---

# 12. Executar as migrations

Depois que o PostgreSQL estiver disponível:

```bash
docker compose exec api php artisan migrate
```

As migrations criarão as tabelas do sistema.

Para verificar:

```bash
docker compose exec api php artisan migrate:status
```

---

# 13. Gerar documentação Swagger

Depois de instalar e configurar o Swagger:

```bash
docker compose exec api php artisan l5-swagger:generate
```

A documentação estará disponível em:

```text
http://localhost:8000/api/documentation
```

---

# 14. URLs do projeto

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

## API de teste

```text
http://localhost:8000/api/teste
```

---

# 15. Comandos Docker úteis

### Iniciar

```bash
docker compose up -d
```

### Iniciar reconstruindo as imagens

```bash
docker compose up -d --build
```

### Parar

```bash
docker compose stop
```

### Parar e remover os containers

```bash
docker compose down
```

### Ver containers

```bash
docker compose ps
```

### Ver logs

```bash
docker compose logs -f
```

### Logs somente do backend

```bash
docker compose logs -f api
```

### Logs somente do frontend

```bash
docker compose logs -f frontend
```

### Reiniciar

```bash
docker compose restart
```

---

# 16. Comandos Laravel

### Listar rotas

```bash
docker compose exec api php artisan route:list
```

### Criar Model

```bash
docker compose exec api php artisan make:model NomeDoModel
```

### Criar Migration

```bash
docker compose exec api php artisan make:migration create_nome_table
```

### Criar Controller

```bash
docker compose exec api php artisan make:controller NomeController
```

### Criar Model + Migration + Controller

```bash
docker compose exec api php artisan make:model Nome -mc
```

### Executar migrations

```bash
docker compose exec api php artisan migrate
```

### Ver status das migrations

```bash
docker compose exec api php artisan migrate:status
```

### Recriar banco

```bash
docker compose exec api php artisan migrate:fresh
```

> `migrate:fresh` apaga as tabelas existentes. Utilize somente durante o desenvolvimento quando não houver dados importantes.

---

# 17. Desenvolvimento da API

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
StoreCategoriaRequest
        │
        ▼
Categoria
        │
        ▼
PostgreSQL
```

---

# 18. Padrão de API

Os endpoints utilizarão HTTP REST.

### GET

Consultar dados:

```http
GET /api/categorias
```

### POST

Criar:

```http
POST /api/categorias
```

### PUT

Atualizar:

```http
PUT /api/categorias/1
```

### DELETE

Excluir:

```http
DELETE /api/categorias/1
```

As respostas serão fornecidas em JSON.

---

# 19. Segurança

O projeto deverá considerar:

* Senhas armazenadas utilizando hash
* Validação dos dados recebidos
* Autenticação
* Autorização
* Middleware
* Proteção contra Mass Assignment
* Controle de acesso por perfil
* Proteção contra SQL Injection através do Eloquent
* CORS configurado
* Rate Limiting
* Não exposição de senhas nas respostas da API
* Registro de operações importantes através da auditoria

---

# 20. Objetivo acadêmico

Além de implementar uma plataforma funcional, o projeto tem como objetivo demonstrar a aplicação prática de conceitos de:

* Engenharia de Software
* Desenvolvimento Web
* APIs REST
* Banco de Dados
* Modelagem Relacional
* ORM
* Docker
* Arquitetura de Software
* Autenticação
* Segurança
* Desenvolvimento Frontend
* Desenvolvimento Backend
* Integração entre sistemas

---

# 21. Roadmap

## Fase 1 — Infraestrutura

* [x] Docker
* [x] Docker Compose
* [x] PostgreSQL
* [x] Laravel
* [x] React
* [x] Vite
* [x] Swagger

## Fase 2 — Backend básico

* [ ] Migration `users`
* [ ] Model `User`
* [ ] Migration `categorias`
* [ ] Model `Categoria`
* [ ] Controllers
* [ ] Routes
* [ ] CRUD de categorias

## Fase 3 — Autenticação

* [ ] Cadastro
* [ ] Login
* [ ] Logout
* [ ] Token
* [ ] Middleware
* [ ] Controle de acesso

## Fase 4 — Serviços

* [ ] Cadastro de categorias
* [ ] Publicação de serviços
* [ ] Anexos
* [ ] Consulta de serviços

## Fase 5 — Propostas

* [ ] Criar propostas
* [ ] Negociação
* [ ] Contraproposta
* [ ] Aceitação
* [ ] Recusa

## Fase 6 — Contratação

* [ ] Criar contratação
* [ ] Pagamento
* [ ] Agendamento
* [ ] Execução
* [ ] Confirmação

## Fase 7 — Pós-serviço

* [ ] Avaliações
* [ ] Repasses
* [ ] Notificações
* [ ] Auditoria

## Fase 8 — Frontend

* [ ] Login
* [ ] Cadastro
* [ ] Dashboard
* [ ] Perfil
* [ ] Lista de serviços
* [ ] Publicação de serviço
* [ ] Propostas
* [ ] Contratações
* [ ] Pagamentos
* [ ] Avaliações

---

# 22. Status atual

O projeto encontra-se em desenvolvimento.

A infraestrutura inicial utiliza:

```text
Docker
├── Laravel API
├── React + Vite
└── PostgreSQL 17
```

O desenvolvimento está sendo realizado de forma incremental, implementando inicialmente as estruturas fundamentais de banco, API e autenticação antes das funcionalidades mais avançadas da plataforma.

---

# JOB

**Plataforma de Intermediação de Serviços**

Backend: Laravel + PHP
Frontend: React + Vite
Banco: PostgreSQL
Infraestrutura: Docker + Docker Compose
Documentação: Swagger / OpenAPI
