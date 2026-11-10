const express = require('express');
const cors = require('cors');
const path = require('path');
const storage = require('./lib/storage');
const ai = require('./lib/ai-service');
const auth = require('./lib/auth');
const linkedin = require('./lib/linkedin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Authentication Middleware
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acesso não autorizado. Faça login para continuar.' });
  }
  const token = header.slice(7).trim();
  const decoded = auth.verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Sessão expirada ou inválida. Faça login novamente.' });
  }
  req.user = decoded;
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Ação permitida apenas para administradores.' });
  }
  next();
}

// Public Health Check Endpoint for Easypanel
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'ai-job-search-web',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Authentication Routes
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Informe e-mail e senha.' });
    }
    const result = auth.login(email, password);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/change-password', requireAuth, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    auth.changePassword(req.user.userId, currentPassword, newPassword);
    res.json({ success: true, message: 'Senha alterada com sucesso!' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin User Management Routes
app.get('/api/admin/users', requireAuth, requireAdmin, (req, res) => {
  try {
    const users = auth.getUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar usuários: ' + err.message });
  }
});

app.post('/api/admin/users', requireAuth, requireAdmin, (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const user = auth.createUserByAdmin(name, email, password, role);
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/users/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    auth.deleteUser(req.params.id);
    res.json({ success: true, message: 'Usuário removido com sucesso.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Protected Profile Endpoints
app.get('/api/profile', requireAuth, (req, res) => {
  try {
    const profile = storage.getProfile(req.user.userId);
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar perfil: ' + err.message });
  }
});

app.put('/api/profile', requireAuth, (req, res) => {
  try {
    const updated = storage.saveProfile(req.user.userId, req.body);
    res.json({ success: true, profile: updated });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar perfil: ' + err.message });
  }
});

// Protected Pipeline (Kanban) Endpoints
app.get('/api/pipeline', requireAuth, (req, res) => {
  try {
    const pipeline = storage.getPipeline(req.user.userId);
    res.json(pipeline);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar candidaturas: ' + err.message });
  }
});

app.post('/api/pipeline', requireAuth, (req, res) => {
  try {
    const list = storage.getPipeline(req.user.userId);
    const newJob = {
      id: 'job-' + Date.now(),
      company: req.body.company || 'Nova Empresa',
      title: req.body.title || 'Novo Cargo',
      url: req.body.url || '',
      location: req.body.location || 'Não especificado',
      salary: req.body.salary || 'A combinar',
      status: req.body.status || 'wishlist',
      fitScore: req.body.fitScore || 0,
      dateAdded: new Date().toISOString().split('T')[0],
      lastUpdate: new Date().toISOString().split('T')[0],
      notes: req.body.notes || '',
      description: req.body.description || ''
    };
    list.unshift(newJob);
    storage.savePipeline(req.user.userId, list);
    res.json({ success: true, item: newJob });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar card: ' + err.message });
  }
});

app.put('/api/pipeline/:id', requireAuth, (req, res) => {
  try {
    const list = storage.getPipeline(req.user.userId);
    const index = list.findIndex(j => j.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Candidatura não encontrada' });
    }
    list[index] = {
      ...list[index],
      ...req.body,
      lastUpdate: new Date().toISOString().split('T')[0]
    };
    storage.savePipeline(req.user.userId, list);
    res.json({ success: true, item: list[index] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar candidatura: ' + err.message });
  }
});

app.delete('/api/pipeline/:id', requireAuth, (req, res) => {
  try {
    let list = storage.getPipeline(req.user.userId);
    list = list.filter(j => j.id !== req.params.id);
    storage.savePipeline(req.user.userId, list);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover candidatura: ' + err.message });
  }
});

// Settings Endpoints
app.get('/api/settings', requireAuth, (req, res) => {
  try {
    const s = storage.getSettings();
    const maskedKey = s.apiKey ? `${s.apiKey.slice(0, 4)}...${s.apiKey.slice(-4)}` : '';
    res.json({
      ...s,
      hasApiKey: !!s.apiKey,
      maskedKey
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar configurações: ' + err.message });
  }
});

app.post('/api/settings', requireAuth, requireAdmin, (req, res) => {
  try {
    const current = storage.getSettings();
    const updated = {
      provider: req.body.provider || current.provider,
      apiKey: req.body.apiKey !== undefined && req.body.apiKey !== '' ? req.body.apiKey : current.apiKey,
      model: req.body.model || current.model,
      ollamaUrl: req.body.ollamaUrl || current.ollamaUrl
    };
    storage.saveSettings(updated);
    res.json({ success: true, message: 'Configurações salvas com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar configurações: ' + err.message });
  }
});

// URL text extractor helper with dedicated LinkedIn integration
app.post('/api/fetch-url', requireAuth, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL não informada' });
  
  // Dedicated LinkedIn extraction
  const linkedinJobId = linkedin.extractLinkedInJobId(url);
  if (linkedinJobId || url.includes('linkedin.com')) {
    if (!linkedinJobId) {
      return res.status(400).json({ error: 'Não foi possível identificar o ID da vaga no link do LinkedIn informado. Verifique se o link possui o parâmetro currentJobId ou /view/.' });
    }
    try {
      const job = await linkedin.fetchLinkedInJob(linkedinJobId);
      return res.json({
        success: true,
        isLinkedIn: true,
        company: job.company,
        title: job.title,
        location: job.location,
        seniority: job.seniority,
        employmentType: job.employmentType,
        text: job.description,
        cleanUrl: job.url
      });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao carregar vaga do LinkedIn: ' + err.message });
    }
  }

  // Generic website text extractor fallback
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: `Não foi possível carregar o link (${response.status})` });
    }
    const html = await response.text();
    const cleaned = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    res.json({ success: true, text: cleaned.slice(0, 10000) });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar URL: ' + err.message });
  }
});

// Evaluation and Document Generation
app.post('/api/evaluate', requireAuth, async (req, res) => {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription || jobDescription.trim().length < 20) {
      return res.status(400).json({ error: 'Por favor, informe a descrição detalhada da vaga.' });
    }
    const profile = storage.getProfile(req.user.userId);
    const settings = storage.getSettings();
    const evaluation = await ai.evaluateJob(jobDescription, profile, settings);
    res.json(evaluation);
  } catch (err) {
    res.status(500).json({ error: 'Erro na avaliação: ' + err.message });
  }
});

app.post('/api/generate/cv', requireAuth, async (req, res) => {
  try {
    const { jobDescription } = req.body;
    const profile = storage.getProfile(req.user.userId);
    const settings = storage.getSettings();
    const cvData = await ai.generateTailoredCV(jobDescription || '', profile, settings);
    res.json(cvData);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar CV: ' + err.message });
  }
});

app.post('/api/generate/cover-letter', requireAuth, async (req, res) => {
  try {
    const { jobDescription, companyName, roleTitle } = req.body;
    const profile = storage.getProfile(req.user.userId);
    const settings = storage.getSettings();
    const letter = await ai.generateCoverLetter(jobDescription || '', profile, companyName, roleTitle, settings);
    res.json(letter);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar carta de apresentação: ' + err.message });
  }
});

app.post('/api/generate/interview', requireAuth, async (req, res) => {
  try {
    const { jobDescription } = req.body;
    const profile = storage.getProfile(req.user.userId);
    const settings = storage.getSettings();
    const prep = await ai.generateInterviewPrep(jobDescription || '', profile, settings);
    res.json(prep);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar guia de entrevista: ' + err.message });
  }
});

// Wildcard fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 JobSearch Web rodando na porta ${PORT}`);
  console.log(`🌐 Acesse localmente: http://localhost:${PORT}`);
});
