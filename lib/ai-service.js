/**
 * AI Service for Job Search Framework
 * Supports: Anthropic Claude, OpenAI, Google Gemini, Groq, Ollama and Built-in Heuristic Engine
 */

// Heuristic keyword extractor and scoring helper
function extractKeywords(text) {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .replace(/[^\w\s\+#\.\-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
  
  const techKeywords = [
    'javascript', 'typescript', 'python', 'node', 'nodejs', 'react', 'nextjs', 'vue', 'angular',
    'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'ci/cd', 'github', 'git', 'linux',
    'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'graphql', 'rest', 'api', 'apis',
    'llm', 'llms', 'ai', 'machine learning', 'deep learning', 'nlp', 'rag', 'langchain',
    'prompt', 'architecture', 'microservices', 'agile', 'scrum', 'backend', 'frontend', 'fullstack',
    'lead', 'senior', 'pleno', 'junior', 'remote', 'remoto', 'hibrido', 'hybrid', 'presencial'
  ];

  const matched = new Set();
  const lowerText = text.toLowerCase();
  for (const kw of techKeywords) {
    if (lowerText.includes(kw)) {
      matched.add(kw);
    }
  }
  return Array.from(matched);
}

// Built-in Heuristic Analysis (works 100% offline, zero API keys required)
function heuristicEvaluate(jobDesc, profile) {
  const jobKeywords = extractKeywords(jobDesc);
  const userSkillsAll = [
    ...(profile.skills?.primary || []),
    ...(profile.skills?.secondary || []),
    ...(profile.skills?.ai_specialties || []),
    ...(profile.skills?.tools || [])
  ].map(s => s.toLowerCase());

  const matchedSkills = [];
  const missingSkills = [];

  for (const kw of jobKeywords) {
    const isMatched = userSkillsAll.some(skill => skill.includes(kw) || kw.includes(skill));
    if (isMatched) {
      matchedSkills.push(kw.toUpperCase());
    } else if (!['remote', 'remoto', 'hibrido', 'hybrid', 'presencial', 'lead', 'senior', 'pleno', 'junior'].includes(kw)) {
      missingSkills.push(kw.toUpperCase());
    }
  }

  // Calculate scores
  const totalRelevant = matchedSkills.length + missingSkills.length;
  const hardSkillsScore = totalRelevant > 0 ? Math.min(98, Math.max(50, Math.round((matchedSkills.length / totalRelevant) * 100))) : 80;

  const descLower = jobDesc.toLowerCase();
  const isRemotePreferred = profile.dealbreakers?.workModel?.some(m => m.toLowerCase().includes('remoto'));
  const mentionsRemote = descLower.includes('remoto') || descLower.includes('remote');
  const mentionsPresencial = descLower.includes('presencial') && !mentionsRemote;

  const locationScore = mentionsRemote ? 95 : (mentionsPresencial ? 60 : 85);
  const experienceScore = descLower.includes('senior') || descLower.includes('sênior') || descLower.includes('lead') ? 90 : 88;
  const cultureScore = 88;
  const careerScore = 92;

  const overallScore = Math.round(
    (hardSkillsScore * 0.4) +
    (experienceScore * 0.2) +
    (cultureScore * 0.15) +
    (locationScore * 0.15) +
    (careerScore * 0.1)
  );

  return {
    overallFitScore: overallScore,
    dimensions: {
      hardSkills: hardSkillsScore,
      experience: experienceScore,
      culture: cultureScore,
      location: locationScore,
      careerAlignment: careerScore
    },
    matchedSkills: matchedSkills.slice(0, 10),
    missingSkills: missingSkills.slice(0, 8),
    dealbreakerAlerts: mentionsPresencial && isRemotePreferred ? ["Atenção: A vaga menciona modelo presencial, verifique se está alinhado com suas restrições."] : [],
    verdict: overallScore >= 80 ? "Alta Compatibilidade! Excelente oportunidade para candidatura." : (overallScore >= 65 ? "Média Compatibilidade. Vale se candidatar destacando pontos de transição." : "Baixa Compatibilidade. Avalie se atende aos seus requisitos prioritários."),
    strategicAdvice: [
      `Enfatize sua experiência prática com ${matchedSkills.slice(0, 3).join(', ') || 'tecnologias centrais'}.`,
      missingSkills.length > 0 ? `Aborde com transparência as lacunas em ${missingSkills.slice(0, 2).join(', ')}, demonstrando rapidez de aprendizado.` : 'Destaque seus projetos recentes com maior impacto numérico.',
      'Mantenha o foco em resultados quantificáveis e liderança técnica.'
    ]
  };
}

function heuristicGenerateCV(jobDesc, profile) {
  const evalData = heuristicEvaluate(jobDesc, profile);
  const matched = evalData.matchedSkills.join(', ');

  const summary = `${profile.identity.summary} Perfil especialmente alinhado aos desafios desta vaga, com forte domínio em ${matched || 'arquitetura escalável e IA'}, agregando agilidade, boas práticas de engenharia e foco em resultados estratégicos.`;

  const experienceTailored = (profile.experience || []).map(exp => ({
    ...exp,
    bullets: exp.bullets.map(b => b)
  }));

  return {
    summary,
    targetRole: profile.identity.title,
    matchedSkills: evalData.matchedSkills,
    experience: experienceTailored,
    education: profile.education || [],
    certifications: profile.certifications || [],
    atsKeywordCheck: {
      score: evalData.overallFitScore,
      coveredKeywords: evalData.matchedSkills,
      missingKeywords: evalData.missingSkills
    }
  };
}

function heuristicGenerateCoverLetter(jobDesc, profile, companyName = "Empresa", roleTitle = "a vaga anunciada") {
  const evalData = heuristicEvaluate(jobDesc, profile);
  const matched = evalData.matchedSkills.slice(0, 4).join(', ');

  const letterText = `Prezado(a) Gestor(a) de Contratação e Equipe da ${companyName},

Escrevo para manifestar meu grande entusiasmo pela oportunidade de atuar como ${roleTitle}. Acompanho com admiração o trabalho inovador desenvolvido pela equipe e tenho plena convicção de que minha trajetória como ${profile.identity.title} está diretamente conectada aos desafios e objetivos estratégicos que vocês buscam alcançar.

Ao longo da minha carreira, tenho liderado e implementado projetos de software de alto impacto, combinando rigor técnico em ${matched || 'arquiteturas modernas'} com foco contínuo em eficiência e geração de valor de negócio. Na minha experiência mais recente, estruturei soluções que otimizaram processos operacionais e garantiram alta escalabilidade e confiabilidade.

O que mais me atrai nesta posição é a oportunidade de aplicar minhas competências em um ambiente dinâmico, colaborando com uma equipe orientada à excelência. Tenho facilidade em transformar requisitos desafiadores em entregas consistentes, além de uma postura proativa e transparente para aprender continuamente e solucionar problemas complexos.

Agradeço imensamente pelo tempo e consideração dedicados à análise da minha candidatura. Coloco-me à inteira disposição para conversarmos mais detalhadamente sobre como posso contribuir para o sucesso contínuo da ${companyName}.

Atenciosamente,

${profile.identity.name}
${profile.identity.phone} | ${profile.identity.email}
${profile.identity.linkedin}`;

  return {
    companyName,
    roleTitle,
    content: letterText
  };
}

function heuristicGenerateInterview(jobDesc, profile) {
  const evalData = heuristicEvaluate(jobDesc, profile);
  const primaryMatched = evalData.matchedSkills.slice(0, 3).join(' e ') || 'tecnologias centrais';
  const missing = evalData.missingSkills[0] || 'novas ferramentas';

  return {
    technicalQuestions: [
      {
        question: `Como você aplicou ${primaryMatched} em um projeto real de alta complexidade?`,
        suggestedAnswerSTAR: {
          situation: "Na minha última posição, enfrentamos o desafio de melhorar o tempo de resposta e a escalabilidade dos nossos serviços.",
          task: "Minha responsabilidade foi arquitetar e refatorar a camada principal utilizando boas práticas e tecnologias modernas.",
          action: "Implementei microsserviços otimizados, adotei conteinerização e integrei métricas de observabilidade ponta a ponta.",
          result: "Reduzimos a latência em 45% e suportamos um aumento significativo no volume de acessos sem custos adicionais de infraestrutura."
        }
      },
      {
        question: "Como você garante a qualidade do código e a segurança em ambientes de produção?",
        suggestedAnswerSTAR: {
          situation: "Em projetos com deploys frequentes, a estabilidade e segurança são essenciais.",
          task: "Instituir uma cultura de desenvolvimento seguro e confiável no time.",
          action: "Configurei pipelines automatizados de CI/CD com testes unitários, análise estática de código (SAST) e testes de integração.",
          result: "Atingimos 85%+ de cobertura de testes e diminuímos incidentes em produção a quase zero."
        }
      }
    ],
    behavioralQuestions: [
      {
        question: "Descreva uma situação em que você discordou tecnicamente de um colega ou gestor. Como resolveu?",
        tip: "Foque em empatia, dados objetivos e o bem do projeto em vez de ego."
      },
      {
        question: "Conte sobre uma vez em que você precisou entregar um projeto com prazo apertado e requisitos mutáveis.",
        tip: "Demonstre adaptabilidade, comunicação clara e priorização baseada em valor de negócio."
      }
    ],
    honestBridgeGaps: [
      {
        gap: missing,
        talkingPoint: `Embora meu foco recente tenha sido em ${primaryMatched}, tenho facilidade de aprendizado e já estou estudando e aplicando ${missing} em projetos práticos, garantindo produtividade imediata.`
      }
    ],
    questionsToAskInterviewer: [
      "Quais são as principais prioridades e os maiores desafios técnicos deste time para os próximos 6 meses?",
      "Como é o ciclo de entrega de vocês (do planejamento ao deploy em produção)?",
      "Qual é a dinâmica de colaboração entre engenharia, produto e liderança técnica na empresa?",
      "O que define um profissional com desempenho excepcional nesta posição?"
    ]
  };
}

// LLM Invoker using native fetch
async function callLLM(prompt, systemInstruction, settings) {
  const { provider, apiKey, model, ollamaUrl } = settings;

  if (!apiKey && provider !== 'ollama') {
    throw new Error(`Chave de API não informada para o provedor ${provider}. Configure em Configurações ou utilize o Modo Heurístico.`);
  }

  if (provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-3-7-sonnet-20250219',
        max_tokens: 3000,
        system: systemInstruction,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API Error (${res.status}): ${err}`);
    }
    const data = await res.json();
    return data.content?.[0]?.text || '';
  }

  if (provider === 'openai' || provider === 'groq') {
    const url = provider === 'groq' 
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';
    
    const targetModel = model || (provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`${provider.toUpperCase()} API Error (${res.status}): ${err}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  if (provider === 'gemini') {
    const targetModel = model || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\n${prompt}` }] }
        ]
      })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API Error (${res.status}): ${err}`);
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  if (provider === 'ollama') {
    const targetUrl = `${ollamaUrl || 'http://localhost:11434'}/api/chat`;
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'llama3',
        stream: false,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ]
      })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Ollama Error (${res.status}): ${err}`);
    }
    const data = await res.json();
    return data.message?.content || '';
  }

  throw new Error(`Provedor desconhecido: ${provider}`);
}

module.exports = {
  evaluateJob: async (jobDescription, profile, settings) => {
    if (!settings || settings.provider === 'heuristic' || !settings.apiKey) {
      return heuristicEvaluate(jobDescription, profile);
    }
    try {
      const prompt = `Analise a compatibilidade do candidato abaixo com a vaga descrita.
Responda EXCLUSIVAMENTE em formato JSON válido contendo as chaves:
{
  "overallFitScore": number (0-100),
  "dimensions": {
    "hardSkills": number,
    "experience": number,
    "culture": number,
    "location": number,
    "careerAlignment": number
  },
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "dealbreakerAlerts": ["alerta1"],
  "verdict": "resumo do parecer",
  "strategicAdvice": ["dica1", "dica2", "dica3"]
}

PERFIL DO CANDIDATO:
${JSON.stringify(profile, null, 2)}

DESCRIÇÃO DA VAGA:
${jobDescription}`;

      const sys = "Você é um especialista em recrutamento técnico e inteligência de carreira. Seja rigoroso, honesto e objetivo. Nunca invente habilidades que o candidato não possui.";
      const raw = await callLLM(prompt, sys, settings);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return heuristicEvaluate(jobDescription, profile);
    } catch (e) {
      console.warn("Falha no LLM, executando fallback heurístico:", e.message);
      return heuristicEvaluate(jobDescription, profile);
    }
  },

  generateTailoredCV: async (jobDescription, profile, settings) => {
    if (!settings || settings.provider === 'heuristic' || !settings.apiKey) {
      return heuristicGenerateCV(jobDescription, profile);
    }
    try {
      const prompt = `Gere os dados de adaptação de currículo para esta vaga. Responda em JSON válido com as chaves:
{
  "summary": "resumo profissional adaptado destacando palavras-chave reais",
  "targetRole": "título do cargo",
  "matchedSkills": ["skills principais"],
  "experience": [
    {
      "id": "exp-id",
      "role": "cargo",
      "company": "empresa",
      "location": "local",
      "period": "período",
      "bullets": ["conquista 1 orientada aos requisitos da vaga", "conquista 2"]
    }
  ],
  "atsKeywordCheck": {
    "score": number,
    "coveredKeywords": ["palavras-chave da vaga cobertas"],
    "missingKeywords": ["palavras-chave honestamente ausentes"]
  }
}
IMPORTANTE: Nunca invente experiências ou cargos falsos. Use apenas o histórico real do candidato, apenas reorganizando e enfatizando os aspectos mais pertinentes.

PERFIL:
${JSON.stringify(profile, null, 2)}

VAGA:
${jobDescription}`;

      const sys = "Você é um redator sênior de currículos executivos focado em ATS e posicionamento estratégico.";
      const raw = await callLLM(prompt, sys, settings);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        parsed.education = profile.education || [];
        parsed.certifications = profile.certifications || [];
        return parsed;
      }
      return heuristicGenerateCV(jobDescription, profile);
    } catch (e) {
      console.warn("Falha no LLM CV, executando fallback heurístico:", e.message);
      return heuristicGenerateCV(jobDescription, profile);
    }
  },

  generateCoverLetter: async (jobDescription, profile, companyName, roleTitle, settings) => {
    if (!settings || settings.provider === 'heuristic' || !settings.apiKey) {
      return heuristicGenerateCoverLetter(jobDescription, profile, companyName, roleTitle);
    }
    try {
      const prompt = `Escreva uma carta de apresentação altamente persuasiva e personalizada em português formal para a empresa "${companyName || 'Empresa'}" e cargo "${roleTitle || 'a vaga anunciada'}".
A carta deve ter de 3 a 4 parágrafos, conectar o perfil real do candidato às dores da vaga, sem clichês ou exageros.

PERFIL:
${JSON.stringify(profile, null, 2)}

VAGA:
${jobDescription}`;

      const sys = "Você é um consultor de carreira executivo especializado em cartas de apresentação de alto impacto.";
      const raw = await callLLM(prompt, sys, settings);
      return {
        companyName: companyName || "Empresa",
        roleTitle: roleTitle || "Posição Alvo",
        content: raw.trim()
      };
    } catch (e) {
      console.warn("Falha no LLM Carta, fallback heurístico:", e.message);
      return heuristicGenerateCoverLetter(jobDescription, profile, companyName, roleTitle);
    }
  },

  generateInterviewPrep: async (jobDescription, profile, settings) => {
    if (!settings || settings.provider === 'heuristic' || !settings.apiKey) {
      return heuristicGenerateInterview(jobDescription, profile);
    }
    try {
      const prompt = `Gere um guia completo de preparação para entrevista para esta vaga. Responda em JSON válido com as chaves:
{
  "technicalQuestions": [
    {
      "question": "pergunta técnica provável",
      "suggestedAnswerSTAR": {
        "situation": "contexto",
        "task": "desafio",
        "action": "ação prática tomada",
        "result": "resultado e métricas"
      }
    }
  ],
  "behavioralQuestions": [
    {
      "question": "pergunta comportamental",
      "tip": "dica de como estruturar a resposta"
    }
  ],
  "honestBridgeGaps": [
    {
      "gap": "tecnologia ausente",
      "talkingPoint": "como responder honestamente sem se desqualificar"
    }
  ],
  "questionsToAskInterviewer": ["pergunta 1", "pergunta 2", "pergunta 3"]
}

PERFIL:
${JSON.stringify(profile, null, 2)}

VAGA:
${jobDescription}`;

      const sys = "Você é um especialista em preparação de candidatos para entrevistas técnicas e executivas.";
      const raw = await callLLM(prompt, sys, settings);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return heuristicGenerateInterview(jobDescription, profile);
    } catch (e) {
      console.warn("Falha no LLM entrevista, fallback heurístico:", e.message);
      return heuristicGenerateInterview(jobDescription, profile);
    }
  }
};
