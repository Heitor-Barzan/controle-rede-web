<template>
    <div>
        <h2>{{ disciplina }}</h2>
        <button @click="$router.go(-1)">Voltar</button>
        <button @click="sincronizar()" :disabled="sincronizado">Sincronizar</button>
        <span>{{ msgSync }}</span>

        <h3>Registrar aula</h3>
        <input v-model="novaData" type="date" />

        <div v-if="sincronizado">
            <span style="color: gray">Presenca ja sincronizada para este dia.</span>
        </div>

        <div v-for="aluno in alunos" :key="aluno.nome">
            <label>
                <input type="checkbox" v-model="aluno.presente" :disabled="sincronizado" />
                {{ aluno.nome }}
            </label>
        </div>

        <button @click="salvarAula()" :disabled="sincronizado">Salvar</button>
        <span style="color: red">{{ erro }}</span>

        <h3>Historico</h3>
        <div v-for="doc in historico" :key="doc._id">
            <b>{{ doc.data }}</b>
            <span v-if="doc.sincronizado" style="color: gray"> (sincronizado) </span>
            <span v-for="r in doc.registros" :key="r.nome">
                {{ r.nome }}: {{ r.presente ? "P" : "F" }} |
            </span>
        </div>
    </div>
</template>

<script>
import { DadosUsuario } from "@/stores/usuario.js";

export default {
    data() {
        return {
            user: DadosUsuario(),
            disciplina: this.$route.params.disciplina,
            alunos: [],
            novaData: new Date().toISOString().split("T")[0],
            historico: [],
            erro: "",
            msgSync: "",
            db: null,
            sincronizado: false,
        };
    },
    methods: {
        carregaAlunos() {
            this.db
                .allDocs({ include_docs: true })
                .then((result) => {
                    const docs = result.rows.map((r) => r.doc);
                    const docDia = docs.find((d) => d._id === this.novaData);
                    if (docDia) {
                        this.sincronizado = !!docDia.sincronizado;
                        this.alunos = docDia.registros.map((r) => ({
                            nome: r.nome,
                            presente: r.presente,
                        }));
                    } else {
                        this.sincronizado = false;
                        const alunosDocs = docs.filter((d) => d.tipo === "aluno");
                        if (alunosDocs.length > 0) {
                            this.alunos = alunosDocs.map((d) => ({
                                nome: d.aluno,
                                presente: false,
                            }));
                        } else {
                            this.buscaAlunosServidor();
                        }
                    }
                })
                .catch((err) => {
                    console.log(err);
                });
        },
        buscaAlunosServidor() {
            fetch("/disciplinas/" + this.disciplina, {
                headers: {
                    Authorization: "Bearer " + this.user.token,
                },
            })
                .then((res) => {
                    if (!res.ok) return [];
                    return res.json();
                })
                .then((dados) => {
                    if (!dados || dados.length === 0) return;
                    const puts = dados.map((d) =>
                        this.db.put({
                            _id: "aluno_" + d.aluno,
                            tipo: "aluno",
                            aluno: d.aluno,
                        }).catch((err) => {
                            if (err.status !== 409) console.log(err);
                        })
                    );
                    return Promise.all(puts);
                })
                .then(() => {
                    return this.db.allDocs({ include_docs: true });
                })
                .then((result) => {
                    const alunosDocs = result.rows
                        .map((r) => r.doc)
                        .filter((d) => d.tipo === "aluno");
                    this.alunos = alunosDocs.map((d) => ({
                        nome: d.aluno,
                        presente: false,
                    }));
                })
                .catch((err) => {
                    console.log(err);
                });
        },
        salvarAula() {
            if (!this.novaData) {
                this.erro = "Informe a data";
                return;
            }
            const doc = {
                _id: this.novaData,
                data: this.novaData,
                sincronizado: false,
                registros: this.alunos.map((a) => ({
                    nome: a.nome,
                    presente: a.presente,
                })),
            };
            this.db
                .get(doc._id)
                .then((existente) => {
                    doc._rev = existente._rev;
                    return this.db.put(doc);
                })
                .catch((err) => {
                    if (err.status === 404) {
                        return this.db.put(doc);
                    }
                    console.log(err);
                })
                .then(() => {
                    this.erro = "";
                    this.carregaHistorico();
                });
        },
        carregaHistorico() {
            this.db
                .allDocs({ include_docs: true, descending: true })
                .then((result) => {
                    this.historico = result.rows
                        .map((r) => r.doc)
                        .filter((d) => d.data);
                })
                .catch((err) => {
                    console.log(err);
                });
        },
        sincronizar() {
            this.msgSync = "Sincronizando...";
            this.db
                .allDocs({ include_docs: true })
                .then((result) => {
                    const docs = result.rows.map((r) => r.doc);
                    return fetch("/sync/" + this.disciplina, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: "Bearer " + this.user.token,
                        },
                        body: JSON.stringify({ docs }),
                    });
                })
                .then((res) => {
                    if (res.status === 401) {
                        this.msgSync = "Sessao expirada, faca login novamente";
                        this.user.limpa();
                        this.$router.push("/");
                        return null;
                    }
                    if (res.ok) {
                        this.msgSync = "Sincronizado";
                        return this.marcaDocComoSincronizado();
                    } else {
                        this.msgSync = "Erro: " + res.status;
                        return null;
                    }
                })
                .catch(() => {
                    this.msgSync = "Sem conexao";
                });
        },
        marcaDocComoSincronizado() {
            return this.db
                .get(this.novaData)
                .then((doc) => {
                    doc.sincronizado = true;
                    return this.db.put(doc);
                })
                .then(() => {
                    this.sincronizado = true;
                    this.carregaHistorico();
                })
                .catch((err) => {
                    if (err.status !== 404) console.log(err);
                });
        },
    },
    watch: {
        novaData() {
            this.carregaAlunos();
        },
    },
    mounted() {
        this.db = new window.PouchDB(this.disciplina);
        this.carregaAlunos();
        this.carregaHistorico();
    },
};
</script>