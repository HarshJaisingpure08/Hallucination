/**
 * FACTLESS API Service
 * MOCK VERSION - No backend required, generates demo results.
 */

const API_BASE = '/api';

// MOCK: Set to true to use mock data (no backend needed)
const USE_MOCK = true;

// Helper for auth headers (returns empty in mock mode)
function authHeaders() {
  return {};
}

/**
 * Generate mock analysis result based on input text.
 */
function generateMockAnalysis(text, { scanMode, sensitivity, targetModel }) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).length;
  
  // Simulate risk detection based on text characteristics
  let riskScore = 0.15; // Base low risk
  const explanations = [];
  
  // Check for overconfidence markers
  const overconfidenceWords = ['always', 'never', 'guaranteed', 'impossible', 'certain', 'definitely', 'absolutely', '100%'];
  const foundOverconfidence = overconfidenceWords.filter(w => text.toLowerCase().includes(w));
  if (foundOverconfidence.length > 0) {
    riskScore += 0.15 * foundOverconfidence.length;
    explanations.push({
      signal_type: 'overconfidence',
      sentence_indices: [0],
      description: `Overconfident language detected: ${foundOverconfidence.join(', ')}`,
      risk_contribution: 0.15
    });
  }
  
  // Check for claim density (many short sentences = high claim density)
  const claimDensity = sentences.length > 0 ? words / sentences.length : 0;
  if (claimDensity < 8 && sentences.length > 2) {
    riskScore += 0.1;
    explanations.push({
      signal_type: 'claim_density',
      sentence_indices: [],
      description: `High claim density detected: ${claimDensity.toFixed(1)} words per claim`,
      risk_contribution: 0.1
    });
  }
  
  // Simulated contradiction check (random for demo)
  if (sentences.length > 3 && Math.random() > 0.7) {
    riskScore += 0.2;
    explanations.push({
      signal_type: 'contradiction',
      sentence_indices: [1, 3],
      description: 'Potential inconsistency detected between sentences',
      risk_contribution: 0.2
    });
  }
  
  // Apply sensitivity factor
  riskScore = riskScore * (sensitivity / 100);
  riskScore = Math.min(1.0, Math.max(0, riskScore));
  
  // Determine risk level
  let riskLevel = 'LOW';
  if (riskScore >= 0.7) riskLevel = 'HIGH';
  else if (riskScore >= 0.3) riskLevel = 'MEDIUM';
  
  return {
    risk_score: riskScore,
    risk_level: riskLevel,
    explanations,
    processing_time_ms: 150 + Math.random() * 200,
    input_length: text.length,
    module_details: {
      sentence_count: sentences.length,
      claim_count: Math.max(1, sentences.length),
      contradiction_count: explanations.filter(e => e.signal_type === 'contradiction').length,
      logical_flaw_count: 0,
      overconfidence_signals: foundOverconfidence.length,
      claim_density: claimDensity,
      suspicious_entities: 0,
      scan_mode: scanMode,
      sensitivity,
      target_model: targetModel,
    }
  };
}

/**
 * Analyze a single text for hallucination risk.
 * @param {string} text — AI-generated text to assess
 * @param {object} options — analysis options
 * @param {string} [options.scanMode='deep'] — 'fast' or 'deep'
 * @param {number} [options.sensitivity=85] — sensitivity level 0-100
 * @param {string} [options.targetModel=''] — target AI model name
 * @returns {Promise<Object>} analysis result
 */
export async function analyzeText(text, { scanMode = 'deep', sensitivity = 85, targetModel = '' } = {}) {
  // MOCK MODE: Return simulated results
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 500 + Math.random() * 500)); // Simulate network delay
    return generateMockAnalysis(text, { scanMode, sensitivity, targetModel });
  }
  
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({
      text,
      include_module_details: true,
      scan_mode: scanMode,
      sensitivity,
      target_model: targetModel,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Analysis failed (${res.status})`);
  }

  return res.json();
}

/**
 * Analyze multiple texts in one request.
 * @param {string[]} texts
 * @param {boolean} includeModuleDetails
 * @returns {Promise<Object[]>}
 */
export async function analyzeBatch(texts, includeModuleDetails = false) {
  const res = await fetch(`${API_BASE}/analyze/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({
      texts,
      include_module_details: includeModuleDetails,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Batch analysis failed (${res.status})`);
  }

  return res.json();
}

/**
 * Get system status (version, modules, config).
 * @returns {Promise<Object>}
 */
export async function getStatus() {
  const res = await fetch(`${API_BASE}/status`, { headers: authHeaders() });

  if (!res.ok) {
    throw new Error('Failed to fetch system status');
  }

  return res.json();
}

/**
 * Simple health check.
 * @returns {Promise<Object>}
 */
export async function healthCheck() {
  const res = await fetch(`${API_BASE}/health`, { headers: authHeaders() });

  if (!res.ok) {
    throw new Error('Health check failed');
  }

  return res.json();
}

/**
 * Fetch analysis history for the authenticated user.
 * @param {{ limit?: number, offset?: number, since?: number, until?: number }} params
 * @returns {Promise<{ items: Object[], total: number }>}
 */
export async function getHistory({ limit = 50, offset = 0, since, until } = {}) {
  // MOCK MODE: Return empty history
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 200));
    return { items: [], total: 0 };
  }
  
  const qs = new URLSearchParams();
  qs.set('limit', String(limit));
  qs.set('offset', String(offset));
  if (since != null) qs.set('since', String(since));
  if (until != null) qs.set('until', String(until));

  const res = await fetch(`${API_BASE}/history?${qs}`, { headers: authHeaders() });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch history');
  }

  return res.json();
}

/**
 * Analyze a PDF or Word document for hallucination risk.
 * @param {File} file — PDF or Word file to analyze
 * @param {object} options — analysis options
 * @param {string} [options.scanMode='deep'] — 'fast' or 'deep'
 * @param {number} [options.sensitivity=85] — sensitivity level 0-100
 * @param {string} [options.targetModel=''] — target AI model name
 * @returns {Promise<Object>} analysis result
 */
export async function analyzeFile(file, { scanMode = 'deep', sensitivity = 85, targetModel = '' } = {}) {
  // MOCK MODE: Generate mock analysis for file
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 1500));
    const mockText = `Content from uploaded file: ${file.name}`;
    const result = generateMockAnalysis(mockText);
    result.source_file = file.name;
    return result;
  }
  
  const formData = new FormData();
  formData.append('file', file);

  const qs = new URLSearchParams();
  qs.set('scan_mode', scanMode);
  qs.set('sensitivity', String(sensitivity));
  if (targetModel) qs.set('target_model', targetModel);

  const res = await fetch(`${API_BASE}/analyze/file?${qs}`, {
    method: 'POST',
    headers: authHeaders(),  // Don't set Content-Type for FormData
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `File analysis failed (${res.status})`);
  }

  return res.json();
}
