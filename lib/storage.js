const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_DATA_DIR = path.join(DATA_DIR, 'users_data');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getUserDir(userId) {
  const safeId = (userId || 'usr_admin').replace(/[^a-zA-Z0-9_\-]/g, '_');
  const userDir = path.join(USERS_DATA_DIR, safeId);
  ensureDir(userDir);
  return userDir;
}

const DEFAULT_PROFILE = {
  identity: {
    name: "Guilherme Azevedo",
    title: "Software Engineer & AI Solutions Specialist",
    email: "guilherme@azespo.com.br",
    phone: "+55 (11) 99999-9999",
    location: "São Paulo, Brasil",
    linkedin: "https://linkedin.com/in/guilherme-azevedo",
    github: "https://github.com/GuilhermeAzespo",
    website: "https://github.com/GuilhermeAzespo/JobSearch",
    summary: "Engenheiro de Software com sólida experiência em arquitetura de sistemas modernos, microsserviços, integração de modelos de IA/LLMs e automação de processos. Apaixonado por construir ferramentas eficientes, escaláveis e com foco em alto impacto de negócio."
  },
  languages: [
    { language: "Português", level: "Nativo" },
    { language: "Inglês", level: "Avançado / Fluente" },
    { language: "Espanhol", level: "Intermediário" }
  ],
  skills: {
    primary: ["JavaScript / TypeScript", "Node.js", "Python", "React / Next.js", "Docker & Containers"],
    secondary: ["PostgreSQL / MySQL", "MongoDB / Redis", "APIs RESTful & GraphQL", "CI/CD & Git", "Easypanel / Cloud"],
    ai_specialties: ["Engenharia de Prompt", "Integração de LLMs (OpenAI, Anthropic, Gemini)", "RAG & Vetores", "Agentes Autônomos"],
    tools: ["Linux", "Git", "VS Code", "Postman", "Docker Compose"]
  },
  experience: [
    {
      id: "exp-1",
      role: "Senior Software Engineer / AI Specialist",
      company: "Tech Innovation Corp",
      location: "São Paulo, Brasil (Remoto)",
      period: "2023 - Presente",
      bullets: [
        "Liderou o desenvolvimento e arquitetura de sistemas com inteligência artificial generativa, reduzindo o tempo de processamento operacional em 45%.",
        "Desenvolveu APIs robustas e microsserviços em Node.js e Python com alta disponibilidade e escalabilidade.",
        "Implementou pipelines de CI/CD automatizados e orquestração de containers com Docker.",
        "Colaborou ativamente com times de produto e negócio para transformar requisitos complexos em soluções ágeis."
      ]
    },
    {
      id: "exp-2",
      role: "Software Engineer Pleno",
      company: "Digital Solutions",
      location: "São Paulo, Brasil",
      period: "2021 - 2023",
      bullets: [
        "Desenvolveu interfaces reativas e aplicações web modernas com foco em performance e experiência do usuário (UX).",
        "Integrou múltiplos gateways de pagamento e serviços de terceiros via REST APIs e Webhooks.",
        "Aumentou a cobertura de testes automatizados unitários e de integração para mais de 85%."
      ]
    }
  ],
  education: [
    {
      degree: "Bacharelado em Ciência da Computação / Engenharia de Software",
      institution: "Universidade de Tecnologia",
      period: "2017 - 2021",
      details: "Ênfase em Arquitetura de Software e Inteligência Artificial."
    }
  ],
  certifications: [
    "AWS Certified Solutions Architect",
    "Generative AI & LLM Applications Specialist",
    "Docker & Kubernetes Mastery"
  ],
  dealbreakers: {
    workModel: ["Remoto", "Híbrido"],
    minSalary: "Compatível com mercado sênior",
    undesiredLocations: ["Exclusivamente presencial fora de SP"],
    notes: "Projetos inovadores com autonomia técnica, cultura aberta e foco em desenvolvimento contínuo."
  }
};

const DEFAULT_SETTINGS = {
  provider: "heuristic", // 'heuristic', 'anthropic', 'openai', 'gemini', 'groq', 'ollama'
  apiKey: "",
  model: "claude-3-7-sonnet-20250219",
  ollamaUrl: "http://localhost:11434",
  systemPromptPreset: "default"
};

const DEFAULT_PIPELINE = [
  {
    id: "job-1",
    company: "Tech Corp Global",
    title: "Senior AI Engineer",
    url: "https://example.com/job/senior-ai-engineer",
    location: "Remoto (Brasil ou Global)",
    salary: "R$ 18.000 - R$ 24.000",
    status: "interview",
    fitScore: 92,
    dateAdded: "2026-11-01",
    lastUpdate: "2026-11-08",
    notes: "Primeira entrevista técnica agendada para quinta-feira às 14h. Focar em cases de LLM e microsserviços.",
    description: "Buscamos um Engenheiro de Software Sênior especialista em soluções de Inteligência Artificial para integrar nossa equipe global. Requisitos: TypeScript, Python, experiência comprovada integrando LLMs, arquitetura de sistemas distribuídos e Docker."
  },
  {
    id: "job-2",
    company: "Inovação Digital Labs",
    title: "Full Stack Engineer (Node & React)",
    url: "https://example.com/job/fullstack-node-react",
    location: "Híbrido - São Paulo",
    salary: "R$ 15.000 - R$ 19.000",
    status: "applied",
    fitScore: 88,
    dateAdded: "2026-11-05",
    lastUpdate: "2026-11-05",
    notes: "Candidatura enviada com CV e carta adaptados. Aguardando retorno do RH.",
    description: "Vaga para desenvolvedor Full Stack com sólida vivência em Node.js, React e Docker. Desejável conhecimento em integração com provedores de nuvem e APIs modernas."
  },
  {
    id: "job-3",
    company: "CloudScale Systems",
    title: "Tech Lead / Arquiteto de Software",
    url: "https://example.com/job/tech-lead",
    location: "Remoto",
    salary: "R$ 22.000 - R$ 28.000",
    status: "wishlist",
    fitScore: 85,
    dateAdded: "2026-11-09",
    lastUpdate: "2026-11-09",
    notes: "Excelente oportunidade. Preciso ajustar o CV destacando liderança técnica antes de submeter.",
    description: "Procuramos Tech Lead para guiar a evolução de nossa plataforma SaaS. Requisitos: liderança técnica, Node.js, microsserviços, CI/CD, governança e mentalidade de mentoria de desenvolvedores."
  }
];

function loadJson(filePath, defaultValue) {
  if (!fs.existsSync(filePath)) {
    saveJson(filePath, defaultValue);
    return defaultValue;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Erro ao ler ${filePath}:`, err);
    return defaultValue;
  }
}

function saveJson(filePath, data) {
  const dir = path.dirname(filePath);
  ensureDir(dir);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  return data;
}

module.exports = {
  // Global / System settings
  getSettings: () => {
    ensureDir(DATA_DIR);
    return loadJson(path.join(DATA_DIR, 'settings.json'), DEFAULT_SETTINGS);
  },
  saveSettings: (data) => {
    ensureDir(DATA_DIR);
    return saveJson(path.join(DATA_DIR, 'settings.json'), data);
  },

  // Per-user profile
  getProfile: (userId) => {
    const userDir = getUserDir(userId);
    const filePath = path.join(userDir, 'profile.json');
    if (!fs.existsSync(filePath)) {
      // Check legacy root profile.json first
      const rootPath = path.join(DATA_DIR, 'profile.json');
      if (fs.existsSync(rootPath)) {
        const legacy = loadJson(rootPath, DEFAULT_PROFILE);
        saveJson(filePath, legacy);
        return legacy;
      }
    }
    return loadJson(filePath, DEFAULT_PROFILE);
  },

  saveProfile: (userId, data) => {
    const userDir = getUserDir(userId);
    const filePath = path.join(userDir, 'profile.json');
    return saveJson(filePath, data);
  },

  // Per-user pipeline
  getPipeline: (userId) => {
    const userDir = getUserDir(userId);
    const filePath = path.join(userDir, 'pipeline.json');
    if (!fs.existsSync(filePath)) {
      // Check legacy root pipeline.json first
      const rootPath = path.join(DATA_DIR, 'pipeline.json');
      if (fs.existsSync(rootPath)) {
        const legacy = loadJson(rootPath, DEFAULT_PIPELINE);
        saveJson(filePath, legacy);
        return legacy;
      }
    }
    return loadJson(filePath, DEFAULT_PIPELINE);
  },

  savePipeline: (userId, data) => {
    const userDir = getUserDir(userId);
    const filePath = path.join(userDir, 'pipeline.json');
    return saveJson(filePath, data);
  }
};
