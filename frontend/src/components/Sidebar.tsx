import { useStore } from '../stores/appStore';
import ForecastPanel from './ForecastPanel';
import AlertsPanel from './AlertsPanel';
import SubscribePanel from './SubscribePanel';

const TABS = [
  { id: 'forecast', label: 'Forecast', labelNp: 'पूर्वानुमान', icon: '📅' },
  { id: 'alerts', label: 'Alerts', labelNp: 'सूचना', icon: '⚠️' },
  { id: 'subscribe', label: 'Subscribe', labelNp: 'सदस्यता', icon: '🔔' },
] as const;

export default function Sidebar() {
  const { showSidebar, setShowSidebar, sidebarTab, setSidebarTab, selectedDistrict, lang, alerts } = useStore();
  const activeAlerts = alerts.filter(a => a.severity === 'red' || a.severity === 'orange').length;

  if (!showSidebar) {
    return (
      <button
        onClick={() => setShowSidebar(true)}
        className="absolute z-[1000] flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-display font-600 transition-all duration-200"
        style={{
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(13,33,55,0.85)',
          border: '1px solid rgba(144,205,244,0.2)',
          color: '#90cdf4',
          backdropFilter: 'blur(12px)',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
        }}
      >
        {selectedDistrict ? (
          <span>{lang === 'np' ? selectedDistrict.nameNepali : selectedDistrict.name}</span>
        ) : (
          <span>{lang === 'en' ? 'Details' : 'विवरण'}</span>
        )}
        <span style={{ writingMode: 'horizontal-tb' }}>›</span>
      </button>
    );
  }

  return (
    <div
      className="absolute right-0 top-0 bottom-0 z-[1000] flex flex-col"
      style={{
        width: 'min(380px, 90vw)',
        background: 'rgba(10, 20, 38, 0.96)',
        borderLeft: '1px solid rgba(144,205,244,0.12)',
        backdropFilter: 'blur(24px)',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          {selectedDistrict ? (
            <div>
              <div className="font-display font-700 text-white text-base leading-none">
                {lang === 'np' ? selectedDistrict.nameNepali : selectedDistrict.name}
              </div>
              <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {selectedDistrict.province} · {selectedDistrict.elevation}m
              </div>
            </div>
          ) : (
            <div className="font-display font-700 text-white text-base">
              {lang === 'en' ? 'Nepal Weather' : 'नेपाल मौसम'}
            </div>
          )}
        </div>
        <button
          onClick={() => setShowSidebar(false)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSidebarTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-display font-600 transition-all duration-200"
            style={{
              background: sidebarTab === tab.id ? 'rgba(49,130,206,0.25)' : 'transparent',
              color: sidebarTab === tab.id ? '#90cdf4' : 'rgba(255,255,255,0.45)',
              border: sidebarTab === tab.id ? '1px solid rgba(144,205,244,0.3)' : '1px solid transparent',
              position: 'relative',
            }}
          >
            <span>{tab.icon}</span>
            <span>{lang === 'en' ? tab.label : tab.labelNp}</span>
            {tab.id === 'alerts' && activeAlerts > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-700"
                style={{ background: '#fc8181', color: 'white', fontSize: '9px' }}
              >
                {activeAlerts}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto">
        {sidebarTab === 'forecast' && <ForecastPanel />}
        {sidebarTab === 'alerts' && <AlertsPanel />}
        {sidebarTab === 'subscribe' && <SubscribePanel />}
      </div>
    </div>
  );
}
