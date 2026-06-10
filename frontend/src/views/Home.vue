<template>
    <div class="page">
        <header class="header">
            <div class="brand">
                <span class="brand-icon">✦</span>
                <span class="brand-name">Presença</span>
            </div>
            <div class="user-info">
                <span class="user-id">{{ user.id }}</span>
                <button class="btn-sair" @click="sair()">Sair</button>
            </div>
        </header>

        <main class="main">
            <div class="page-header">
                <h1 class="title">Suas disciplinas</h1>
                <p class="subtitle">Selecione uma disciplina para registrar presença</p>
            </div>

            <div class="grid">
                <div
                    v-for="disc in user.disciplinas"
                    :key="disc"
                    class="disc-card"
                    @click="$router.push('/presenca/' + disc)"
                >
                    <div class="disc-code">{{ disc }}</div>
                    <div class="disc-arrow">→</div>
                </div>
            </div>

            <div v-if="user.disciplinas.length === 0" class="empty">
                Nenhuma disciplina cadastrada.
            </div>
        </main>
    </div>
</template>

<script>
import { DadosUsuario } from "@/stores/usuario.js";

export default {
    data() {
        return { user: DadosUsuario() };
    },
    methods: {
        sair() {
            this.user.limpa();
            this.$router.push("/");
        },
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

.brand {
    display: flex;
    align-items: center;
    gap: 8px;
}

.brand-icon { color: #2DD4A0; font-size: 16px; }
.brand-name {
    color: #E8EFF5;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 16px;
}

.user-id {
    color: #7A9BB5;
    font-size: 13px;
    font-family: 'JetBrains Mono', monospace;
}

.btn-sair {
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

.btn-sair:hover {
    border-color: #FF6B6B;
    color: #FF6B6B;
}

.main {
    max-width: 720px;
    margin: 0 auto;
    padding: 56px 40px;
}

.page-header { margin-bottom: 40px; }

.title {
    color: #E8EFF5;
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
}

.subtitle {
    color: #7A9BB5;
    font-size: 14px;
}

.grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.disc-card {
    background: #162330;
    border: 1px solid #1E3347;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    transition: border-color 0.15s, transform 0.1s;
}

.disc-card:hover {
    border-color: #2DD4A0;
    transform: translateX(4px);
}

.disc-code {
    color: #E8EFF5;
    font-family: 'JetBrains Mono', monospace;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

.disc-arrow {
    color: #2DD4A0;
    font-size: 18px;
    opacity: 0;
    transition: opacity 0.15s;
}

.disc-card:hover .disc-arrow {
    opacity: 1;
}

.empty {
    color: #3A5670;
    font-size: 14px;
    text-align: center;
    padding: 48px 0;
}
</style>
