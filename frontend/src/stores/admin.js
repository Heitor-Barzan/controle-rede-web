import { defineStore } from "pinia";

export const DadosAdmin = defineStore("Admin", {
    state: () => ({
        token: sessionStorage.getItem("admin_token") || "",
    }),
    actions: {
        login(token) {
            this.token = token;
            sessionStorage.setItem("admin_token", token);
        },
        sair() {
            this.token = "";
            sessionStorage.removeItem("admin_token");
        },
    },
});
