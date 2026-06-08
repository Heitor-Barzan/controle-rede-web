import { createRouter, createWebHistory } from "vue-router";
import Login from "../views/Login.vue";
import Home from "../views/Home.vue";
import Presenca from "../views/Presenca.vue";
import { DadosUsuario } from "@/stores/usuario.js";

const routes = [
    { path: "/", component: Login },
    { path: "/home", component: Home, meta: { requiresAuth: true } },
    { path: "/presenca/:disciplina", component: Presenca, meta: { requiresAuth: true } },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to) => {
    const auth = DadosUsuario();
    if (to.meta.requiresAuth && !auth.id) {
        return "/";
    }
});

export default router;