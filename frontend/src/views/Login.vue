<template>
    <div class="page">
        <div class="card">
            <div class="brand">
                <span class="brand-icon">✦</span>
                <span class="brand-name">Presença</span>
            </div>

            <h1 class="title">{{ modo === "login" ? "Entrar" : "Criar conta" }}</h1>
            <p class="subtitle">{{ modo === "login" ? "Acesse sua conta de professor" : "Cadastre-se como professor" }}</p>

            <div class="form">
                <div v-if="modo === 'cadastro'" class="field">
                    <label>ID</label>
                    <input v-model="dados.id" placeholder="ex: fabio" />
                </div>

                <div class="field">
                    <label>E-mail</label>
                    <input v-model="dados.email" type="email" placeholder="seu@email.com" />
                </div>

                <div class="field">
                    <label>Senha</label>
                    <input v-model="dados.senha" type="password" placeholder="••••••••" />
                </div>

                <div v-if="modo === 'cadastro'" class="field">
                    <label>Disciplinas</label>
                    <input v-model="dados.disciplinas" placeholder="dec0007, dec0020, dec0040" />
                    <span class="hint">Separe por vírgula</span>
                </div>

                <div v-if="erro" class="alert alert-erro">{{ erro }}</div>
                <div v-if="msg" class="alert alert-ok">{{ msg }}</div>

                <button class="btn-primary" @click="submete()">
                    {{ modo === "login" ? "Entrar" : "Cadastrar" }}
                </button>

                <button class="btn-ghost" @click="alternaModal()">
                    {{ modo === "login" ? "Criar conta" : "Já tenho conta" }}
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { DadosUsuario } from "@/stores/usuario.js";

export default {
    data() {
        return {
            user: DadosUsuario(),
            modo: "login",
            dados: { id: "", email: "", senha: "", disciplinas: "" },
            erro: "",
            msg: "",
        };
    },
    methods: {
        alternaModal() {
            this.modo = this.modo === "login" ? "cadastro" : "login";
            this.erro = "";
            this.msg = "";
        },
        submete() {
            if (this.modo === "login") {
                this.fazLogin();
            } else {
                this.fazCadastro();
            }
        },
        fazLogin() {
            fetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: this.dados.email, senha: this.dados.senha }),
            })
                .then((res) => {
                    if (res.status === 401) { this.erro = "Credenciais inválidas"; return null; }
                    if (!res.ok) { this.erro = "Erro no servidor"; return null; }
                    return res.json();
                })
                .then((data) => {
                    if (!data) return;
                    this.user.leUsuario(data.id, this.dados.email, data.disciplinas, data.token);
                    this.$router.push("/home");
                })
                .catch(() => { this.erro = "Sem conexão com o servidor"; });
        },
        fazCadastro() {
            const disciplinas = this.dados.disciplinas.split(",").map((d) => d.trim()).filter((d) => d.length > 0);
            fetch("/cadastro", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: this.dados.id, email: this.dados.email, senha: this.dados.senha, disciplinas }),
            })
                .then((res) => {
                    if (!res.ok) return res.text().then((t) => { this.erro = t; });
                    this.msg = "Cadastro realizado, faça login";
                    this.modo = "login";
                })
                .catch(() => { this.erro = "Sem conexão com o servidor"; });
        },
    },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

.page {
    min-height: 100vh;
    background: #0F1923;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Inter', sans-serif;
    padding: 24px;
}

.card {
    background: #162330;
  
    border-radius: 16px;
    padding: 48px 40px;
    width: 100%;
    max-width: 400px;
}

.brand {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 40px;
}

.brand-icon {
    color: #2DD4A0;
    font-size: 18px;
}

.brand-name {
    color: #E8EFF5;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.title {
    color: #E8EFF5;
    font-size: 26px;
    font-weight: 700;
    margin-bottom: 6px;
}

.subtitle {
    color: #7A9BB5;
    font-size: 14px;
    font-weight: 400;
    margin-bottom: 32px;
}

.form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.field label {
    color: #7A9BB5;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.field input {
    background: #0F1923;
    border: 1px solid #1E3347;
    border-radius: 8px;
    color: #E8EFF5;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    padding: 11px 14px;
    outline: none;
    transition: border-color 0.15s;
}

.field input:focus {
    border-color: #2DD4A0;
}

.field input::placeholder {
    color: #3A5670;
}

.hint {
    color: #3A5670;
    font-size: 11px;
}

.alert {
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
}

.alert-erro {
    background: rgba(255, 80, 80, 0.1);
    border: 1px solid rgba(255, 80, 80, 0.25);
    color: #FF6B6B;
}

.alert-ok {
    background: rgba(45, 212, 160, 0.08);
    border: 1px solid rgba(45, 212, 160, 0.2);
    color: #2DD4A0;
}

.btn-primary {
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
    margin-top: 4px;
}

.btn-primary:hover {
    opacity: 0.9;
    transform: translateY(-1px);
}

.btn-ghost {
    background: transparent;
    border: 1px solid #1E3347;
    border-radius: 8px;
    color: #7A9BB5;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 500;
    padding: 11px;
    transition: border-color 0.15s, color 0.15s;
}

.btn-ghost:hover {
    border-color: #2DD4A0;
    color: #2DD4A0;
}
</style>
