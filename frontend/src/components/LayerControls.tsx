import { useStore } from '../stores/appStore';

const LAYERS = [
  { id: 'temperature', label: 'Temp',      labelNp: 'तापक्रम', icon: '🌡️' },
  { id: 'precipitation', label: 'Rain',    labelNp: 'वर्षा',   icon: '🌧️' },
  { id: 'wind',        label: 'Wind',      labelNp: 'हावा',    icon: '💨' },
  { id: 'satellite',   label: 'Satellite', labelNp: 'उपग्रह',  icon: '🛰️' },
] as const;

const PANEL_STYLE = {
  background: 'rgba(255,255,255,0.92)',
  border: '1px solid rgba(0,0,0,0.08)',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
} as const;

export default function LayerControls() {
  const { activeLayer, setActiveLayer, lang } = useStore();

  return (
    <div
      className="absolute z-[1000] flex flex-col gap-1.5"
      style={{ left: 16, top: '50%', transform: 'translateY(-50%)' }}
    >
      {/* Layer buttons */}
      <div style={{ ...PANEL_STYLE, borderRadius: '14px', padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {LAYERS.map(layer => (
          <button
            key={layer.id}
            onClick={() => setActiveLayer(layer.id)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-display font-600 transition-all duration-150"
            style={{
              background: activeLayer === layer.id ? 'rgba(49,130,206,0.12)' : 'transparent',
              border: activeLayer === layer.id ? '1px solid rgba(49,130,206,0.4)' : '1px solid transparent',
              color: activeLayer === layer.id ? '#2b6cb0' : '#4a5568',
              boxShadow: activeLayer === layer.id ? '0 1px 8px rgba(49,130,206,0.15)' : 'none',
              minWidth: '90px',
            }}
          >
            <span className="text-base">{layer.icon}</span>
            <span>{lang === 'en' ? layer.label : layer.labelNp}</span>
          </button>
        ))}
      </div>

      {/* Inline legend */}
      <div style={{ ...PANEL_STYLE, borderRadius: '12px', padding: '10px 12px' }} className="text-xs">
        {activeLayer === 'temperature' && (
          <>
            <div className="font-600 mb-2" style={{ color: '#2d3748' }}>Temperature</div>
            {[['≤0°C','#93c5fd'],['10°','#60a5fa'],['20°','#4ade80'],['30°','#facc15'],['38°+','#f87171']].map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                <span style={{ color: '#4a5568' }}>{label}</span>
              </div>
            ))}
          </>
        )}
        {activeLayer === 'precipitation' && (
          <>
            <div className="font-600 mb-2" style={{ color: '#2d3748' }}>Rainfall (mm)</div>
            {[['Dry','rgba(147,197,253,0.2)'],['1–2','rgba(59,130,246,0.4)'],['10','rgba(29,78,216,0.7)'],['50+','rgba(109,40,217,0.85)']].map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5 mb-1">
                <div className="w-3 h-3 rounded-full border" style={{ background: color, borderColor: 'rgba(0,0,0,0.1)' }} />
                <span style={{ color: '#4a5568' }}>{label}</span>
              </div>
            ))}
          </>
        )}
        {activeLayer === 'wind' && (
          <>
            <div className="font-600 mb-2" style={{ color: '#2d3748' }}>Wind (km/h)</div>
            {[['Calm','#1e6ee6'],['Moderate','#00d2be'],['Strong','#dcdc00'],['Severe','#ff6e00']].map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                <span style={{ color: '#4a5568' }}>{label}</span>
              </div>
            ))}
          </>
        )}
        {activeLayer === 'satellite' && (
          <div style={{ color: '#4a5568' }}>
            <div className="font-600 mb-2" style={{ color: '#2d3748' }}>Conditions</div>
            {['☀️ Clear', '⛅ Partly cloudy', '🌧️ Rain', '⛈️ Thunderstorm', '❄️ Snow'].map(s => (
              <div key={s} className="mb-1">{s}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
