import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import { useUser } from '../context/UserContext';
import { analyzeText, analyzeFile } from '../services/api';
import './AnalyzePage.css';

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

const AnalyzePage = () => {
  const navigate = useNavigate();
  const { setResult, setInputText, loading, setLoading, error, setError } = useAnalysis();
  const { userName } = useUser();
  const [text, setText] = useState('');
  const [deepScan, setDeepScan] = useState(true);
  const [sensitivity, setSensitivity] = useState(85);
  const [selectedModel, setSelectedModel] = useState('GPT-4');
  const [activeNav, setActiveNav] = useState('/analyze');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleAnalyze = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > 10000) {
      setError('Text is too long. Please limit to 10,000 characters.');
      return;
    }
    try {
      setError(null);
      setLoading(true);
      const result = await analyzeText(trimmed, {
        scanMode: deepScan ? 'deep' : 'fast',
        sensitivity,
        targetModel: selectedModel,
      });
      setResult(result);
      setInputText(trimmed);
      navigate('/results');
    } catch (err) {
      setError(err.message || 'Analysis failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
      setError('Invalid file type. Only PDF and Word documents (.pdf, .doc, .docx) are allowed.');
      return;
    }
    
    setSelectedFile(file);
    setError(null);
  };

  const handleFileAnalyze = async () => {
    if (!selectedFile) return;
    
    try {
      setError(null);
      setLoading(true);
      const result = await analyzeFile(selectedFile, {
        scanMode: deepScan ? 'deep' : 'fast',
        sensitivity,
        targetModel: selectedModel,
      });
      setResult(result);
      setInputText(`[File: ${selectedFile.name}]`);
      navigate('/results');
    } catch (err) {
      setError(err.message || 'File analysis failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getInitials = (name) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0]?.substring(0, 2).toUpperCase() || '?';
  };

  const handleNavClick = (path) => {
    setActiveNav(path);
    if (path === '/') navigate('/');
    if (path === '/history') navigate('/history');
  };

  return (
    <div className="ap">

      {/* ── Top navbar ── */}
      <nav className="ap-nav">
        <div className="ap-nav-brand">
          <div className="ap-nav-logo">
            <span className="ap-nav-logo-txt">F</span>
          </div>
          <span className="ap-nav-title">FACTLESS</span>
          <span className="ap-nav-sub">AI HALLUCINATION DETECTOR</span>
        </div>

        <div className="ap-nav-actions">
          <button className="ap-bell">
            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <div className="ap-avatar">{getInitials(userName)}</div>
        </div>
      </nav>

      <div className="ap-body">

        {/* ── Sidebar ── */}
        <aside className="ap-sidebar">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item.path)}
              className={`ap-sb-btn ${
                activeNav === item.path ? 'ap-sb-btn-on' : 'ap-sb-btn-off'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </aside>

        {/* ── Main content ── */}
        <main className="ap-main">
          <div className="ap-content">

            {/* Editor column */}
            <div className="ap-editor">
              <h1 className="ap-editor-title">NEW ANALYSIS.</h1>

              <div className="ap-ta-wrap">
                <div className="ap-ta-glow" />
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste or Input AI Text to Verify."
                  className="ap-ta"
                />
                <div className="ap-dot" />
              </div>

              {error && (
                <div className="ap-error">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {/* Selected file info */}
              {selectedFile && (
                <div className="ap-file-info">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span className="ap-file-name">{selectedFile.name}</span>
                  <span className="ap-file-size">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  <button className="ap-file-remove" onClick={clearFile}>×</button>
                </div>
              )}

              <div className="ap-actions">
                {selectedFile ? (
                  <button
                    className="ap-btn ap-btn-detect"
                    onClick={handleFileAnalyze}
                    disabled={loading}
                  >
                    {loading ? 'ANALYZING…' : 'ANALYZE FILE'}
                  </button>
                ) : (
                  <button
                    className="ap-btn ap-btn-detect"
                    onClick={handleAnalyze}
                    disabled={loading || !text.trim()}
                  >
                    {loading ? 'ANALYZING…' : 'DETECT HALLUCINATIONS'}
                  </button>
                )}
                <button className="ap-btn ap-btn-sec" onClick={handleUploadClick}>UPLOAD FILE</button>
                <button className="ap-btn ap-btn-sec" onClick={() => { setText(''); setError(null); clearFile(); }}>CLEAR</button>
              </div>

              <div className="ap-char-count">
                {text.length.toLocaleString()} / 10,000 characters
              </div>
            </div>

            {/* Settings panel */}
            <div className="ap-settings">

              {/* Analysis mode */}
              <div>
                <h3 className="ap-set-heading">Analysis Mode</h3>
                <div className="ap-tog-row">
                  <span className={`ap-tog-lbl ${!deepScan ? 'ap-tog-lbl-on' : 'ap-tog-lbl-off'}`}>Fast Scan</span>
                  <button onClick={() => setDeepScan(!deepScan)} className={`ap-tog ${deepScan ? 'ap-tog-on' : 'ap-tog-off'}`}>
                    <div className={`ap-knob ${deepScan ? 'ap-knob-on' : 'ap-knob-off'}`} />
                  </button>
                  <span className={`ap-tog-lbl ${deepScan ? 'ap-tog-lbl-on' : 'ap-tog-lbl-off'}`}>Deep Scan</span>
                </div>
              </div>

              {/* Sensitivity */}
              <div>
                <h3 className="ap-slider-lbl">Sensitivity Level (Low to High)</h3>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(Number(e.target.value))}
                  className="ap-slider"
                />
                <div className="ap-slider-range">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              {/* Target models */}
              <div>
                <h3 className="ap-set-heading">Target Models</h3>
                <div className="ap-models">
                  {targetModels.map((model) => (
                    <div
                      key={model.name}
                      className={`ap-model ${selectedModel === model.name ? 'ap-model-active' : ''}`}
                      onClick={() => setSelectedModel(model.name)}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className={`ap-model-icon ${model.color}`}>{model.icon}</span>
                      <span className="ap-model-name">{model.name}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AnalyzePage;
