const express = require('express');
const cors = require('cors');
const path = require('path');
const storage = require('./lib/storage');
const ai = require('./lib/ai-service');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint for Easypanel
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'ai-job-search-web',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Profile endpoints
app.get('/api/profile', (req, res) => {
  try {
    const profile = storage.getProfile();
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar perfil: ' + err.message });
  }
});

app.put('/api/profile', (req, res) => {
  try {
    const updated = storage.saveProfile(req.body);
    res.json({ success: true, profile: updated });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar perfil: ' + err.message });
  }
});

// Pipeline (Kanban) endpoints
app.get('/api/pipeline', (req, res) => {
  try {
    const pipeline = storage.getPipeline();
    res.json(pipeline);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar candidaturas: ' + err.message });
  }
});

app.post('/api/pipeline', (req, res) => {
  try {
    const list = storage.getPipeline();
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
    storage.savePipeline(list);
    res.json({ success: true, item: newJob });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar card: ' + err.message });
  }
});

app.put('/api/pipeline/:id', (req, res) => {
  try {
    const list = storage.getPipeline();
    const index = list.findIndex(j => j.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Candidatura não encontrada' });
    }
    list[index] = {
      ...list[index],
      ...req.body,
      lastUpdate: new Date().toISOString().split('T')[0]
    };
    storage.savePipeline(list);
    res.json({ success: true, item: list[index] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar candidatura: ' + err.message });
  }
});

app.delete('/api/pipeline/:id', (req, res) => {
  try {
    let list = storage.getPipeline();
    list = list.filter(j => j.id !== req.params.id);
    storage.savePipeline(list);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover candidatura: ' + err.message });
  }
});

// Settings endpoints
app.get('/api/settings', (req, res) => {
  try {
    const s = storage.getSettings();
    // Do not return raw API key in full for security
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

app.post('/api/settings', (req, res) => {
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

// URL text extractor helper
app.post('/api/fetch-url', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL não informada' });
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: `Não foi possível carregar o link (${response.status})` });
    }
    const html = await response.text();
    // Basic text cleaner
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

// Evaluation and Generation Endpoints
app.post('/api/evaluate', async (req, res) => {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription || jobDescription.trim().length < 20) {
      return res.status(400).json({ error: 'Por favor, informe a descrição detalhada da vaga.' });
    }
    const profile = storage.getProfile();
    const settings = storage.getSettings();
    const evaluation = await ai.evaluateJob(jobDescription, profile, settings);
    res.json(evaluation);
  } catch (err) {
    res.status(500).json({ error: 'Erro na avaliação: ' + err.message });
  }
});

app.post('/api/generate/cv', async (req, res) => {
  try {
    const { jobDescription } = req.body;
    const profile = storage.getProfile();
    const settings = storage.getSettings();
    const cvData = await ai.generateTailoredCV(jobDescription || '', profile, settings);
    res.json(cvData);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar CV: ' + err.message });
  }
});

app.post('/api/generate/cover-letter', async (req, res) => {
  try {
    const { jobDescription, companyName, roleTitle } = req.body;
    const profile = storage.getProfile();
    const settings = storage.getSettings();
    const letter = await ai.generateCoverLetter(jobDescription || '', profile, companyName, roleTitle, settings);
    res.json(letter);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar carta de apresentação: ' + err.message });
  }
});

app.post('/api/generate/interview', async (req, res) => {
  try {
    const { jobDescription } = req.body;
    const profile = storage.getProfile();
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
  console.log(`🚀 AI Job Search Web está rodando na porta ${PORT}`);
  console.log(`🌐 Acesse localmente: http://localhost:${PORT}`);
});
