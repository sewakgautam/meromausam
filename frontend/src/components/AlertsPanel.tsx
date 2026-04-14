import { useStore } from '../stores/appStore';
import { alertSeverityColor, alertTypeIcon, formatDate } from '../utils/weather';

export default function AlertsPanel() {
  const { alerts, lang } = useStore();

  const sorted = [...alerts].sort((a, b) => {
    const order = { red: 0, orange: 1, yellow: 2, green: 3 };
    return (order[a.severity as keyof typeof order] ?? 4) - (order[b.severity as keyof typeof order] ?? 4);
  });

  if (sorted.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-4xl mb-3">✅</div>
        <div className="font-display font-600 text-white text-sm mb-1">
          {lang === 'en' ? 'No Active Alerts' : 'कुनै सूचना छैन'}
        </div>
        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {lang === 'en' ? 'Weather looks calm across Nepal' : 'नेपालभर मौसम शान्त देखिन्छ'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 animate-fade-up">
      <div className="text-xs font-display font-600" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {sorted.length} {lang === 'en' ? 'ACTIVE ALERTS' : 'सक्रिय सूचनाहरू'}
      </div>

      {sorted.map(alert => {
        const colors = alertSeverityColor(alert.severity);
        const title = lang === 'np' && alert.titleNp ? alert.titleNp : alert.title;
        const desc = lang === 'np' && alert.descNp ? alert.descNp : alert.description;

        return (
          <div
            key={alert.id}
            className="rounded-xl p-3 space-y-2"
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}33`,
            }}
          >
            <div className="flex items-start gap-2">
              <span className="text-xl flex-shrink-0 mt-0.5">
                {alertTypeIcon(alert.alertType)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-display font-700 uppercase"
                    style={{ background: `${colors.border}22`, color: colors.text, border: `1px solid ${colors.border}44` }}
                  >
                    {alert.severity}
                  </span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {alert.province || (lang === 'en' ? 'National' : 'राष्ट्रिय')}
                  </span>
                </div>
                <div className="font-display font-600 text-sm text-white mt-1 leading-snug">{title}</div>
                <div className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{desc}</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <span>{lang === 'en' ? 'Valid until' : 'मान्य'}: {formatDate(alert.validUntil)}</span>
              <span style={{ textTransform: 'capitalize' }}>{alert.alertType}</span>
            </div>
          </div>
        );
      })}

      <div className="text-xs text-center pb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
        {lang === 'en' ? 'Sources: DHM Nepal + Auto-generated from forecast data' : 'स्रोत: DHM नेपाल + पूर्वानुमान डेटा'}
      </div>
    </div>
  );
}
