'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';

const CRIME_TYPES = [
  'Online Financial Fraud (UPI/Banking)',
  'Credit/Debit Card Fraud',
  'Identity Theft (Aadhaar/PAN Misuse)',
  'Phishing / Email Scam',
  'Social Media Harassment / Stalking',
  'Cyber Bullying',
  'Obscene / Morphed Content',
  'Ransomware Attack',
  'Online Job Scam',
  'Online Shopping Fraud',
  'Matrimonial Fraud',
  'Investment / Crypto Scam',
  'Data Breach / Hacking',
  'Child Pornography (CSAM)',
  'Online Gaming Scam',
  'Other Cyber Crime',
];

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman & Nicobar Islands','Chandigarh','Dadra & Nagar Haveli','Daman & Diu',
  'Delhi (NCT)','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry',
];

interface CaseData {
  caseId: string;
  status: string;
  createdAt: string;
  name: string;
  phone: string;
  email: string;
  state: string;
  district: string;
  aadhaarLast4: string;
  crimeType: string;
  incidentDate: string;
  incidentTime: string;
  description: string;
  suspectInfo: string;
  evidenceFiles: string[];
  lossAmount: string;
  location?: object;
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const preType = searchParams.get('type') || '';

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', phone: '', email: '', state: '', district: '',
    aadhaarLast4: '', crimeType: preType, incidentDate: '', incidentTime: '',
    description: '', suspectInfo: '', lossAmount: '', evidenceFiles: [] as string[],
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const names = Array.from(files).map(f => f.name);
      setForm(f => ({ ...f, evidenceFiles: names }));
    }
  };

  const generateCaseId = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `CYB-${year}-${rand}`;
  };

  const submit = () => {
    setSubmitting(true);
    setTimeout(() => {
      const caseId = generateCaseId();
      const saved: CaseData = {
        caseId,
        status: 'Registered',
        createdAt: new Date().toISOString(),
        ...form,
        location: JSON.parse(localStorage.getItem('cyb_location') || 'null'),
      };
      const existing = JSON.parse(localStorage.getItem('cyb_cases') || '[]');
      existing.push(saved);
      localStorage.setItem('cyb_cases', JSON.stringify(existing));
      setSubmitted(caseId);
      setSubmitting(false);
    }, 1500);
  };

  const isStep1Valid = form.name && form.phone && form.state && form.aadhaarLast4;
  const isStep2Valid = form.crimeType && form.incidentDate && form.description;

  if (submitted) {
    return (
      <div className="page-container" style={{maxWidth:680}}>
        <div className="card" style={{textAlign:'center', padding:'44px 32px'}}>
          <div style={{fontSize:'4rem'}}>✅</div>
          <h2 style={{color:'var(--green)', fontFamily:'Noto Serif, serif', marginTop:12}}>
            Case Registered Successfully!
          </h2>
          <p style={{color:'var(--text-light)', marginTop:8}}>
            Your complaint has been registered. Note your Case ID below.
          </p>
          <div style={{
            background:'var(--navy-light)', borderRadius:12, padding:'20px 32px',
            margin:'24px 0', border:'2px dashed var(--navy)',
          }}>
            <div style={{fontSize:'0.78rem', color:'var(--text-light)', marginBottom:4}}>YOUR CASE ID</div>
            <div style={{fontSize:'2rem', fontWeight:800, color:'var(--navy)', letterSpacing:2}}>{submitted}</div>
          </div>
          <div className="alert alert-info" style={{textAlign:'left', marginBottom:18}}>
            <span>ℹ️</span>
            <div>Save this Case ID for future reference. You can track your case status at any time using this ID.</div>
          </div>
          <div style={{display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap'}}>
            <a href={`/case/${submitted}`} className="btn btn-primary">View Case Details</a>
            <a href="/track-case" className="btn btn-outline">Track Case</a>
            <a href="/" className="btn btn-saffron">Go to Home</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{maxWidth:800}}>
      {/* Steps */}
      <div className="steps-bar">
        {['Personal Details','Incident Details','Review & Submit'].map((s, i) => (
          <div key={s} className={`step-item ${step > i+1 ? 'done' : step === i+1 ? 'current' : ''}`}>
            <div className="step-num">{step > i+1 ? '✓' : i+1}</div>
            <span>{s}</span>
          </div>
        ))}
      </div>

      <div className="card animate-in">
        {/* Step 1 */}
        {step === 1 && (
          <>
            <div className="card-header">
              <div className="card-icon">👤</div>
              <div>
                <h3>Personal Information</h3>
                <p>All fields marked * are mandatory</p>
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Full Name <span>*</span></label>
                <input className="form-control" placeholder="As per Aadhaar" value={form.name} onChange={e=>set('name',e.target.value)}/>
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Number <span>*</span></label>
                <input className="form-control" placeholder="+91 XXXXX XXXXX" maxLength={10} value={form.phone} onChange={e=>set('phone',e.target.value)}/>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-control" type="email" placeholder="example@email.com" value={form.email} onChange={e=>set('email',e.target.value)}/>
              </div>
              <div className="form-group">
                <label className="form-label">Aadhaar Last 4 Digits <span>*</span></label>
                <input className="form-control" placeholder="XXXX" maxLength={4} value={form.aadhaarLast4} onChange={e=>set('aadhaarLast4',e.target.value)}/>
              </div>
              <div className="form-group">
                <label className="form-label">State / UT <span>*</span></label>
                <select className="form-control" value={form.state} onChange={e=>set('state',e.target.value)}>
                  <option value="">— Select State —</option>
                  {STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">District</label>
                <input className="form-control" placeholder="Enter your district" value={form.district} onChange={e=>set('district',e.target.value)}/>
              </div>
            </div>
            <div className="alert alert-info mt-8">
              <span>🔒</span>
              <small>Your personal information is encrypted and shared only with authorized law enforcement agencies. We comply with IT Act, 2000.</small>
            </div>
            <div style={{display:'flex', justifyContent:'flex-end', marginTop:16}}>
              <button className="btn btn-primary" disabled={!isStep1Valid} onClick={()=>setStep(2)}>
                Next: Incident Details →
              </button>
            </div>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <div className="card-header">
              <div className="card-icon">🔍</div>
              <div>
                <h3>Incident Information</h3>
                <p>Provide details about the cyber crime</p>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Type of Cyber Crime <span>*</span></label>
              <select className="form-control" value={form.crimeType} onChange={e=>set('crimeType',e.target.value)}>
                <option value="">— Select Crime Type —</option>
                {CRIME_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Date of Incident <span>*</span></label>
                <input className="form-control" type="date" max={new Date().toISOString().split('T')[0]} value={form.incidentDate} onChange={e=>set('incidentDate',e.target.value)}/>
              </div>
              <div className="form-group">
                <label className="form-label">Time of Incident (approx.)</label>
                <input className="form-control" type="time" value={form.incidentTime} onChange={e=>set('incidentTime',e.target.value)}/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Financial Loss Amount (if any)</label>
              <input className="form-control" placeholder="₹ Enter amount (e.g. 50000)" value={form.lossAmount} onChange={e=>set('lossAmount',e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">Incident Description <span>*</span></label>
              <textarea className="form-control" rows={5} placeholder="Describe the incident in detail — what happened, when, how, suspected platforms/numbers involved..." value={form.description} onChange={e=>set('description',e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">Suspect Information (if known)</label>
              <textarea className="form-control" rows={3} placeholder="Mobile number, email, social media handles, bank account number, website URL of suspect..." value={form.suspectInfo} onChange={e=>set('suspectInfo',e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">Upload Evidence Files</label>
              <input type="file" multiple className="form-control" style={{padding:'8px'}} onChange={handleFileChange}/>
              {form.evidenceFiles.length > 0 && (
                <div style={{marginTop:6, fontSize:'0.8rem', color:'var(--green)'}}>
                  ✅ {form.evidenceFiles.length} file(s) selected: {form.evidenceFiles.join(', ')}
                </div>
              )}
              <p style={{fontSize:'0.75rem', color:'var(--text-light)', marginTop:4}}>
                Accepted: Screenshots, PDFs, bank statements, call recordings. Max 5MB each.
              </p>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', marginTop:8}}>
              <button className="btn btn-outline" onClick={()=>setStep(1)}>← Back</button>
              <button className="btn btn-primary" disabled={!isStep2Valid} onClick={()=>setStep(3)}>
                Next: Review →
              </button>
            </div>
          </>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <>
            <div className="card-header">
              <div className="card-icon">📋</div>
              <div>
                <h3>Review & Submit</h3>
                <p>Please verify details before submitting</p>
              </div>
            </div>

            <div style={{display:'grid', gap:12}}>
              {[
                ['Complainant', form.name],
                ['Mobile', form.phone],
                ['Email', form.email || '—'],
                ['State / District', `${form.state}${form.district ? ', '+form.district:''}`],
                ['Crime Type', form.crimeType],
                ['Incident Date', form.incidentDate + (form.incidentTime ? ' at '+form.incidentTime:'')],
                ['Financial Loss', form.lossAmount ? '₹'+form.lossAmount : '—'],
                ['Evidence Files', form.evidenceFiles.length > 0 ? form.evidenceFiles.join(', ') : 'None'],
              ].map(([label, val]) => (
                <div key={label} style={{display:'flex', gap:12, padding:'10px 14px', background:'var(--off-white)', borderRadius:8}}>
                  <span style={{minWidth:150, fontSize:'0.82rem', color:'var(--text-light)', fontWeight:600}}>{label}</span>
                  <span style={{fontSize:'0.88rem', color:'var(--text-dark)', fontWeight:500}}>{val}</span>
                </div>
              ))}
              <div style={{padding:'10px 14px', background:'var(--off-white)', borderRadius:8}}>
                <div style={{fontSize:'0.82rem', color:'var(--text-light)', fontWeight:600, marginBottom:4}}>Description</div>
                <div style={{fontSize:'0.87rem', color:'var(--text-dark)'}}>{form.description}</div>
              </div>
            </div>

            <div className="alert alert-warning mt-16">
              <span>⚖️</span>
              <small>By submitting, I declare that the information provided is true and correct to the best of my knowledge. Filing a false complaint is a punishable offence under the Indian Penal Code.</small>
            </div>

            <div style={{display:'flex', justifyContent:'space-between', marginTop:16}}>
              <button className="btn btn-outline" onClick={()=>setStep(2)}>← Back</button>
              <button className="btn btn-green btn-lg" onClick={submit} disabled={submitting}>
                {submitting ? '⏳ Submitting...' : '✅ Submit Complaint'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function RegisterCase() {
  return (
    <>
      <Header />
      <div className="page-hero">
        <div className="badge">Step 1 of 3</div>
        <h2>Register Cyber Crime Case</h2>
        <p>साइबर अपराध शिकायत दर्ज करें | File your complaint online — 100% secure</p>
      </div>
      <Suspense fallback={<div className="page-container">Loading...</div>}>
        <RegisterForm />
      </Suspense>
      <Footer />
    </>
  );
}
