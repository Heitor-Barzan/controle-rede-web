<template>
    <div>
        <h2>Disciplinas de {{ user.id }}</h2>
        <ul>
            <li
                v-for="disc in user.disciplinas"
                :key="disc"
                @click="$router.push('/presenca/' + disc)"
                style="cursor: pointer"
            >
                {{ disc }}
            </li>
        </ul>
        <button @click="sair()">Sair</button>
    </div>
</template>

<script>
import { DadosUsuario } from "@/stores/usuario.js";

export default {
    data() {
        return {
            user: DadosUsuario(),
        };
    },
    methods: {
        sair() {
            this.user.limpa();
            this.$router.push("/");
        },
    },
};
</script>