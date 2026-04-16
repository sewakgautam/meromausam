import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useStore } from '../stores/appStore';
import { weatherEmoji, tempColor, alertTypeIcon, getSeasonalContext } from '../utils/weather';

export default function HomePage() {
  const { overview, alerts, setOverview, setMapData, setAllDaysData, setAlerts, loading, setLoading, lang, toggleLang } = useStore();
  const season = getSeasonalContext();
  const severeAlerts = alerts.filter(a => a.severity === 'red' || a.severity === 'orange');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [ov, matrix, al] = await Promise.all([
          api.getOverview().catch(() => null),
          api.getForecastMatrix().catch(() => [] as any[][]),
          api.getAlerts().catch(() => []),
        ]);
        if (ov) setOverview(ov);
        if (matrix?.length) setAllDaysData(matrix);
        else {
          const md = await api.getMapData().catch(() => []);
          setMapData(md);
        }
        setAlerts(al || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats = overview?.summary;
  const provinces = overview
    ? [...new Map(overview.districts.map(d => [d.province, d])).keys()]
    : [];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'DM Sans, sans-serif' }}>
      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 1px 12px rgba(0,0,0,0.06)',
        padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>🌦️</span>
          <div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 18, color: '#1a365d', lineHeight: 1 }}>
              MeroMausam
            </div>
            <div style={{ fontSize: 11, color: '#718096', fontFamily: 'Noto Sans Devanagari, sans-serif' }}>
              मेरो मौसम · Nepal Weather
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {severeAlerts.length > 0 && (
            <div style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: '#fff5f5', border: '1px solid #fed7d7', color: '#c53030', fontWeight: 600 }}>
              ⚠️ {severeAlerts.length} active alert{severeAlerts.length > 1 ? 's' : ''}
            </div>
          )}
          <button onClick={toggleLang} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 20, background: 'rgba(49,130,206,0.08)', border: '1px solid rgba(49,130,206,0.25)', color: '#3182ce', cursor: 'pointer', fontWeight: 600 }}>
            {lang === 'en' ? 'नेपाली' : 'English'}
          </button>
          <Link to="/map" style={{
            fontSize: 13, padding: '8px 20px', borderRadius: 20,
            background: 'linear-gradient(135deg,#2b6cb0,#3182ce)', color: 'white',
            fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(49,130,206,0.35)',
          }}>
            {lang === 'en' ? 'Open Live Map →' : 'नक्सा खोल्नुस् →'}
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        background: 'linear-gradient(135deg, #1a365d 0%, #2b6cb0 50%, #3182ce 100%)',
        padding: '80px 24px 72px',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* subtle grid pattern */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', marginBottom: 24 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#68d391', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
              {season.emoji} {lang === 'en' ? season.season : season.np} · Live data from DHM Nepal
            </span>
          </div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(32px,6vw,60px)', color: 'white', margin: '0 0 16px', lineHeight: 1.1 }}>
            {lang === 'en' ? 'Nepal Weather Intelligence' : 'नेपाल मौसम बुद्धिमत्ता'}
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.6 }}>
            {lang === 'en'
              ? 'Real-time forecasts, wind flows, and severe weather alerts for all 77 districts of Nepal — in your language.'
              : 'नेपालका सबै ७७ जिल्लाका लागि वास्तविक समयको पूर्वानुमान, हावाको प्रवाह र गम्भीर मौसम सूचना।'}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/map" style={{
              padding: '14px 32px', borderRadius: 12,
              background: 'white', color: '#2b6cb0',
              fontWeight: 700, fontSize: 15, textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              🗺️ {lang === 'en' ? 'View Live Map' : 'नक्सा हेर्नुस्'}
            </Link>
            <a href="#how" style={{
              padding: '14px 32px', borderRadius: 12,
              background: 'rgba(255,255,255,0.12)', color: 'white',
              fontWeight: 600, fontSize: 15, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              {lang === 'en' ? 'How it works' : 'कसरी काम गर्छ'}
            </a>
          </div>
        </div>
      </section>

      {/* ── Live Alert Banner ── */}
      {severeAlerts.length > 0 && (
        <div style={{ background: '#fff5f5', borderTop: '3px solid #fc8181', borderBottom: '1px solid #fed7d7', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#c53030', background: '#fed7d7', padding: '3px 10px', borderRadius: 20, flexShrink: 0 }}>⚠️ ALERT</span>
          <div style={{ flex: 1, fontSize: 13, color: '#742a2a', lineHeight: 1.5 }}>
            {severeAlerts.slice(0, 2).map(a => (
              <span key={a.id} style={{ marginRight: 20 }}>
                {alertTypeIcon(a.alertType)} {lang === 'np' && a.titleNp ? a.titleNp : a.title}
                {a.province ? ` — ${a.province}` : ''}
              </span>
            ))}
            {severeAlerts.length > 2 && <span style={{ color: '#c53030', fontWeight: 600 }}>+{severeAlerts.length - 2} more</span>}
          </div>
          <Link to="/map" style={{ fontSize: 12, color: '#c53030', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
            View on map →
          </Link>
        </div>
      )}

      {/* ── Live Stats ── */}
      <section style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '28px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
              {[1,2,3,4].map(i => <div key={i} style={{ height: 80, borderRadius: 12, background: '#f7fafc' }} />)}
            </div>
          ) : stats ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
              {[
                { icon: '🌡️', val: `${stats.avgTemp}°C`, label: lang === 'en' ? 'National Avg Temp' : 'राष्ट्रिय औसत', color: '#dd6b20' },
                { icon: '🌧️', val: `${stats.rainyDistricts}`, label: lang === 'en' ? 'Districts with Rain' : 'वर्षा हुने जिल्ला', color: '#3182ce' },
                { icon: '⚠️', val: `${stats.severeDistricts}`, label: lang === 'en' ? 'Severe Conditions' : 'गम्भीर मौसम', color: stats.severeDistricts > 0 ? '#c53030' : '#38a169' },
                { icon: '🔔', val: `${stats.activeAlerts}`, label: lang === 'en' ? 'Active Alerts' : 'सक्रिय सूचना', color: stats.activeAlerts > 0 ? '#dd6b20' : '#38a169' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: 28 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 24, color: s.color, lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontSize: 12, color: '#718096', marginTop: 3 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {stats && (
            <div style={{ textAlign: 'right', fontSize: 11, color: '#a0aec0', marginTop: 10 }}>
              Updated: {new Date(stats.updatedAt).toLocaleString('en-NP', { timeZone: 'Asia/Kathmandu', hour: '2-digit', minute: '2-digit' })} NPT
            </div>
          )}
        </div>
      </section>

      {/* ── Feature Cards ── */}
      <section style={{ padding: '60px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 28, color: '#1a365d', marginBottom: 8, textAlign: 'center' }}>
          {lang === 'en' ? 'What you can see' : 'तपाईं के देख्न सक्नुहुन्छ'}
        </h2>
        <p style={{ textAlign: 'center', color: '#718096', marginBottom: 40, fontSize: 15 }}>
          {lang === 'en' ? 'Four interactive layers over a live map of Nepal' : 'नेपालको नक्सामाथि चार अन्तरक्रियात्मक तहहरू'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20 }}>
          {[
            { icon: '🌡️', title: lang === 'en' ? 'Temperature Heatmap' : 'तापक्रम नक्सा', desc: lang === 'en' ? 'Smooth IDW-interpolated temperature field across all 77 districts. Deep blue to red.' : 'सबै ७७ जिल्लामा चिल्लो तापक्रम क्षेत्र।', color: '#fff5eb', border: '#fbd38d' },
            { icon: '💧', title: lang === 'en' ? 'Precipitation Layer' : 'वर्षा तह', desc: lang === 'en' ? 'Rainfall in mm visualised as transparent blue overlays — light drizzle to heavy monsoon.' : 'मिमीमा वर्षा पारदर्शी नीलो ओभरलेको रूपमा।', color: '#ebf8ff', border: '#90cdf4' },
            { icon: '💨', title: lang === 'en' ? 'Wind Flow Animation' : 'हावाको प्रवाह', desc: lang === 'en' ? '3,500 animated particles flowing in real wind direction — calm blue to dangerous red.' : '३,५०० एनिमेटेड कण वास्तविक हावाको दिशामा।', color: '#f0fff4', border: '#9ae6b4' },
            { icon: '🛰️', title: lang === 'en' ? 'Satellite View' : 'उपग्रह दृश्य', desc: lang === 'en' ? 'NASA GIBS true color, infrared, and cloud cover imagery from MODIS/VIIRS.' : 'MODIS/VIIRS बाट NASA GIBS उपग्रह चित्र।', color: '#faf5ff', border: '#d6bcfa' },
          ].map(f => (
            <Link to="/map" key={f.title} style={{ textDecoration: 'none' }}>
              <div style={{ padding: '24px', borderRadius: 16, background: f.color, border: `1px solid ${f.border}`, transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16, color: '#1a365d', marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: '#4a5568', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Province Table ── */}
      {overview && (
        <section style={{ padding: '0 24px 60px', maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 24, color: '#1a365d', marginBottom: 20 }}>
            {lang === 'en' ? 'Conditions by Province' : 'प्रदेश अनुसार अवस्था'}
          </h2>
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f7fafc' }}>
                  {['Province', 'Districts', 'Avg Temp', 'Rainy', 'Severe', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#718096', textTransform: 'uppercase', textAlign: 'left', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {provinces.map((province, i) => {
                  const pd = overview.districts.filter(d => d.province === province);
                  const temps = pd.map(d => d.forecast?.tempMax).filter(Boolean) as number[];
                  const avgT = temps.length ? Math.round(temps.reduce((a, b) => a + b, 0) / temps.length) : null;
                  const rainy = pd.filter(d => (d.forecast?.precipitation ?? 0) > 1).length;
                  const severe = pd.filter(d => ['warning', 'extreme'].includes(d.forecast?.severity ?? '')).length;
                  return (
                    <tr key={province} style={{ borderBottom: i < provinces.length - 1 ? '1px solid #f0f4f8' : 'none', background: i % 2 === 0 ? 'white' : '#fafbfc' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2d3748', fontSize: 14 }}>{province}</td>
                      <td style={{ padding: '12px 16px', color: '#4a5568', fontSize: 14 }}>{pd.length}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {avgT ? <span style={{ fontWeight: 700, fontSize: 14, color: tempColor(avgT) }}>{avgT}°C</span> : <span style={{ color: '#a0aec0' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 13, color: rainy > 0 ? '#3182ce' : '#a0aec0', fontWeight: rainy > 0 ? 600 : 400 }}>
                          {rainy > 0 ? `🌧️ ${rainy}` : '—'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {severe > 0
                          ? <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 10, background: '#fff5f5', color: '#c53030', fontWeight: 600 }}>⚠️ {severe}</span>
                          : <span style={{ color: '#68d391', fontSize: 13 }}>✓ Clear</span>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Link to="/map" style={{ fontSize: 12, color: '#3182ce', fontWeight: 600, textDecoration: 'none' }}>View →</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── How It Works ── */}
      <section id="how" style={{ background: '#1a365d', padding: '60px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 28, color: 'white', marginBottom: 8, textAlign: 'center' }}>
            {lang === 'en' ? 'How it works' : 'कसरी काम गर्छ'}
          </h2>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', marginBottom: 48, fontSize: 15 }}>
            {lang === 'en' ? 'Three data sources → one smart dashboard' : 'तीन डेटा स्रोत → एक स्मार्ट ड्यासबोर्ड'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24 }}>
            {[
              { icon: '🌐', title: 'Open-Meteo API', sub: lang === 'en' ? 'Every 3 hours' : 'हरेक ३ घण्टामा', desc: lang === 'en' ? '7-day forecasts for all 77 districts: temperature, rain, wind, UV, humidity — fetched automatically.' : 'सबै ७७ जिल्लाको ७ दिनको पूर्वानुमान।' },
              { icon: '🏛️', title: 'DHM Nepal', sub: lang === 'en' ? 'Every 6 hours' : 'हरेक ६ घण्टामा', desc: lang === 'en' ? 'Official bulletins and severe weather warnings scraped from Nepal\'s Department of Hydrology and Meteorology.' : 'DHM नेपालबाट आधिकारिक मौसम बुलेटिन।' },
              { icon: '🛰️', title: 'NASA GIBS', sub: lang === 'en' ? 'Daily satellite' : 'दैनिक उपग्रह', desc: lang === 'en' ? 'Free WMTS satellite tiles — MODIS true color, infrared cloud, and precipitation overlays.' : 'NASA GIBS बाट नि:शुल्क उपग्रह चित्र।' },
            ].map(s => (
              <div key={s.title} style={{ padding: '28px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{s.icon}</div>
                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 17, color: 'white', marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#90cdf4', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.sub}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#0f2240', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>🌦️</div>
        <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16, color: 'white', marginBottom: 4 }}>MeroMausam — मेरो मौसम</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>
          Nepal Weather Intelligence · Data: DHM Nepal, Open-Meteo, NASA GIBS
        </div>
        <Link to="/map" style={{ fontSize: 13, padding: '8px 20px', borderRadius: 20, background: 'rgba(49,130,206,0.2)', border: '1px solid rgba(49,130,206,0.4)', color: '#90cdf4', textDecoration: 'none', fontWeight: 600 }}>
          Open Live Map →
        </Link>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
