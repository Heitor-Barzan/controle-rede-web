# Sistema de sincronizacao com CouchDB e PouchDB

Projeto Node.js simples para demonstrar autenticacao de professores, consulta de disciplinas e sincronizacao de dados entre uma aplicacao web local, bancos PouchDB no navegador e bancos CouchDB no servidor.

## Visao geral

- Servidor HTTP com Express na porta `7000`.
- CouchDB em Docker na porta `5984`.
- Autenticacao via JWT.
- Interface web estatica servida pelo proprio Express em `http://localhost:7000`.
- Dados locais no navegador com PouchDB.
- Sincronizacao manual para bancos CouchDB por disciplina.

## Estrutura do projeto

```text
.
├── README.md
├── docs/
│   └── controle.pdf
└── src/
    ├── docker-compose.yml
    ├── package.json
    ├── package-lock.json
    ├── servidor.js
    └── public/
        ├── index.html
        └── rede.js
```

## Pre-requisitos

- Node.js instalado.
- npm instalado.
- Docker e Docker Compose instalados.

## Como executar

Entre na pasta da aplicacao:

```bash
cd src
```

Instale as dependencias, caso ainda nao estejam instaladas:

```bash
npm install
```

Suba o CouchDB:

```bash
docker compose up -d
```

Inicie o servidor Node:

```bash
node servidor.js
```

Com tudo em execucao, acesse:

- Aplicacao web: `http://localhost:7000`
- Painel do CouchDB: `http://localhost:5984/_utils/#`

Credenciais do CouchDB:

- Usuario: `admin`
- Senha: `123`

## Inicializacao dos bancos

Antes de sincronizar dados, crie os bancos das disciplinas no CouchDB acessando:

```text
http://localhost:7000/init
```

Essa rota cria um banco para cada disciplina cadastrada nos professores ficticios definidos em `src/servidor.js`.

## Usuarios de teste

O projeto possui professores cadastrados diretamente no codigo:

| Professor | E-mail | Senha | Disciplinas |
| --- | --- | --- | --- |
| fabio | `fabio@ufsc.br` | `123` | `dec0007`, `dec0020`, `dec0040` |
| joao | `joao@ufsc.br` | `123` | `dec0001`, `dec0002`, `dec0003` |

## Rotas da API

### `POST /login`

Autentica um professor e retorna um token JWT.

Exemplo:

```bash
curl -X POST http://localhost:7000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"fabio@ufsc.br","senha":"123"}'
```

Resposta esperada:

```json
{
  "token": "..."
}
```

### `GET /disciplinas`

Retorna as disciplinas do professor autenticado.

```bash
curl http://localhost:7000/disciplinas \
  -H "Authorization: Bearer SEU_TOKEN"
```

### `GET /disciplinas/:disciplina`

Retorna os dados iniciais de uma disciplina.

```bash
curl http://localhost:7000/disciplinas/dec0007 \
  -H "Authorization: Bearer SEU_TOKEN"
```

### `POST /sync/:disciplina`

Envia documentos para o banco CouchDB da disciplina. O professor precisa ter acesso a disciplina informada.

```bash
curl -X POST http://localhost:7000/sync/dec0007 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"docs":[{"aluno":"Ana Maria","aulas":[{"data":"2026-06-01","presente":true}]}]}'
```

## Parando o ambiente

Para parar e remover o container do CouchDB:

```bash
docker compose down
```

Para remover tambem o volume com os dados persistidos:

```bash
docker compose down -v
```
