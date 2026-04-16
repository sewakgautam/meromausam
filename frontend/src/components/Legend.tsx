import { useStore } from '../stores/appStore';

const TEMP_STOPS = [
  { val: -10, color: '#0000ff', label: '-10°' },
  { val: 0,   color: '#0078ff', label: '0°' },
  { val: 10,  color: '#00ffff', label: '10°' },
  { val: 15,  color: '#00ff80', label: '15°' },
  { val: 20,  color: '#80ff00', label: '20°' },
  { val: 25,  color: '#ffee00', label: '25°' },
  { val: 30,  color: '#ff8800', label: '30°' },
  { val: 35,  color: '#ff3000', label: '35°' },
  { val: 40,  color: '#c8003c', label: '40°' },
];

const PRECIP_STOPS = [
  { val: 0,   color: 'rgba(0,0,0,0)',        label: '0' },
  { val: 1,   color: 'rgba(100,180,255,0.6)', label: '1mm' },
  { val: 5,   color: 'rgba(0,80,220,0.8)',    label: '5' },
  { val: 20,  color: 'rgba(0,0,140,0.9)',     label: '20' },
  { val: 50,  color: 'rgba(80,0,100,0.95)',   label: '50+' },
];

const WIND_STOPS = [
  { val: 0,  color: '#143878', label: '0' },
  { val: 10, color: '#1e64c8', label: '10' },
  { val: 20, color: '#3ca0ff', label: '20' },
  { val: 30, color: '#b4f0ff', label: '30' },
  { val: 50, color: '#ffffc8', label: '50' },
  { val: 80, color: '#ff5000', label: '80 km/h' },
];

export default function Legend() {
  const { activeLayer } = useStore();

  let stops = TEMP_STOPS;
  let unit = '°C';
  let title = 'Temperature';

  if (activeLayer === 'precipitation') {
    stops = PRECIP_STOPS as typeof TEMP_STOPS;
    unit = 'mm';
    title = 'Precipitation';
  } else if (activeLayer === 'wind') {
    stops = WIND_STOPS as typeof TEMP_STOPS;
    unit = 'km/h';
    title = 'Wind Speed';
  } else if (activeLayer === 'satellite') {
    return null;
  }

  const gradient = stops.map(s => s.color).join(', ');

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '68px',
        right: '16px',
        zIndex: 1001,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: '10px',
        padding: '10px 12px',
        width: '160px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
      }}
    >
      <div style={{ fontSize: '10px', color: '#718096', marginBottom: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {title}
      </div>
      <div
        style={{
          height: '10px',
          borderRadius: '5px',
          background: `linear-gradient(to right, ${gradient})`,
          marginBottom: '4px',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {[stops[0], stops[Math.floor(stops.length / 2)], stops[stops.length - 1]].map((s, i) => (
          <span key={i} style={{ fontSize: '10px', color: '#a0aec0' }}>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
