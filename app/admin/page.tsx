'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

const STATUSES = ['Registered', 'Under Review', 'Assigned', 'Investigation', 'Closed'];

interface CaseRow {
  caseId: string;
  name: string;
  crimeType: string;
  state: string;
  status: string;
  createdAt: string;
  phone: string;
  description: string;
  officerNotes?: string;
  assignedOfficer?: string;
}

export default function AdminDashboard() {
  const [authed, setAuthed]     = useState(false);
  const [password, setPassword] = useState('');
  const [authErr, setAuthErr]   = useState('');
  const [cases, setCases]       = useState<CaseRow[]>([]);
  const [search, setSearch]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState<CaseRow | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateForm, setUpdateForm] = useState({ status: '', assignedOfficer: '', officerNotes: '' });

  const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'Admin@1234';

  const login = () => {
    if (password === ADMIN_PASS) { setAuthed(true); setAuthErr(''); }
    else setAuthErr('Invalid password. Please try again.');
  };

  // Load cases: try API first, fallback to localStorage
  const loadCases = async () => {
    try {
      const res = await fetch('/api/cases?limit=200');
      if (res.ok) {
        const data = await res.json();
        setCases(data.cases || []);
        return;
      }
    } catch {}
    // Fallback
    const local = JSON.parse(localStorage.getItem('cyb_cases') || '[]');
    setCases(local);
  };

  useEffect(() => { if (authed) loadCases(); }, [authed]);

  const filtered = cases.filter(c => {
    const matchSearch = !search || c.caseId.includes(search.toUpperCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    const matchStatus = !filterStatus || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:      cases.length,
    registered: cases.filter(c => c.status === 'Registered').length,
    active:     cases.filter(c => ['Under Review','Assigned','Investigation'].includes(c.status)).length,
    closed:     cases.filter(c => c.status === 'Closed').length,
  };

  const openCase = (c: CaseRow) => {
    setSelected(c);
    setUpdateForm({ status: c.status, assignedOfficer: c.assignedOfficer||'', officerNotes: c.officerNotes||'' });
  };

  const updateCase = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      // Try API
      const res = await fetch(`/api/cases/${selected.caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_PASS },
        body: JSON.stringify(updateForm),
      });
      if (res.ok) {
        await loadCases();
        setSelected(null);
        setUpdating(false);
        return;
      }
    } catch {}
    // Fallback: update localStorage
    const local: CaseRow[] = JSON.parse(localStorage.getItem('cyb_cases') || '[]');
    const idx = local.findIndex(c => c.caseId === selected.caseId);
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...updateForm };
      localStorage.setItem('cyb_cases', JSON.stringify(local));
    }
    setCases(prev => prev.map(c => c.caseId === selected.caseId ? { ...c, ...updateForm } : c));
    setSelected(null);
    setUpdating(false);
  };

  const STATUS_CLS: Record<string,string> = {
    'Registered':'badge-registered','Under Review':'badge-review',
    'Assigned':'badge-assigned','Investigation':'badge-investigation','Closed':'badge-closed',
  };

  // ── Login Screen ────────────────────────────────────────────────────────────
  if (!authed) return (
    <>
      <Header />
      <div className="page-hero">
        <div className="badge">Officers Only</div>
        <h2>🛡️ Officer / Admin Login</h2>
        <p>अधिकारी पोर्टल | Authorized personnel only</p>
      </div>
      <div className="page-container" style={{maxWidth:440}}>
        <div className="card animate-in">
          <div className="card-header">
            <div className="card-icon">🔐</div>
            <div><h3>Secure Login</h3><p>For authorized officers only</p></div>
          </div>
          {authErr && <div className="alert alert-danger mb-16"><span>❌</span><div>{authErr}</div></div>}
          <div className="form-group">
            <label className="form-label">Admin Password</label>
            <input className="form-control" type="password" placeholder="Enter admin password"
              value={password} onChange={e=>setPassword(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&login()}/>
          </div>
          <button className="btn btn-primary w-full mt-8" style={{justifyContent:'center'}} onClick={login}>
            🔑 Login to Dashboard
          </button>
          <div className="alert alert-warning mt-16">
            <span>⚠️</span>
            <small>Unauthorized access to this system is a punishable offence under the IT Act, 2000 (Section 66).</small>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );

  // ── Dashboard ───────────────────────────────────────────────────────────────
  return (
    <>
      <Header />
      <div className="page-hero">
        <div className="badge">Admin Dashboard</div>
        <h2>🛡️ Case Management Dashboard</h2>
        <p>अधिकारी डैशबोर्ड | Manage and update all registered cyber crime cases</p>
      </div>
      <div className="page-container">

        {/* Stats */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:28}}>
          {[
            { label:'Total Cases',    val:stats.total,      color:'var(--navy)',    icon:'📁' },
            { label:'New (Registered)',val:stats.registered, color:'#92400e',       icon:'📋' },
            { label:'Active',          val:stats.active,     color:'#1e40af',       icon:'🔍' },
            { label:'Closed',          val:stats.closed,     color:'var(--green)',  icon:'✅' },
          ].map(s => (
            <div key={s.label} className="card" style={{textAlign:'center', padding:'18px', borderTop:`3px solid ${s.color}`}}>
              <div style={{fontSize:'2rem'}}>{s.icon}</div>
              <div style={{fontSize:'1.8rem', fontWeight:800, color:s.color, margin:'4px 0'}}>{s.val}</div>
              <div style={{fontSize:'0.78rem', color:'var(--text-light)'}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Location Map Link */}
        <div style={{ marginBottom: 20 }}>
          <Link href="/admin/locations" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderColor: 'var(--navy)', color: 'var(--navy)' }}>
            🗺️ View Visitor Location Map
          </Link>
        </div>

        {/* Filters */}
        <div className="card" style={{marginBottom:20}}>
          <div style={{display:'flex', gap:12, flexWrap:'wrap', alignItems:'center'}}>
            <input className="form-control" placeholder="🔍 Search by Case ID, Name, Phone..."
              value={search} onChange={e=>setSearch(e.target.value)}
              style={{flex:2, minWidth:220}}/>
            <select className="form-control" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
              style={{flex:1, minWidth:160}}>
              <option value="">All Statuses</option>
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
            <button className="btn btn-outline btn-sm" onClick={()=>{setSearch('');setFilterStatus('');}}>
              ✕ Clear
            </button>
            <button className="btn btn-primary btn-sm" onClick={loadCases}>🔄 Refresh</button>
          </div>
        </div>

        {/* Table */}
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Complainant</th>
                  <th>Crime Type</th>
                  <th>State</th>
                  <th>Filed On</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{textAlign:'center', padding:'32px', color:'var(--text-light)'}}>
                    {cases.length === 0 ? '📭 No cases registered yet' : '🔍 No cases match your filters'}
                  </td></tr>
                )}
                {filtered.map(c => (
                  <tr key={c.caseId}>
                    <td style={{fontWeight:700, color:'var(--navy)', letterSpacing:1}}>{c.caseId}</td>
                    <td>
                      <div style={{fontWeight:600}}>{c.name}</div>
                      <div style={{fontSize:'0.75rem', color:'var(--text-light)'}}>{c.phone}</div>
                    </td>
                    <td style={{maxWidth:160, fontSize:'0.82rem'}}>{c.crimeType}</td>
                    <td style={{fontSize:'0.82rem'}}>{c.state}</td>
                    <td style={{fontSize:'0.8rem', color:'var(--text-light)'}}>
                      {new Date(c.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td><span className={`status-badge ${STATUS_CLS[c.status]||''}`}>{c.status}</span></td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={()=>openCase(c)}>
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div style={{padding:'10px 16px', borderTop:'1px solid var(--border)', fontSize:'0.78rem', color:'var(--text-light)'}}>
              Showing {filtered.length} of {cases.length} cases
            </div>
          )}
        </div>
      </div>

      {/* Case Update Modal */}
      {selected && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
          display:'flex', alignItems:'center', justifyContent:'center',
          zIndex:1000, padding:16,
        }} onClick={e=>{if(e.target===e.currentTarget)setSelected(null);}}>
          <div style={{
            background:'white', borderRadius:16, padding:'32px', maxWidth:580, width:'100%',
            maxHeight:'90vh', overflowY:'auto',
          }}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20}}>
              <div>
                <div style={{fontSize:'0.72rem', color:'var(--text-light)'}}>CASE MANAGEMENT</div>
                <div style={{fontSize:'1.4rem', fontWeight:800, color:'var(--navy)', letterSpacing:1}}>{selected.caseId}</div>
              </div>
              <button onClick={()=>setSelected(null)} style={{background:'none', border:'none', fontSize:'1.4rem', cursor:'pointer'}}>✕</button>
            </div>

            <div style={{background:'var(--off-white)', borderRadius:10, padding:'14px', marginBottom:20, fontSize:'0.85rem'}}>
              <div><strong>Complainant:</strong> {selected.name} ({selected.phone})</div>
              <div style={{marginTop:4}}><strong>Crime:</strong> {selected.crimeType}</div>
              <div style={{marginTop:4, color:'var(--text-light)'}}>{selected.description}</div>
            </div>

            <div className="form-group">
              <label className="form-label">Update Status</label>
              <select className="form-control" value={updateForm.status}
                onChange={e=>setUpdateForm(f=>({...f, status:e.target.value}))}>
                {STATUSES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Assigned Officer</label>
              <input className="form-control" placeholder="Officer name / badge number"
                value={updateForm.assignedOfficer}
                onChange={e=>setUpdateForm(f=>({...f, assignedOfficer:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Officer Notes / Remarks</label>
              <textarea className="form-control" rows={4} placeholder="Internal notes..."
                value={updateForm.officerNotes}
                onChange={e=>setUpdateForm(f=>({...f, officerNotes:e.target.value}))}/>
            </div>
            <div style={{display:'flex', gap:12, justifyContent:'flex-end'}}>
              <button className="btn btn-outline" onClick={()=>setSelected(null)}>Cancel</button>
              <button className="btn btn-green" onClick={updateCase} disabled={updating}>
                {updating ? '⏳ Saving...' : '✅ Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
