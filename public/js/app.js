// Global State
let currentProfile = null;
let currentPipeline = [];
let currentSettings = null;
let lastEvaluation = null;
let currentCV = null;
let currentCoverLetter = null;

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
  loadPipeline();
  loadSettings();
});

// Tab Switcher
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.classList.remove('active', 'text-brand-700', 'bg-brand-50');
    btn.classList.add('text-slate-600');
  });

  const activeTab = document.getElementById(`tab-${tabId}`);
  if (activeTab) activeTab.classList.remove('hidden');

  const activeBtn = document.getElementById(`tab-btn-${tabId}`);
  if (activeBtn) {
    activeBtn.classList.add('active', 'text-brand-700', 'bg-brand-50');
    activeBtn.classList.remove('text-slate-600');
  }

  // Refresh pipeline stats if switching to dashboard or kanban
  if (tabId === 'dashboard' || tabId === 'kanban') {
    renderPipeline();
  }
}

// Modal Helpers
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

// --- PROFILE MODULE ---
async function loadProfile() {
  try {
    const res = await fetch('/api/profile');
    if (!res.ok) throw new Error('Falha ao carregar perfil');
    currentProfile = await res.json();
    populateProfileForm(currentProfile);
  } catch (err) {
    console.error(err);
  }
}

function populateProfileForm(p) {
  if (!p) return;
  document.getElementById('prof-name').value = p.identity?.name || '';
  document.getElementById('prof-title').value = p.identity?.title || '';
  document.getElementById('prof-location').value = p.identity?.location || '';
  document.getElementById('prof-email').value = p.identity?.email || '';
  document.getElementById('prof-phone').value = p.identity?.phone || '';
  document.getElementById('prof-linkedin').value = p.identity?.linkedin || '';
  document.getElementById('prof-summary').value = p.identity?.summary || '';

  document.getElementById('prof-skills-primary').value = (p.skills?.primary || []).join(', ');
  document.getElementById('prof-skills-secondary').value = (p.skills?.secondary || []).join(', ');
  document.getElementById('prof-skills-ai').value = (p.skills?.ai_specialties || []).join(', ');
  document.getElementById('prof-skills-tools').value = (p.skills?.tools || []).join(', ');

  document.getElementById('prof-deal-work').value = (p.dealbreakers?.workModel || []).join(', ');
  document.getElementById('prof-deal-salary').value = p.dealbreakers?.minSalary || '';
}

async function saveProfileData() {
  if (!currentProfile) currentProfile = {};
  
  currentProfile.identity = {
    ...currentProfile.identity,
    name: document.getElementById('prof-name').value,
    title: document.getElementById('prof-title').value,
    location: document.getElementById('prof-location').value,
    email: document.getElementById('prof-email').value,
    phone: document.getElementById('prof-phone').value,
    linkedin: document.getElementById('prof-linkedin').value,
    summary: document.getElementById('prof-summary').value
  };

  currentProfile.skills = {
    primary: document.getElementById('prof-skills-primary').value.split(',').map(s => s.trim()).filter(Boolean),
    secondary: document.getElementById('prof-skills-secondary').value.split(',').map(s => s.trim()).filter(Boolean),
    ai_specialties: document.getElementById('prof-skills-ai').value.split(',').map(s => s.trim()).filter(Boolean),
    tools: document.getElementById('prof-skills-tools').value.split(',').map(s => s.trim()).filter(Boolean)
  };

  currentProfile.dealbreakers = {
    ...currentProfile.dealbreakers,
    workModel: document.getElementById('prof-deal-work').value.split(',').map(s => s.trim()).filter(Boolean),
    minSalary: document.getElementById('prof-deal-salary').value
  };

  try {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentProfile)
    });
    if (res.ok) {
      alert('Perfil mestre atualizado com sucesso!');
    }
  } catch (err) {
    alert('Erro ao salvar perfil: ' + err.message);
  }
}

// --- PIPELINE (KANBAN) MODULE ---
async function loadPipeline() {
  try {
    const res = await fetch('/api/pipeline');
    if (!res.ok) throw new Error('Falha ao carregar pipeline');
    currentPipeline = await res.json();
    renderPipeline();
  } catch (err) {
    console.error(err);
  }
}

function renderPipeline() {
  const cols = {
    wishlist: document.getElementById('col-wishlist'),
    applied: document.getElementById('col-applied'),
    interview: document.getElementById('col-interview'),
    offer: document.getElementById('col-offer'),
    rejected: document.getElementById('col-rejected')
  };

  Object.values(cols).forEach(c => { if (c) c.innerHTML = ''; });

  const counts = { wishlist: 0, applied: 0, interview: 0, offer: 0, rejected: 0 };
  let fitSum = 0;
  let fitCount = 0;

  currentPipeline.forEach(job => {
    const status = job.status || 'wishlist';
    if (counts[status] !== undefined) counts[status]++;
    if (job.fitScore) {
      fitSum += Number(job.fitScore);
      fitCount++;
    }

    const colEl = cols[status];
    if (!colEl) return;

    const card = document.createElement('div');
    card.className = "bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition-all space-y-2 text-xs relative group";
    card.innerHTML = `
      <div class="flex items-start justify-between">
        <div>
          <h4 class="font-bold text-slate-900 text-sm leading-tight">${escapeHtml(job.company)}</h4>
          <p class="text-slate-600 font-medium">${escapeHtml(job.title)}</p>
        </div>
        <span class="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full text-[10px] border border-indigo-100">
          ${job.fitScore || '--'}% Fit
        </span>
      </div>

      <div class="text-[11px] text-slate-500 space-y-0.5">
        <p><i class="fa-solid fa-location-dot text-slate-400 mr-1"></i> ${escapeHtml(job.location || 'Não especificado')}</p>
        ${job.salary ? `<p><i class="fa-solid fa-money-bill-wave text-emerald-500 mr-1"></i> ${escapeHtml(job.salary)}</p>` : ''}
      </div>

      ${job.notes ? `<p class="bg-slate-50 p-2 rounded text-[11px] text-slate-600 border border-slate-100 italic">${escapeHtml(job.notes)}</p>` : ''}

      <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
        <select onchange="updateJobStatus('${job.id}', this.value)" class="text-[11px] border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50 text-slate-700 outline-none">
          <option value="wishlist" ${job.status === 'wishlist' ? 'selected' : ''}>Salva</option>
          <option value="applied" ${job.status === 'applied' ? 'selected' : ''}>Aplicada</option>
          <option value="interview" ${job.status === 'interview' ? 'selected' : ''}>Entrevista</option>
          <option value="offer" ${job.status === 'offer' ? 'selected' : ''}>Oferta</option>
          <option value="rejected" ${job.status === 'rejected' ? 'selected' : ''}>Encerrada</option>
        </select>
        <button onclick="deleteJob('${job.id}')" class="text-slate-400 hover:text-red-500 p-1 transition-colors" title="Remover">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;
    colEl.appendChild(card);
  });

  // Update Column Counts
  document.getElementById('col-count-wishlist').textContent = counts.wishlist;
  document.getElementById('col-count-applied').textContent = counts.applied;
  document.getElementById('col-count-interview').textContent = counts.interview;
  document.getElementById('col-count-offer').textContent = counts.offer;
  document.getElementById('col-count-rejected').textContent = counts.rejected;

  // Update Dashboard stats
  document.getElementById('stat-total').textContent = currentPipeline.length;
  document.getElementById('stat-interviews').textContent = counts.interview;
  document.getElementById('stat-offers').textContent = counts.offer;
  document.getElementById('stat-avg-fit').textContent = fitCount > 0 ? `${Math.round(fitSum / fitCount)}%` : '85%';

  // Dashboard table
  const recentTable = document.getElementById('dashboard-recent-jobs');
  if (recentTable) {
    recentTable.innerHTML = '';
    currentPipeline.slice(0, 5).forEach(job => {
      const tr = document.createElement('tr');
      tr.className = "hover:bg-slate-50 transition-colors";
      tr.innerHTML = `
        <td class="py-3 px-3">
          <div class="font-bold text-slate-900">${escapeHtml(job.company)}</div>
          <div class="text-xs text-slate-500">${escapeHtml(job.title)}</div>
        </td>
        <td class="py-3 px-3">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${getStatusBadge(job.status)}">
            ${getStatusLabel(job.status)}
          </span>
        </td>
        <td class="py-3 px-3 font-semibold text-xs text-slate-700">${job.fitScore || 85}%</td>
        <td class="py-3 px-3 text-right">
          <button onclick="prepareJobEvaluation('${escapeHtml(job.company)}', '${escapeHtml(job.title)}', '${encodeURIComponent(job.description || '')}')" class="text-xs text-brand-600 hover:text-brand-800 font-semibold">
            Reavaliar
          </button>
        </td>
      `;
      recentTable.appendChild(tr);
    });
  }
}

async function updateJobStatus(id, newStatus) {
  try {
    const res = await fetch(`/api/pipeline/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      const item = currentPipeline.find(j => j.id === id);
      if (item) item.status = newStatus;
      renderPipeline();
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteJob(id) {
  if (!confirm('Deseja realmente remover esta vaga do pipeline?')) return;
  try {
    const res = await fetch(`/api/pipeline/${id}`, { method: 'DELETE' });
    if (res.ok) {
      currentPipeline = currentPipeline.filter(j => j.id !== id);
      renderPipeline();
    }
  } catch (err) {
    console.error(err);
  }
}

function openNewJobModal() {
  openModal('modal-new-job');
}

async function submitNewJob() {
  const newJob = {
    company: document.getElementById('modal-new-company').value,
    title: document.getElementById('modal-new-title').value,
    status: document.getElementById('modal-new-status').value,
    salary: document.getElementById('modal-new-salary').value,
    location: document.getElementById('modal-new-loc').value,
    notes: document.getElementById('modal-new-notes').value,
    fitScore: 85
  };

  try {
    const res = await fetch('/api/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newJob)
    });
    if (res.ok) {
      const data = await res.json();
      currentPipeline.unshift(data.item);
      closeModal('modal-new-job');
      renderPipeline();
      document.getElementById('new-job-form').reset();
    }
  } catch (err) {
    alert('Erro ao salvar: ' + err.message);
  }
}

// --- EVALUATOR & GENERATOR MODULE ---
async function fetchJobUrl() {
  const url = document.getElementById('eval-url').value.trim();
  if (!url) return alert('Por favor, informe uma URL válida.');

  const btn = document.getElementById('btn-fetch-url');
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Lendo...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/fetch-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await res.json();
    if (data.success && data.text) {
      document.getElementById('eval-desc').value = data.text;
    } else {
      alert(data.error || 'Não foi possível extrair o texto automaticamente. Por favor, copie e cole o anúncio.');
    }
  } catch (err) {
    alert('Erro ao buscar link: ' + err.message);
  } finally {
    btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i> Carregar Link';
    btn.disabled = false;
  }
}

async function runEvaluation() {
  const desc = document.getElementById('eval-desc').value.trim();
  if (!desc || desc.length < 20) {
    return alert('Por favor, cole a descrição da vaga com os requisitos para que possamos avaliá-la.');
  }

  const btn = document.getElementById('btn-run-eval');
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Avaliando Compatibilidade...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobDescription: desc })
    });
    if (!res.ok) throw new Error('Falha na avaliação');
    lastEvaluation = await res.json();
    renderEvaluationResults(lastEvaluation);
  } catch (err) {
    alert('Erro ao avaliar vaga: ' + err.message);
  } finally {
    btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Avaliar Compatibilidade (Fit Score)';
    btn.disabled = false;
  }
}

function renderEvaluationResults(ev) {
  const container = document.getElementById('eval-result-container');
  container.classList.remove('hidden');

  const score = ev.overallFitScore || 85;
  document.getElementById('eval-score-num').textContent = `${score}%`;
  document.getElementById('eval-verdict').textContent = ev.verdict || "Análise concluída com sucesso.";

  // Dimensions
  const dims = ev.dimensions || { hardSkills: 85, experience: 85, culture: 85, location: 85, careerAlignment: 85 };
  document.getElementById('dim-skills').textContent = `${dims.hardSkills}%`;
  document.getElementById('dim-skills-bar').style.width = `${dims.hardSkills}%`;
  document.getElementById('dim-exp').textContent = `${dims.experience}%`;
  document.getElementById('dim-exp-bar').style.width = `${dims.experience}%`;
  document.getElementById('dim-cult').textContent = `${dims.culture}%`;
  document.getElementById('dim-cult-bar').style.width = `${dims.culture}%`;
  document.getElementById('dim-loc').textContent = `${dims.location}%`;
  document.getElementById('dim-loc-bar').style.width = `${dims.location}%`;
  document.getElementById('dim-car').textContent = `${dims.careerAlignment}%`;
  document.getElementById('dim-car-bar').style.width = `${dims.careerAlignment}%`;

  // Matched Skills Badges
  const matchedEl = document.getElementById('eval-matched-badges');
  matchedEl.innerHTML = '';
  (ev.matchedSkills || []).forEach(skill => {
    const span = document.createElement('span');
    span.className = "bg-emerald-50 text-emerald-800 text-xs px-2.5 py-1 rounded-md font-medium border border-emerald-200 flex items-center";
    span.innerHTML = `<i class="fa-solid fa-check text-[10px] mr-1 text-emerald-600"></i> ${escapeHtml(skill)}`;
    matchedEl.appendChild(span);
  });

  // Missing Skills Badges
  const missingEl = document.getElementById('eval-missing-badges');
  missingEl.innerHTML = '';
  (ev.missingSkills || []).forEach(skill => {
    const span = document.createElement('span');
    span.className = "bg-amber-50 text-amber-800 text-xs px-2.5 py-1 rounded-md font-medium border border-amber-200 flex items-center";
    span.innerHTML = `<i class="fa-solid fa-circle-dot text-[9px] mr-1 text-amber-600"></i> ${escapeHtml(skill)}`;
    missingEl.appendChild(span);
  });

  // Strategic Advice
  const adviceEl = document.getElementById('eval-strategic-advice');
  adviceEl.innerHTML = '';
  (ev.strategicAdvice || []).forEach(adv => {
    const li = document.createElement('li');
    li.className = "flex items-start space-x-2";
    li.innerHTML = `<i class="fa-solid fa-lightbulb text-amber-500 mt-0.5 text-xs"></i> <span>${escapeHtml(adv)}</span>`;
    adviceEl.appendChild(li);
  });

  // Dealbreakers
  const dealBox = document.getElementById('eval-dealbreakers-box');
  if (ev.dealbreakerAlerts && ev.dealbreakerAlerts.length > 0) {
    dealBox.classList.remove('hidden');
    document.getElementById('eval-dealbreakers-text').textContent = ev.dealbreakerAlerts.join(' ');
  } else {
    dealBox.classList.add('hidden');
  }

  // Scroll to results
  container.scrollIntoView({ behavior: 'smooth' });
}

// Tailored CV Generator
async function generateCustomCV() {
  const desc = document.getElementById('eval-desc').value.trim();
  try {
    const res = await fetch('/api/generate/cv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobDescription: desc })
    });
    currentCV = await res.json();
    renderCVModal(currentCV);
    openModal('modal-cv');
  } catch (err) {
    alert('Erro ao gerar CV: ' + err.message);
  }
}

function renderCVModal(cv) {
  const p = currentProfile || {};
  const area = document.getElementById('cv-content-area');
  
  area.innerHTML = `
    <div id="printable-document" class="space-y-6 max-w-3xl mx-auto">
      
      <!-- CV Header -->
      <div class="border-b-2 border-slate-900 pb-4">
        <h1 class="text-2xl font-black text-slate-900 tracking-tight uppercase">${escapeHtml(p.identity?.name || 'Candidato')}</h1>
        <p class="text-sm font-bold text-indigo-700 tracking-wide mt-0.5">${escapeHtml(cv.targetRole || p.identity?.title || '')}</p>
        <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 mt-2">
          <span><i class="fa-solid fa-location-dot mr-1"></i> ${escapeHtml(p.identity?.location || '')}</span>
          <span><i class="fa-solid fa-envelope mr-1"></i> ${escapeHtml(p.identity?.email || '')}</span>
          <span><i class="fa-solid fa-phone mr-1"></i> ${escapeHtml(p.identity?.phone || '')}</span>
          <span><i class="fa-brands fa-linkedin mr-1"></i> ${escapeHtml(p.identity?.linkedin || '')}</span>
        </div>
      </div>

      <!-- Resumo Estratégico -->
      <div>
        <h2 class="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Resumo Profissional</h2>
        <p class="text-xs text-slate-700 leading-relaxed">${escapeHtml(cv.summary)}</p>
      </div>

      <!-- Competências Relevantes para a Vaga -->
      <div>
        <h2 class="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Principais Competências & Tecnologias</h2>
        <div class="flex flex-wrap gap-1.5">
          ${(cv.matchedSkills || []).map(s => `<span class="bg-slate-100 text-slate-800 text-[11px] px-2 py-0.5 rounded font-mono font-medium">${escapeHtml(s)}</span>`).join('')}
        </div>
      </div>

      <!-- Experiência Profissional -->
      <div>
        <h2 class="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 mb-3">Experiência Profissional</h2>
        <div class="space-y-4">
          ${(cv.experience || []).map(exp => `
            <div>
              <div class="flex justify-between items-baseline">
                <h3 class="text-xs font-bold text-slate-900">${escapeHtml(exp.role)}</h3>
                <span class="text-[11px] text-slate-500 font-medium">${escapeHtml(exp.period)}</span>
              </div>
              <p class="text-[11px] text-slate-600 font-semibold">${escapeHtml(exp.company)} &bull; ${escapeHtml(exp.location)}</p>
              <ul class="list-disc list-inside mt-1.5 space-y-1 text-xs text-slate-700">
                ${(exp.bullets || []).map(b => `<li>${escapeHtml(b)}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Formação Acadêmica & Certificações -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <h2 class="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Formação Acadêmica</h2>
          ${(cv.education || []).map(ed => `
            <div class="text-xs">
              <p class="font-bold text-slate-800">${escapeHtml(ed.degree)}</p>
              <p class="text-slate-600 text-[11px]">${escapeHtml(ed.institution)} (${escapeHtml(ed.period)})</p>
            </div>
          `).join('')}
        </div>
        <div>
          <h2 class="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Certificações</h2>
          <ul class="list-disc list-inside text-xs text-slate-700 space-y-0.5">
            ${(cv.certifications || []).map(c => `<li>${escapeHtml(c)}</li>`).join('')}
          </ul>
        </div>
      </div>

    </div>
  `;
}

// Cover Letter Generator
async function generateCustomCoverLetter() {
  const desc = document.getElementById('eval-desc').value.trim();
  const company = document.getElementById('eval-company').value.trim() || 'Empresa';
  const role = document.getElementById('eval-title').value.trim() || 'Vaga Alvo';

  try {
    const res = await fetch('/api/generate/cover-letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobDescription: desc, companyName: company, roleTitle: role })
    });
    currentCoverLetter = await res.json();
    document.getElementById('cover-letter-content-area').textContent = currentCoverLetter.content;
    openModal('modal-cover-letter');
  } catch (err) {
    alert('Erro ao gerar carta: ' + err.message);
  }
}

function copyCoverLetterText() {
  if (currentCoverLetter?.content) {
    navigator.clipboard.writeText(currentCoverLetter.content);
    alert('Texto da carta copiado para a área de transferência!');
  }
}

// Interview Prep Generator
async function generateCustomInterviewPrep() {
  const desc = document.getElementById('eval-desc').value.trim();
  try {
    const res = await fetch('/api/generate/interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobDescription: desc })
    });
    const prep = await res.json();
    renderInterviewTab(prep);
    switchTab('interview');
  } catch (err) {
    alert('Erro ao gerar entrevista: ' + err.message);
  }
}

function renderInterviewTab(prep) {
  const container = document.getElementById('interview-prep-content');
  container.innerHTML = `
    <!-- Top Technical Questions -->
    <div>
      <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 text-brand-600 flex items-center">
        <i class="fa-solid fa-code mr-2"></i> Perguntas Técnicas Prováveis com Respostas STAR
      </h3>
      <div class="space-y-4">
        ${(prep.technicalQuestions || []).map(q => `
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 class="font-bold text-slate-900 text-sm">${escapeHtml(q.question)}</h4>
            ${q.suggestedAnswerSTAR ? `
              <div class="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs pt-1">
                <div class="p-2 bg-white rounded border border-slate-200">
                  <span class="font-bold text-indigo-700 block uppercase text-[10px]">Situação</span>
                  <p class="text-slate-600 mt-0.5">${escapeHtml(q.suggestedAnswerSTAR.situation)}</p>
                </div>
                <div class="p-2 bg-white rounded border border-slate-200">
                  <span class="font-bold text-purple-700 block uppercase text-[10px]">Tarefa</span>
                  <p class="text-slate-600 mt-0.5">${escapeHtml(q.suggestedAnswerSTAR.task)}</p>
                </div>
                <div class="p-2 bg-white rounded border border-slate-200">
                  <span class="font-bold text-blue-700 block uppercase text-[10px]">Ação</span>
                  <p class="text-slate-600 mt-0.5">${escapeHtml(q.suggestedAnswerSTAR.action)}</p>
                </div>
                <div class="p-2 bg-white rounded border border-slate-200">
                  <span class="font-bold text-emerald-700 block uppercase text-[10px]">Resultado</span>
                  <p class="text-slate-600 mt-0.5">${escapeHtml(q.suggestedAnswerSTAR.result)}</p>
                </div>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Behavioral Questions -->
    <div>
      <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 text-indigo-600 flex items-center">
        <i class="fa-solid fa-users mr-2"></i> Perguntas Comportamentais & Cultura
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        ${(prep.behavioralQuestions || []).map(b => `
          <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1">
            <h4 class="font-bold text-slate-900 text-xs">${escapeHtml(b.question)}</h4>
            <p class="text-slate-500 italic text-[11px]"><i class="fa-solid fa-lightbulb text-amber-500 mr-1"></i> ${escapeHtml(b.tip)}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Honest Bridge for Missing Skills -->
    <div>
      <h3 class="text-sm font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center">
        <i class="fa-solid fa-bridge-water mr-2"></i> Pontes Honestas para Lacunas
      </h3>
      <div class="space-y-2">
        ${(prep.honestBridgeGaps || []).map(g => `
          <div class="p-3 bg-amber-50 text-amber-900 text-xs rounded-lg border border-amber-200">
            <span class="font-bold block mb-1">Para perguntas sobre "${escapeHtml(g.gap)}":</span>
            <p class="italic">"${escapeHtml(g.talkingPoint)}"</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Questions to Ask the Interviewer -->
    <div>
      <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 text-emerald-700 flex items-center">
        <i class="fa-solid fa-circle-question mr-2"></i> Perguntas Inteligentes para Você Fazer ao Entrevistador
      </h3>
      <ul class="space-y-2 text-xs text-slate-700">
        ${(prep.questionsToAskInterviewer || []).map(qi => `
          <li class="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center space-x-2">
            <i class="fa-solid fa-arrow-right text-emerald-600"></i>
            <span>${escapeHtml(qi)}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

// Add evaluated job directly to Pipeline
async function addCurrentJobToPipeline() {
  const company = document.getElementById('eval-company').value.trim() || 'Nova Empresa';
  const title = document.getElementById('eval-title').value.trim() || 'Novo Cargo';
  const desc = document.getElementById('eval-desc').value.trim();
  const url = document.getElementById('eval-url').value.trim();
  const score = lastEvaluation ? lastEvaluation.overallFitScore : 88;

  const newJob = {
    company,
    title,
    url,
    status: 'wishlist',
    fitScore: score,
    description: desc,
    notes: 'Avaliada via Avaliador de Vagas.'
  };

  try {
    const res = await fetch('/api/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newJob)
    });
    if (res.ok) {
      const data = await res.json();
      currentPipeline.unshift(data.item);
      renderPipeline();
      alert('Vaga adicionada ao Kanban com sucesso!');
      switchTab('kanban');
    }
  } catch (err) {
    alert('Erro ao salvar no Kanban: ' + err.message);
  }
}

function prepareJobEvaluation(company, title, descEncoded) {
  document.getElementById('eval-company').value = company;
  document.getElementById('eval-title').value = title;
  document.getElementById('eval-desc').value = decodeURIComponent(descEncoded);
  switchTab('evaluator');
}

// --- SETTINGS MODULE ---
async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    currentSettings = await res.json();
    document.getElementById('set-provider').value = currentSettings.provider || 'heuristic';
    document.getElementById('set-model').value = currentSettings.model || '';
    document.getElementById('set-ollama-url').value = currentSettings.ollamaUrl || 'http://localhost:11434';
    
    // Status
    const badge = document.getElementById('ai-provider-name');
    if (badge) {
      badge.textContent = getProviderLabel(currentSettings.provider);
    }
    const keyStatus = document.getElementById('api-key-status');
    if (keyStatus && currentSettings.hasApiKey) {
      keyStatus.textContent = `Chave configurada: ${currentSettings.maskedKey}`;
    }
    toggleProviderFields();
  } catch (err) {
    console.error(err);
  }
}

function toggleProviderFields() {
  const prov = document.getElementById('set-provider').value;
  const keyField = document.getElementById('field-api-key');
  const modelField = document.getElementById('field-model');
  const ollamaField = document.getElementById('field-ollama-url');

  if (prov === 'heuristic') {
    keyField.classList.add('hidden');
    modelField.classList.add('hidden');
    ollamaField.classList.add('hidden');
  } else if (prov === 'ollama') {
    keyField.classList.add('hidden');
    modelField.classList.remove('hidden');
    ollamaField.classList.remove('hidden');
  } else {
    keyField.classList.remove('hidden');
    modelField.classList.remove('hidden');
    ollamaField.classList.add('hidden');
  }
}

async function saveSettingsData() {
  const prov = document.getElementById('set-provider').value;
  const apiKey = document.getElementById('set-api-key').value;
  const model = document.getElementById('set-model').value;
  const ollamaUrl = document.getElementById('set-ollama-url').value;

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: prov, apiKey, model, ollamaUrl })
    });
    if (res.ok) {
      alert('Configurações salvas com sucesso!');
      loadSettings();
    }
  } catch (err) {
    alert('Erro ao salvar configurações: ' + err.message);
  }
}

// Helpers
function getProviderLabel(p) {
  switch(p) {
    case 'anthropic': return 'Anthropic Claude';
    case 'openai': return 'OpenAI GPT-4o';
    case 'gemini': return 'Google Gemini';
    case 'groq': return 'Groq Llama 3';
    case 'ollama': return 'Ollama Local';
    default: return 'Modo Heurístico';
  }
}

function getStatusBadge(s) {
  switch(s) {
    case 'applied': return 'bg-indigo-100 text-indigo-800';
    case 'interview': return 'bg-amber-100 text-amber-800';
    case 'offer': return 'bg-emerald-100 text-emerald-800';
    case 'rejected': return 'bg-rose-100 text-rose-800';
    default: return 'bg-slate-100 text-slate-800';
  }
}

function getStatusLabel(s) {
  switch(s) {
    case 'applied': return 'Candidatado';
    case 'interview': return 'Em Entrevista';
    case 'offer': return 'Oferta Recebida';
    case 'rejected': return 'Encerrada';
    default: return 'Salva';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

