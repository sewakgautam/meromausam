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
        background: 'linear-gradient(180deg, rgba(10,22,40,0.98) 0%, rgba(10,22,40,0.85) 70%, transparent 100%)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <span className="text-3xl" style={{ filter: 'drop-shadow(0 0 12px rgba(144,205,244,0.6))' }}>🌦️</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-800 text-white text-lg leading-none tracking-tight">
              MeroMausam
            </h1>
            <span className="text-xs px-1.5 py-0.5 rounded-full font-display font-600"
              style={{ background: 'rgba(144,205,244,0.15)', color: '#90cdf4', border: '1px solid rgba(144,205,244,0.2)' }}>
              LIVE
            </span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'Noto Sans Devanagari' }}>
            मेरो मौसम · Nepal Weather Intelligence
          </div>
        </div>
      </div>

      {/* Center - Season + stats */}
      <div className="hidden md:flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
          <span>{season.emoji}</span>
          <span className="font-display">{lang === 'en' ? season.season : season.np}</span>
        </div>
        {overview && !loading && (
          <>
            <div className="w-px h-4" style={{ background: 'rgba(255,255,255,0.15)' }} />
            <div className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <span className="font-display font-600 text-white">{overview.summary.avgTemp}°C</span>
              <span className="ml-1">avg</span>
            </div>
            <div className="w-px h-4" style={{ background: 'rgba(255,255,255,0.15)' }} />
            <div className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <span className="font-display font-600" style={{ color: '#90cdf4' }}>{overview.summary.rainyDistricts}</span>
              <span className="ml-1">rainy districts</span>
            </div>
          </>
        )}
        {loading && (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <div className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(144,205,244,0.5)', borderTopColor: 'transparent' }} />
            Loading data...
          </div>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {severeAlerts > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-display font-600"
            style={{ background: 'rgba(197,48,48,0.2)', border: '1px solid rgba(252,129,129,0.4)', color: '#fc8181' }}>
            <span className="animate-pulse">⚠️</span>
            {severeAlerts} alert{severeAlerts > 1 ? 's' : ''}
          </div>
        )}

        {/* Language toggle */}
        <button
          onClick={toggleLang}
          className="px-3 py-1.5 rounded-full text-xs font-display font-600 transition-all duration-200"
          style={{
            background: 'rgba(144,205,244,0.1)',
            border: '1px solid rgba(144,205,244,0.2)',
            color: '#90cdf4',
          }}
        >
          {lang === 'en' ? 'नेपाली' : 'English'}
        </button>

        {/* DHM source badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
          DHM · Open-Meteo · NASA
        </div>
      </div>
    </div>
  );
}
