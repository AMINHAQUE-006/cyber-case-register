'use client';
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface Session { name: string; email: string; phone: string; state: string; }

export default function AuthPage() {
  const [mode, setMode] = useState<'login'|'signup'>('login');
  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'', state:'' });
  const [error, setError] = useState('');
  const [session, setSession] = useState<Session|null>(null);

  const STATES = [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
    'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
    'Maharashtra','Delhi (NCT)','Punjab','Rajasthan','Tamil Nadu','Telangana',
    'Uttar Pradesh','Uttarakhand','West Bengal',
  ];

  useEffect(() => {
    const s = localStorage.getItem('cyb_session');
    if (s) setSession(JSON.parse(s));
  }, []);

  const set = (k: string, v: string) => setForm(f => ({...f, [k]:v}));

  const handleSignup = () => {
    if (!form.name || !form.email || !form.phone || !form.password) { setError('Please fill all required fields.'); return; }
    const users = JSON.parse(localStorage.getItem('cyb_users') || '[]');
    if (users.find((u: {email:string}) => u.email === form.email)) { setError('Account already exists. Please login.'); return; }
    const loc = localStorage.getItem('cyb_location');
    users.push({ ...form, registeredAt: new Date().toISOString(), location: loc ? JSON.parse(loc) : null });
    localStorage.setItem('cyb_users', JSON.stringify(users));
    const sess: Session = { name: form.name, email: form.email, phone: form.phone, state: form.state };
    localStorage.setItem('cyb_session', JSON.stringify(sess));
    setSession(sess);
  };

  const handleLogin = () => {
    if (!form.email || !form.password) { setError('Please enter email and password.'); return; }
    const users = JSON.parse(localStorage.getItem('cyb_users') || '[]');
    const user = users.find((u: {email:string, password:string}) => u.email === form.email && u.password === form.password);
    if (!user) { setError('Invalid email or password.'); return; }
    const sess: Session = { name: user.name, email: user.email, phone: user.phone, state: user.state };
    localStorage.setItem('cyb_session', JSON.stringify(sess));
    setSession(sess);
  };

  const handleLogout = () => {
    localStorage.removeItem('cyb_session');
    setSession(null);
  };

  const myCases = () => {
    if (!session) return [];
    try {
      const all = JSON.parse(localStorage.getItem('cyb_cases') || '[]');
      return all.filter((c: {phone:string}) => c.phone === session.phone);
    } catch { return []; }
  };

  if (session) {
    const cases = myCases();
    return (
      <>
        <Header />
        <div className="page-hero">
          <div className="badge">Citizen Portal</div>
          <h2>Welcome, {session.name}</h2>
          <p>नागरिक डैशबोर्ड | Your Cyber Crime case dashboard</p>
        </div>
        <div className="page-container" style={{maxWidth:900}}>
          <div style={{display:'grid', gridTemplateColumns:'260px 1fr', gap:24, alignItems:'start'}}>
            {/* Profile Card */}
            <div className="card" style={{borderTop:'3px solid var(--saffron)'}}>
              <div style={{textAlign:'center', marginBottom:18}}>
                <div style={{width:72, height:72, borderRadius:'50%', background:'var(--navy)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', margin:'0 auto 10px'}}>
                  {session.name.charAt(0).toUpperCase()}
                </div>
                <div style={{fontWeight:700, color:'var(--navy)'}}>{session.name}</div>
                <div style={{fontSize:'0.78rem', color:'var(--text-light)', marginTop:2}}>{session.email}</div>
              </div>
              <div style={{display:'grid', gap:8, fontSize:'0.82rem'}}>
                <div style={{background:'var(--off-white)', padding:'8px 12px', borderRadius:8}}>
                  📱 {session.phone}
                </div>
                {session.state && <div style={{background:'var(--off-white)', padding:'8px 12px', borderRadius:8}}>🗺️ {session.state}</div>}
                <div style={{background:'var(--navy-light)', padding:'8px 12px', borderRadius:8, color:'var(--navy)', fontWeight:600}}>
                  📁 {cases.length} Case{cases.length !== 1 ? 's' : ''} Filed
                </div>
              </div>
              <button className="btn btn-outline btn-sm w-full mt-16" onClick={handleLogout} style={{justifyContent:'center'}}>
                🚪 Logout
              </button>
            </div>

            {/* Cases */}
            <div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
                <div>
                  <div className="section-title" style={{margin:0}}>My Cases</div>
                  <div style={{fontSize:'0.82rem', color:'var(--text-light)'}}>All complaints filed by you</div>
                </div>
                <a href="/register-case" className="btn btn-saffron btn-sm">+ New Case</a>
              </div>
              {cases.length === 0 ? (
                <div className="card" style={{textAlign:'center', padding:'40px'}}>
                  <div style={{fontSize:'3rem'}}>📭</div>
                  <h3 style={{color:'var(--navy)', marginTop:10}}>No Cases Filed Yet</h3>
                  <p style={{color:'var(--text-light)', margin:'8px 0 16px'}}>You haven&apos;t filed any cyber crime complaints yet.</p>
                  <a href="/register-case" className="btn btn-primary">Register Your First Case</a>
                </div>
              ) : (
                <div style={{display:'grid', gap:14}}>
                  {cases.map((c: Record<string,unknown>) => (
                    <div key={c.caseId as string} className="card" style={{padding:'18px', borderLeft:'4px solid var(--navy)'}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8}}>
                        <div>
                          <div style={{fontWeight:800, color:'var(--navy)', fontSize:'1.05rem', letterSpacing:1}}>{c.caseId as string}</div>
                          <div style={{fontSize:'0.82rem', color:'var(--text-light)', marginTop:3}}>{c.crimeType as string}</div>
                        </div>
                        <span className={`status-badge badge-${(c.status as string).toLowerCase().replace(' ','-')}`}>
                          {c.status as string}
                        </span>
                      </div>
                      <div style={{display:'flex', gap:12, marginTop:12, flexWrap:'wrap'}}>
                        <a href={`/case/${c.caseId}`} className="btn btn-outline btn-sm">View Details</a>
                        <a href={`/track-case`} className="btn btn-primary btn-sm">Track Status</a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="page-hero">
        <div className="badge">Citizen Portal</div>
        <h2>{mode === 'login' ? 'Citizen Login' : 'Create Account'}</h2>
        <p>{mode === 'login' ? 'नागरिक लॉगिन | Access your case dashboard' : 'नया खाता बनाएं | Register to track your cases'}</p>
      </div>
      <div className="page-container" style={{maxWidth:480}}>
        <div className="card animate-in">
          <div style={{display:'flex', borderBottom:'2px solid var(--border)', marginBottom:24}}>
            {(['login','signup'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{flex:1, padding:'10px', fontWeight:600, fontSize:'0.9rem', background:'none', border:'none',
                  cursor:'pointer', borderBottom: mode===m ? '3px solid var(--navy)' : '3px solid transparent',
                  color: mode===m ? 'var(--navy)' : 'var(--text-light)', transition:'all 0.2s',
                }}>
                {m === 'login' ? '🔑 Login' : '📝 Register'}
              </button>
            ))}
          </div>

          {error && <div className="alert alert-danger mb-16"><span>❌</span><div>{error}</div></div>}

          {mode === 'signup' && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name <span style={{color:'#dc2626'}}>*</span></label>
                <input className="form-control" placeholder="As per Aadhaar" value={form.name} onChange={e=>set('name',e.target.value)}/>
              </div>
              <div className="form-group">
                <label className="form-label">State / UT</label>
                <select className="form-control" value={form.state} onChange={e=>set('state',e.target.value)}>
                  <option value="">— Select State —</option>
                  {STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email Address <span style={{color:'#dc2626'}}>*</span></label>
            <input className="form-control" type="email" placeholder="example@email.com" value={form.email} onChange={e=>set('email',e.target.value)}/>
          </div>

          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Mobile Number <span style={{color:'#dc2626'}}>*</span></label>
              <input className="form-control" placeholder="+91 XXXXX XXXXX" maxLength={10} value={form.phone} onChange={e=>set('phone',e.target.value)}/>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Password <span style={{color:'#dc2626'}}>*</span></label>
            <input className="form-control" type="password" placeholder="Min. 8 characters" value={form.password} onChange={e=>set('password',e.target.value)}/>
          </div>

          <button className="btn btn-primary w-full mt-8" style={{justifyContent:'center', fontSize:'1rem'}}
            onClick={mode==='login' ? handleLogin : handleSignup}>
            {mode === 'login' ? '🔑 Login to Portal' : '✅ Create Account'}
          </button>

          <div className="alert alert-info mt-16">
            <span>🔒</span>
            <small>Your credentials are stored securely. This portal uses end-to-end security as per IT Act, 2000.</small>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
