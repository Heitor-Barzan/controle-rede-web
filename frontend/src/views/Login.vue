<template>
    <div>
        <h2>{{ modo === "login" ? "Login" : "Cadastro" }}</h2>

        <div v-if="modo === 'cadastro'">
            <input v-model="dados.id" placeholder="id (ex: fabio)" />
        </div>
        <input v-model="dados.email" placeholder="email" />
        <input v-model="dados.senha" type="password" placeholder="senha" />
        <div v-if="modo === 'cadastro'">
            <input v-model="dados.disciplinas" placeholder="disciplinas separadas por virgula" />
        </div>

        <button @click="submete()">
            {{ modo === "login" ? "Entrar" : "Cadastrar" }}
        </button>
        <button @click="alternaModal()">
            {{ modo === "login" ? "Criar conta" : "Ja tenho conta" }}
        </button>

        <span style="color: red">{{ erro }}</span>
        <span style="color: green">{{ msg }}</span>
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
            fetch("http://localhost:7000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: this.dados.email,
                    senha: this.dados.senha,
                }),
            })
                .then((res) => {
                    if (res.status === 401) {
                        this.erro = "Credenciais invalidas";
                        return null;
                    }
                    if (!res.ok) {
                        this.erro = "Erro no servidor";
                        return null;
                    }
                    return res.json();
                })
                .then((data) => {
                    if (!data) return;
                    this.user.leUsuario(data.id, this.dados.email, data.disciplinas, data.token);
                    this.$router.push("/home");
                })
                .catch(() => {
                    this.erro = "Sem conexao com o servidor";
                });
        },
        fazCadastro() {
            const disciplinas = this.dados.disciplinas
                .split(",")
                .map((d) => d.trim())
                .filter((d) => d.length > 0);
            fetch("http://localhost:7000/cadastro", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: this.dados.id,
                    email: this.dados.email,
                    senha: this.dados.senha,
                    disciplinas,
                }),
            })
                .then((res) => {
                    if (!res.ok) {
                        return res.text().then((t) => {
                            this.erro = t;
                        });
                    }
                    this.msg = "Cadastro realizado, faca login";
                    this.modo = "login";
                })
                .catch(() => {
                    this.erro = "Sem conexao com o servidor";
                });
        },
    },
};
</script>