import { useStore } from '../stores/appStore';
import { Link } from 'react-router-dom';
import { weatherEmoji } from '../utils/weather';
import ForecastPanel from './ForecastPanel';
import AlertsPanel from './AlertsPanel';
import SubscribePanel from './SubscribePanel';

const LAYERS = [
  { id: 'temperature',  label: 'Temp',      labelNp: 'तापक्रम', icon: '🌡️' },
  { id: 'precipitation',label: 'Rain',      labelNp: 'वर्षा',   icon: '🌧️' },
  { id: 'wind',         label: 'Wind',      labelNp: 'हावा',    icon: '💨' },
  { id: 'satellite',    label: 'Satellite', labelNp: 'उपग्रह',  icon: '🛰️' },
] as const;


export default function MapSidebar() {
  const {
    activeLayer, setActiveLayer, lang, toggleLang,
    forecastDayIndex, setForecastDayIndex, allDaysData,
    sidebarTab, setSidebarTab, selectedDistrict,
    alerts, loading,
  } = useStore();

  const severeAlerts = alerts.filter(a => a.severity === 'red' || a.severity === 'orange');

  const getDayLabel = (i: number) => {
    if (i === 0) return 'Today';
    if (i === 1) return 'Tmrw';
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getDominantEmoji = (i: number) => {
    const day = allDaysData[i];
    if (!day || day.length === 0) return '🌤️';
    const codes = day.map(d => d.forecast?.weatherCode).filter(Boolean) as number[];
    if (codes.length === 0) return '🌤️';
    const freq: Record<number, number> = {};
    for (const c of codes) freq[c] = (freq[c] || 0) + 1;
    const dominant = Number(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]);
    return weatherEmoji(dominant);
  };

  const getAvgTemp = (i: number) => {
    const day = allDaysData[i];
    if (!day || day.length === 0) return null;
    const temps = day.map(d => d.forecast?.tempMax).filter(t => t != null) as number[];
    if (temps.length === 0) return null;
    return Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);
  };

  const tabs = [
    {
      id: 'forecast' as const,
      label: selectedDistrict ? 'District' : 'Overview',
      icon: selectedDistrict ? '📍' : '🗺️',
    },
    {
      id: 'alerts' as const,
      label: severeAlerts.length ? `Alerts (${severeAlerts.length})` : 'Alerts',
      icon: '⚠️',
    },
    { id: 'subscribe' as const, label: 'Subscribe', icon: '🔔' },
  ];

  return (
    <aside
      style={{
        width: 300,
        flexShrink: 0,
        background: 'linear-gradient(180deg, #0a1628 0%, #0d1f3c 100%)',
        borderRight: '1px solid rgba(144,205,244,0.08)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: '14px 16px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #2b6cb0, #3182ce)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
              }}
            >
              🌦️
            </div>
            <div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, color: 'white', fontSize: 15, letterSpacing: '-0.01em' }}>
                मेरो मौसम
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>
                NEPAL WEATHER
              </div>
            </div>
          </div>

          {/* Lang toggle */}
          <button
            onClick={toggleLang}
            style={{
              padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
              background: 'rgba(49,130,206,0.15)',
              border: '1px solid rgba(49,130,206,0.3)',
              color: '#90cdf4',
            }}
          >
            {lang === 'en' ? 'नेपाली' : 'EN'}
          </button>
        </div>

        <Link
          to="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 11, color: 'rgba(255,255,255,0.3)', textDecoration: 'none',
            transition: 'color 0.15s',
          }}
        >
          ← {lang === 'en' ? 'Back to homepage' : 'होमपेजमा फर्कनुहोस्'}
        </Link>
      </div>

      {/* ── Severe alert strip ── */}
      {severeAlerts.length > 0 && (
        <button
          onClick={() => setSidebarTab('alerts')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 16px', flexShrink: 0, cursor: 'pointer',
            background: 'rgba(197,48,48,0.18)',
            borderBottom: '1px solid rgba(252,129,129,0.15)',
            border: 'none', width: '100%', textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 13, animation: 'pulse 2s infinite' }}>⚠️</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fc8181', letterSpacing: '0.05em' }}>
            {severeAlerts.length} ACTIVE ALERT{severeAlerts.length > 1 ? 'S' : ''} — View →
          </span>
        </button>
      )}

      {/* ── Layer selector ── */}
      <div style={{ padding: '12px 16px 8px', flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: 7 }}>
          {lang === 'en' ? 'MAP LAYER' : 'नक्सा तह'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {LAYERS.map(layer => {
            const active = activeLayer === layer.id;
            return (
              <button
                key={layer.id}
                onClick={() => setActiveLayer(layer.id)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: active ? '1px solid rgba(144,205,244,0.4)' : '1px solid rgba(255,255,255,0.07)',
                  background: active ? 'rgba(49,130,206,0.2)' : 'rgba(255,255,255,0.04)',
                  color: active ? '#90cdf4' : 'rgba(255,255,255,0.45)',
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: active ? '0 0 12px rgba(49,130,206,0.2)' : 'none',
                }}
              >
                <span style={{ fontSize: 15 }}>{layer.icon}</span>
                <span>{lang === 'en' ? layer.label : layer.labelNp}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 7-day time slider ── */}
      {activeLayer !== 'satellite' && (
        <div style={{ padding: '0 16px 10px', flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: 7 }}>
            {lang === 'en' ? 'FORECAST DAY' : 'पूर्वानुमान दिन'}
          </div>
          <div
            style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}
          >
            {Array.from({ length: 7 }, (_, i) => {
              const active = i === forecastDayIndex;
              const temp = getAvgTemp(i);
              const hasData = allDaysData.length > 0;
              return (
                <button
                  key={i}
                  onClick={() => setForecastDayIndex(i)}
                  disabled={!hasData}
                  style={{
                    flexShrink: 0,
                    padding: '6px 7px',
                    borderRadius: 8,
                    border: active ? '1px solid rgba(144,205,244,0.35)' : '1px solid transparent',
                    background: active ? 'rgba(49,130,206,0.2)' : 'rgba(255,255,255,0.04)',
                    cursor: hasData ? 'pointer' : 'default',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    transition: 'all 0.15s',
                    minWidth: 34,
                  }}
                >
                  <span style={{
                    fontSize: 9, fontWeight: 600, whiteSpace: 'nowrap',
                    color: active ? '#90cdf4' : 'rgba(255,255,255,0.3)',
                    letterSpacing: '0.02em',
                  }}>
                    {getDayLabel(i)}
                  </span>
                  <span style={{ fontSize: 15, lineHeight: 1 }}>
                    {loading ? '…' : getDominantEmoji(i)}
                  </span>
                  {temp != null && (
                    <span style={{ fontSize: 9, fontWeight: 600, color: active ? '#90cdf4' : 'rgba(255,255,255,0.3)' }}>
                      {temp}°
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Legend ── */}
      {(activeLayer === 'temperature' || activeLayer === 'precipitation' || activeLayer === 'wind') && (
        <div style={{ padding: '0 16px 14px', flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
            {activeLayer === 'temperature' ? (lang === 'en' ? 'TEMPERATURE (°C)' : 'तापक्रम (°C)') :
             activeLayer === 'precipitation' ? (lang === 'en' ? 'RAINFALL (mm)' : 'वर्षा (mm)') :
             lang === 'en' ? 'WIND SPEED (km/h)' : 'हावाको गति (km/h)'}
          </div>

          {/* Gradient bar */}
          <div
            style={{
              height: 12,
              borderRadius: 6,
              background: activeLayer === 'temperature'
                ? 'linear-gradient(to right, #60a5fa, #34d399, #4ade80, #facc15, #fb923c, #f87171)'
                : activeLayer === 'precipitation'
                ? 'linear-gradient(to right, rgba(147,197,253,0.25), rgba(59,130,246,0.55), rgba(29,78,216,0.75), rgba(109,40,217,0.9))'
                : 'linear-gradient(to right, #1e6ee6, #00d2be, #dcdc00, #ff6e00)',
              marginBottom: 5,
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          />

          {/* Tick labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {activeLayer === 'temperature' && (
              ['≤0°', '10°', '20°', '30°', '38°+'].map((l, i, arr) => (
                <span key={l} style={{
                  fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600,
                  textAlign: i === 0 ? 'left' : i === arr.length - 1 ? 'right' : 'center',
                }}>{l}</span>
              ))
            )}
            {activeLayer === 'precipitation' && (
              ['Dry', '2mm', '10mm', '50mm+'].map((l, i, arr) => (
                <span key={l} style={{
                  fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600,
                  textAlign: i === 0 ? 'left' : i === arr.length - 1 ? 'right' : 'center',
                }}>{l}</span>
              ))
            )}
            {activeLayer === 'wind' && (
              ['Calm', 'Moderate', 'Strong', 'Severe'].map((l, i, arr) => (
                <span key={l} style={{
                  fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600,
                  textAlign: i === 0 ? 'left' : i === arr.length - 1 ? 'right' : 'center',
                }}>{l}</span>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Divider ── */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

      {/* ── Content tabs ── */}
      <div style={{
        display: 'flex', gap: 3, padding: '8px 12px', flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {tabs.map(tab => {
          const active = sidebarTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSidebarTab(tab.id)}
              style={{
                flex: 1, padding: '6px 4px', borderRadius: 8,
                border: active ? '1px solid rgba(144,205,244,0.3)' : '1px solid transparent',
                background: active ? 'rgba(49,130,206,0.15)' : 'transparent',
                color: active ? '#90cdf4' : 'rgba(255,255,255,0.38)',
                fontSize: 10, fontWeight: active ? 700 : 500,
                cursor: 'pointer', transition: 'all 0.15s',
                letterSpacing: '0.02em', whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {sidebarTab === 'forecast' && <ForecastPanel />}
        {sidebarTab === 'alerts' && <AlertsPanel />}
        {sidebarTab === 'subscribe' && <SubscribePanel />}
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          padding: '8px 16px', flexShrink: 0,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.03em' }}>
          Open-Meteo · DHM Nepal
        </span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)' }}>
          Updated every 3h
        </span>
      </div>
    </aside>
  );
}
