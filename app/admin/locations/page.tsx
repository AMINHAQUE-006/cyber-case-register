'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

interface LocRecord {
  _id: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  ip?: string;
  userAgent?: string;
  capturedAt: string;
}

const ADMIN_PASS =
  typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'Admin@1234'
    : 'Admin@1234';

export default function AdminLocationsPage() {
  const [authed, setAuthed]     = useState(false);
  const [password, setPassword] = useState('');
  const [authErr, setAuthErr]   = useState('');
  const [locations, setLocations] = useState<LocRecord[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [selected, setSelected] = useState<LocRecord | null>(null);
  const [search, setSearch]     = useState('');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);

  const login = () => {
    if (password === ADMIN_PASS) { setAuthed(true); setAuthErr(''); }
    else setAuthErr('Invalid password. Please try again.');
  };

  // Fetch location records
  const fetchLocations = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/location?limit=500');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setLocations(data.locations || []);
    } catch {
      setError('Failed to load locations. Check your MongoDB connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) fetchLocations();
  }, [authed]);

  // Load Leaflet from CDN and initialise map
  useEffect(() => {
    if (!authed || locations.length === 0 || !mapContainerRef.current) return;

    const initMap = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (window as any).L;
      if (!L || !mapContainerRef.current) return;

      // Destroy previous map instance
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629], // India center
        zoom: 5,
        zoomControl: true,
      });
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Custom marker icon
      const pinIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:28px; height:28px; border-radius:50% 50% 50% 0;
          background:#003366; border:3px solid #FF9933;
          transform:rotate(-45deg); box-shadow:0 2px 8px rgba(0,0,0,0.35);
        "></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -32],
      });

      markersRef.current = [];
      locations.forEach((loc) => {
        if (!loc.latitude || !loc.longitude) return;
        const marker = L.marker([loc.latitude, loc.longitude], { icon: pinIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:Inter,sans-serif;min-width:220px;">
              <div style="background:#003366;color:#fff;padding:8px 12px;border-radius:6px 6px 0 0;font-weight:700;font-size:0.85rem;">
                📍 Visitor Location
              </div>
              <div style="padding:10px 12px;font-size:0.82rem;line-height:1.7;">
                <b>City:</b> ${loc.city || '—'}<br/>
                <b>State:</b> ${loc.state || '—'}<br/>
                <b>Country:</b> ${loc.country || 'India'}<br/>
                <b>Lat / Lon:</b> ${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}<br/>
                <b>IP:</b> ${loc.ip || '—'}<br/>
                <b>Time:</b> ${new Date(loc.capturedAt).toLocaleString('en-IN')}<br/>
                <b>Device:</b> <span style="color:#555;font-size:0.75rem;">${(loc.userAgent || '').slice(0, 60)}…</span>
              </div>
            </div>
          `, { maxWidth: 300 });

        marker.on('click', () => setSelected(loc));
        markersRef.current.push(marker);
      });

      // Fit bounds to all markers if we have some
      if (markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current);
        map.fitBounds(group.getBounds().pad(0.2));
      }
    };

    // Load Leaflet CSS + JS if not already loaded
    if (!(window as any).L) { // eslint-disable-line @typescript-eslint/no-explicit-any
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [authed, locations]);

  const filtered = locations.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (l.city || '').toLowerCase().includes(q) ||
      (l.state || '').toLowerCase().includes(q) ||
      (l.ip || '').includes(q) ||
      (l.country || '').toLowerCase().includes(q)
    );
  });

  const focusMarker = (loc: LocRecord) => {
    setSelected(loc);
    if (!mapRef.current) return;
    mapRef.current.setView([loc.latitude, loc.longitude], 14, { animate: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const marker = markersRef.current.find((m: any) => {
      const ll = m.getLatLng();
      return Math.abs(ll.lat - loc.latitude) < 0.0001 && Math.abs(ll.lng - loc.longitude) < 0.0001;
    });
    if (marker) marker.openPopup();
    // Scroll to map
    mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // ── Login ─────────────────────────────────────────────────────────────────
  if (!authed) return (
    <>
      <Header />
      <div className="page-hero">
        <div className="badge">Officers Only</div>
        <h2>🗺️ Visitor Location Map</h2>
        <p>Authorized personnel only — Admin login required</p>
      </div>
      <div className="page-container" style={{ maxWidth: 440 }}>
        <div className="card animate-in">
          <div className="card-header">
            <div className="card-icon">🔐</div>
            <div><h3>Secure Login</h3><p>For authorized officers only</p></div>
          </div>
          {authErr && <div className="alert alert-danger mb-16"><span>❌</span><div>{authErr}</div></div>}
          <div className="form-group">
            <label className="form-label">Admin Password</label>
            <input className="form-control" type="password" placeholder="Enter admin password"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()} />
          </div>
          <button className="btn btn-primary w-full mt-8" style={{ justifyContent: 'center' }} onClick={login}>
            🔑 Access Location Map
          </button>
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Link href="/admin" style={{ color: 'var(--navy)', fontSize: '0.82rem' }}>← Back to Admin Dashboard</Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <>
      <Header />
      <div className="page-hero">
        <div className="badge">Admin — Location Intelligence</div>
        <h2>🗺️ Visitor Location Map</h2>
        <p>Real-time geographic distribution of portal visitors</p>
      </div>

      <div className="page-container">

        {/* Top bar */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          <Link href="/admin" className="btn btn-outline btn-sm">← Admin Dashboard</Link>
          <div style={{
            background: 'var(--navy)', color: 'white', borderRadius: 8,
            padding: '8px 18px', fontSize: '0.85rem', display: 'flex', gap: 16, flexWrap: 'wrap',
          }}>
            <span>📍 <strong>{locations.length}</strong> Visitors Tracked</span>
            {selected && (
              <span style={{ color: '#FF9933' }}>
                🎯 Viewing: {selected.city || '—'}, {selected.state || '—'}
              </span>
            )}
          </div>
          <button className="btn btn-primary btn-sm" onClick={fetchLocations} disabled={loading}>
            {loading ? '⏳ Loading…' : '🔄 Refresh'}
          </button>
        </div>

        {error && (
          <div className="alert alert-danger mb-16"><span>❌</span><div>{error}</div></div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-light)' }}>
            ⏳ Loading location data…
          </div>
        )}

        {/* Map */}
        {!loading && locations.length > 0 && (
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
            <div style={{
              background: 'var(--navy)', color: 'white', padding: '12px 20px',
              display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem',
            }}>
              <span style={{ fontSize: '1.1rem' }}>🗺️</span>
              <span><strong>Interactive Map</strong> — Click any pin for details</span>
              <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                Powered by OpenStreetMap
              </span>
            </div>
            <div
              ref={mapContainerRef}
              id="visitor-map"
              style={{ height: 480, width: '100%' }}
            />
          </div>
        )}

        {/* Selected detail card */}
        {selected && (
          <div className="card animate-in" style={{
            marginBottom: 24, borderLeft: '4px solid var(--saffron)',
            background: 'linear-gradient(135deg,#fff7ed,#fff)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 10 }}>
                📍 Selected Location Detail
              </div>
              <button onClick={() => setSelected(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#999' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12, fontSize: '0.85rem' }}>
              {[
                { icon: '🏙️', label: 'City',      val: selected.city || '—' },
                { icon: '🗾', label: 'State',     val: selected.state || '—' },
                { icon: '🌍', label: 'Country',   val: selected.country || 'India' },
                { icon: '📐', label: 'Latitude',  val: selected.latitude.toFixed(6) },
                { icon: '📐', label: 'Longitude', val: selected.longitude.toFixed(6) },
                { icon: '🌐', label: 'IP Address', val: selected.ip || '—' },
                { icon: '🕐', label: 'Captured',  val: new Date(selected.capturedAt).toLocaleString('en-IN') },
              ].map(r => (
                <div key={r.label} style={{
                  background: 'white', borderRadius: 8, padding: '10px 14px',
                  border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                  <div style={{ color: 'var(--text-light)', fontSize: '0.72rem', marginBottom: 2 }}>{r.icon} {r.label}</div>
                  <div style={{ fontWeight: 600, color: 'var(--navy)', wordBreak: 'break-all' }}>{r.val}</div>
                </div>
              ))}
            </div>
            {selected.userAgent && (
              <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--text-light)', wordBreak: 'break-all' }}>
                <strong>User Agent:</strong> {selected.userAgent}
              </div>
            )}
          </div>
        )}

        {/* Data table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            background: 'var(--navy)', color: 'white', padding: '12px 20px',
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}>
            <span style={{ fontWeight: 700 }}>📋 Location Records</span>
            <input
              style={{
                marginLeft: 'auto', background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6,
                padding: '5px 12px', color: 'white', fontSize: '0.82rem', minWidth: 200,
              }}
              placeholder="🔍 Search city, state, IP…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Country</th>
                  <th>Coordinates</th>
                  <th>IP Address</th>
                  <th>Captured At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-light)' }}>
                      {locations.length === 0 ? '📭 No visitor locations recorded yet' : '🔍 No records match your search'}
                    </td>
                  </tr>
                )}
                {filtered.map((loc, i) => (
                  <tr
                    key={loc._id}
                    style={{
                      cursor: 'pointer',
                      background: selected?._id === loc._id ? 'rgba(255,153,51,0.08)' : undefined,
                      borderLeft: selected?._id === loc._id ? '3px solid var(--saffron)' : '3px solid transparent',
                    }}
                    onClick={() => focusMarker(loc)}
                  >
                    <td style={{ color: 'var(--text-light)', fontSize: '0.78rem' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{loc.city || '—'}</td>
                    <td style={{ fontSize: '0.82rem' }}>{loc.state || '—'}</td>
                    <td style={{ fontSize: '0.82rem' }}>{loc.country || 'India'}</td>
                    <td style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#4a5568' }}>
                      {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                    </td>
                    <td style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#4a5568' }}>{loc.ip || '—'}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                      {new Date(loc.capturedAt).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <button
                        className="btn btn-saffron btn-sm"
                        onClick={e => { e.stopPropagation(); focusMarker(loc); }}
                      >
                        📍 View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-light)' }}>
              Showing {filtered.length} of {locations.length} location records
            </div>
          )}
        </div>

      </div>
      <Footer />
    </>
  );
}
