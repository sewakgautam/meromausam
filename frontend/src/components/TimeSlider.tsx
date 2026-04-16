import { useStore } from '../stores/appStore';
import { weatherEmoji } from '../utils/weather';

const DAY_LABELS = ['Today', 'Tomorrow', '+2', '+3', '+4', '+5', '+6'];

export default function TimeSlider() {
  const { forecastDayIndex, setForecastDayIndex, allDaysData } = useStore();

  const getDayLabel = (i: number) => {
    if (i < 2) return DAY_LABELS[i];
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getEmoji = (i: number) => {
    const day = allDaysData[i];
    if (!day) return '🌤️';
    const codes = day.map(d => d.forecast?.weatherCode).filter(Boolean) as number[];
    if (codes.length === 0) return '🌤️';
    const freq: Record<number, number> = {};
    for (const c of codes) freq[c] = (freq[c] || 0) + 1;
    const dominant = Number(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]);
    return weatherEmoji(dominant);
  };

  const getAvgTemp = (i: number) => {
    const day = allDaysData[i];
    if (!day) return null;
    const temps = day.map(d => d.forecast?.tempMax).filter(t => t != null) as number[];
    if (temps.length === 0) return null;
    return Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);
  };

  return (
    <div
      className="absolute bottom-14 left-1/2 z-[1001]"
      style={{
        transform: 'translateX(-50%)',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: '16px',
        padding: '6px 8px',
        display: 'flex',
        gap: '4px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
      }}
    >
      {Array.from({ length: 7 }, (_, i) => {
        const active = i === forecastDayIndex;
        const temp = getAvgTemp(i);
        return (
          <button
            key={i}
            onClick={() => setForecastDayIndex(i)}
            style={{
              background: active ? 'rgba(49,130,206,0.10)' : 'transparent',
              border: active ? '1px solid rgba(49,130,206,0.45)' : '1px solid transparent',
              borderRadius: '10px',
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              transition: 'all 0.15s',
              minWidth: '56px',
            }}
          >
            <span style={{ fontSize: '10px', fontWeight: active ? 600 : 400, color: active ? '#2b6cb0' : '#718096', letterSpacing: '0.03em' }}>
              {getDayLabel(i)}
            </span>
            <span style={{ fontSize: '18px', lineHeight: 1 }}>{getEmoji(i)}</span>
            {temp != null && (
              <span style={{ fontSize: '11px', fontWeight: 600, color: active ? '#2b6cb0' : '#a0aec0' }}>
                {temp}°
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
