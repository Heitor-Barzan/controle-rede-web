const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
const nano = require("nano")("http://admin:123@localhost:5984");

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname + "/public"));

const SECRET = "segredo";
const ADMIN_ID = "admin";
const ADMIN_SENHA = "admin123";

var listaBancos;

/*
Antes, o campo de dados era assim:  
        dados: [
            { aluno: "Ana maria", aulas: [] },
            { aluno: "pedro", aulas: [] },
            { aluno: "cintia", aulas: [] },
Veja que tinha um campo de "aulas: []", possivelmente, pode ser que era para registrar as aulas que o aluno foi? 
Mas isso não foi implementado, então retirei
*/

const semestre = [
    {
        disciplina: "dec0007",
        dados: [
            { aluno: "Ana maria", },
            { aluno: "Pedro", },
            { aluno: "Cintia", },
        ],
    },
    {
        disciplina: "dec0020",
        dados: [
            { aluno: "Ana Maria", },
            { aluno: "Pedro", },
            { aluno: "Cintia", },
        ],
    },
];

async function criaBD(nomeBanco) {
    try {
        listaBancos = await nano.db.list();
        if (listaBancos.includes(nomeBanco)) {
            console.log(`O banco "${nomeBanco}" ja existe.`);
        } else {
            console.log(`O banco "${nomeBanco}" nao existe. Criando...`);
            await nano.db.create(nomeBanco);
            console.log("Banco criado com sucesso.");
        }
    } catch (error) {
        console.error("Erro ao verificar banco:", error.message);
    }
}

async function criaTodosBancosDados() {
    listaBancos = await nano.db.list();

    await criaBD("usuarios");

    const dbUsuarios = nano.use("usuarios");

    try {
        await dbUsuarios.createIndex({
            index: {
                fields: ["email"],
            },
        });
    } catch {}

    try {
        await dbUsuarios.createIndex({
            index: {
                fields: ["id"],
            },
        });
    } catch {}

    let todosProfs = [];

    try {
        const result = await dbUsuarios.list({
            include_docs: true,
        });

        todosProfs = result.rows.map((r) => r.doc);
    } catch {}

    for (const prof of todosProfs) {
        for (const disc of prof.disciplinas || []) {
            await criaBD(disc);
        }
    }
}

async function buscaUsuario(email) {
    const db = nano.use("usuarios");

    try {
        const result = await db.find({
            selector: {
                email,
            },
        });

        return result.docs[0] || null;
    } catch {
        return null;
    }
}

async function buscaUsuarioPorId(id) {
    const db = nano.use("usuarios");

    try {
        const result = await db.find({
            selector: {
                id,
            },
        });

        return result.docs[0] || null;
    } catch {
        return null;
    }
}

function dadosDisciplina(nome) {
    for (let a = 0; a < semestre.length; a++) {
        if (nome === semestre[a].disciplina) {
            return semestre[a].dados;
        }
    }

    return [];
}

function autenticar(req, res, next) {
    const auth = req.headers.authorization;

    if (!auth) {
        return res.status(401).send("Sem token");
    }

    const token = auth.split(" ")[1];

    try {
        const decoded = jwt.verify(token, SECRET);

        req.usuario = decoded.id;

        next();
    } catch {
        res.status(401).send("Token invalido");
    }
}

function autenticarAdmin(req, res, next) {
    const auth = req.headers.authorization;

    if (!auth) {
        return res.status(401).send("Sem token");
    }

    const token = auth.split(" ")[1];

    try {
        const decoded = jwt.verify(token, SECRET);

        if (decoded.role !== "admin") {
            return res.status(403).send("Acesso negado");
        }

        next();
    } catch {
        res.status(401).send("Token invalido");
    }
}

app.post("/api/admin/login", (req, res) => {
    const { id, senha } = req.body;

    if (id !== ADMIN_ID || senha !== ADMIN_SENHA) {
        return res.status(401).send("Credenciais invalidas");
    }

    const token = jwt.sign({ role: "admin" }, SECRET, { expiresIn: "8h" });

    res.json({ token });
});

app.post("/cadastro", async (req, res) => {
    const { id, email, senha, disciplinas } = req.body;

    if (!id || !email || !senha) {
        return res
            .status(400)
            .send("Campos obrigatorios: id, email, senha");
    }

    const existente = await buscaUsuario(email);

    if (existente) {
        return res.status(409).send("Email ja cadastrado");
    }

    try {
        const db = nano.use("usuarios");

        await db.insert({
            id,
            email,
            senha,
            disciplinas: disciplinas || [],
        });

        for (const disc of disciplinas || []) {
            await criaBD(disc);
        }

        res.send("Cadastro realizado");
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao cadastrar");
    }
});

app.post("/login", async (req, res) => {
    const { email, senha } = req.body;

    const prof = await buscaUsuario(email);

    if (!prof || prof.senha !== senha) {
        return res.status(401).send("Login invalido");
    }

    const token = jwt.sign(
        {
            id: prof.id,
        },
        SECRET,
        {
            expiresIn: "8h",
        },
    );

    res.json({
        token,
        id: prof.id,
        disciplinas: prof.disciplinas,
    });
});

app.get("/init", async (req, res) => {
    await criaTodosBancosDados();
    res.end();
});

app.get("/disciplinas", autenticar, async (req, res) => {
    const prof = await buscaUsuarioPorId(req.usuario);

    if (!prof) {
        return res.status(404).send("Usuario nao encontrado");
    }

    res.send(prof.disciplinas || []);
});

app.get("/disciplinas/:disciplina", autenticar, async (req, res) => {
    const disciplina = req.params.disciplina;

    try {
        const db = nano.use(disciplina);
        const result = await db.list({ include_docs: true });
        const alunos = result.rows
            .map((r) => r.doc)
            .filter((d) => d.tipo === "aluno")
            .map((d) => ({ aluno: d.aluno }));

        if (alunos.length > 0) {
            return res.json(alunos);
        }
    } catch {}

    res.json(dadosDisciplina(disciplina));
});

app.post("/sync/:disciplina", autenticar, async (req, res) => {
    const disciplina = req.params.disciplina;

    const prof = await buscaUsuarioPorId(req.usuario);

    if (!prof) {
        return res.status(404).send("Usuario nao encontrado");
    }

    if (!prof.disciplinas.includes(disciplina)) {
        return res
            .status(403)
            .send("Professor sem acesso a esta disciplina");
    }

    try {
        await criaBD(disciplina);

        const db = nano.use(disciplina);

        const docs = req.body.docs;

        for (const doc of docs) {
            try {
                const existente = await db.get(doc._id);

                await db.insert({
                    ...doc,
                    _rev: existente._rev,
                });
            } catch (err) {
                if (err.statusCode === 404 || err.status === 404) {
                    const novoDoc = { ...doc };
                    delete novoDoc._rev;
                    await db.insert(novoDoc);
                } else {
                    throw err;
                }
            }
        }

        res.send("Sincronizacao realizada");
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro");
    }
});

app.get("/api/admin/disciplinas", autenticarAdmin, async (req, res) => {
    try {
        const db = nano.use("usuarios");
        const result = await db.list({ include_docs: true });
        const profs = result.rows.map((r) => r.doc);
        const discs = [...new Set(profs.flatMap((p) => p.disciplinas || []))];
        res.json(discs);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao buscar disciplinas");
    }
});

app.get("/api/admin/disciplinas/:disciplina", autenticarAdmin, async (req, res) => {
    const disciplina = req.params.disciplina;
    try {
        const db = nano.use(disciplina);
        const result = await db.list({ include_docs: true });
        const docs = result.rows.map((r) => r.doc);
        const aulas = docs.filter((d) => d.data && d.sincronizado === true);

        const freq = {};
        for (const aula of aulas) {
            for (const reg of aula.registros || []) {
                if (!freq[reg.nome]) freq[reg.nome] = { presencas: 0, faltas: 0 };
                if (reg.presente) freq[reg.nome].presencas++;
                else freq[reg.nome].faltas++;
            }
        }

        const alunos = Object.entries(freq).map(([nome, d]) => ({
            nome,
            presencas: d.presencas,
            faltas: d.faltas,
            total: d.presencas + d.faltas,
            frequencia:
                d.presencas + d.faltas > 0
                    ? Math.round((d.presencas / (d.presencas + d.faltas)) * 100)
                    : 0,
        }));

        res.json({ totalAulas: aulas.length, alunos });
    } catch {
        res.json({ totalAulas: 0, alunos: [] });
    }
});

app.listen(7000, () => {
    console.log("Servidor iniciado na porta 7000");
});
