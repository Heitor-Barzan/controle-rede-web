import { defineStore } from "pinia";

export const DadosUsuario = defineStore("Usuario", {
    state: () => ({
        id: localStorage.getItem("usuario_id") || "",
        email: localStorage.getItem("usuario_email") || "",
        disciplinas: JSON.parse(localStorage.getItem("usuario_disciplinas") || "[]"),
        token: localStorage.getItem("usuario_token") || "",
    }),
    actions: {
        leUsuario(id, email, disciplinas, token) {
            this.id = id;
            this.email = email;
            this.disciplinas = disciplinas;
            this.token = token;
            localStorage.setItem("usuario_id", id);
            localStorage.setItem("usuario_email", email);
            localStorage.setItem("usuario_disciplinas", JSON.stringify(disciplinas));
            localStorage.setItem("usuario_token", token);
        },
        limpa() {
            this.id = "";
            this.email = "";
            this.disciplinas = [];
            this.token = "";
            localStorage.removeItem("usuario_id");
            localStorage.removeItem("usuario_email");
            localStorage.removeItem("usuario_disciplinas");
            localStorage.removeItem("usuario_token");
        },
    },
});