import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { getHistory } from '../services/api';
import './HistoryPage.css';

/* ── Sidebar (same items as AnalyzePage, minus Settings) ── */
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

/* ── Helpers ── */
const fmtDate = (ts) => {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
const fmtTime = (ts) => {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const truncate = (s, max = 100) => (s.length > max ? s.slice(0, max) + '…' : s);

const riskColor = (level) => {
  const l = (level || '').toUpperCase();
  if (l === 'HIGH') return 'hp-risk-high';
  if (l === 'MEDIUM') return 'hp-risk-medium';
  return 'hp-risk-low';
};

/* ── Filter presets ── */
const FILTERS = [
  { label: 'Last 10',  key: 'last10' },
  { label: 'Today',    key: 'today' },
  { label: 'This Week', key: 'week' },
  { label: 'This Month', key: 'month' },
  { label: 'All Time', key: 'all' },
];

function filterToParams(key) {
  const now = Date.now() / 1000;
  const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
  switch (key) {
    case 'last10': return { limit: 10 };
    case 'today':  return { since: startOfDay.getTime() / 1000 };
    case 'week': {
      const d = new Date();
      d.setDate(d.getDate() - d.getDay());
      d.setHours(0,0,0,0);
      return { since: d.getTime() / 1000 };
    }
    case 'month': {
      const d = new Date();
      d.setDate(1);
      d.setHours(0,0,0,0);
      return { since: d.getTime() / 1000 };
    }
    default: return {};
  }
}

/* ── Component ──────────────────────────────────────────────── */
const HistoryPage = () => {
  const navigate = useNavigate();
  const [items, setItems]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [filter, setFilter]   = useState('all');
  const [activeNav, setActiveNav] = useState('/history');

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0]?.substring(0, 2).toUpperCase() || '?';
  };
  const { userName } = useUser();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = filterToParams(filter);
      const data = await getHistory(params);
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleNavClick = (path) => {
    setActiveNav(path);
    navigate(path);
  };

  return (
    <div className="hp">

      {/* ── Top navbar ── */}
      <nav className="hp-nav">
        <div className="hp-nav-brand">
          <div className="hp-nav-logo"><span className="hp-nav-logo-txt">F</span></div>
          <span className="hp-nav-title">FACTLESS</span>
          <span className="hp-nav-sub">AI HALLUCINATION DETECTOR</span>
        </div>
        <div className="hp-nav-actions">
          <span className="hp-total-badge">{total} total analyses</span>
          <button className="hp-bell">
            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <div className="hp-avatar">{getInitials(userName)}</div>
        </div>
      </nav>

      <div className="hp-body">

        {/* ── Sidebar ── */}
        <aside className="hp-sidebar">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item.path)}
              className={`hp-sb-btn ${activeNav === item.path ? 'hp-sb-btn-on' : 'hp-sb-btn-off'}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </aside>

        {/* ── Main content ── */}
        <main className="hp-main">
          <div className="hp-header-row">
            <h1 className="hp-title">ANALYSIS HISTORY</h1>
            <div className="hp-filters">
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  className={`hp-filter-btn ${filter === f.key ? 'hp-filter-on' : ''}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="hp-error">{error}</div>}

          {loading ? (
            <div className="hp-loading">Loading history…</div>
          ) : items.length === 0 ? (
            <div className="hp-empty">
              <svg className="hp-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No analyses found for this filter.</p>
              <button className="hp-go-analyze" onClick={() => navigate('/analyze')}>
                Run your first analysis
              </button>
            </div>
          ) : (
            <div className="hp-table-wrap">
              <table className="hp-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Input</th>
                    <th>Risk</th>
                    <th>Score</th>
                    <th>Time</th>
                    <th>Length</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="hp-cell-id">{item.id}</td>
                      <td className="hp-cell-date">
                        <span className="hp-date">{fmtDate(item.created_at)}</span>
                        <span className="hp-time">{fmtTime(item.created_at)}</span>
                      </td>
                      <td className="hp-cell-text" title={item.input_text}>
                        {truncate(item.input_text)}
                      </td>
                      <td>
                        <span className={`hp-risk-badge ${riskColor(item.risk_level)}`}>
                          {item.risk_level}
                        </span>
                      </td>
                      <td className="hp-cell-score">
                        {Math.round(item.risk_score * 100)}%
                      </td>
                      <td className="hp-cell-ms">
                        {item.processing_time_ms.toFixed(0)}ms
                      </td>
                      <td className="hp-cell-len">
                        {item.input_length.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default HistoryPage;
