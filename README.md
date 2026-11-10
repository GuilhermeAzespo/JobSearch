<p align="center">
  <h1 align="center">🚀 JobSearch</h1>
  <p align="center">
    <b>Plataforma Inteligente de Gestão de Vagas, Currículos & Carreira com IA</b><br>
    Avalie vagas em 5 dimensões, adapte currículos para filtros ATS, gere cartas de apresentação persuasivas, simule entrevistas no método STAR e gerencie todo o seu pipeline de candidaturas em um painel moderno.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-22%2B-68a063?style=flat-square&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ed?style=flat-square&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/Easypanel-Cloud%20Deploy-7c3aed?style=flat-square" alt="Easypanel">
  <img src="https://img.shields.io/badge/TailwindCSS-Modern%20UI-38bdf8?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind">
  <img src="https://img.shields.io/badge/Multi--AI-Claude%20%7C%20GPT--4o%20%7C%20Gemini%20%7C%20Groq%20%7C%20Ollama-4f46e5?style=flat-square" alt="Multi-AI">
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License MIT">
</p>

---

## 🎯 Por que o JobSearch?

Concorrer a posições de tecnologia e alta qualificação exige personalização rigorosa para cada anúncio de emprego. Enviar o mesmo currículo genérico resulta em descarte automático pelos sistemas de triagem (**ATS - Applicant Tracking Systems**).

O **JobSearch** transforma esse processo em um fluxo ágil, estratégico e honesto:
- **Sem alucinações:** O sistema nunca inventa competências que você não possui. As conquistas são reorganizadas estrategicamente para evidenciar os pontos fortes exigidos pela oportunidade.
- **Transparência em lacunas:** Identifica com clareza o que falta no seu perfil para a vaga e cria "pontes honestas" para entrevistas.
- **Autonomia total e privacidade:** Seus dados ficam armazenados sob o seu controle no seu servidor pessoal ou máquina local.

---

## 🌟 Principais Recursos

### 1. 📊 Dashboard de Carreira & Métricas
- Visão unificada do funil de candidaturas (Total de vagas, em entrevista, propostas e histórico).
- Taxa média de compatibilidade (*Fit Score*) das suas aplicações.
- Acesso rápido a avaliações de novas oportunidades e histórico de candidaturas.

### 2. 🎯 Avaliador de Compatibilidade em 5 Dimensões
Insira o link da vaga (com captura automática de texto) ou cole a descrição do anúncio para calcular a pontuação:
- **Hard Skills (Técnico):** Percentual de correspondência entre as tecnologias da vaga e o seu perfil.
- **Experiência & Senioridade:** Alinhamento de anos de atuação, porte de projetos e liderança.
- **Fit Cultural & Comportamental:** Valores, dinâmica de equipe e metodologia de trabalho.
- **Localização & Modalidade:** Remoto, híbrido ou presencial com alerta imediato de *deal-breakers*.
- **Alinhamento de Carreira:** O quanto a posição agrega aos seus objetivos profissionais de longo prazo.
- **Mapeamento de Competências:** Badges visuais de competências atendidas (*Matches*) e lacunas identificadas (*Gaps Honestos*), com orientações estratégicas de posicionamento.

### 3. 📄 Gerador de Currículo Sob Medida (ATS-Optimized)
- Adapta automaticamente o resumo executivo, destaques técnicos e balas de experiência para evidenciar o impacto exigido pelo anúncio.
- Otimizado para leitura precisa por robôs ATS (densidade semântica de palavras-chave).
- Layout executivo limpo formatado para impressão direta em **PDF (A4)** pelo navegador ou exportação.

### 4. ✉️ Gerador de Cartas de Apresentação Direcionadas
- Redação persuasiva e profissional conectando suas maiores realizações às dores e desafios da empresa.
- Cópia rápida para a área de transferência com um clique.

### 5. 🎤 Simulador & Preparador de Entrevistas
- Perguntas técnicas prováveis com sugestões de resposta no método **STAR** (Situação, Tarefa, Ação, Resultado).
- Pontes honestas de resposta para perguntas sobre tecnologias que você ainda não domina.
- Perguntas de alto impacto para você fazer ao recrutador ao final da conversa.

### 6. 📋 Pipeline Kanban de Candidaturas
- Gestão completa das etapas seletivas:
  - 📌 **Interesse / Salvas**
  - 📩 **Candidatado**
  - 💬 **Em Entrevista**
  - 🏆 **Oferta / Proposta**
  - 📁 **Encerradas**
- Histórico de datas, faixa salarial estimada, localização e anotações individuais.

### 7. 🧠 Inteligência Artificial Flexível & Modo Offline
- **Modo Heurístico Integrado (Offline):** Funciona imediatamente sem necessidade de chaves de API, analisando requisitos e perfis com regras de NLP locais.
- **Provedores de LLM Suportados:**
  - **Anthropic Claude** (Claude 3.7 Sonnet / Claude 3.5 Sonnet)
  - **OpenAI** (GPT-4o / GPT-4o-mini)
  - **Google Gemini** (Gemini 1.5 Pro / Flash)
  - **Groq** (Llama 3.3 70B com resposta em milissegundos)
  - **Ollama** (Modelos locais no seu próprio servidor)

### 8. 🔐 Autenticação & Gestão de Usuários (Acesso Restrito)
- **Segurança Nativa:** Proteção de rotas com tokens assinados digitalmente e hashing Scrypt com salt individual para senhas.
- **Sem Registro Aberto:** Novas contas são criadas e controladas exclusivamente pelo Administrador no painel de configurações.
- **Conta Inicial de Administrador:** E-mail `guilherme@azespo.com.br` (senha inicial: `admin123`, alterável nas configurações).
- **Isolamento de Dados:** Cada usuário tem seu próprio perfil mestre e seu próprio pipeline Kanban de vagas isolados.

---

## 🐳 Deploy no Easypanel (Nuvem em Minutos)

O projeto conta com `Dockerfile` multi-stage leve em Node Alpine e suporte a volumes persistentes no **Easypanel**:

1. Acesse o seu painel do **Easypanel**.
2. Clique em **+ New App** &rarr; **App** &rarr; Selecione **Git Repository**.
3. Informe os dados:
   - **Repository:** `https://github.com/GuilhermeAzespo/JobSearch`
   - **Branch:** `main`
   - **Port:** `3000`
4. Na aba **Mounts / Volumes**, adicione o volume persistente:
   - **Mount Path:** `/app/data` (preserva suas candidaturas e configurações mesmo após deploys).
5. Clique em **Deploy**!
6. O Easypanel gerará automaticamente o subdomínio e o certificado SSL/HTTPS.

> 📖 Confira o passo a passo com detalhes no guia dedicado: [EASYPANEL.md](EASYPANEL.md).

---

## 💻 Executando Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 20 ou superior.
- Git.

### 1. Clonar o repositório
```bash
git clone https://github.com/GuilhermeAzespo/JobSearch.git
cd JobSearch
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Iniciar a aplicação
```bash
npm start
```

Abra o seu navegador em [http://localhost:3000](http://localhost:3000).

### Rodando com Docker Compose Local:
```bash
docker compose up -d --build
```

---

## 📂 Arquitetura do Projeto

```text
JobSearch/
├── server.js              # Servidor Express com APIs REST e health check (/api/health)
├── lib/
│   ├── ai-service.js      # Integração com provedores de IA e motor heurístico
│   └── storage.js         # Persistência em JSON/volume no diretório ./data
├── public/                # Frontend responsivo
│   ├── index.html         # Dashboard, Avaliador, Kanban, Entrevistas e Perfil
│   ├── css/style.css      # Folha de estilo e regras de impressão (@media print)
│   └── js/app.js          # Controladores reativos da interface
├── Dockerfile             # Container Alpine para Easypanel / Cloud
├── docker-compose.yml     # Orquestração local de contêineres
├── EASYPANEL.md           # Guia de implantação no Easypanel
├── CLAUDE.md              # Perfil mestre e regras canônicas de aplicação
├── AGENTS.md              # Contratos e especificações para agentes autônomos
└── package.json           # Dependências e scripts de execução
```

---

## 🛡️ Segurança e Privacidade

- **Proteção de Credenciais:** As chaves de API e arquivos de ambiente (`.env`, `Git`, `data/`) são ignorados pelo `.gitignore` e nunca são comitados.
- **Seus Dados Ficam Com Você:** Todas as candidaturas, currículos gerados e notas permanecem no volume montado localmente.

---

## 💡 Créditos e Reconhecimento

Inspirado pelo trabalho pioneiro de engenharia de busca de vagas em CLI de [ai-job-search-dev/ai-job-search](https://github.com/ai-job-search-dev/ai-job-search). O **JobSearch** expande essa filosofia transformando-a em uma plataforma web completa, visual, independente e conteinerizada para produção em nuvem.

---

## 📄 Licença

Distribuído sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
