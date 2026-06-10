<template>
  <div class="pagina">
    <header class="cabecalho">
      <div class="cabecalho-conteudo">
        <h1 class="titulo-sistema">Sistema de Controle de Presença</h1>
        <button class="btn-sair" @click="sair">Sair</button>
      </div>
    </header>

    <main class="conteudo">
      <!-- Lista de disciplinas -->
      <div v-if="!disciplinaSelecionada">
        <h2 class="secao-titulo">Disciplinas</h2>
        <p v-if="carregando" class="estado-msg">Carregando...</p>
        <p v-else-if="disciplinas.length === 0" class="estado-msg">
          Nenhuma disciplina encontrada.
        </p>
        <div v-else class="grade-disciplinas">
          <div
            v-for="disc in disciplinas"
            :key="disc"
            class="card-disciplina"
            @click="selecionarDisciplina(disc)"
          >
            <span class="disc-icone">📚</span>
            <span class="disc-nome">{{ disc.toUpperCase() }}</span>
            <span class="disc-acao">Ver frequências →</span>
          </div>
        </div>
      </div>

      <!-- Detalhe da disciplina -->
      <div v-else>
        <div class="barra-nav">
          <button class="btn-voltar" @click="disciplinaSelecionada = null">
            ← Voltar
          </button>
          <h2 class="secao-titulo">
            {{ disciplinaSelecionada.toUpperCase() }}
          </h2>
        </div>

        <p v-if="carregando" class="estado-msg">Carregando...</p>

        <div v-else>
          <!-- Cards de resumo -->
          <div class="grade-resumo">
            <div class="card-resumo">
              <span class="resumo-valor">{{ dados.totalAulas }}</span>
              <span class="resumo-label">Aulas registradas</span>
            </div>
            <div class="card-resumo">
              <span class="resumo-valor">{{ dados.alunos.length }}</span>
              <span class="resumo-label">Alunos</span>
            </div>
            <div class="card-resumo">
              <span class="resumo-valor" :class="corMedia(mediaFrequencia)">
                {{ mediaFrequencia }}%
              </span>
              <span class="resumo-label">Frequência média</span>
            </div>
            <div class="card-resumo">
              <span class="resumo-valor vermelho">{{ alunosEmRisco }}</span>
              <span class="resumo-label">Alunos em risco (< 75%)</span>
            </div>
          </div>

          <p v-if="dados.alunos.length === 0" class="estado-msg">
            Nenhum registro de presença sincronizado para esta disciplina.
          </p>

          <!-- Tabela de frequências -->
          <div v-else class="tabela-container">
            <table class="tabela">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Presenças</th>
                  <th>Faltas</th>
                  <th>Total</th>
                  <th>Frequência</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="aluno in alunosOrdenados" :key="aluno.nome">
                  <td class="nome-aluno">{{ aluno.nome }}</td>
                  <td class="centro verde">{{ aluno.presencas }}</td>
                  <td class="centro vermelho">{{ aluno.faltas }}</td>
                  <td class="centro">{{ aluno.total }}</td>
                  <td class="centro">
                    <span class="badge-freq" :class="corFreq(aluno.frequencia)">
                      {{ aluno.frequencia }}%
                    </span>
                  </td>
                  <td class="centro">
                    <span
                      class="badge-situacao"
                      :class="corFreq(aluno.frequencia)"
                    >
                      {{ situacao(aluno.frequencia) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>

    <span v-if="erro" class="erro-global">{{ erro }}</span>
  </div>
</template>

<script>
import { DadosAdmin } from "@/stores/admin.js";

export default {
  data() {
    return {
      admin: DadosAdmin(),
      disciplinas: [],
      disciplinaSelecionada: null,
      dados: { totalAulas: 0, alunos: [] },
      carregando: false,
      erro: "",
    };
  },
  computed: {
    alunosOrdenados() {
      return [...this.dados.alunos].sort((a, b) => a.frequencia - b.frequencia);
    },
    mediaFrequencia() {
      if (this.dados.alunos.length === 0) return 0;
      const soma = this.dados.alunos.reduce((acc, a) => acc + a.frequencia, 0);
      return Math.round(soma / this.dados.alunos.length);
    },
    alunosEmRisco() {
      return this.dados.alunos.filter((a) => a.frequencia < 75).length;
    },
  },
  methods: {
    sair() {
      this.admin.sair();
      this.$router.push("/admin/login");
    },
    corFreq(freq) {
      if (freq >= 85) return "verde";
      if (freq >= 75) return "amarelo";
      return "vermelho";
    },
    corMedia(freq) {
      return this.corFreq(freq);
    },
    situacao(freq) {
      if (freq >= 75) return "Aprovado";
      return "Em risco";
    },
    fetchComAuth(url) {
      return fetch(url, {
        headers: { Authorization: "Bearer " + this.admin.token },
      }).then((res) => {
        if (res.status === 401 || res.status === 403) {
          this.admin.sair();
          this.$router.push("/admin/login");
          throw new Error("Sessao expirada");
        }
        if (!res.ok) throw new Error("Erro ao buscar dados");
        return res.json();
      });
    },
    selecionarDisciplina(disc) {
      this.disciplinaSelecionada = disc;
      this.carregando = true;
      this.erro = "";
      this.fetchComAuth("/api/admin/disciplinas/" + disc)
        .then((data) => {
          this.dados = data;
        })
        .catch((err) => {
          this.erro = err.message;
        })
        .finally(() => {
          this.carregando = false;
        });
    },
  },
  mounted() {
    this.carregando = true;
    this.fetchComAuth("/api/admin/disciplinas")
      .then((data) => {
        this.disciplinas = data;
      })
      .catch((err) => {
        this.erro = err.message;
      })
      .finally(() => {
        this.carregando = false;
      });
  },
};
</script>

<style scoped>
.pagina {
  min-height: 100vh;
  background: #f0f4f8;
  font-family: sans-serif;
}

.cabecalho {
  background: #2d3748;
  color: white;
  padding: 0 24px;
}

.cabecalho-conteudo {
  max-width: 960px;
  margin: 0 auto;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.titulo-sistema {
  margin: 0;
  font-size: 1.1rem;
}

.btn-sair {
  background: transparent;
  color: #a0aec0;
  border: 1px solid #4a5568;
  border-radius: 6px;
  padding: 6px 14px;
  cursor: pointer;
  font-size: 0.85rem;
  transition:
    color 0.2s,
    border-color 0.2s;
}

.btn-sair:hover {
  color: white;
  border-color: #718096;
}

.conteudo {
  max-width: 960px;
  margin: 32px auto;
  padding: 0 24px;
}

.secao-titulo {
  font-size: 1.4rem;
  color: #2d3748;
  margin: 0 0 20px 0;
}

.estado-msg {
  color: #718096;
  font-style: italic;
}

.grade-disciplinas {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.card-disciplina {
  background: white;
  border-radius: 10px;
  padding: 24px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}

.card-disciplina:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.disc-icone {
  font-size: 1.8rem;
}

.disc-nome {
  font-weight: 700;
  font-size: 1rem;
  color: #2d3748;
}

.disc-acao {
  font-size: 0.8rem;
  color: #4299e1;
}

.barra-nav {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.barra-nav .secao-titulo {
  margin: 0;
}

.btn-voltar {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  color: #4a5568;
  font-size: 0.9rem;
  transition: background 0.15s;
}

.btn-voltar:hover {
  background: #edf2f7;
}

/* Cards de resumo */
.grade-resumo {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.card-resumo {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.resumo-valor {
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
}

.resumo-label {
  font-size: 0.8rem;
  color: #718096;
}

/* Tabela */
.tabela-container {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.tabela {
  width: 100%;
  border-collapse: collapse;
}

.tabela thead tr {
  background: #f7fafc;
}

.tabela th {
  padding: 12px 16px;
  text-align: left;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #718096;
  border-bottom: 1px solid #e2e8f0;
}

.tabela td {
  padding: 14px 16px;
  border-bottom: 1px solid #f0f4f8;
  color: #2d3748;
}

.tabela tbody tr:last-child td {
  border-bottom: none;
}

.tabela tbody tr:hover td {
  background: #f7fafc;
}

.nome-aluno {
  font-weight: 500;
}

.centro {
  text-align: center;
}

.badge-freq,
.badge-situacao {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}
.verde {
  color: #38a169;
}
.amarelo {
  color: #d69e2e;
}
.vermelho {
  color: #e53e3e;
}

.badge-freq.verde,
.badge-situacao.verde {
  background: #f0fff4;
  color: #38a169;
}

.badge-freq.amarelo,
.badge-situacao.amarelo {
  background: #fffff0;
  color: #d69e2e;
}

.badge-freq.vermelho,
.badge-situacao.vermelho {
  background: #fff5f5;
  color: #e53e3e;
}

.erro-global {
  display: block;
  text-align: center;
  color: #e53e3e;
  margin-top: 16px;
}
</style>
