## Inicialização do zero

Siga essa ordem obrigatoriamente.

### 1. Sobe o CouchDB

Em `controle-rede-web/src`:

```bash
docker compose up
```

### 2. Sobe o servidor

Em `controle-rede-web/src`:

```bash
node servidor.js
```

### 3. Sobe as tabelas do banco:

```
curl http://localhost:7000/init
```

### 4. Cadastra o professor Fabio

```bash
curl -X POST http://localhost:7000/cadastro \
  -H "Content-Type: application/json" \
  -d '{
    "id":"fabio",
    "email":"fabio@ufsc.br",
    "senha":"123",
    "disciplinas":["dec0007","dec0020","dec0040"]
  }'
```

Resposta esperada: `Cadastro realizado`

### 5. Cria os bancos das disciplinas no CouchDB

```bash
curl -X PUT http://admin:123@localhost:5984/dec0007
curl -X PUT http://admin:123@localhost:5984/dec0020
curl -X PUT http://admin:123@localhost:5984/dec0040
```

Resposta esperada para cada: `{"ok":true}`

### 5. Sobe o frontend

Em `controle-rede-web/frontend`:

```bash
npm run dev
```

Acessa em `http://localhost:5173

---

## Fluxo de testes

### Login

- Acessa `http://localhost:5173`
- Email: `fabio@ufsc.br`
- Senha: `123`
- Deve redirecionar para `/home` com a lista de disciplinas

### Registro de presença

1. Clica em uma disciplina, ex: `dec0020` (atualmente so `dec0020` e `dec0007` tem alunos, `dec0040` não tem alunos)
2. A lista de alunos deve aparecer: Ana maria, Pedro, Cintia
3. Seleciona uma data
4. Marca os checkboxes de presença
5. Clica em **Salvar**, os dados são gravados localmente no PouchDB do browser
6. O histórico no final da página deve atualizar com a aula salva
7. O registro de presenças é compartilhado entre os usuários, logo o que o usuário X registra em um turma, para o usuário Y que tem a mesma turma, também ficará persistido.

### Sincronização

1. Com a presença salva, clica em **Sincronizar**
2. Deve aparecer "Sincronizando..." e depois "Sincronizado"
3. Os campos da data atual ficam bloqueados (checkboxes, salvar, sincronizar)
4. Outras datas continuam editáveis normalmente
5. Fecha o browser, reabre e volta para a mesma tela, o bloqueio persiste

### Verificação no CouchDB

Acessa `http://localhost:5984/_utils`

- Usuário: `admin`
- Senha: `123`

Entra no banco `dec0020` e verifica que o documento do dia existe com `registros` preenchido e `sincronizado: true`.

Ou via terminal:

```bash
curl http://admin:123@localhost:5984/dec0020/_all_docs?include_docs=true |jq
```

---

## Comandos úteis

### Ver todos os bancos existentes

```bash
curl http://admin:123@localhost:5984/_all_dbs
```

### Forçar criação dos bancos via init

```bash
curl http://localhost:7000/init
```

---

## Resetar tudo e começar do zero

### 1. Apaga os bancos remotos

```bash
curl -X DELETE http://admin:123@localhost:5984/dec0007
curl -X DELETE http://admin:123@localhost:5984/dec0020
curl -X DELETE http://admin:123@localhost:5984/dec0040
curl -X DELETE http://admin:123@localhost:5984/usuarios
```

### 2. Apaga o banco local no browser

Abre o console em `http://localhost:5173` e roda:

```javascript
await new PouchDB('dec0007').destroy()
await new PouchDB('dec0020').destroy()
await new PouchDB('dec0040').destroy()
await new PouchDB('lista').destroy()
```

Recarrega a página.

### 3. Reinicia do passo 3 da inicialização

Cadastra o professor e recria os bancos conforme descrito acima.
