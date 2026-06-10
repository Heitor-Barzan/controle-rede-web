import { createRouter, createWebHistory } from "vue-router";
import Login from "../views/Login.vue";
import Home from "../views/Home.vue";
import Presenca from "../views/Presenca.vue";
import Admin from "../views/Admin.vue";
import AdminLogin from "../views/AdminLogin.vue";
import { DadosUsuario } from "@/stores/usuario.js";
import { DadosAdmin } from "@/stores/admin.js";

const routes = [
    { path: "/", component: Login },
    { path: "/home", component: Home, meta: { requiresAuth: true } },
    { path: "/presenca/:disciplina", component: Presenca, meta: { requiresAuth: true } },
    { path: "/admin/login", component: AdminLogin },
    { path: "/admin", component: Admin, meta: { requiresAdmin: true } },
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

    const admin = DadosAdmin();
    if (to.meta.requiresAdmin && !admin.token) {
        return "/admin/login";
    }
});

export default router;