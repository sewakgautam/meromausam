import { useStore } from '../stores/appStore';
import { alertTypeIcon } from '../utils/weather';

export default function AlertBanner() {
  const { alerts, lang } = useStore();
  const severe = alerts.filter(a => a.severity === 'red' || a.severity === 'orange');

  if (severe.length === 0) return null;

  const items = severe.slice(0, 5);

  return (
    <div
      className="absolute z-[1000] left-0 right-0 overflow-hidden"
      style={{
        top: 68,
        background: 'linear-gradient(90deg, rgba(197,48,48,0.25) 0%, rgba(197,48,48,0.1) 50%, rgba(197,48,48,0.25) 100%)',
        borderTop: '1px solid rgba(252,129,129,0.2)',
        borderBottom: '1px solid rgba(252,129,129,0.2)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center">
        {/* Badge */}
        <div
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs font-display font-700"
          style={{
            background: 'rgba(197,48,48,0.4)',
            color: '#fc8181',
            borderRight: '1px solid rgba(252,129,129,0.2)',
          }}
        >
          <span className="animate-pulse">⚠️</span>
          <span>ALERT</span>
        </div>

        {/* Scrolling text */}
        <div className="flex-1 overflow-hidden">
          <div
            className="whitespace-nowrap text-xs py-2 px-4"
            style={{
              color: 'rgba(255,255,255,0.85)',
              animation: 'marquee 30s linear infinite',
            }}
          >
            {items.map((a, i) => (
              <span key={a.id}>
                <span className="mr-1">{alertTypeIcon(a.alertType)}</span>
                <span className="font-600" style={{ color: '#fbd38d' }}>
                  {lang === 'np' && a.titleNp ? a.titleNp : a.title}
                </span>
                {' — '}
                <span style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {lang === 'np' && a.descNp ? a.descNp : a.description}
                </span>
                {i < items.length - 1 && <span className="mx-6 opacity-30">•••</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
