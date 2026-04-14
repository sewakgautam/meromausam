import { useStore } from '../stores/appStore';
import { getSeasonalContext } from '../utils/weather';

export default function StatsBar() {
  const { overview, loading, lang } = useStore();
  const season = getSeasonalContext();

  const stats = overview?.summary;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-[1000] px-4 py-3"
      style={{
        background: 'linear-gradient(0deg, rgba(10,22,40,0.98) 0%, rgba(10,22,40,0.8) 70%, transparent 100%)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center justify-between gap-4 max-w-5xl mx-auto">
        {loading ? (
          <div className="flex gap-4 w-full">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton h-8 flex-1" />
            ))}
          </div>
        ) : stats ? (
          <>
            <StatItem
              value={`${stats.avgTemp}°C`}
              label={lang === 'en' ? 'National Avg Temp' : 'राष्ट्रिय औसत'}
              color="#f6ad55"
              icon="🌡️"
            />
            <div className="w-px h-8 bg-white/10" />
            <StatItem
              value={`${stats.rainyDistricts}`}
              label={lang === 'en' ? 'Rainy Districts' : 'वर्षा हुने जिल्ला'}
              color="#90cdf4"
              icon="🌧️"
            />
            <div className="w-px h-8 bg-white/10 hidden sm:block" />
            <StatItem
              value={`${stats.severeDistricts}`}
              label={lang === 'en' ? 'Severe Weather' : 'गम्भीर मौसम'}
              color={stats.severeDistricts > 0 ? '#fc8181' : '#68d391'}
              icon="⚠️"
            />
            <div className="w-px h-8 bg-white/10 hidden md:block" />
            <StatItem
              value={`${stats.activeAlerts}`}
              label={lang === 'en' ? 'Active Alerts' : 'सक्रिय सूचना'}
              color={stats.activeAlerts > 0 ? '#f6ad55' : '#68d391'}
              icon="🔔"
            />
            <div className="w-px h-8 bg-white/10 hidden md:block" />
            <div className="hidden md:flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <span>Updated:</span>
              <span>{new Date(stats.updatedAt).toLocaleTimeString('en-NP', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kathmandu' })}</span>
              <span>NPT</span>
            </div>
          </>
        ) : (
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Connecting to data sources...
          </div>
        )}

        {/* Season tag */}
        <div className="flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span>{season.emoji}</span>
          <span className="hidden sm:inline">{lang === 'en' ? season.season : season.np}</span>
        </div>
      </div>
    </div>
  );
}

function StatItem({ value, label, color, icon }: { value: string; label: string; color: string; icon: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{icon}</span>
      <div>
        <div className="font-display font-700 text-sm leading-none" style={{ color }}>{value}</div>
        <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</div>
      </div>
    </div>
  );
}
