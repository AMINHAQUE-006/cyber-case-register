'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const [session, setSession] = useState<{name: string} | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem('cyb_session');
      if (s) setSession(JSON.parse(s));
    } catch {}
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('cyb_session');
    setSession(null);
    window.location.href = '/';
  };

  return (
    <header className="site-header">
      <div className="tricolor-bar"><span/><span/><span/></div>
      <div className="header-top">
        {/* Emblem SVG */}
        <svg className="header-emblem" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="#000080" stroke="#C8A951" strokeWidth="2"/>
          <circle cx="50" cy="50" r="22" fill="none" stroke="#C8A951" strokeWidth="1.5"/>
          <circle cx="50" cy="50" r="4" fill="#C8A951"/>
          {/* Chakra spokes */}
          {Array.from({length:24}).map((_,i) => (
            <line key={i}
              x1="50" y1="28"
              x2="50" y2="32"
              stroke="#C8A951"
              strokeWidth="1.2"
              transform={`rotate(${i*15} 50 50)`}
            />
          ))}
          {/* Lions simplified */}
          <ellipse cx="35" cy="42" rx="5" ry="7" fill="#C8A951"/>
          <ellipse cx="65" cy="42" rx="5" ry="7" fill="#C8A951"/>
          <circle cx="35" cy="35" r="4" fill="#C8A951"/>
          <circle cx="65" cy="35" r="4" fill="#C8A951"/>
          {/* Base */}
          <rect x="30" y="60" width="40" height="5" rx="2" fill="#C8A951"/>
          <text x="50" y="74" textAnchor="middle" fill="#FF9933" fontSize="5" fontWeight="700">सत्यमेव जयते</text>
        </svg>

        <div className="header-titles">
          <h1>भारत सरकार | Government of India</h1>
          <p>राष्ट्रीय साइबर अपराध रिपोर्टिंग पोर्टल | National Cyber Crime Reporting Portal</p>
          <p style={{fontSize:'0.7rem', color:'rgba(255,255,255,0.5)', marginTop:'1px'}}>
            Ministry of Home Affairs | Indian Cyber Crime Coordination Centre (I4C)
          </p>
        </div>

        {/* Helpline */}
        <div style={{flexShrink:0, textAlign:'right'}}>
          <div style={{background:'rgba(255,153,51,0.15)', borderRadius:8, padding:'8px 14px', border:'1px solid rgba(255,153,51,0.3)'}}>
            <div style={{fontSize:'0.68rem', color:'rgba(255,255,255,0.6)'}}>Helpline</div>
            <div style={{color:'#FF9933', fontWeight:700, fontSize:'1.1rem'}}>1930</div>
            <div style={{fontSize:'0.65rem', color:'rgba(255,255,255,0.5)'}}>24×7</div>
          </div>
        </div>
      </div>

      <nav className="header-nav">
        <Link href="/" className={pathname === '/' ? 'active' : ''}>🏠 Home</Link>
        <Link href="/register-case" className={pathname === '/register-case' ? 'active' : ''}>📝 Register Case</Link>
        <Link href="/track-case" className={pathname === '/track-case' ? 'active' : ''}>📡 Track Case</Link>
        <Link href="/admin" className={pathname.startsWith('/admin') ? 'active' : ''}>🛡️ Officer Login</Link>
        {session ? (
          <>
            <span style={{color:'rgba(255,255,255,0.5)', padding:'10px 8px', fontSize:'0.82rem'}}>
              👤 {session.name}
            </span>
            <button onClick={handleLogout} style={{color:'#fca5a5'}}>Logout</button>
          </>
        ) : (
          <Link href="/auth" className={`nav-cta ${pathname === '/auth' ? 'active' : ''}`}>Login / Register</Link>
        )}
      </nav>
    </header>
  );
}
