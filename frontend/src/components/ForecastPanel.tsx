import { useStore } from '../stores/appStore';
import { weatherEmoji, tempColor, formatDate, windDirection, alertTypeIcon } from '../utils/weather';

export default function ForecastPanel() {
  const { selectedDistrict, districtForecast, overview, lang, setSelectedDistrict, setDistrictForecast } = useStore();

  if (!selectedDistrict) {
    return <NepalOverview />;
  }

  if (districtForecast.length === 0) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  const today = districtForecast[0];

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      {/* Back button */}
      <button
        onClick={() => { setSelectedDistrict(null); setDistrictForecast([]); }}
        className="flex items-center gap-1.5 text-xs transition-all"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        ← {lang === 'en' ? 'All of Nepal' : 'सम्पूर्ण नेपाल'}
      </button>

      {/* Today's hero card */}
      <div
        className="rounded-2xl p-4 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(43,108,176,0.3) 0%, rgba(10,22,40,0.8) 100%)',
          border: '1px solid rgba(144,205,244,0.2)',
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-4xl mb-2" style={{ filter: 'drop-shadow(0 0 16px rgba(255,255,255,0.3))' }}>
              {weatherEmoji(today.weatherCode)}
            </div>
            <div className="font-display font-700 text-white" style={{ fontSize: 42, lineHeight: 1 }}>
              {today.tempMax?.toFixed(0)}°
            </div>
            <div className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {lang === 'np' ? today.weatherDescNp : today.weatherDesc}
            </div>
            <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {lang === 'en' ? 'Feels like' : 'अनुभव'} {today.feelsLike?.toFixed(0) ?? today.tempMax?.toFixed(0)}°C
            </div>
          </div>
          <div className="text-right space-y-2 pt-1">
            <div className="text-xs px-2 py-1 rounded-full font-display font-600 inline-block"
              style={{
                background: today.severity === 'normal' ? 'rgba(56,161,105,0.2)' : 'rgba(197,48,48,0.2)',
                color: today.severity === 'normal' ? '#68d391' : '#fc8181',
                border: `1px solid ${today.severity === 'normal' ? 'rgba(104,211,145,0.3)' : 'rgba(252,129,129,0.3)'}`,
              }}>
              {today.severity.toUpperCase()}
            </div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {formatDate(today.validTime)}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { icon: '💧', val: `${today.precipitation?.toFixed(0) ?? 0}mm`, label: lang === 'en' ? 'Rain' : 'वर्षा' },
            { icon: '🌬️', val: `${today.windSpeed?.toFixed(0) ?? 0}`, label: `${windDirection(today.windDir)} km/h` },
            { icon: '☔', val: `${today.precipProb?.toFixed(0) ?? 0}%`, label: lang === 'en' ? 'Rain %' : 'वर्षा %' },
            { icon: '☀️', val: `UV ${today.uvIndex?.toFixed(0) ?? '—'}`, label: lang === 'en' ? 'UV Index' : 'UV सूचकांक' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-2 text-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="text-base">{s.icon}</div>
              <div className="font-display font-600 text-white text-xs mt-0.5">{s.val}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Severe flags */}
        {(today.isThunderstorm || today.isHeavyRain || today.isHailstone || today.isSnow || today.isHeatwave) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {today.isThunderstorm && <Flag label={lang === 'np' ? 'बज्रपात' : 'Thunderstorm'} icon="⚡" />}
            {today.isHeavyRain && <Flag label={lang === 'np' ? 'भारी वर्षा' : 'Heavy Rain'} icon="🌧️" />}
            {today.isHailstone && <Flag label={lang === 'np' ? 'असिना' : 'Hailstone'} icon="🌨️" />}
            {today.isSnow && <Flag label={lang === 'np' ? 'हिमपात' : 'Snowfall'} icon="❄️" />}
            {today.isHeatwave && <Flag label={lang === 'np' ? 'तापलहर' : 'Heat Wave'} icon="🌡️" />}
          </div>
        )}
      </div>

      {/* 7-day forecast */}
      <div>
        <div className="text-xs font-display font-600 mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {lang === 'en' ? '7-DAY FORECAST' : '७ दिनको पूर्वानुमान'}
        </div>
        <div className="space-y-1.5">
          {districtForecast.map((fc, i) => (
            <div
              key={fc.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
              style={{
                background: i === 0 ? 'rgba(49,130,206,0.15)' : 'rgba(255,255,255,0.04)',
                border: i === 0 ? '1px solid rgba(144,205,244,0.2)' : '1px solid transparent',
              }}
            >
              <div className="text-xl">{weatherEmoji(fc.weatherCode)}</div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-600 text-xs text-white">
                  {i === 0 ? (lang === 'en' ? 'Today' : 'आज') : formatDate(fc.validTime)}
                </div>
                <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {lang === 'np' ? fc.weatherDescNp : fc.weatherDesc}
                  {fc.precipitation && fc.precipitation > 1 ? ` · ${fc.precipitation.toFixed(0)}mm` : ''}
                </div>
              </div>
              {/* Temp bar */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{fc.tempMin?.toFixed(0)}°</span>
                <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(10, ((fc.tempMax ?? 25) / 45) * 100))}%`,
                      background: tempColor(fc.tempMax),
                    }}
                  />
                </div>
                <span className="text-xs font-display font-600" style={{ color: tempColor(fc.tempMax) }}>
                  {fc.tempMax?.toFixed(0)}°
                </span>
              </div>
              {/* Severe icons */}
              <div className="flex gap-0.5 flex-shrink-0">
                {fc.isThunderstorm && <span className="text-xs">⚡</span>}
                {fc.isHeavyRain && <span className="text-xs">🌧️</span>}
                {fc.isHailstone && <span className="text-xs">🌨️</span>}
                {fc.isSnow && <span className="text-xs">❄️</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Source note */}
      <div className="text-xs text-center pb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
        Data: Open-Meteo · DHM Nepal · Updated every 3 hours
      </div>
    </div>
  );
}

function Flag({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-600"
      style={{ background: 'rgba(197,48,48,0.2)', color: '#fc8181', border: '1px solid rgba(252,129,129,0.3)' }}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function NepalOverview() {
  const { overview, lang } = useStore();
  if (!overview) return (
    <div className="p-4 space-y-3">
      {[1,2,3,4].map(i => <div key={i} className="skeleton h-20 rounded-xl"/>)}
    </div>
  );

  const provinces = [...new Set(overview.districts.map(d => d.province))];

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="text-xs font-display font-600" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {lang === 'en' ? 'NATIONAL OVERVIEW' : 'राष्ट्रिय सारांश'}
      </div>

      {/* National stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { v: `${overview.summary.avgTemp}°C`, l: lang === 'en' ? 'Avg Temperature' : 'औसत तापक्रम', c: '#f6ad55', i: '🌡️' },
          { v: `${overview.summary.rainyDistricts}`, l: lang === 'en' ? 'Rainy Districts' : 'वर्षा हुने', c: '#90cdf4', i: '🌧️' },
          { v: `${overview.summary.severeDistricts}`, l: lang === 'en' ? 'Severe Weather' : 'गम्भीर', c: '#fc8181', i: '⚠️' },
          { v: `${overview.summary.activeAlerts}`, l: lang === 'en' ? 'Active Alerts' : 'सूचना', c: '#f6ad55', i: '🔔' },
        ].map(s => (
          <div key={s.l} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{s.i}</span>
              <div>
                <div className="font-display font-700 text-base" style={{ color: s.c }}>{s.v}</div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.l}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Province breakdown */}
      <div>
        <div className="text-xs font-display font-600 mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {lang === 'en' ? 'BY PROVINCE' : 'प्रदेश अनुसार'}
        </div>
        <div className="space-y-1.5">
          {provinces.map(province => {
            const pDistricts = overview.districts.filter(d => d.province === province);
            const temps = pDistricts.map(d => d.forecast?.tempMax ?? null).filter(Boolean) as number[];
            const avgT = temps.length ? Math.round(temps.reduce((a, b) => a + b, 0) / temps.length) : null;
            const rainy = pDistricts.filter(d => (d.forecast?.precipitation ?? 0) > 1).length;
            const severe = pDistricts.filter(d => d.forecast?.severity === 'warning' || d.forecast?.severity === 'extreme').length;

            return (
              <div key={province} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex-1">
                  <div className="font-display font-600 text-xs text-white">{province}</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {pDistricts.length} districts · {rainy} rainy
                    {severe > 0 ? ` · ⚠️ ${severe} severe` : ''}
                  </div>
                </div>
                {avgT && (
                  <div className="font-display font-700 text-sm" style={{ color: tempColor(avgT) }}>
                    {avgT}°C
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
        {lang === 'en' ? 'Click any district on the map for details' : 'विवरणका लागि नक्सामा जिल्ला क्लिक गर्नुहोस्'}
      </div>
    </div>
  );
}
