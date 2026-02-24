'use client';
import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Link from 'next/link';

const STATUSES = ['Registered', 'Under Review', 'Assigned', 'Investigation', 'Closed'];

const STATUS_INFO: Record<string, {icon:string, desc:string, cls:string}> = {
  'Registered':    { icon:'📋', desc:'Your complaint has been received and is awaiting initial review.', cls:'badge-registered' },
  'Under Review':  { icon:'🔎', desc:'Your case is being reviewed by a cyber crime officer.', cls:'badge-review' },
  'Assigned':      { icon:'👮', desc:'Case has been assigned to an investigating officer.', cls:'badge-assigned' },
  'Investigation': { icon:'🔍', desc:'Active investigation is underway. Officers are gathering evidence.', cls:'badge-investigation' },
  'Closed':        { icon:'✅', desc:'The case has been closed. If unsatisfied, you may raise a grievance.', cls:'badge-closed' },
};

export default function TrackCase() {
  const [caseId, setCaseId] = useState('');
  const [result, setResult] = useState<Record<string,unknown> | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const search = () => {
    if (!caseId.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    setTimeout(() => {
      try {
        const cases = JSON.parse(localStorage.getItem('cyb_cases') || '[]');
        const found = cases.find((c: {caseId:string}) => c.caseId === caseId.trim().toUpperCase());
        if (found) {
          setResult(found);
        } else {
          setError(`No case found with ID "${caseId.trim()}". Please check the ID and try again.`);
        }
      } catch {
        setError('An error occurred. Please try again.');
      }
      setLoading(false);
    }, 800);
  };

  const statusIndex = result ? STATUSES.indexOf(result.status as string) : -1;

  return (
    <>
      <Header />
      <div className="page-hero">
        <div className="badge">Case Tracking</div>
        <h2>Track Your Case</h2>
        <p>अपनी शिकायत की स्थिति जांचें | Enter your Case ID to track real-time status</p>
      </div>

      <div className="page-container" style={{maxWidth:760}}>

        {/* Search Box */}
        <div className="card animate-in" style={{marginBottom:24}}>
          <div className="card-header">
            <div className="card-icon">📡</div>
            <div><h3>Case ID Search</h3><p>Format: CYB-YYYY-XXXXXX (e.g. CYB-2026-839201)</p></div>
          </div>
          <div style={{display:'flex', gap:12}}>
            <input
              className="form-control"
              placeholder="Enter Case ID (e.g. CYB-2026-839201)"
              value={caseId}
              onChange={e=>setCaseId(e.target.value.toUpperCase())}
              onKeyDown={e=>e.key==='Enter' && search()}
              style={{flex:1, fontSize:'1.05rem', fontWeight:600, letterSpacing:1}}
            />
            <button className="btn btn-primary" onClick={search} disabled={loading||!caseId}>
              {loading ? '⏳' : '🔍 Track'}
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger animate-in"><span>❌</span><div>{error}</div></div>
        )}

        {result && (
          <div className="animate-in">
            {/* Case Summary */}
            <div className="card" style={{marginBottom:20, borderTop:'3px solid var(--saffron)'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12, marginBottom:18}}>
                <div>
                  <div style={{fontSize:'0.75rem', color:'var(--text-light)', marginBottom:4}}>CASE ID</div>
                  <div style={{fontSize:'1.4rem', fontWeight:800, color:'var(--navy)', letterSpacing:1}}>
                    {result.caseId as string}
                  </div>
                </div>
                <span className={`status-badge ${STATUS_INFO[result.status as string]?.cls}`}>
                  {STATUS_INFO[result.status as string]?.icon} {result.status as string}
                </span>
              </div>
              <div className="grid-2">
                {[
                  ['Complainant', result.name as string],
                  ['Crime Type', result.crimeType as string],
                  ['State', result.state as string],
                  ['Filed On', new Date(result.createdAt as string).toLocaleDateString('en-IN', {day:'2-digit', month:'long', year:'numeric'})],
                  ['Incident Date', result.incidentDate as string],
                  ['Financial Loss', result.lossAmount ? `₹${result.lossAmount}` : '—'],
                ].map(([k,v]) => (
                  <div key={k} style={{background:'var(--off-white)', borderRadius:8, padding:'10px 14px'}}>
                    <div style={{fontSize:'0.72rem', color:'var(--text-light)', fontWeight:600}}>{k}</div>
                    <div style={{fontSize:'0.9rem', fontWeight:600, color:'var(--text-dark)', marginTop:2}}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:14, textAlign:'right'}}>
                <Link href={`/case/${result.caseId as string}`} className="btn btn-primary btn-sm">View Full Details →</Link>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="card">
              <div className="card-header">
                <div className="card-icon">📊</div>
                <div><h3>Case Progress Timeline</h3><p>Track your case through each stage</p></div>
              </div>
              <div className="timeline">
                {STATUSES.map((s, i) => {
                  const isDone    = i < statusIndex;
                  const isCurrent = i === statusIndex;
                  return (
                    <div key={s} className={`timeline-item ${isDone ? 'active' : ''}`}>
                      <div className={`timeline-dot ${isDone ? 'done' : isCurrent ? 'current' : ''}`}>
                        {isDone ? '✓' : STATUS_INFO[s].icon}
                      </div>
                      <div className="timeline-content">
                        <h4 style={{color: isCurrent ? 'var(--saffron)' : isDone ? 'var(--navy)' : 'var(--text-light)'}}>
                          {s} {isCurrent && '← Current'}
                        </h4>
                        <p>{STATUS_INFO[s].desc}</p>
                        {isCurrent && (
                          <div style={{marginTop:6, fontSize:'0.78rem', padding:'4px 10px', background:'var(--saffron-light)', borderRadius:99, display:'inline-block', color:'#92400e', fontWeight:600}}>
                            Updated: {new Date().toLocaleDateString('en-IN')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        {!result && !error && (
          <div className="alert alert-info animate-in-delay">
            <span>💡</span>
            <div>
              <strong>Tip:</strong> Your Case ID was provided when you registered the complaint. 
              It looks like <strong>CYB-2026-839201</strong>. If you have lost your Case ID, 
              please login to your citizen account to retrieve it.
            </div>
          </div>
        )}

      </div>
      <Footer />
    </>
  );
}
