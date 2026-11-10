/**
 * LinkedIn Job Scraper & Extractor Module
 * Uses LinkedIn's public jobs-guest endpoint (no login required)
 */

function extractLinkedInJobId(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // Pattern 1: currentJobId=... or jobId=... (search results link)
  const queryMatch = trimmed.match(/[?&](?:currentJobId|jobId)=(\d{6,})/i);
  if (queryMatch) return queryMatch[1];

  // Pattern 2: /jobs/view/123456... or /jobs/view/title-123456...
  const viewMatch = trimmed.match(/\/jobs\/view\/(?:[^\/?#]*?-)?(\d{6,})/i);
  if (viewMatch) return viewMatch[1];

  // Pattern 3: urn:li:jobPosting:... or urn:li:fs_normalized_jobPosting:...
  const urnMatch = trimmed.match(/urn:li:(?:jobPosting|fs_normalized_jobPosting):(\d{6,})/i);
  if (urnMatch) return urnMatch[1];

  // Pattern 4: Any /jobs/... with an ID in path (e.g. /jobs/externalApply/123...)
  const pathMatch = trimmed.match(/\/jobs\/(?:[^\/?#]+\/)*(\d{6,})/i);
  if (pathMatch) return pathMatch[1];

  // Pattern 5: Any 8-12 digit number in a LinkedIn URL
  if (trimmed.includes('linkedin.com/jobs')) {
    const digitMatch = trimmed.match(/\b(\d{8,12})\b/);
    if (digitMatch) return digitMatch[1];
  }

  // Pattern 6: Bare 6+ digit ID
  if (/^\d{6,}$/.test(trimmed)) return trimmed;

  return null;
}

function decodeEntities(text) {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function cleanHtmlText(html) {
  if (!html) return '';
  return decodeEntities(
    html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<\s*br\s*\/?>/gi, '\n')
      .replace(/<\/(p|li|ul|ol|div|h\d)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim()
  );
}

async function fetchLinkedInJob(jobId) {
  const url = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'X-Requested-With': 'XMLHttpRequest'
  };

  let response;
  let retries = 3;
  let delay = 1000;

  for (let attempt = 0; attempt <= retries; attempt++) {
    response = await fetch(url, { headers });
    if (response.status === 429 || response.status >= 500) {
      if (attempt === retries) {
        throw new Error(`LinkedIn retornou status ${response.status} (Limite de requisições excedido). Tente novamente em instantes.`);
      }
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
      continue;
    }
    break;
  }

  if (response.status === 404) {
    throw new Error('Vaga não encontrada no LinkedIn. Verifique se o link ou ID está correto.');
  }

  if (!response.ok) {
    throw new Error(`Erro ao acessar LinkedIn (Status ${response.status})`);
  }

  const html = await response.text();

  // Extract Title
  const titleMatch = html.match(/class="(?:top-card-layout__title|topcard__title)[^"]*"[^>]*>([\s\S]*?)<\/h[12]>/i);
  const title = titleMatch ? cleanHtmlText(titleMatch[1]) : '';

  // Extract Company
  const orgMatch = html.match(/class="topcard__org-name-link[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
  let company = orgMatch ? cleanHtmlText(orgMatch[1]) : '';
  if (!company) {
    const fallbackOrg = html.match(/class="(?:topcard__flavor|top-card-layout__first-sub-headline)[^"]*"[^>]*>([\s\S]*?)<\/(?:span|a)>/i);
    if (fallbackOrg) company = cleanHtmlText(fallbackOrg[1]);
  }

  // Extract Location
  const locMatch = html.match(/class="(?:topcard__flavor topcard__flavor--bullet|top-card-layout__second-sub-headline)[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
  const location = locMatch ? cleanHtmlText(locMatch[1]) : '';

  // Extract Description Block
  let description = '';
  const descMatch = html.match(/class="(?:show-more-less-html__markup|description__text)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (descMatch) {
    description = cleanHtmlText(descMatch[1]);
  } else {
    // Fallback: extract main section
    description = cleanHtmlText(html);
  }

  // Criteria (Seniority, Employment Type)
  const criteria = {};
  const itemRe = /class="description__job-criteria-subheader"[^>]*>([\s\S]*?)<\/h3>[\s\S]*?class="description__job-criteria-text[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;
  let cm;
  while ((cm = itemRe.exec(html)) !== null) {
    const key = cleanHtmlText(cm[1]).toLowerCase();
    const val = cleanHtmlText(cm[2]);
    criteria[key] = val;
  }

  return {
    id: jobId,
    title,
    company,
    location,
    seniority: criteria['nível de experiência'] || criteria['seniority level'] || '',
    employmentType: criteria['tipo de emprego'] || criteria['employment type'] || '',
    description,
    url: `https://www.linkedin.com/jobs/view/${jobId}`
  };
}

module.exports = {
  extractLinkedInJobId,
  fetchLinkedInJob
};
