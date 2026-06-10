<template>
    <div class="pagina">
        <div class="card">
            <h2 class="titulo">Acesso Institucional</h2>
            <p class="subtitulo">Entre com suas credenciais para visualizar os dados de frequência</p>

            <div class="campo">
                <label>Usuário</label>
                <input v-model="dados.id" placeholder="admin" @keyup.enter="entrar" />
            </div>
            <div class="campo">
                <label>Senha</label>
                <input v-model="dados.senha" type="password" placeholder="••••••••" @keyup.enter="entrar" />
            </div>

            <button class="btn" :disabled="carregando" @click="entrar">
                {{ carregando ? "Entrando..." : "Entrar" }}
            </button>

            <span class="erro">{{ erro }}</span>
        </div>
    </div>
</template>

<script>
import { DadosAdmin } from "@/stores/admin.js";

export default {
    data() {
        return {
            admin: DadosAdmin(),
            dados: { id: "", senha: "" },
            carregando: false,
            erro: "",
        };
    },
    methods: {
        entrar() {
            if (!this.dados.id || !this.dados.senha) {
                this.erro = "Preencha todos os campos";
                return;
            }
            this.carregando = true;
            this.erro = "";
            fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: this.dados.id, senha: this.dados.senha }),
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
                    this.admin.login(data.token);
                    this.$router.push("/admin");
                })
                .catch(() => {
                    this.erro = "Sem conexao com o servidor";
                })
                .finally(() => {
                    this.carregando = false;
                });
        },
    },
};
</script>

<style scoped>
.pagina {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f0f4f8;
}

.card {
    background: white;
    border-radius: 12px;
    padding: 40px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.titulo {
    margin: 0;
    font-size: 1.5rem;
    color: #1a202c;
}

.subtitulo {
    margin: 0;
    color: #718096;
    font-size: 0.9rem;
}

.campo {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.campo label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #4a5568;
}

.campo input {
    padding: 10px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    outline: none;
    transition: border-color 0.2s;
}

.campo input:focus {
    border-color: #4299e1;
}

.btn {
    padding: 12px;
    background: #4299e1;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
}

.btn:hover:not(:disabled) {
    background: #3182ce;
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.erro {
    color: #e53e3e;
    font-size: 0.9rem;
    min-height: 1.2em;
}
</style>
