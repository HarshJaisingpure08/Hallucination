import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import { useUser } from '../context/UserContext';
import './ResultsPage.css';

/* ── Shared sidebar & models (same as AnalyzePage) ── */
const sidebarItems = [
  { label: 'Home', icon: (
    <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
    </svg>
  ), path: '/' },
  { label: 'Analyze', icon: (
    <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ), path: '/analyze' },
  { label: 'History', icon: (
    <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ), path: '/history' },
];

const targetModels = [
  { name: 'GPT-4', icon: '🌐', color: 'color-emerald' },
  { name: 'Claude', icon: 'A\\', color: 'color-orange' },
  { name: 'Llama 3', icon: '∞', color: 'color-blue' },
];

/* ── Derive metrics from backend module_details ── */
function buildRadarMetrics(details, riskScore) {
  if (!details) {
    // Fallback: use overall risk_score alone
    const base = Math.round((1 - riskScore) * 100);
    return [
      { label: 'OVERALL', value: base },
      { label: 'CONSISTENCY', value: base },
      { label: 'CONFIDENCE', value: base },
      { label: 'LOGICAL FLOW', value: base },
      { label: 'ENTITY TRUST', value: base },
    ];
  }
  const clampPct = (v) => Math.max(0, Math.min(100, Math.round(v)));

  // Scale scores proportionally based on actual signal counts and text size
  const sentCount = details.sentence_count || 1;
  const contradictionPct = clampPct(100 - (details.contradiction_count / Math.max(1, sentCount / 2)) * 100);
  const overconfPct = clampPct(100 - (details.overconfidence_signals / sentCount) * 100);
  const logicalPct = clampPct(100 - (details.logical_flaw_count / Math.max(1, sentCount / 2)) * 100);
  const entityPct = clampPct(100 - (details.suspicious_entities / Math.max(1, sentCount)) * 80);
  const overallPct = clampPct((1 - riskScore) * 100);

  return [
    { label: 'OVERALL', value: overallPct },
    { label: 'CONSISTENCY', value: contradictionPct },
    { label: 'CONFIDENCE', value: overconfPct },
    { label: 'LOGICAL FLOW', value: logicalPct },
    { label: 'ENTITY TRUST', value: entityPct },
  ];
}

function buildKeyParams(details, riskScore) {
  const pct = (v) => Math.max(0, Math.min(100, Math.round(v)));
  const overall = pct((1 - riskScore) * 100);
  const sentCount = details ? (details.sentence_count || 1) : 1;
  const consistency = details ? pct(100 - (details.contradiction_count / Math.max(1, sentCount / 2)) * 100) : overall;
  const confidence = details ? pct(100 - (details.overconfidence_signals / sentCount) * 100) : overall;
  const density = details ? pct((1 - Math.min(1, details.claim_density / 3)) * 100) : overall;
  const colorOf = (v) => v >= 80 ? '#34d399' : v >= 60 ? '#fbbf24' : '#ef4444';
  return [
    { label: 'Overall Score', value: overall, color: colorOf(overall) },
    { label: 'Consistency', value: consistency, color: colorOf(consistency) },
    { label: 'Confidence', value: confidence, color: colorOf(confidence) },
    { label: 'Claim Density', value: density, color: colorOf(density) },
  ];
}

function mapExplanationsToIssues(explanations) {
  return explanations.map((exp) => ({
    text: exp.description,
    severity: exp.risk_contribution >= 0.2 ? 'Issues' : 'Attention',
    signalType: exp.signal_type,
    riskContribution: exp.risk_contribution,
  }));
}

const scoreColor = (v) => v >= 90 ? '#10b981' : v >= 80 ? '#34d399' : v >= 70 ? '#fbbf24' : '#ef4444';

/* ── Radar helpers ── */
const CX = 220, CY = 170, R = 100, N = 5;
const ang = (i) => (Math.PI * 2 * i) / N - Math.PI / 2;
const pt = (i, pct) => ({
  x: CX + (R * pct / 100) * Math.cos(ang(i)),
  y: CY + (R * pct / 100) * Math.sin(ang(i)),
});
const gridPolyFn = (pct, metrics) => metrics.map((_, i) => { const p = pt(i, pct); return `${p.x},${p.y}`; }).join(' ');
const dataPolyFn = (metrics) => metrics.map((m, i) => { const p = pt(i, m.value); return `${p.x},${p.y}`; }).join(' ');
const labelCfg = [
  { anchor: 'middle', dx: 0, dy: -20 },
  { anchor: 'start', dx: 10, dy: -4 },
  { anchor: 'start', dx: 10, dy: 12 },
  { anchor: 'end', dx: -10, dy: 12 },
  { anchor: 'end', dx: -10, dy: -4 },
];

/* ══════════════════════════════════════════════ */
const ResultsPage = () => {
  const navigate = useNavigate();
  const { result, inputText } = useAnalysis();
  const { userName } = useUser();
  const [activeNav, setActiveNav] = useState('/analyze');
  const [activeTab, setActiveTab] = useState('scoring');

  // Read scan settings from result's module_details (reflects what was actually used)
  const scanMode = result?.module_details?.scan_mode || 'deep';
  const sensitivityVal = result?.module_details?.sensitivity ?? 85;
  const targetModel = result?.module_details?.target_model || '';

  // Redirect if no result data
  useEffect(() => {
    if (!result) navigate('/analyze');
  }, [result, navigate]);

  // Derived data from backend response
  const radarMetrics = useMemo(
    () => result ? buildRadarMetrics(result.module_details, result.risk_score) : [],
    [result]
  );
  const keyParams = useMemo(
    () => result ? buildKeyParams(result.module_details, result.risk_score) : [],
    [result]
  );
  const flaggedIssues = useMemo(
    () => result ? mapExplanationsToIssues(result.explanations) : [],
    [result]
  );
  const dataPoly = useMemo(() => dataPolyFn(radarMetrics), [radarMetrics]);

  const riskLevelLabel = result?.risk_level || 'LOW';
  const riskScorePct = result ? Math.round(result.risk_score * 100) : 0;

  const getInitials = (name) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0]?.substring(0, 2).toUpperCase() || '?';
  };

  const handleNavClick = (path) => {
    setActiveNav(path);
    if (path === '/') navigate('/');
    if (path === '/analyze') navigate('/analyze');
    if (path === '/history') navigate('/history');
  };

  if (!result) return null; // will redirect via useEffect

  return (
    <div className="rp">

      {/* ── Nav ── */}
      <nav className="rp-nav">
        <div className="rp-nav-brand">
          <div className="rp-nav-logo"><span className="rp-nav-logo-txt">F</span></div>
          <span className="rp-nav-title">FACTLESS</span>
          <span className="rp-nav-sub">AI HALLUCINATION DETECTOR</span>
        </div>
        <div className="rp-nav-actions">
          <span className={`rp-risk-badge rp-risk-${riskLevelLabel.toLowerCase()}`}>
            {riskLevelLabel} RISK — {riskScorePct}%
          </span>
          <span className="rp-time-badge">
            {result.processing_time_ms.toFixed(0)}ms
          </span>
          <button className="rp-bell">
            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <div className="rp-avatar">{getInitials(userName)}</div>
        </div>
      </nav>

      <div className="rp-body">

        {/* ── Sidebar ── */}
        <aside className="rp-sidebar">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item.path)}
              className={`rp-sb-btn ${activeNav === item.path ? 'rp-sb-btn-on' : 'rp-sb-btn-off'}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </aside>

        {/* ── Main ── */}
        <main className="rp-main">

          <h1 className="rp-title">
            AI VERIFICATION REPORT: <span className="rp-title-light">{riskLevelLabel} Risk &bull; {result.input_length.toLocaleString()} chars analyzed.</span>
          </h1>

          {/* ── Top grid: Radar + Settings ── */}
          <div className="rp-grid">

            {/* Radar card */}
            <div className="rp-radar">
              <div className="rp-radar-head">
                <h2 className="rp-radar-label">TRUTHSCORER RADAR</h2>
                <div className="rp-tabs">
                  <button className={`rp-tab ${activeTab === 'scoring' ? 'rp-tab-on' : ''}`} onClick={() => setActiveTab('scoring')}>Scoring parameter</button>
                  <button className={`rp-tab ${activeTab === 'hallucination' ? 'rp-tab-on' : ''}`} onClick={() => setActiveTab('hallucination')}>Hal-Resource Instances</button>
                </div>
              </div>

              {/* SVG radar chart */}
              <svg className="rp-radar-svg" viewBox="0 0 440 340">
                <defs>
                  <radialGradient id="rGrad">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
                  </radialGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                {/* Grid rings */}
                {[20, 40, 60, 80, 100].map((pct) => (
                  <polygon key={pct} points={gridPolyFn(pct, radarMetrics)} fill="none" stroke="rgba(55,65,81,0.35)" strokeWidth="0.5" />
                ))}

                {/* Axes */}
                {radarMetrics.map((_, i) => {
                  const p = pt(i, 100);
                  return <line key={i} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke="rgba(55,65,81,0.3)" strokeWidth="0.5" />;
                })}

                {/* Data polygon */}
                <polygon points={dataPoly} fill="url(#rGrad)" stroke="#10b981" strokeWidth="2" filter="url(#glow)" />

                {/* Vertex dots */}
                {radarMetrics.map((m, i) => {
                  const p = pt(i, m.value);
                  return <circle key={i} cx={p.x} cy={p.y} r="4" fill={scoreColor(m.value)} stroke="#0b121c" strokeWidth="2" />;
                })}

                {/* Labels + percentages */}
                {radarMetrics.map((m, i) => {
                  const lp = pt(i, 130);
                  const cfg = labelCfg[i];
                  return (
                    <g key={i}>
                      <text x={lp.x + cfg.dx} y={lp.y + cfg.dy} textAnchor={cfg.anchor} fill="#9ca3af" fontSize="10" fontWeight="600" fontFamily="inherit">{m.label}</text>
                      <text x={lp.x + cfg.dx} y={lp.y + cfg.dy + 16} textAnchor={cfg.anchor} fill={scoreColor(m.value)} fontSize="17" fontWeight="800" fontFamily="inherit">{m.value}%</text>
                    </g>
                  );
                })}
              </svg>

              {/* Legend */}
              <div className="rp-legend">
                <span className="rp-legend-item"><span className="rp-legend-dot" style={{ background: '#10b981' }} />Good</span>
                <span className="rp-legend-item"><span className="rp-legend-dot" style={{ background: '#34d399' }} />good</span>
                <span className="rp-legend-item"><span className="rp-legend-dot" style={{ background: '#f59e0b' }} />Attention</span>
                <span className="rp-legend-item"><span className="rp-legend-dot" style={{ background: '#ef4444' }} />Issues</span>
              </div>
            </div>

            {/* Settings panel (right) */}
            <div className="rp-panel">

              {/* Analysis Mode (read-only, shows what was used) */}
              <div>
                <h3 className="rp-set-heading">Analysis Mode</h3>
                <div className="rp-tog-row">
                  <span className={`rp-tog-lbl ${scanMode === 'fast' ? 'rp-tog-lbl-on' : 'rp-tog-lbl-off'}`}>Fast Scan</span>
                  <button className={`rp-tog ${scanMode === 'deep' ? 'rp-tog-on' : 'rp-tog-off'}`} style={{ pointerEvents: 'none' }}>
                    <div className={`rp-knob ${scanMode === 'deep' ? 'rp-knob-on' : 'rp-knob-off'}`} />
                  </button>
                  <span className={`rp-tog-lbl ${scanMode === 'deep' ? 'rp-tog-lbl-on' : 'rp-tog-lbl-off'}`}>Deep Scan</span>
                </div>
              </div>

              {/* Sensitivity (read-only) */}
              <div>
                <h3 className="rp-slider-lbl">Sensitivity Level — {sensitivityVal}%</h3>
                <input type="range" min="0" max="100" value={sensitivityVal} readOnly className="rp-slider" style={{ pointerEvents: 'none' }} />
                <div className="rp-slider-range"><span>Low</span><span>High</span></div>
              </div>

              {/* Target Model */}
              <div>
                <h3 className="rp-set-heading">Target Model</h3>
                <div className="rp-models">
                  {targetModels.map((model) => (
                    <div
                      key={model.name}
                      className={`rp-model ${targetModel === model.name ? 'rp-model-active' : ''}`}
                    >
                      <span className={`rp-model-icon ${model.color}`}>{model.icon}</span>
                      <span className="rp-model-name">{model.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Module Breakdown */}
              {result.module_details && (
                <div>
                  <h3 className="rp-set-heading">Module Breakdown</h3>
                  <div className="rp-module-stats">
                    <div className="rp-stat-row"><span>Sentences</span><span>{result.module_details.sentence_count}</span></div>
                    <div className="rp-stat-row"><span>Claims</span><span>{result.module_details.claim_count}</span></div>
                    <div className="rp-stat-row"><span>Contradictions</span><span>{result.module_details.contradiction_count}</span></div>
                    <div className="rp-stat-row"><span>Logical Flaws</span><span>{result.module_details.logical_flaw_count}</span></div>
                    <div className="rp-stat-row"><span>Overconfidence</span><span>{result.module_details.overconfidence_signals}</span></div>
                    <div className="rp-stat-row"><span>Suspicious Entities</span><span>{result.module_details.suspicious_entities}</span></div>
                    <div className="rp-stat-row"><span>Claim Density</span><span>{result.module_details.claim_density?.toFixed(2)}/sent</span></div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ── Key Parameters Overview ── */}
          <section className="rp-params">
            <h2 className="rp-sec-title">Key Parameters Overview</h2>
            <div className="rp-cards">
              {keyParams.map((kp) => (
                  <div key={kp.label} className="rp-card">
                    <div className="rp-card-head">
                      <span className="rp-card-name">{kp.label}</span>
                      <div className="rp-card-badges">
                        <svg width="14" height="14" fill="none" stroke={kp.color} viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 17l4-4 4 4 4-8 4 4" /></svg>
                        <svg width="14" height="14" fill="none" stroke={kp.color} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="1.5" /><path strokeWidth="2" strokeLinecap="round" d="M12 8v4m0 4h.01" /></svg>
                      </div>
                    </div>
                    <div className="rp-card-val" style={{ color: kp.color }}>{kp.value}%</div>
                    {/* Progress bar instead of sparkline (single analysis, no history yet) */}
                    <div className="rp-card-bar-track">
                      <div
                        className="rp-card-bar-fill"
                        style={{ width: `${kp.value}%`, background: kp.color }}
                      />
                    </div>
                  </div>
              ))}
            </div>
          </section>

          {/* ── Flagged Content ── */}
          <section className="rp-flagged">
            <h2 className="rp-sec-title">Flagged Content ({flaggedIssues.length})</h2>

            <div className="rp-issues">
              <div className="rp-issues-head">
                <span className="rp-issues-label">Issues Detected ({flaggedIssues.length})</span>
                <div className="rp-issues-cols"><span>Test</span><span>Severity</span></div>
              </div>

              {flaggedIssues.map((issue, i) => (
                <div key={i} className="rp-issue">
                  <div className="rp-issue-left">
                    <svg className="rp-issue-warn" width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                        stroke={issue.severity === 'Issues' ? '#ef4444' : '#f59e0b'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12 9v4m0 4h.01"
                        stroke={issue.severity === 'Issues' ? '#ef4444' : '#f59e0b'} strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span className="rp-issue-text">{issue.text}</span>
                  </div>
                  <span className={`rp-badge ${issue.severity === 'Issues' ? 'rp-badge-red' : 'rp-badge-amber'}`}>
                    {issue.severity}
                  </span>
                </div>
              ))}
            </div>
          </section>

        </main>
      </div>
    </div>
  );
};

export default ResultsPage;
