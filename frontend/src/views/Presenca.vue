<template>
    <div class="page">
        <header class="header">
            <div class="brand">
                <span class="brand-icon">✦</span>
                <span class="brand-name">Presença</span>
            </div>
            <button class="btn-voltar" @click="$router.go(-1)">← Voltar</button>
        </header>

        <main class="main">
            <div class="page-header">
                <div class="disc-badge">{{ disciplina }}</div>
                <h1 class="title">Registro de aula</h1>
            </div>

            <!-- Data e sync -->
            <div class="section">
                <div class="section-row">
                    <div class="field">
                        <label>Data da aula</label>
                        <input v-model="novaData" type="date" />
                    </div>
                    <div class="sync-area">
                        <button
                            class="btn-sync"
                            @click="sincronizar()"
                            :disabled="sincronizado"
                            :class="{ synced: sincronizado }"
                        >
                            <span v-if="sincronizado">✔ Sincronizado</span>
                            <span v-else-if="msgSync === 'Sincronizando...'">⟳ Sincronizando...</span>
                            <span v-else>↑ Sincronizar</span>
                        </button>
                        <span v-if="msgSync && msgSync !== 'Sincronizado' && msgSync !== 'Sincronizando...'" class="sync-erro">{{ msgSync }}</span>
                    </div>
                </div>

                <div v-if="sincronizado" class="aviso-sync">
                    Presença já sincronizada para este dia — somente leitura.
                </div>
            </div>

            <!-- Lista de alunos -->
            <div class="section">
                <div class="section-label">Alunos</div>
                <div v-if="alunos.length === 0" class="empty">Nenhum aluno encontrado.</div>
                <div class="alunos-lista">
                    <label
                        v-for="aluno in alunos"
                        :key="aluno.nome"
                        class="aluno-row"
                        :class="{ presente: aluno.presente, disabled: sincronizado }"
                    >
                        <span class="aluno-nome">{{ aluno.nome }}</span>
                        <div class="checkbox-wrap">
                            <input
                                type="checkbox"
                                v-model="aluno.presente"
                                :disabled="sincronizado"
                                class="checkbox-input"
                            />
                            <div class="checkbox-custom">
                                <svg v-if="aluno.presente" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2 7L6 11L12 3" stroke="#0F1923" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                        </div>
                    </label>
                </div>

                <div v-if="erro" class="alert-erro">{{ erro }}</div>

                <button class="btn-salvar" @click="salvarAula()" :disabled="sincronizado">
                    Salvar presença
                </button>
            </div>

            <!-- Histórico -->
            <div class="section">
                <div class="section-label">Histórico</div>
                <div v-if="historico.length === 0" class="empty">Nenhuma aula registrada.</div>
                <div class="historico-lista">
                    <div v-for="doc in historico" :key="doc._id" class="hist-item">
                        <div class="hist-header">
                            <span class="hist-data">{{ doc.data }}</span>
                            <span v-if="doc.sincronizado" class="hist-badge">sincronizado</span>
                            <span v-else class="hist-badge pendente">pendente</span>
                        </div>
                        <div class="hist-registros">
                            <span
                                v-for="r in doc.registros"
                                :key="r.nome"
                                class="hist-aluno"
                                :class="{ ausente: !r.presente }"
                            >
                                {{ r.nome }}: <b>{{ r.presente ? "P" : "F" }}</b>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
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
            this.db.allDocs({ include_docs: true }).then((result) => {
                const docs = result.rows.map((r) => r.doc);
                const docDia = docs.find((d) => d._id === this.novaData);
                if (docDia) {
                    this.sincronizado = !!docDia.sincronizado;
                    this.alunos = docDia.registros.map((r) => ({ nome: r.nome, presente: r.presente }));
                } else {
                    this.sincronizado = false;
                    const alunosDocs = docs.filter((d) => d.tipo === "aluno");
                    if (alunosDocs.length > 0) {
                        this.alunos = alunosDocs.map((d) => ({ nome: d.aluno, presente: false }));
                    } else {
                        this.buscaAlunosServidor();
                    }
                }
            }).catch(console.log);
        },
        buscaAlunosServidor() {
            fetch("/disciplinas/" + this.disciplina, { headers: { Authorization: "Bearer " + this.user.token } })
                .then((res) => { if (!res.ok) return []; return res.json(); })
                .then((dados) => {
                    if (!dados || dados.length === 0) return;
                    const puts = dados.map((d) => this.db.put({ _id: "aluno_" + d.aluno, tipo: "aluno", aluno: d.aluno }).catch((err) => { if (err.status !== 409) console.log(err); }));
                    return Promise.all(puts);
                })
                .then(() => this.db.allDocs({ include_docs: true }))
                .then((result) => {
                    const alunosDocs = result.rows.map((r) => r.doc).filter((d) => d.tipo === "aluno");
                    this.alunos = alunosDocs.map((d) => ({ nome: d.aluno, presente: false }));
                }).catch(console.log);
        },
        salvarAula() {
            if (!this.novaData) { this.erro = "Informe a data"; return; }
            const doc = { _id: this.novaData, data: this.novaData, sincronizado: false, registros: this.alunos.map((a) => ({ nome: a.nome, presente: a.presente })) };
            this.db.get(doc._id)
                .then((existente) => { doc._rev = existente._rev; return this.db.put(doc); })
                .catch((err) => { if (err.status === 404) return this.db.put(doc); console.log(err); })
                .then(() => { this.erro = ""; this.carregaHistorico(); });
        },
        carregaHistorico() {
            this.db.allDocs({ include_docs: true, descending: true })
                .then((result) => { this.historico = result.rows.map((r) => r.doc).filter((d) => d.data); })
                .catch(console.log);
        },
        sincronizar() {
            this.msgSync = "Sincronizando...";
            this.db.allDocs({ include_docs: true })
                .then((result) => {
                    const docs = result.rows.map((r) => r.doc).filter((d) => d._id === this.novaData).map((d) => ({ ...d, sincronizado: true }));
                    return fetch("/sync/" + this.disciplina, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + this.user.token }, body: JSON.stringify({ docs }) });
                })
                .then((res) => {
                    if (res.status === 401) { this.msgSync = "Sessão expirada"; this.user.limpa(); this.$router.push("/"); return null; }
                    if (res.ok) { this.msgSync = "Sincronizado"; return this.marcaDocComoSincronizado(); }
                    else { this.msgSync = "Erro: " + res.status; return null; }
                })
                .catch(() => { this.msgSync = "Sem conexão"; });
        },
        marcaDocComoSincronizado() {
            return this.db.get(this.novaData)
                .then((doc) => { doc.sincronizado = true; return this.db.put(doc); })
                .then(() => { this.sincronizado = true; this.carregaHistorico(); })
                .catch((err) => { if (err.status !== 404) console.log(err); });
        },
    },
    watch: { novaData() { this.carregaAlunos(); } },
    mounted() {
        this.db = new window.PouchDB(this.disciplina);
        this.carregaAlunos();
        this.carregaHistorico();
    },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

.page {
    min-height: 100vh;
    background: #0F1923;
    font-family: 'Inter', sans-serif;
}

.header {
    border-bottom: 1px solid #1E3347;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 40px;
}

.brand { display: flex; align-items: center; gap: 8px; }
.brand-icon { color: #2DD4A0; font-size: 16px; }
.brand-name { color: #E8EFF5; font-size: 14px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }

.btn-voltar {
    background: transparent;
    border: 1px solid #1E3347;
    border-radius: 6px;
    color: #7A9BB5;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 500;
    padding: 6px 12px;
    transition: border-color 0.15s, color 0.15s;
}
.btn-voltar:hover { border-color: #2DD4A0; color: #2DD4A0; }

.main {
    max-width: 680px;
    margin: 0 auto;
    padding: 48px 40px;
    display: flex;
    flex-direction: column;
    gap: 40px;
}

.page-header { display: flex; flex-direction: column; gap: 10px; }

.disc-badge {
    display: inline-block;
    background: rgba(45, 212, 160, 0.1);
    border: 1px solid rgba(45, 212, 160, 0.25);
    border-radius: 6px;
    color: #2DD4A0;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    padding: 4px 10px;
    text-transform: uppercase;
    width: fit-content;
}

.title { color: #E8EFF5; font-size: 26px; font-weight: 700; }

.section {
    background: #162330;
    border: 1px solid #1E3347;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.section-label {
    color: #7A9BB5;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.section-row {
    display: flex;
    align-items: flex-end;
    gap: 16px;
    flex-wrap: wrap;
}

.field { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 160px; }

.field label {
    color: #7A9BB5;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.field input[type="date"] {
    background: #0F1923;
    border: 1px solid #1E3347;
    border-radius: 8px;
    color: #E8EFF5;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    padding: 10px 12px;
    outline: none;
    transition: border-color 0.15s;
}
.field input[type="date"]:focus { border-color: #2DD4A0; }
.field input[type="date"]:disabled { opacity: 0.4; }

.sync-area { display: flex; flex-direction: column; gap: 6px; }

.btn-sync {
    background: #0F1923;
    border: 1px solid #1E3347;
    border-radius: 8px;
    color: #E8EFF5;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    padding: 10px 18px;
    transition: border-color 0.15s, color 0.15s;
    white-space: nowrap;
}
.btn-sync:hover:not(:disabled) { border-color: #2DD4A0; color: #2DD4A0; }
.btn-sync.synced { border-color: rgba(45,212,160,0.3); color: #2DD4A0; cursor: default; }
.btn-sync:disabled:not(.synced) { opacity: 0.4; cursor: not-allowed; }

.sync-erro { color: #FF6B6B; font-size: 12px; }

.aviso-sync {
    background: rgba(45, 212, 160, 0.06);
    border: 1px solid rgba(45, 212, 160, 0.15);
    border-radius: 8px;
    color: #2DD4A0;
    font-size: 13px;
    padding: 10px 14px;
}

.alunos-lista { display: flex; flex-direction: column; gap: 2px; }

.aluno-row {
    align-items: center;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    padding: 12px 14px;
    transition: background 0.1s;
    user-select: none;
}
.aluno-row:hover:not(.disabled) { background: rgba(45, 212, 160, 0.05); }
.aluno-row.presente { background: rgba(45, 212, 160, 0.06); }
.aluno-row.disabled { cursor: default; opacity: 0.6; }

.aluno-nome { color: #E8EFF5; font-size: 15px; font-weight: 400; }
.aluno-row.presente .aluno-nome { color: #E8EFF5; }

.checkbox-wrap { position: relative; }
.checkbox-input { position: absolute; opacity: 0; width: 0; height: 0; }

.checkbox-custom {
    width: 22px;
    height: 22px;
    border: 2px solid #1E3347;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, border-color 0.15s;
    background: #0F1923;
}

.aluno-row.presente .checkbox-custom {
    background: #2DD4A0;
    border-color: #2DD4A0;
}

.checkbox-custom svg { width: 14px; height: 14px; }

.alert-erro {
    background: rgba(255, 80, 80, 0.1);
    border: 1px solid rgba(255, 80, 80, 0.25);
    border-radius: 8px;
    color: #FF6B6B;
    font-size: 13px;
    padding: 10px 14px;
}

.btn-salvar {
    background: #2DD4A0;
    border: none;
    border-radius: 8px;
    color: #0F1923;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 700;
    padding: 12px;
    transition: opacity 0.15s, transform 0.1s;
    align-self: flex-start;
    padding: 11px 28px;
}
.btn-salvar:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.btn-salvar:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

.empty { color: #3A5670; font-size: 13px; text-align: center; padding: 24px 0; }

.historico-lista { display: flex; flex-direction: column; gap: 10px; }

.hist-item {
    background: #0F1923;
    border: 1px solid #1E3347;
    border-radius: 8px;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.hist-header { display: flex; align-items: center; gap: 10px; }

.hist-data {
    color: #E8EFF5;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 600;
}

.hist-badge {
    background: rgba(45, 212, 160, 0.1);
    border: 1px solid rgba(45, 212, 160, 0.2);
    border-radius: 4px;
    color: #2DD4A0;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    padding: 2px 7px;
    text-transform: uppercase;
}

.hist-badge.pendente {
    background: rgba(255, 180, 0, 0.08);
    border-color: rgba(255, 180, 0, 0.2);
    color: #FFB400;
}

.hist-registros { display: flex; flex-wrap: wrap; gap: 10px; }

.hist-aluno {
    color: #7A9BB5;
    font-size: 12px;
}
.hist-aluno b { color: #2DD4A0; }
.hist-aluno.ausente b { color: #FF6B6B; }
</style>
