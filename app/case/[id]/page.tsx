'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Link from 'next/link';

const STATUS_INFO: Record<string, {icon:string, cls:string}> = {
  'Registered':    { icon:'📋', cls:'badge-registered' },
  'Under Review':  { icon:'🔎', cls:'badge-review' },
  'Assigned':      { icon:'👮', cls:'badge-assigned' },
  'Investigation': { icon:'🔍', cls:'badge-investigation' },
  'Closed':        { icon:'✅', cls:'badge-closed' },
};

export default function CaseDetail() {
  const params = useParams();
  const caseId = (params?.id as string)?.toUpperCase();
  const [caseData, setCaseData] = useState<Record<string,unknown> | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!caseId) return;
    try {
      const cases = JSON.parse(localStorage.getItem('cyb_cases') || '[]');
      const found = cases.find((c: {caseId:string}) => c.caseId === caseId);
      if (found) setCaseData(found);
      else setNotFound(true);
    } catch { setNotFound(true); }
  }, [caseId]);

  return (
    <>
      <Header />
      <div className="page-hero">
        <div className="badge">Case Details</div>
        <h2>Case: {caseId}</h2>
        <p>Full details and status of your registered complaint</p>
      </div>
      <div className="page-container" style={{maxWidth:820}}>
        {notFound && (
          <div className="card" style={{textAlign:'center', padding:'44px'}}>
            <div style={{fontSize:'3rem'}}>❌</div>
            <h3 style={{color:'var(--navy)', marginTop:12}}>Case Not Found</h3>
            <p style={{color:'var(--text-light)', margin:'8px 0 20px'}}>No case found with ID <strong>{caseId}</strong></p>
            <Link href="/track-case" className="btn btn-primary">← Search Again</Link>
          </div>
        )}

        {!caseData && !notFound && (
          <div className="card" style={{padding:40, textAlign:'center'}}>
            <div className="skeleton" style={{height:24, width:'60%', margin:'0 auto 12px'}}/>
            <div className="skeleton" style={{height:16, width:'40%', margin:'0 auto'}}/>
          </div>
        )}

        {caseData && (
          <div className="animate-in">
            {/* Header Card */}
            <div className="card" style={{marginBottom:20, background:'linear-gradient(135deg, var(--navy) 0%, #001a8c 100%)', color:'white'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12}}>
                <div>
                  <div style={{fontSize:'0.72rem', color:'rgba(255,255,255,0.55)', marginBottom:6}}>CASE REFERENCE NUMBER</div>
                  <div style={{fontSize:'1.8rem', fontWeight:800, letterSpacing:2, color:'var(--saffron)'}}>{caseData.caseId as string}</div>
                  <div style={{fontSize:'0.82rem', color:'rgba(255,255,255,0.65)', marginTop:4}}>
                    Registered on {new Date(caseData.createdAt as string).toLocaleDateString('en-IN', {day:'2-digit', month:'long', year:'numeric'})}
                  </div>
                </div>
                <span className={`status-badge ${STATUS_INFO[caseData.status as string]?.cls}`} style={{alignSelf:'flex-start'}}>
                  {STATUS_INFO[caseData.status as string]?.icon} {caseData.status as string}
                </span>
              </div>
            </div>

            {/* Personal Info */}
            <div className="card" style={{marginBottom:20}}>
              <div className="card-header">
                <div className="card-icon">👤</div>
                <div><h3>Complainant Information</h3></div>
              </div>
              <div className="grid-2">
                {[
                  ['Full Name', caseData.name],
                  ['Mobile', caseData.phone],
                  ['Email', caseData.email || '—'],
                  ['State', `${caseData.state}${caseData.district ? ', '+caseData.district:''}`],
                  ['Aadhaar (Last 4)', '****' + caseData.aadhaarLast4],
                ].map(([k,v]) => (
                  <div key={k as string} style={{background:'var(--off-white)', borderRadius:8, padding:'10px 14px'}}>
                    <div style={{fontSize:'0.72rem', color:'var(--text-light)', fontWeight:600}}>{k as string}</div>
                    <div style={{fontSize:'0.9rem', fontWeight:600, color:'var(--text-dark)', marginTop:2}}>{v as string}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Incident Info */}
            <div className="card" style={{marginBottom:20}}>
              <div className="card-header">
                <div className="card-icon">🔍</div>
                <div><h3>Incident Details</h3></div>
              </div>
              <div style={{display:'grid', gap:12}}>
                {[
                  ['Crime Type', caseData.crimeType],
                  ['Date & Time', `${caseData.incidentDate}${caseData.incidentTime ? ' at '+caseData.incidentTime:''}`],
                  ['Financial Loss', caseData.lossAmount ? `₹${caseData.lossAmount}` : 'Not specified'],
                  ['Evidence Files', (caseData.evidenceFiles as string[])?.length > 0 ? (caseData.evidenceFiles as string[]).join(', ') : 'None uploaded'],
                ].map(([k,v]) => (
                  <div key={k as string} style={{display:'flex', gap:12, background:'var(--off-white)', borderRadius:8, padding:'10px 14px'}}>
                    <span style={{minWidth:160, fontSize:'0.82rem', color:'var(--text-light)', fontWeight:600}}>{k as string}</span>
                    <span style={{fontSize:'0.88rem', color:'var(--text-dark)'}}>{v as string}</span>
                  </div>
                ))}
                <div style={{background:'var(--off-white)', borderRadius:8, padding:'10px 14px'}}>
                  <div style={{fontSize:'0.82rem', color:'var(--text-light)', fontWeight:600, marginBottom:6}}>Description</div>
                  <div style={{fontSize:'0.88rem', color:'var(--text-dark)', lineHeight:1.7}}>{caseData.description as string}</div>
                </div>
                {(caseData.suspectInfo as string) && (
                  <div style={{background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:8, padding:'10px 14px'}}>
                    <div style={{fontSize:'0.82rem', color:'#92400e', fontWeight:600, marginBottom:6}}>⚠️ Suspect Information</div>
                    <div style={{fontSize:'0.88rem', color:'var(--text-dark)'}}>{caseData.suspectInfo as string}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Location Info */}
            {caseData.location && (
              <div className="card" style={{marginBottom:20}}>
                <div className="card-header">
                  <div className="card-icon">📍</div>
                  <div><h3>Filing Location</h3><p>Captured at time of complaint registration</p></div>
                </div>
                <div className="grid-2">
                  {[
                    ['City', (caseData.location as Record<string,unknown>).city as string || '—'],
                    ['State', (caseData.location as Record<string,unknown>).state as string || '—'],
                    ['Coordinates', `${((caseData.location as Record<string,unknown>).latitude as number)?.toFixed(4)}, ${((caseData.location as Record<string,unknown>).longitude as number)?.toFixed(4)}`],
                    ['Captured At', new Date((caseData.location as Record<string,unknown>).capturedAt as string).toLocaleString('en-IN')],
                  ].map(([k,v]) => (
                    <div key={k} style={{background:'var(--off-white)', borderRadius:8, padding:'10px 14px'}}>
                      <div style={{fontSize:'0.72rem', color:'var(--text-light)', fontWeight:600}}>{k}</div>
                      <div style={{fontSize:'0.9rem', fontWeight:600, color:'var(--text-dark)', marginTop:2}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
              <Link href="/track-case" className="btn btn-outline">← Back to Track</Link>
              <Link href="/" className="btn btn-primary">🏠 Home</Link>
              <button onClick={() => window.print()} className="btn btn-saffron">🖨️ Print Details</button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
