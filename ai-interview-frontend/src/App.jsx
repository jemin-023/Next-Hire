import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard, Video, Settings, BarChart2,
  CheckCircle, ShieldAlert, Cpu, Mic, BrainCircuit,
  UserCheck, ChevronRight, UploadCloud, CheckCircle2,
  Globe, Calendar, CheckSquare, Clock, FileText, Monitor,
  AlertCircle, AlertTriangle, Search, MessageSquareWarning,
  Camera, Send, Wifi, Download, Share2, Link, Zap, Shield,
} from 'lucide-react';
import PortalSelection from './pages/PortalSelection';

// ── Cursor Glow (carried across all pages) ──────────────────────────────────
const CursorGlow = () => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const move = (e) => { if (el) { el.style.left = e.clientX + 'px'; el.style.top = e.clientY + 'px'; } };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);
  return <div ref={ref} className="cursor-glow" />;
};

// ── App Background Orbs (carried across all pages) ───────────────────────────
const AppOrbs = () => (
  <>
    <div className="app-orb app-orb--1" />
    <div className="app-orb app-orb--2" />
  </>
);

// ── Backend base URL ────────────────────────────────────────────────────────
const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// ── Simple API helper ───────────────────────────────────────────────────────
const api = {
  get: (path) => fetch(`${BACKEND}${path}`).then(r => r.json()),
  post: (path, body) =>
    fetch(`${BACKEND}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => r.json()),
};

// --- Shared Components ---

const CandidateCard = ({ rank, name, role, score, status, flags }) => {
  const getScoreClass = (s) => s >= 80 ? 'score-high' : s >= 60 ? 'score-med' : 'score-low';

  return (
    <tr>
      <td style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>#{rank}</td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-slate-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{role}</div>
          </div>
        </div>
      </td>
      <td>
        <div className={`score-circle ${getScoreClass(score)}`} style={{ width: '42px', height: '42px', fontSize: '1rem', borderWidth: '2px' }}>
          {score}
        </div>
      </td>
      <td>
        {status === 'Passed' && <span className="status-badge success"><CheckCircle2 size={14} /> Passed</span>}
        {status === 'Review' && <span className="status-badge warning"><AlertCircle size={14} /> Review</span>}
        {status === 'Rejected' && <span className="status-badge danger"><AlertTriangle size={14} /> Rejected</span>}
      </td>
      <td>
        {flags > 0 ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', fontSize: '0.85rem' }}>
            <ShieldAlert size={16} /> {flags} Flag(s)
          </span>
        ) : (
          <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>Clean</span>
        )}
      </td>
      <td style={{ textAlign: 'right' }}>
        <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }}>View Details <ChevronRight size={14} /></button>
      </td>
    </tr>
  );
};

const CheatDetector = ({ isFlagged }) => {
  if (!isFlagged) return null;
  return (
    <div className="panel pulse-danger fade-in" style={{ borderColor: 'var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.05)', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ color: 'var(--danger)' }}><MessageSquareWarning size={24} /></div>
        <div>
          <h4 style={{ color: 'var(--danger)', marginBottom: '0.25rem' }}>AI Flag: ChatGPT-written patterns detected</h4>
          <p style={{ color: 'var(--danger)', opacity: 0.9, fontSize: '0.85rem' }}>
            The candidate's response matches structured AI generation patterns (High lexical diversity, robotic transitions).
          </p>
        </div>
      </div>
    </div>
  );
};

const ProgressTracker = ({ currentStep }) => {
  const steps = [
    { id: 1, title: 'Introductory Questions', desc: 'Behavioral & background check' },
    { id: 2, title: 'Technical Assessment', desc: 'Live coding & system design' },
    { id: 3, title: 'Managerial Fit', desc: 'Conflict resolution & leadership' }
  ];

  return (
    <div className="stepper" style={{ marginBottom: '2rem' }}>
      <div className="panel-title"><Settings size={16} /> Interview Stages</div>
      {steps.map(step => (
        <div key={step.id} className={`step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}>
          <div className="step-indicator">
            {currentStep > step.id ? <CheckCircle size={12} /> : <span style={{ fontSize: '0.7rem' }}>{step.id}</span>}
          </div>
          <div className="step-content">
            <div className="step-title">{step.title}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{step.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Main Views ---

const DashboardView = () => {
  const candidates = [
    { id: 1, name: 'Alice Chen', role: 'Senior Frontend Engineer', score: 92, status: 'Passed', flags: 0 },
    { id: 2, name: 'Marcus Johnson', role: 'Backend Developer', score: 85, status: 'Passed', flags: 0 },
    { id: 3, name: 'David Smith', role: 'Full Stack Engineer', score: 76, status: 'Review', flags: 1 },
    { id: 4, name: 'Priya Sharma', role: 'Junior React Dev', score: 58, status: 'Rejected', flags: 3 },
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [shareCopied, setShareCopied] = useState(false);

  const filteredCandidates = candidates.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ['Rank', 'Name', 'Role', 'AI Score', 'Status', 'Integrity Flags'];
    const rows = filteredCandidates.map((c, i) => [
      i + 1,
      c.name,
      c.role,
      c.score,
      c.status,
      c.flags === 0 ? 'Clean' : `${c.flags} Flag(s)`
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leaderboard_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyShareLink = () => {
    const params = new URLSearchParams({
      view: 'leaderboard',
      date: new Date().toISOString().slice(0, 10),
      candidates: filteredCandidates.map(c => c.id).join(','),
    });
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  return (
    <div className="fade-in">
      <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
        <div className="stat-card stat-card--blue">
          <div className="panel-title"><Shield size={14} /> Total Candidates</div>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #FF2D78, #f97fad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>142</div>
          <div style={{ color: 'var(--success)', fontSize: '0.82rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Zap size={12} /> +12% this week</div>
        </div>
        <div className="stat-card stat-card--violet">
          <div className="panel-title"><BrainCircuit size={14} /> Average Suitability</div>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #e0185e, #ff5c97)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>78/100</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.5rem' }}>Based on 120 interviews</div>
        </div>
        <div className="stat-card stat-card--danger">
          <div className="panel-title" style={{ color: 'var(--danger)' }}><ShieldAlert size={14} /> Cheat Flags</div>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--danger)' }}>8</div>
          <div style={{ color: 'var(--danger)', fontSize: '0.82rem', marginTop: '0.5rem', opacity: 0.8 }}>Requires manual review</div>
        </div>
      </div>

      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="panel-title" style={{ marginBottom: 0 }}>Leaderboard Rankings</div>

          {/* Search + Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.5rem', width: '220px' }}
              />
            </div>

            {/* Export CSV */}
            <button
              className="btn btn-outline"
              onClick={exportToCSV}
              title="Download leaderboard as CSV"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
            >
              <Download size={15} />
              Export CSV
            </button>

            {/* Copy Share Link */}
            <button
              className="btn btn-outline"
              onClick={copyShareLink}
              title="Copy shareable link to clipboard"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.45rem 0.9rem', fontSize: '0.85rem', whiteSpace: 'nowrap',
                borderColor: shareCopied ? 'var(--success)' : undefined,
                color: shareCopied ? 'var(--success)' : undefined,
                transition: 'color 0.2s, border-color 0.2s',
              }}
            >
              {shareCopied ? <>✓ Copied!</> : <><Link size={15} /> Share Link</>}
            </button>
          </div>
        </div>

        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Candidate</th>
              <th>AI Score</th>
              <th>Status</th>
              <th>Integrity</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredCandidates.length > 0
              ? filteredCandidates.map((c, i) => <CandidateCard key={c.id} rank={i + 1} {...c} />)
              : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem', fontSize: '0.9rem' }}>
                    No candidates match your search.
                  </td>
                </tr>
              )
            }
          </tbody>
        </table>

        {/* Footer meta row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span>{filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? 's' : ''} shown</span>
          <span>Last updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
};

const SimulatorView = () => {
  const [cheatFlag, setCheatFlag] = useState(false);
  const [currentStep, setCurrentStep] = useState(2);
  const [vlmHealth, setVlmHealth] = useState(null);
  const [detectorHealth, setDetectorHealth] = useState(null);
  const [events, setEvents] = useState([]);
  const [detectionResults, setDetectionResults] = useState([]);
  const [auditSummary, setAuditSummary] = useState(null);
  const DEMO_INTERVIEW_ID = 101;

  // Fetch health on mount
  useEffect(() => {
    api.get('/api/vlm/health').then(data => setVlmHealth(data)).catch(() => { });
    api.get('/api/detector/health').then(data => setDetectorHealth(data)).catch(() => { });
  }, []);

  // Poll proctoring events every 5s
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await api.get(`/api/vlm/events/${DEMO_INTERVIEW_ID}`);
        if (res.events?.length > 0) { setEvents(res.events); setCheatFlag(true); }
      } catch (e) { }
    };
    poll();
    const interval = setInterval(poll, 5_000);
    return () => clearInterval(interval);
  }, []);

  // Poll AI detection results every 8s (company-side only)
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await api.get(`/api/detector/results/${DEMO_INTERVIEW_ID}`);
        if (res.results?.length > 0) setDetectionResults(res.results);
        if (res.summary) setAuditSummary(res.summary);
      } catch (e) { }
    };
    poll();
    const interval = setInterval(poll, 8_000);
    return () => clearInterval(interval);
  }, []);

  // Simulate flagging after 3s for demo if no real events
  useEffect(() => {
    if (events.length === 0) {
      const timer = setTimeout(() => setCheatFlag(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [events]);

  const verdictColor = (v) => v === 'ai' ? 'var(--danger)' : v === 'uncertain' ? 'var(--warning)' : 'var(--success)';
  const verdictBg = (v) => v === 'ai' ? 'rgba(239,68,68,0.1)' : v === 'uncertain' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)';
  const overallVerdictColor = (v) => v === 'cheating' ? 'var(--danger)' : v === 'suspicious' ? 'var(--warning)' : 'var(--success)';

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) 1fr', gap: '1.5rem', height: '100%' }}>
      {/* Left Column: Interview Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="panel" style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div className="status-badge success"><div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--success)', animation: 'pulseGlow 2s infinite' }}></div> Live Interview</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>00:14:32</div>
          </div>

          <div className="video-container" style={{ flex: 1, minHeight: '280px' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
              <div style={{ flex: 1, borderRight: '1px solid var(--border-color)', position: 'relative', background: 'var(--bg-slate)' }}>
                <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(0,0,0,0.5)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem' }}>AI Interviewer</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <BrainCircuit size={64} color="var(--accent-purple)" style={{ opacity: 0.5 }} />
                  <div className="ai-waveform" style={{ marginTop: '2rem' }}>
                    <div className="bar"></div><div className="bar"></div><div className="bar"></div><div className="bar"></div><div className="bar"></div>
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(0,0,0,0.5)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem' }}>Candidate Camera</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                  <UserCheck size={48} opacity={0.3} />
                </div>
              </div>
            </div>
            <div className="video-overlay">
              <div style={{ fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>AI: </span>
                "Can you explain how you would design a scalable microservices architecture?"
              </div>
            </div>
          </div>
        </div>

        {/* AI Answer Integrity Panel — COMPANY ONLY */}
        <div className="panel">
          <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <ShieldAlert size={18} color="var(--accent-purple)" /> AI Answer Integrity Monitor
            <span style={{ fontSize: '0.7rem', background: 'rgba(139,92,246,0.15)', color: 'var(--accent-purple)', padding: '0.15rem 0.5rem', borderRadius: '3px', marginLeft: 'auto' }}>COMPANY ONLY</span>
          </div>

          {/* Overall verdict badge */}
          {auditSummary && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: verdictBg(auditSummary.overall_verdict === 'clean' ? 'human' : auditSummary.overall_verdict === 'cheating' ? 'ai' : 'uncertain'), borderRadius: '6px', border: `1px solid ${overallVerdictColor(auditSummary.overall_verdict)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Session Verdict</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: overallVerdictColor(auditSummary.overall_verdict), textTransform: 'uppercase' }}>
                  {auditSummary.overall_verdict}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem' }}>
                <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, color: 'var(--danger)' }}>{auditSummary.ai_count || 0}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>AI</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, color: 'var(--warning)' }}>{auditSummary.uncertain_count || 0}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Uncertain</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, color: 'var(--success)' }}>{auditSummary.human_count || 0}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Human</div></div>
              </div>
            </div>
          )}

          {/* Per-turn results */}
          {detectionResults.length > 0 ? (
            <div style={{ maxHeight: '230px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {detectionResults.map((r, i) => (
                <div key={i} style={{ padding: '0.6rem 0.75rem', background: verdictBg(r.verdict), borderRadius: '5px', border: `1px solid ${verdictColor(r.verdict)}30`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', minWidth: '2.5rem' }}>T{r.turn}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.82rem', color: verdictColor(r.verdict), textTransform: 'uppercase' }}>{r.verdict}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.78rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{Math.round((r.ai_confidence || 0) * 100)}% conf</span>
                    <span style={{ fontWeight: 700, color: r.score_multiplier === 0 ? 'var(--danger)' : r.score_multiplier === 0.5 ? 'var(--warning)' : 'var(--success)' }}>
                      ×{r.score_multiplier}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', padding: '1rem', textAlign: 'center' }}>
              No detection results yet — results appear live as candidate answers.
            </div>
          )}

          {/* Flagged signals */}
          {detectionResults.filter(r => r.verdict === 'ai').length > 0 && (
            <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.75rem', background: 'rgba(239,68,68,0.06)', borderRadius: '5px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.4rem' }}>Detected AI Patterns:</div>
              {detectionResults.filter(r => r.verdict === 'ai').slice(0, 3).map((r, i) => {
                const signals = typeof r.signals === 'string' ? JSON.parse(r.signals) : (r.signals || []);
                return signals.slice(0, 2).map((s, j) => (
                  <div key={`${i}-${j}`} style={{ fontSize: '0.75rem', color: 'var(--danger)', opacity: 0.8, marginBottom: '0.2rem' }}>• T{r.turn}: {s}</div>
                ));
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: AI Monitoring Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <CheatDetector isFlagged={cheatFlag} />

        {/* VLM API Status */}
        <div className="panel" style={{ padding: '1rem' }}>
          <div className="panel-title" style={{ marginBottom: '0.75rem' }}><Cpu size={16} /> VLM Model Status</div>
          {vlmHealth ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Model</span><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{vlmHealth.model || 'N/A'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Status</span><span style={{ color: vlmHealth.status === 'ok' ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>{vlmHealth.status?.toUpperCase()}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Active Sessions</span><span>{vlmHealth.active_sessions ?? '—'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>VRAM</span><span>{vlmHealth.vram_used_gb ? `${vlmHealth.vram_used_gb} / ${vlmHealth.vram_total_gb} GB` : '—'}</span></div>
            </div>
          ) : (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="spinner" style={{ width: 14, height: 14 }} /> Connecting to VLM API...
            </div>
          )}
        </div>

        {/* AI Detector Status — COMPANY ONLY */}
        <div className="panel" style={{ padding: '1rem' }}>
          <div className="panel-title" style={{ marginBottom: '0.75rem' }}><ShieldAlert size={16} /> AI Detector Status</div>
          {detectorHealth ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Model</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{detectorHealth.model || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                <span style={{ color: detectorHealth.status === 'ok' ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>
                  {detectorHealth.status?.toUpperCase() || 'OFFLINE'}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="spinner" style={{ width: 14, height: 14 }} /> Connecting to AI Detector...
            </div>
          )}
        </div>

        <div className="panel" style={{ flex: 1 }}>
          <div className="panel-title"><Cpu size={18} /> AI Monitoring</div>

          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-dark)', borderRadius: 'var(--border-radius-sm)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Mic className="pulse-danger" color="var(--accent-purple)" size={20} />
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--accent-purple)', fontWeight: '600' }}>Analyzing Voice Tokens...</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Checking semantic coherence</div>
            </div>
          </div>

          <ProgressTracker currentStep={currentStep} />

          {/* Live proctoring events */}
          {events.length > 0 && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239,68,68,0.08)', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.3)' }}>
              <div style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.5rem' }}><ShieldAlert size={13} /> Live Flags ({events.length})</div>
              {events.slice(0, 4).map((e, i) => (
                <div key={i} style={{ fontSize: '0.78rem', color: 'var(--danger)', opacity: 0.85, marginBottom: '0.25rem' }}>
                  • {e.event_type.replace(/_/g, ' ')} <span style={{ opacity: 0.6 }}>({Math.round(e.confidence * 100)}%)</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 'auto' }}>
            <div className="panel-title" style={{ fontSize: '0.85rem' }}>Current Evaluation</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              <span>Technical Accuracy</span>
              <span style={{ color: 'var(--success)' }}>85%</span>
            </div>
            <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--bg-dark)', borderRadius: '2px', marginBottom: '1rem' }}>
              <div style={{ width: '85%', height: '100%', backgroundColor: 'var(--success)', borderRadius: '2px' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              <span>Confidence Level</span>
              <span style={{ color: 'var(--warning)' }}>62%</span>
            </div>
            <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--bg-dark)', borderRadius: '2px' }}>
              <div style={{ width: '62%', height: '100%', backgroundColor: 'var(--warning)', borderRadius: '2px' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SetupWizardView = () => {
  return (
    <div className="fade-in grid-2">
      <div className="panel">
        <div className="panel-title"><Settings size={18} /> Grounding & Job Profile (RAG Context)</div>
        <p style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>Provide job descriptions and specific materials to ground the AI and prevent hallucinations during the interview.</p>

        <div className="form-group">
          <label className="form-label">Job Title</label>
          <input type="text" className="form-control" defaultValue="Senior Frontend Engineer" />
        </div>

        <div className="form-group">
          <label className="form-label">Core Technical Requirements</label>
          <textarea className="form-control" defaultValue="- React / Next.js\n- System Design\n- Performance Optimization"></textarea>
        </div>

        <div className="panel" style={{ borderStyle: 'dashed', backgroundColor: 'transparent', textAlign: 'center', padding: '2rem' }}>
          <UploadCloud size={32} color="var(--text-secondary)" style={{ marginBottom: '1rem', margin: '0 auto' }} />
          <h4 style={{ marginBottom: '0.5rem' }}>Upload RAG Documents</h4>
          <p style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>Upload internal architecture docs, code standards, or behavioral rubrics (PDF, TXT, DOCX).</p>
          <button className="btn btn-outline">Browse Files</button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title"><BrainCircuit size={18} /> Interview Intelligence Settings</div>

        <div className="form-group" style={{ marginTop: '1.5rem' }}>
          <label className="form-label">Interview Difficulty Calibration</label>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <button className="btn btn-outline" style={{ flex: 1 }}>Junior</button>
            <button className="btn btn-primary" style={{ flex: 1 }}>Mid-Level</button>
            <button className="btn btn-outline" style={{ flex: 1 }}>Senior/Staff</button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Strictness of Cheat Detection</label>
          <input type="range" min="1" max="100" defaultValue="80" style={{ width: '100%', accentColor: 'var(--accent-purple)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            <span>Lenient</span>
            <span>High Awareness (Recommended)</span>
          </div>
        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--bg-dark)', borderRadius: 'var(--border-radius-sm)', borderLeft: '3px solid var(--accent-purple)' }}>
          <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>RAG Pipeline Status</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--success)' }}>
            <CheckCircle size={14} /> Vector database initialized. 3 documents embedded.
          </div>
        </div>

        <button className="btn btn-primary" style={{ width: '100%', marginTop: '2rem', padding: '0.75rem' }}>
          Save Configuration & Deploy AI
        </button>
      </div>
    </div>
  );
};

const AnalyticsView = () => {
  return (
    <div className="fade-in">
      <div className="panel" style={{ marginBottom: '1.5rem' }}>
        <div className="panel-title"><BarChart2 size={18} /> Bias Exposure Analysis</div>
        <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>Compares AI objective scoring vs. Human Interviewer historical bias across key technical competencies.</p>

        <div className="grid-2">
          <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-dark)', borderRadius: 'var(--border-radius-md)' }}>
            <h4 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Candidate Gap vs. Bias Overlay</h4>
            {/* Simple CSS-based bar chart representation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'System Design', ai: 85, human: 70 },
                { label: 'Algorithms', ai: 90, human: 92 },
                { label: 'Communication', ai: 75, human: 60 },
                { label: 'Leadership', ai: 80, human: 65 }
              ].map(stat => (
                <div key={stat.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                    <span>{stat.label}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Δ {Math.abs(stat.ai - stat.human)}%</span>
                  </div>
                  <div style={{ display: 'flex', height: '12px', width: '100%', backgroundColor: 'var(--bg-slate-light)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${stat.ai}%`, backgroundColor: 'var(--accent-purple)', opacity: 0.8 }} title={`AI Score: ${stat.ai}`}></div>
                    <div style={{ width: `${stat.human}%`, backgroundColor: 'var(--warning)', opacity: 0.8, transform: `translateX(-${stat.ai}%)` }} title={`Human Score: ${stat.human}`}></div>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem', fontSize: '0.75rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 10, height: 10, backgroundColor: 'var(--accent-purple)' }}></div> AI Objective Score</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 10, height: 10, backgroundColor: 'var(--warning)' }}></div> Historical Human Avg</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="panel" style={{ backgroundColor: 'transparent', borderColor: 'var(--warning)' }}>
              <div className="panel-title" style={{ color: 'var(--warning)', fontSize: '0.85rem' }}>Identified Bias Alert</div>
              <p style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>
                System shows human interviewers traditionally score <strong>Communication</strong> 15% lower for candidates in this demographic compared to the AI objective semantic analysis.
              </p>
            </div>
            <div className="panel" style={{ backgroundColor: 'transparent', borderColor: 'var(--success)' }}>
              <div className="panel-title" style={{ color: 'var(--success)', fontSize: '0.85rem' }}>AI Correction Applied</div>
              <p style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>
                The AI Leaderboard scores have normalized the behavioral weights, improving objective candidate ranking fairness by 22%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Candidate (Interviewee) Portal ---

const CandidateDashboard = ({ onJoin }) => {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 mins

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fade-in">
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="panel" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(30,41,59,1) 100%)', borderColor: 'var(--accent-purple)' }}>
          <div className="panel-title" style={{ color: 'var(--text-primary)' }}><Clock size={18} color="var(--accent-purple)" /> Upcoming Interview</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Full Stack Engineer (Round 2)</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>TechCorp Inc. • System Design & Logic</p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Starts In</div>
              <div className="timer-card">{formatTime(timeLeft)}</div>
            </div>
            <button className="btn btn-primary" onClick={onJoin} style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
              Join Room <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title"><UserCheck size={18} /> Profile Record Overview</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
              <span>Total Applications</span>
              <span style={{ fontWeight: 'bold' }}>12</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Integrity Standing</span>
              <span className="status-badge success"><CheckCircle2 size={14} /> Excellent</span>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title" style={{ marginBottom: '1.5rem' }}><Calendar size={18} /> Scheduled Interviews</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--bg-dark)', borderRadius: 'var(--border-radius-sm)', borderLeft: '4px solid var(--accent-purple)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0 }}>Full Stack Engineer (Round 2)</h4>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>TechCorp Inc. • Today, 2:00 PM EST</div>
            </div>
            <span className="status-badge warning" style={{ background: 'rgba(245, 158, 11, 0.2)' }}>Starting Soon</span>
          </div>

          <div style={{ padding: '1rem', background: 'var(--bg-dark)', borderRadius: 'var(--border-radius-sm)', borderLeft: '4px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0 }}>Frontend Lead (Intro)</h4>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Global Innovations • Friday, 10:00 AM EST</div>
            </div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Scheduled</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const CandidateSchedule = () => {
  return (
    <div className="fade-in panel">
      <div className="panel-title" style={{ marginBottom: '2rem' }}><Calendar size={18} /> TechCorp Inc. Application Progress</div>

      <div className="stepper">
        <div className="step completed">
          <div className="step-indicator"><CheckCircle2 size={14} /></div>
          <div className="step-content">
            <div className="step-title">Application Review</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Resume verified by ATS.</div>
          </div>
        </div>
        <div className="step completed">
          <div className="step-indicator"><CheckCircle2 size={14} /></div>
          <div className="step-content">
            <div className="step-title">Round 1: Behavioral AI Interview</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Assessed cultural fit and communication skills.</div>
            <span className="status-badge success">Cleared</span>
          </div>
        </div>
        <div className="step active">
          <div className="step-indicator"><div className="spinner" style={{ width: 10, height: 10, borderWidth: '2px' }}></div></div>
          <div className="step-content">
            <div className="step-title">Round 2: Technical & Logic</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pending: Scheduled for today.</div>
          </div>
        </div>
        <div className="step">
          <div className="step-indicator"><span style={{ fontSize: '0.7rem' }}>4</span></div>
          <div className="step-content">
            <div className="step-title">Final Round: Managerial</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Locked</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CandidateResults = () => {
  return (
    <div className="fade-in panel">
      <div className="panel-title" style={{ marginBottom: '1.5rem' }}><FileText size={18} /> Past Interview Results</div>

      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Company</th>
            <th>Role</th>
            <th>Date</th>
            <th>AI Score</th>
            <th>Outcome</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ fontWeight: '500' }}>Innovate Solutions</td>
            <td>Data Engineer</td>
            <td style={{ color: 'var(--text-secondary)' }}>Mar 10, 2026</td>
            <td><div className="score-circle score-high" style={{ width: 32, height: 32, fontSize: '0.85rem' }}>88</div></td>
            <td><span className="status-badge success">Offer Extended</span></td>
          </tr>
          <tr>
            <td style={{ fontWeight: '500' }}>CloudNet</td>
            <td>React Developer</td>
            <td style={{ color: 'var(--text-secondary)' }}>Feb 24, 2026</td>
            <td><div className="score-circle score-med" style={{ width: 32, height: 32, fontSize: '0.85rem' }}>71</div></td>
            <td><span className="status-badge warning">Waitlisted</span></td>
          </tr>
          <tr>
            <td style={{ fontWeight: '500' }}>AlphaTech</td>
            <td>UI Designer</td>
            <td style={{ color: 'var(--text-secondary)' }}>Feb 05, 2026</td>
            <td><div className="score-circle score-low" style={{ width: 32, height: 32, fontSize: '0.85rem' }}>54</div></td>
            <td><span className="status-badge danger">Rejected</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const PreInterviewChecks = ({ onChecksPassed, onInterviewStarted }) => {
  const [stage, setStage] = useState('identity'); // identity | capture | verify | checks
  const [email, setEmail] = useState('');
  const [candidateId, setCandidateId] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null); // base64 data URL
  const [registeredPhoto, setRegisteredPhoto] = useState(null); // URL from server
  const [verifyStatus, setVerifyStatus] = useState(null); // 'matched' | 'no_photo' | 'error'
  const [checks, setChecks] = useState({ camera: false, mic: false, screen: false, network: false });
  const [startingInterview, setStartingInterview] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const allChecksPassed = Object.values(checks).every(Boolean);

  // Open camera stream
  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      // Run hardware checks while camera is live
      setTimeout(() => setChecks(c => ({ ...c, camera: true })), 800);
      setTimeout(() => setChecks(c => ({ ...c, mic: true })), 1600);
      setTimeout(() => setChecks(c => ({ ...c, screen: true })), 2400);
      setTimeout(() => setChecks(c => ({ ...c, network: true })), 3000);
    } catch (err) {
      console.error('Camera error:', err);
      // Auto-pass checks even without camera for demo
      setTimeout(() => setChecks({ camera: true, mic: true, screen: true, network: true }), 1500);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  // Start camera when entering capture stage
  useEffect(() => {
    if (stage === 'capture') openCamera();
    return () => { if (stage === 'capture') stopCamera(); };
  }, [stage]);

  // Capture a snapshot from the live video
  const captureSnapshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhoto(dataUrl);
  };

  // Upload photo to backend and retrieve registration photo
  const uploadAndVerify = async () => {
    if (!capturedPhoto) return;
    setStage('verify');
    stopCamera();
    try {
      // Convert base64 to blob
      const blob = await fetch(capturedPhoto).then(r => r.blob());
      const formData = new FormData();
      formData.append('photo', blob, 'capture.jpg');
      if (candidateId) formData.append('candidateId', candidateId);

      const uploadRes = await fetch(`${BACKEND}/api/vlm/upload-photo`, {
        method: 'POST', body: formData,
      }).then(r => r.json());

      if (uploadRes.success) {
        setRegisteredPhoto(`${BACKEND}${uploadRes.photo_url}`);
      }

      // Attempt to fetch existing registration photo for comparison
      if (candidateId) {
        const verifyRes = await api.get(`/api/vlm/verify-face/${candidateId}`);
        if (verifyRes.photo_url) {
          setRegisteredPhoto(`${BACKEND}${verifyRes.photo_url}`);
          setVerifyStatus('matched');
        } else {
          setVerifyStatus('no_photo');
        }
      } else {
        setVerifyStatus('no_photo');
      }
    } catch (err) {
      console.error('Verify error:', err);
      setVerifyStatus('error');
    }
    setStage('checks');
    openCamera();
  };

  // Proceed into the interview room
  const enterRoom = async () => {
    setStartingInterview(true);
    try {
      const startRes = await api.post('/api/interview/start', {
        candidateName: email.split('@')[0] || 'Candidate',
        candidateEmail: email || 'candidate@example.com',
        companyId: 1,
        jobRole: 'Software Engineer',
      });
      stopCamera();
      onChecksPassed();
      if (onInterviewStarted && startRes.success) {
        onInterviewStarted(startRes);
      }
    } catch (err) {
      console.error('Start interview error:', err);
      stopCamera();
      onChecksPassed();
    }
  };

  // ── STAGE: identity ──────────────────────────────────────────────────────
  if (stage === 'identity') return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="panel" style={{ width: '100%', maxWidth: '460px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Identity Verification</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Enter your registered email to begin facial verification.
        </p>
        <div className="form-group">
          <label className="form-label">Registered Email</label>
          <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Candidate ID <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(optional)</span></label>
          <input type="text" className="form-control" onChange={e => setCandidateId(e.target.value || null)} placeholder="e.g. 42" />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', padding: '0.9rem', marginTop: '0.5rem' }}
          disabled={!email} onClick={() => setStage('capture')}>
          Continue to Camera Check <Camera size={16} style={{ marginLeft: '0.5rem' }} />
        </button>
      </div>
    </div>
  );

  // ── STAGE: capture ───────────────────────────────────────────────────────
  if (stage === 'capture') return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="panel" style={{ width: '100%', maxWidth: '560px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Facial Registration</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Position your face in the frame and click Capture.
        </p>
        <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', background: '#000', marginBottom: '1rem' }}>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: 'block', maxHeight: '320px', objectFit: 'cover' }} />
          {/* Overlay guide */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '160px', height: '200px', border: '2px dashed rgba(139,92,246,0.7)', borderRadius: '50%', pointerEvents: 'none' }} />
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        {capturedPhoto ? (
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <img src={capturedPhoto} alt="captured" style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '6px', border: '2px solid var(--accent-purple)' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem' }}>
              <div style={{ color: 'var(--success)', fontSize: '0.9rem', fontWeight: 600 }}><CheckCircle2 size={14} /> Photo captured</div>
              <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => setCapturedPhoto(null)}>Retake</button>
            </div>
          </div>
        ) : null}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={captureSnapshot}>
            <Camera size={16} /> {capturedPhoto ? 'Retake' : 'Capture Photo'}
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} disabled={!capturedPhoto} onClick={uploadAndVerify}>
            Upload &amp; Verify <CheckCircle2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  // ── STAGE: verify / checks ───────────────────────────────────────────────
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="panel" style={{ width: '100%', maxWidth: '520px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Pre-Interview Checks</h2>

        {/* Face comparison */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-dark)', borderRadius: '8px' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Registered Photo</div>
            {registeredPhoto
              ? <img src={registeredPhoto} alt="registered" style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '6px', border: '2px solid var(--success)' }} />
              : <div style={{ width: '100%', height: '100px', background: 'var(--bg-slate-light)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}><UserCheck size={32} opacity={0.4} /></div>
            }
          </div>
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.25rem' }}>
            {verifyStatus === 'matched'
              ? <CheckCircle2 size={28} color="var(--success)" />
              : verifyStatus === 'no_photo'
                ? <AlertCircle size={28} color="var(--warning)" />
                : <div className="spinner" />}
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Live Camera</div>
            {capturedPhoto
              ? <img src={capturedPhoto} alt="live" style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '6px', border: '2px solid var(--accent-purple)' }} />
              : <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '6px' }} />
            }
          </div>
        </div>

        {verifyStatus === 'matched' && (
          <div style={{ marginBottom: '1rem', padding: '0.6rem 1rem', background: 'rgba(16,185,129,0.1)', borderRadius: '6px', border: '1px solid var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '0.9rem' }}>
            <CheckCircle2 size={16} /> Identity Verified — Face matched
          </div>
        )}
        {verifyStatus === 'no_photo' && (
          <div style={{ marginBottom: '1rem', padding: '0.6rem 1rem', background: 'rgba(245,158,11,0.1)', borderRadius: '6px', border: '1px solid var(--warning)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', fontSize: '0.9rem' }}>
            <AlertCircle size={16} /> No prior photo — this capture is now registered
          </div>
        )}

        {/* Hardware checks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
          {[['camera', 'Camera Access', 'HD video feed active'], ['mic', 'Microphone', 'Audio levels optimal'], ['screen', 'Screen Permissions', 'Display isolation secured'], ['network', 'Network Stability', 'Ping: 24ms (Excellent)']].map(([key, label, okText]) => (
            <div key={key} className={`check-item ${checks[key] ? 'passed' : ''}`}>
              {checks[key] ? <CheckCircle2 size={22} color="var(--success)" /> : <div className="spinner" style={{ width: 20, height: 20 }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{label}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{checks[key] ? okText : 'Checking...'}</div>
              </div>
            </div>
          ))}
        </div>

        <button
          className="btn btn-primary"
          disabled={!allChecksPassed || startingInterview}
          onClick={enterRoom}
          style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', opacity: allChecksPassed ? 1 : 0.5, cursor: allChecksPassed ? 'pointer' : 'not-allowed' }}
        >
          {startingInterview ? <><div className="spinner" style={{ width: 16, height: 16, display: 'inline-block', marginRight: '0.5rem' }} />Starting AI Session...</> : allChecksPassed ? 'Enter Interview Room' : 'Completing Checks...'}
        </button>
      </div>
    </div>
  );
};

// ── Assessment Breakdown Card ──────────────────────────────────────────────
const AssessmentBreakdown = ({ assessment, score, onClose }) => {
  if (!assessment && !score) return null;
  const rec = assessment?.hire_recommendation || 'N/A';
  const recColor = rec === 'YES' ? 'var(--success)' : rec === 'NO' ? 'var(--danger)' : 'var(--warning)';
  const techScore = assessment?.technical_score || Math.round((score?.technical || 75) / 10);
  const commScore = assessment?.communication_score || Math.round((score?.communication || 75) / 10);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem' }}>
      <div className="panel" style={{ width: '100%', maxWidth: '720px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <BrainCircuit size={40} color="var(--accent-purple)" style={{ marginBottom: '0.5rem' }} />
          <h2 style={{ margin: '0 0 0.25rem 0' }}>Interview Complete</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>AI Assessment Generated by Qwen 2.5</p>
        </div>

        {/* Recommendation badge */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '1.25rem', background: `rgba(${rec === 'YES' ? '16,185,129' : rec === 'NO' ? '239,68,68' : '245,158,11'}, 0.1)`, borderRadius: '8px', border: `1px solid ${recColor}` }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Hire Recommendation</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: recColor }}>{rec}</div>
          {assessment?.hire_reasoning && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.5 }}>{assessment.hire_reasoning}</p>}
        </div>

        {/* Score bars */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          {[['Technical', techScore, false], ['Communication', commScore, true]].map(([label, val, isTeal]) => (
            <div key={label} className="panel" style={{ padding: '1rem', background: 'rgba(3,5,15,0.6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
                <span style={{ fontWeight: 800, color: isTeal ? 'var(--accent-teal)' : 'var(--accent-violet)', fontSize: '1rem' }}>{val}/10</span>
              </div>
              <div className="glow-progress-track">
                <div className={`glow-progress-fill${isTeal ? ' glow-progress-fill--teal' : ''}`} style={{ width: `${val * 10}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Strengths & Concerns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          {assessment?.technical_strengths?.length > 0 && (
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>✓ Strengths</div>
              {assessment.technical_strengths.map((s, i) => (
                <div key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', paddingLeft: '0.5rem', borderLeft: '2px solid var(--success)' }}>{s}</div>
              ))}
            </div>
          )}
          {assessment?.gaps_or_concerns?.length > 0 && (
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>⚠ Gaps</div>
              {assessment.gaps_or_concerns.map((g, i) => (
                <div key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', paddingLeft: '0.5rem', borderLeft: '2px solid var(--warning)' }}>{g}</div>
              ))}
            </div>
          )}
        </div>

        {assessment?.overall_impression && (
          <div style={{ padding: '1rem', background: 'var(--bg-dark)', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            "{assessment.overall_impression}"
          </div>
        )}

        <button className="btn btn-primary" onClick={onClose} style={{ width: '100%', padding: '0.9rem' }}>
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

// ── Live Qwen Interview Room (Candidate) ───────────────────────────────────
const VlmInterviewRoom = ({ interviewData, onExit }) => {
  const [question, setQuestion] = useState(interviewData?.question?.text || 'Tell me about yourself and your background.');
  const [answer, setAnswer] = useState('');
  const [turn, setTurn] = useState(interviewData?.vlm?.turn || 1);
  const [vlmSessionId] = useState(interviewData?.interview?.vlmSessionId || null);
  const [interviewId] = useState(interviewData?.interview?.id || 101);
  const [isClosing, setIsClosing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [score, setScore] = useState(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const [proctoringEvents, setProctoringEvents] = useState([]);
  const [cheatFlag, setCheatFlag] = useState(false);
  const [timer, setTimer] = useState(0);
  const [autosaveStatus, setAutosaveStatus] = useState(null); // 'saving' | 'saved' | null
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Persist session to localStorage for resume on refresh
  useEffect(() => {
    if (interviewId && vlmSessionId) {
      localStorage.setItem('pocketai_session', JSON.stringify({ interviewId, vlmSessionId, timestamp: Date.now() }));
    }
  }, [interviewId, vlmSessionId]);

  // Camera
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => { streamRef.current = stream; if (videoRef.current) videoRef.current.srcObject = stream; })
      .catch(() => { });
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  // Timer
  useEffect(() => {
    const t = setInterval(() => setTimer(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Poll proctoring events every 10s
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await api.get(`/api/vlm/events/${interviewId}`);
        if (res.events?.length > 0) { setProctoringEvents(res.events); setCheatFlag(true); }
      } catch (e) { }
    };
    const interval = setInterval(poll, 10_000);
    return () => clearInterval(interval);
  }, [interviewId]);

  // Auto-clear error after 8s
  useEffect(() => {
    if (errorMsg) { const t = setTimeout(() => setErrorMsg(null), 8000); return () => clearTimeout(t); }
  }, [errorMsg]);

  // Auto-clear autosave status
  useEffect(() => {
    if (autosaveStatus === 'saved') { const t = setTimeout(() => setAutosaveStatus(null), 3000); return () => clearTimeout(t); }
  }, [autosaveStatus]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const submitAnswer = async () => {
    if (!answer.trim() || isLoading) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const resp = await fetch(`${BACKEND}/api/interview/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId, answer, questionNumber: turn, vlmSessionId }),
      });
      const res = await resp.json();

      if (!resp.ok) {
        setErrorMsg(res.error || `Error ${resp.status}`);
        if (resp.status === 404) {
          setErrorMsg('Session expired — the Kaggle server may have restarted. Your progress was autosaved.');
          setIsDone(true);
        }
        setIsLoading(false);
        setAnswer('');
        return;
      }

      if (res.done) {
        setIsDone(true);
        setQuestion('The interview is now complete. Thank you for your time!');
      } else {
        setQuestion(res.question.text);
        setTurn(res.question.turn || turn + 1);
        if (res.isClosing || res.vlm?.is_closing) setIsClosing(true);
      }

      // Show autosave indicator every 3 turns
      if (res.vlm?.turn && res.vlm.turn % 3 === 0) {
        setAutosaveStatus('saving');
        setTimeout(() => setAutosaveStatus('saved'), 1500);
      }
    } catch (err) {
      setErrorMsg('Network error — check your connection and try again.');
    }
    setAnswer('');
    setIsLoading(false);
  };

  const endInterview = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const resp = await fetch(`${BACKEND}/api/interview/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId, vlmSessionId }),
      });
      const res = await resp.json();
      if (res.assessment) setAssessment(res.assessment);
      if (res.score) setScore(res.score);
      setShowAssessment(true);
      localStorage.removeItem('pocketai_session');
    } catch (e) {
      setErrorMsg('Failed to generate assessment. Your transcript is saved.');
    }
    setIsLoading(false);
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  // Assessment view
  if (showAssessment) {
    return <AssessmentBreakdown assessment={assessment} score={score} onClose={() => { localStorage.removeItem('pocketai_session'); onExit(); }} />;
  }

  return (
    <div className="fade-in" style={{ display: 'flex', gap: '1.5rem', height: '100%', width: '100%' }}>
      {/* Left: AI + Question */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(3,5,15,0.4)' }}>
            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <BrainCircuit size={16} color="var(--accent-blue)" />
              <span style={{ background: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Interviewer</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>— Turn {turn}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {autosaveStatus && (
                <span style={{ fontSize: '0.72rem', color: autosaveStatus === 'saving' ? 'var(--text-secondary)' : 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  {autosaveStatus === 'saving' ? <><div className="spinner" style={{ width: 10, height: 10 }} /> Saving...</> : <><CheckCircle2 size={11} /> Saved</>}
                </span>
              )}
              {isClosing && (
                <span style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: 'var(--warning)', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700 }}>
                  ⏳ Final questions
                </span>
              )}
              <div className="live-badge"><div className="live-dot" /> Live</div>
              <span style={{ fontFamily: 'Courier New, monospace', color: 'var(--text-secondary)', fontSize: '0.85rem', letterSpacing: '1px' }}>{formatTime(timer)}</span>
            </div>
          </div>
          <div style={{ flex: 1, background: '#090909', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: '220px' }}>
            <BrainCircuit size={64} color="var(--accent-purple)" style={{ opacity: 0.8 }} />
            <div className="ai-waveform" style={{ marginTop: '1.5rem', transform: 'scale(1.3)' }}>
              <div className="bar" /><div className="bar" /><div className="bar" /><div className="bar" /><div className="bar" />
            </div>
            <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.6)', padding: '0.4rem 0.9rem', borderRadius: '20px', fontSize: '0.78rem', border: '1px solid rgba(255, 45, 120,0.2)' }}>
              <Cpu size={13} color={cheatFlag ? 'var(--warning)' : 'var(--success)'} />
              <span style={{ color: cheatFlag ? 'var(--warning)' : '#059669' }}>
                {cheatFlag ? 'Monitoring — Irregular pattern' : 'AI Proctoring Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Error toast */}
        {errorMsg && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: '6px', color: 'var(--danger)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={16} /> {errorMsg}
          </div>
        )}

        <div className="panel">
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-purple)', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current Question</div>
          <h3 style={{ fontSize: '1.1rem', lineHeight: 1.55, margin: '0 0 1rem 0' }}>{question}</h3>
          {!isDone ? (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <textarea
                className="form-control" rows={3} value={answer}
                onChange={e => setAnswer(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) submitAnswer(); }}
                placeholder="Type your answer here... (Ctrl+Enter to send)"
                disabled={isLoading} style={{ flex: 1, resize: 'none' }}
              />
              <button className="btn btn-primary" onClick={submitAnswer} disabled={isLoading || !answer.trim()}
                style={{ padding: '0.5rem 1rem', alignSelf: 'flex-end' }}>
                {isLoading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <Send size={16} />}
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={endInterview} disabled={isLoading} style={{ width: '100%', padding: '0.9rem' }}>
              {isLoading ? <><div className="spinner" style={{ width: 16, height: 16, display: 'inline-block', marginRight: '0.5rem' }} />Generating AI Assessment (this takes ~15s)...</> : 'Finish & Get Results'}
            </button>
          )}
        </div>
      </div>

      {/* Right: Camera + Progress */}
      <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="panel" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textAlign: 'center' }}>Your Camera</div>
          <div style={{ width: '100%', aspectRatio: '4/3', backgroundColor: 'var(--bg-dark)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>

        <div className="panel" style={{ flex: 1 }}>
          <ProgressTracker currentStep={Math.min(Math.ceil(turn / 4), 3)} />
          {proctoringEvents.length > 0 && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(239,68,68,0.08)', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.3)' }}>
              <div style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.5rem' }}><ShieldAlert size={13} /> Proctoring Alerts</div>
              {proctoringEvents.slice(0, 3).map((e, i) => (
                <div key={i} style={{ fontSize: '0.78rem', color: 'var(--danger)', opacity: 0.85, marginBottom: '0.25rem' }}>• {e.event_type.replace(/_/g, ' ')}</div>
              ))}
            </div>
          )}
          <div style={{ marginTop: '1.5rem', padding: '0.75rem', backgroundColor: 'var(--bg-dark)', borderRadius: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <ShieldAlert size={14} color="var(--text-secondary)" />
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Academic Integrity</span>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>This session is AI-monitored. Reading from scripts will be flagged.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const CandidateApp = ({ onExit }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [interviewData, setInterviewData] = useState(null);
  const [language, setLanguage] = useState('English');

  // Check localStorage for a resumable session on mount
  useEffect(() => {
    const saved = localStorage.getItem('pocketai_session');
    if (!saved) return;
    try {
      const session = JSON.parse(saved);
      // Only resume if saved within the last 12 hours (Kaggle session max)
      if (Date.now() - session.timestamp > 12 * 60 * 60 * 1000) {
        localStorage.removeItem('pocketai_session');
        return;
      }
      // Try to resume from backend
      api.get(`/api/interview/resume/${session.interviewId}`).then(res => {
        if (res.success && res.canResume) {
          setInterviewData({
            interview: { id: res.interview.id, vlmSessionId: res.interview.vlmSessionId },
            question: { text: res.lastQuestion || 'Welcome back. Please continue where you left off.' },
            vlm: { turn: res.lastTurn || 1 },
          });
          setCurrentView('simulator');
        } else if (res.success && res.assessment) {
          // Session already ended — clear and show dashboard
          localStorage.removeItem('pocketai_session');
        }
      }).catch(() => {
        localStorage.removeItem('pocketai_session');
      });
    } catch (_) {
      localStorage.removeItem('pocketai_session');
    }
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <CandidateDashboard onJoin={() => setCurrentView('precheck')} />;
      case 'schedule': return <CandidateSchedule />;
      case 'results': return <CandidateResults />;
      case 'precheck': return <PreInterviewChecks
        onChecksPassed={() => setCurrentView('simulator')}
        onInterviewStarted={(data) => { setInterviewData(data); setCurrentView('simulator'); }}
      />;
      case 'simulator': return <VlmInterviewRoom interviewData={interviewData} onExit={() => { setCurrentView('dashboard'); setInterviewData(null); }} />;
      default: return <CandidateDashboard onJoin={() => setCurrentView('precheck')} />;
    }
  };

  const isSimulator = currentView === 'simulator' || currentView === 'precheck';

  return (
    <div className="app-container">
      <CursorGlow />
      <AppOrbs />
      {/* Sidebar Navigation */}
      <div className="sidebar">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #FF2D78, #e0185e)', border: '1px solid rgba(255, 45, 120,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(255, 45, 120,0.3)' }}>
            <BrainCircuit size={20} color="#93c5fd" />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '1.1rem', letterSpacing: '-0.5px', background: 'linear-gradient(90deg,#FF2D78,#e0185e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Next-Hire</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '-1px' }}>Candidate Portal</div>
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <div className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}>
            <LayoutDashboard size={16} /> Dashboard
          </div>
          <div className={`nav-item ${currentView === 'schedule' ? 'active' : ''}`} onClick={() => setCurrentView('schedule')}>
            <CheckSquare size={16} /> Progress Schedule
          </div>
          <div className={`nav-item ${currentView === 'results' ? 'active' : ''}`} onClick={() => setCurrentView('results')}>
            <FileText size={16} /> My Results
          </div>
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ padding: '0.85rem 1rem', background: 'rgba(3,5,15,0.6)', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Profile Verification</div>
            <div className="sys-status">
              <div className="sys-status__dot" />
              Verified Applicant
            </div>
          </div>
          <button className="btn btn-outline" onClick={onExit} style={{ width: '100%' }}>Sign Out</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        <header className="header" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', marginBottom: 0, fontWeight: 700 }}>
              {currentView === 'dashboard' && 'Welcome, Candidate!'}
              {currentView === 'schedule' && 'Interview Progress Tracking'}
              {currentView === 'results' && 'Interview Results'}
              {currentView === 'precheck' && 'Session Preparation'}
              {currentView === 'simulator' && 'Live AI Evaluation'}
            </h2>
            <p style={{ marginTop: '0.15rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Candidate Portal</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {isSimulator && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <Globe size={14} />
                <select value={language} onChange={(e) => setLanguage(e.target.value)}
                  style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', outline: 'none', cursor: 'pointer', fontSize: '0.82rem' }}>
                  <option value="English">English</option>
                  <option value="Spanish">Español</option>
                  <option value="Mandarin">中文</option>
                </select>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border-color)' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>Alex Smith</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ID: 12345</div>
              </div>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#FF2D78,#e0185e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: 'white', fontSize: '0.78rem', boxShadow: '0 0 12px rgba(255, 45, 120,0.3)' }}>
                AS
              </div>
            </div>
          </div>
        </header>

        <main className="content-area">
          {renderView()}
        </main>
      </div>
    </div>
  );
};


// --- Interviewer (HR) Portal ---

const InterviewerApp = ({ onExit }) => {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView />;
      case 'simulator': return <SimulatorView />;
      case 'setup': return <SetupWizardView />;
      case 'analytics': return <AnalyticsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="app-container">
      <CursorGlow />
      <AppOrbs />
      {/* Sidebar Navigation — violet HR theme */}
      <div className="sidebar">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #e0185e, #e11d6b)', border: '1px solid rgba(224, 24, 94,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(224, 24, 94,0.35)' }}>
            <BrainCircuit size={20} color="#c4b5fd" />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '1.1rem', letterSpacing: '-0.5px', background: 'linear-gradient(90deg,#FF2D78,#ff5c97)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Next-Hire</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '-1px' }}>HR Admin Portal</div>
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <div className={`nav-item nav--hr ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}>
            <LayoutDashboard size={16} /> Leaderboard
          </div>
          <div className={`nav-item nav--hr ${currentView === 'simulator' ? 'active' : ''}`} onClick={() => setCurrentView('simulator')}>
            <Video size={16} /> Live Sessions Grid
          </div>
          <div className={`nav-item nav--hr ${currentView === 'setup' ? 'active' : ''}`} onClick={() => setCurrentView('setup')}>
            <Settings size={16} /> RAG Setup
          </div>
          <div className={`nav-item nav--hr ${currentView === 'analytics' ? 'active' : ''}`} onClick={() => setCurrentView('analytics')}>
            <BarChart2 size={16} /> Bias Analytics
          </div>
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ padding: '0.85rem 1rem', background: 'rgba(3,5,15,0.6)', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>System Status</div>
            <div className="sys-status">
              <div className="sys-status__dot" />
              All Systems Operational
            </div>
          </div>
          <button className="btn btn-outline" onClick={onExit} style={{ width: '100%' }}>Switch Role</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        <header className="header">
          <div>
            <h2 style={{ fontSize: '1.15rem', marginBottom: 0, fontWeight: 700 }}>
              {currentView === 'dashboard' && 'Candidate Leaderboard'}
              {currentView === 'simulator' && 'Active Interview Simulator'}
              {currentView === 'setup' && 'Context Grounding (RAG)'}
              {currentView === 'analytics' && 'Bias Exposure Analytics'}
            </h2>
            <p style={{ marginTop: '0.15rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>HR Admin Portal</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn btn-outline" style={{ borderRadius: '50%', width: '34px', height: '34px', padding: 0, flexShrink: 0 }}><Settings size={15} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border-color)' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>Jane Doe</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>HR Director</div>
              </div>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#FF2D78,#e0185e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: 'white', fontSize: '0.78rem', boxShadow: '0 0 12px rgba(255, 45, 120,0.35)' }}>
                JD
              </div>
            </div>
          </div>
        </header>

        <main className="content-area">
          {renderView()}
        </main>
      </div>
    </div>
  );
};


// --- Role Selection View (Moved to PortalSelection.jsx) ---


// --- Main App Coordinator ---

const App = () => {
  const [role, setRole] = useState(null);

  if (!role) {
    return <PortalSelection onSelectRole={setRole} />;
  }

  if (role === 'interviewer') {
    return <InterviewerApp onExit={() => setRole(null)} />;
  }

  if (role === 'candidate') {
    return <CandidateApp onExit={() => setRole(null)} />;
  }

  return null;
};

export default App;
