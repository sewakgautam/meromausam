import { useStore } from '../stores/appStore';
import { getSeasonalContext } from '../utils/weather';

export default function TopBar() {
  const { lang, toggleLang, overview, alerts, loading } = useStore();
  const season = getSeasonalContext();
  const severeAlerts = alerts.filter(a => a.severity === 'red' || a.severity === 'orange').length;

  return (
    <div
      className="absolute top-0 left-0 right-0 z-[1000] flex items-center justify-between px-4 py-3"
      style={{
        background: 'rgba(255,255,255,0.90)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 1px 16px rgba(0,0,0,0.08)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">🌦️</span>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-800 text-lg leading-none tracking-tight" style={{ color: '#1a365d' }}>
              MeroMausam
            </h1>
            <span className="text-xs px-1.5 py-0.5 rounded-full font-display font-600"
              style={{ background: 'rgba(49,130,206,0.1)', color: '#3182ce', border: '1px solid rgba(49,130,206,0.25)' }}>
              LIVE
            </span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: '#718096', fontFamily: 'Noto Sans Devanagari' }}>
            मेरो मौसम · Nepal Weather Intelligence
          </div>
        </div>
      </div>

      {/* Center — season + stats */}
      <div className="hidden md:flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm" style={{ color: '#4a5568' }}>
          <span>{season.emoji}</span>
          <span className="font-display">{lang === 'en' ? season.season : season.np}</span>
        </div>
        {overview && !loading && (
          <>
            <div className="w-px h-4" style={{ background: 'rgba(0,0,0,0.12)' }} />
            <div className="text-sm" style={{ color: '#4a5568' }}>
              <span className="font-display font-600" style={{ color: '#1a365d' }}>{overview.summary.avgTemp}°C</span>
              <span className="ml-1">avg</span>
            </div>
            <div className="w-px h-4" style={{ background: 'rgba(0,0,0,0.12)' }} />
            <div className="text-sm" style={{ color: '#4a5568' }}>
              <span className="font-display font-600" style={{ color: '#3182ce' }}>{overview.summary.rainyDistricts}</span>
              <span className="ml-1">rainy districts</span>
            </div>
          </>
        )}
        {loading && (
          <div className="flex items-center gap-2 text-sm" style={{ color: '#a0aec0' }}>
            <div className="w-3 h-3 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(49,130,206,0.4)', borderTopColor: '#3182ce' }} />
            Loading data...
          </div>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {severeAlerts > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-display font-600"
            style={{ background: '#fff5f5', border: '1px solid #fed7d7', color: '#c53030' }}>
            <span className="animate-pulse">⚠️</span>
            {severeAlerts} alert{severeAlerts > 1 ? 's' : ''}
          </div>
        )}

        <button
          onClick={toggleLang}
          className="px-3 py-1.5 rounded-full text-xs font-display font-600 transition-all duration-200"
          style={{
            background: 'rgba(49,130,206,0.08)',
            border: '1px solid rgba(49,130,206,0.25)',
            color: '#3182ce',
          }}
        >
          {lang === 'en' ? 'नेपाली' : 'English'}
        </button>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
          style={{ background: '#f7fafc', border: '1px solid rgba(0,0,0,0.08)', color: '#718096' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
          DHM · Open-Meteo · NASA
        </div>
      </div>
    </div>
  );
}
