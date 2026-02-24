'use client';
import { useState, useEffect, ReactNode } from 'react';

interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
  capturedAt: string;
}

interface Props { children: ReactNode; }

export default function LocationGate({ children }: Props) {
  const [status, setStatus] = useState<'checking'|'granted'|'requesting'|'denied'>('checking');
  const [locData, setLocData] = useState<LocationData | null>(null);
  const [geoError, setGeoError] = useState('');

  useEffect(() => {
    // If already captured in this session, pass through immediately
    const saved = localStorage.getItem('cyb_location');
    if (saved) {
      setLocData(JSON.parse(saved));
      setStatus('granted');
      return;
    }
    setStatus('requesting');
  }, []);

  const requestLocation = () => {
    setGeoError('');
    setStatus('requesting');

    if (!navigator.geolocation) {
      setGeoError('Your browser does not support geolocation. Please use a modern browser.');
      setStatus('denied');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let city = '', state = '', country = 'India';

        try {
          const nominatimUrl = process.env.NEXT_PUBLIC_NOMINATIM_URL || 'https://nominatim.openstreetmap.org';
          const res = await fetch(
            `${nominatimUrl}/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          city    = data.address?.city || data.address?.town || data.address?.village || '';
          state   = data.address?.state || '';
          country = data.address?.country || 'India';
        } catch { /* reverse-geocode failed, store coords only */ }

        const loc: LocationData = { latitude, longitude, city, state, country, capturedAt: new Date().toISOString() };
        localStorage.setItem('cyb_location', JSON.stringify(loc));
        setLocData(loc);
        setStatus('granted');

        // Send to backend (fire-and-forget)
        fetch('/api/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loc),
        }).catch(() => {/* non-critical */});
      },
      (err) => {
        const msgs: Record<number, string> = {
          1: 'Location access was denied. You must allow location access to use this portal.',
          2: 'Location could not be determined. Please check your device settings.',
          3: 'Location request timed out. Please try again.',
        };
        setGeoError(msgs[err.code] || 'Unknown location error.');
        setStatus('denied');
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  // ── Checking (instant) ──────────────────────────────────────────────────────
  if (status === 'checking') return null;

  // ── GRANTED → render the portal ────────────────────────────────────────────
  if (status === 'granted') return <>{children}</>;

  // ── REQUESTING / DENIED → Full-screen gate ─────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000080 0%, #001a8c 60%, #000d5c 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Tricolor bar */}
      <div style={{position:'fixed',top:0,left:0,right:0,display:'flex',height:6}}>
        <div style={{flex:1,background:'#FF9933'}}/>
        <div style={{flex:1,background:'#ffffff'}}/>
        <div style={{flex:1,background:'#138808'}}/>
      </div>

      {/* Emblem */}
      <svg width="96" height="96" viewBox="0 0 100 100" fill="none" style={{marginBottom:24}}>
        <circle cx="50" cy="50" r="48" fill="rgba(255,255,255,0.06)" stroke="#C8A951" strokeWidth="1.5"/>
        <circle cx="50" cy="50" r="22" fill="none" stroke="#C8A951" strokeWidth="1.5"/>
        <circle cx="50" cy="50" r="4" fill="#C8A951"/>
        {Array.from({length:24}).map((_,i) => (
          <line key={i} x1="50" y1="28" x2="50" y2="32" stroke="#C8A951" strokeWidth="1.2"
            transform={`rotate(${i*15} 50 50)`}/>
        ))}
        <ellipse cx="35" cy="42" rx="5" ry="7" fill="#C8A951"/>
        <ellipse cx="65" cy="42" rx="5" ry="7" fill="#C8A951"/>
        <circle cx="35" cy="35" r="4" fill="#C8A951"/>
        <circle cx="65" cy="35" r="4" fill="#C8A951"/>
        <rect x="30" y="60" width="40" height="4" rx="2" fill="#C8A951"/>
        <text x="50" y="73" textAnchor="middle" fill="#FF9933" fontSize="5" fontWeight="700">सत्यमेव जयते</text>
      </svg>

      <div style={{
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 20,
        padding: '44px 40px',
        maxWidth: 520,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }}>
        <div style={{
          fontSize: '3.5rem',
          marginBottom: 16,
          animation: status === 'requesting' ? 'pulse 1.5s infinite' : 'none',
        }}>
          {status === 'requesting' ? '📍' : '🚫'}
        </div>

        <h1 style={{
          fontFamily: "'Noto Serif', serif",
          fontSize: '1.4rem',
          fontWeight: 800,
          color: '#FF9933',
          marginBottom: 8,
        }}>
          {status === 'requesting' ? 'Location Verification Required' : 'Location Access Denied'}
        </h1>

        <p style={{color:'rgba(255,255,255,0.6)', fontSize:'0.8rem', marginBottom:16}}>
          भारत सरकार | Government of India
        </p>
        <p style={{color:'rgba(255,255,255,0.8)', fontSize:'0.92rem', lineHeight:1.7, marginBottom:24}}>
          {status === 'requesting'
            ? 'This is an official Government of India security portal. To comply with the IT Act, 2000, your location must be verified before you can access or file any cyber crime complaint.'
            : 'Location access is mandatory for this government security portal. Without location verification, access cannot be granted per IT Act, 2000.'}
        </p>

        {/* Security Badges */}
        <div style={{display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap', marginBottom:24}}>
          {['🔒 SSL Secured', '🇮🇳 Govt. of India', '⚖️ IT Act, 2000'].map(b => (
            <span key={b} style={{
              background: 'rgba(255,153,51,0.15)',
              border: '1px solid rgba(255,153,51,0.3)',
              color: '#FF9933',
              padding: '4px 12px',
              borderRadius: 99,
              fontSize: '0.72rem',
              fontWeight: 600,
            }}>{b}</span>
          ))}
        </div>

        {geoError && (
          <div style={{
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 20,
            fontSize: '0.85rem',
            color: '#fca5a5',
            textAlign: 'left',
          }}>
            ⚠️ {geoError}
          </div>
        )}

        {status === 'requesting' ? (
          <button
            onClick={requestLocation}
            style={{
              background: '#FF9933',
              color: '#000080',
              border: 'none',
              borderRadius: 10,
              padding: '14px 36px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.background='#e07800')}
            onMouseOut={e => (e.currentTarget.style.background='#FF9933')}
          >
            📍 Allow Location & Access Portal
          </button>
        ) : (
          <div style={{display:'flex', gap:12, flexDirection:'column'}}>
            <button onClick={requestLocation} style={{
              background: '#FF9933', color: '#000080', border: 'none',
              borderRadius: 10, padding: '13px 24px', fontSize: '0.95rem',
              fontWeight: 700, cursor: 'pointer', width: '100%',
            }}>
              🔄 Try Again
            </button>
            <p style={{fontSize:'0.78rem', color:'rgba(255,255,255,0.4)'}}>
              To enable location: click the 🔒 icon in your browser's address bar → Site settings → Location → Allow
            </p>
          </div>
        )}

        <p style={{marginTop:20, fontSize:'0.72rem', color:'rgba(255,255,255,0.3)', lineHeight:1.5}}>
          Your location data is encrypted and stored securely. It is used only for jurisdiction
          determination and will not be shared with third parties. Ref: IT Act 2000, Section 43A.
        </p>
      </div>

      <p style={{marginTop:24, color:'rgba(255,255,255,0.3)', fontSize:'0.72rem'}}>
        Helpline: <strong style={{color:'#FF9933'}}>1930</strong> &nbsp;|&nbsp; cybercrime.gov.in
      </p>

      <style>{`@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }`}</style>
    </div>
  );
}
