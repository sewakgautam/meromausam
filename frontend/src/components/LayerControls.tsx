import { useStore } from '../stores/appStore';

const LAYERS = [
  { id: 'temperature', label: 'Temp', labelNp: 'तापक्रम', icon: '🌡️' },
  { id: 'precipitation', label: 'Rain', labelNp: 'वर्षा', icon: '🌧️' },
  { id: 'wind', label: 'Wind', labelNp: 'हावा', icon: '💨' },
  { id: 'satellite', label: 'Satellite', labelNp: 'उपग्रह', icon: '🛰️' },
] as const;

export default function LayerControls() {
  const { activeLayer, setActiveLayer, lang } = useStore();

  return (
    <div
      className="absolute z-[1000] flex flex-col gap-1.5"
      style={{ left: 16, top: '50%', transform: 'translateY(-50%)' }}
    >
      {LAYERS.map(layer => (
        <button
          key={layer.id}
          onClick={() => setActiveLayer(layer.id)}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-display font-600 transition-all duration-200 w-full"
          style={{
            background: activeLayer === layer.id
              ? 'rgba(49,130,206,0.35)'
              : 'rgba(13,33,55,0.75)',
            border: activeLayer === layer.id
              ? '1px solid rgba(144,205,244,0.5)'
              : '1px solid rgba(255,255,255,0.08)',
            color: activeLayer === layer.id ? '#90cdf4' : 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(12px)',
            boxShadow: activeLayer === layer.id
              ? '0 0 12px rgba(49,130,206,0.3)'
              : 'none',
          }}
        >
          <span className="text-base">{layer.icon}</span>
          <span>{lang === 'en' ? layer.label : layer.labelNp}</span>
        </button>
      ))}

      {/* Legend */}
      <div
        className="mt-2 p-3 rounded-xl text-xs"
        style={{
          background: 'rgba(13,33,55,0.75)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        {activeLayer === 'temperature' && (
          <div>
            <div className="font-600 mb-1.5 text-white/70">Temperature</div>
            {[['≤0°C', '#bee3f8'], ['10°', '#90cdf4'], ['20°', '#68d391'], ['30°', '#f6e05e'], ['38°+', '#fc8181']].map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}
        {activeLayer === 'precipitation' && (
          <div>
            <div className="font-600 mb-1.5 text-white/70">Rainfall (mm)</div>
            {[['Dry', 'rgba(144,205,244,0.1)'], ['1-2mm', 'rgba(99,179,237,0.4)'], ['10mm', 'rgba(49,130,206,0.6)'], ['20mm', 'rgba(44,82,130,0.8)'], ['50mm+', 'rgba(116,42,42,0.9)']].map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5 mb-1">
                <div className="w-3 h-3 rounded-full border border-white/20" style={{ background: color }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}
        {activeLayer === 'wind' && (
          <div>
            <div className="font-600 mb-1.5 text-white/70">Wind (km/h)</div>
            {[['Calm', 'hsl(240,70%,45%)'], ['Moderate', 'hsl(160,70%,45%)'], ['Strong', 'hsl(60,70%,45%)'], ['Severe', 'hsl(0,70%,45%)']].map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}
        {activeLayer === 'satellite' && (
          <div>
            <div className="font-600 mb-1.5 text-white/70">Conditions</div>
            <div className="space-y-1">
              <div>☀️ Clear</div>
              <div>⛅ Partly cloudy</div>
              <div>🌧️ Rain</div>
              <div>⛈️ Thunderstorm</div>
              <div>❄️ Snow</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
