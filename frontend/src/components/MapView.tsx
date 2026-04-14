import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { useStore } from '../stores/appStore';
import { api, MapDistrict } from '../utils/api';
import { tempColor, precipColor, weatherEmoji, severityColor } from '../utils/weather';

// Nepal bounds
const NEPAL_BOUNDS: L.LatLngBoundsExpression = [[26.3, 80.0], [30.5, 88.2]];
const NEPAL_CENTER: L.LatLngExpression = [28.3949, 84.124];

function createDistrictIcon(district: MapDistrict, layer: string): L.DivIcon {
  const fc = district.forecast;
  let bg = 'rgba(13,33,55,0.85)';
  let borderColor = 'rgba(144,205,244,0.3)';
  let label = '';
  let sublabel = '';

  if (fc) {
    if (layer === 'temperature') {
      const t = fc.tempMax ?? 20;
      bg = tempColor(t);
      label = `${t.toFixed(0)}°`;
      sublabel = weatherEmoji(fc.weatherCode);
      borderColor = tempColor(t);
    } else if (layer === 'precipitation') {
      const p = fc.precipitation ?? 0;
      bg = precipColor(p);
      label = p > 0.5 ? `${p.toFixed(0)}` : '—';
      sublabel = p > 0.5 ? 'mm' : weatherEmoji(fc.weatherCode);
      borderColor = p > 10 ? '#4299e1' : 'rgba(144,205,244,0.3)';
    } else if (layer === 'wind') {
      const w = fc.windSpeed ?? 0;
      const hue = Math.min(240, Math.round((w / 80) * 240));
      bg = `hsl(${hue},70%,45%)`;
      label = `${w.toFixed(0)}`;
      sublabel = 'km/h';
      borderColor = bg;
    } else {
      label = weatherEmoji(fc.weatherCode);
      sublabel = `${fc.tempMax?.toFixed(0) ?? '—'}°`;
    }

    if (fc.severity === 'extreme' || fc.severity === 'warning') {
      borderColor = severityColor(fc.severity);
    }
  }

  const size = 44;
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="
        width:${size}px;height:${size}px;
        background:${layer === 'temperature' && fc ? `${bg}22` : 'rgba(13,33,55,0.88)'};
        border:1.5px solid ${borderColor};
        border-radius:50%;
        display:flex;flex-direction:column;
        align-items:center;justify-content:center;
        cursor:pointer;
        transition:all 0.2s;
        box-shadow:0 4px 16px rgba(0,0,0,0.4),0 0 0 0 ${borderColor};
        ${fc?.severity === 'extreme' ? 'animation:pulse-glow 2s infinite;' : ''}
      ">
        <div style="font-size:${layer === 'satellite' ? '18px' : '13px'};font-weight:700;color:${layer === 'temperature' && fc ? tempColor(fc.tempMax) : '#e2e8f0'};line-height:1.1;font-family:Sora,sans-serif">${label}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.5);line-height:1">${sublabel}</div>
      </div>
    `,
  });
}

function buildPopupHTML(district: MapDistrict, lang: string): string {
  const fc = district.forecast;
  const name = lang === 'np' ? district.nameNepali : district.name;
  const emoji = fc ? weatherEmoji(fc.weatherCode) : '🌤️';
  const desc = fc ? (lang === 'np' ? fc.weatherDescNp : fc.weatherDesc) || '' : 'No data';
  const severeFlags = fc ? [
    fc.isThunderstorm && (lang === 'np' ? '⚡ बज्रपात' : '⚡ Thunderstorm'),
    fc.isHeavyRain && (lang === 'np' ? '🌧️ भारी वर्षा' : '🌧️ Heavy Rain'),
    fc.isHailstone && (lang === 'np' ? '🌨️ असिना' : '🌨️ Hailstone'),
    fc.isSnow && (lang === 'np' ? '❄️ हिमपात' : '❄️ Snowfall'),
    fc.isHeatwave && (lang === 'np' ? '🌡️ तापलहर' : '🌡️ Heat Wave'),
  ].filter(Boolean) : [];

  return `
    <div style="padding:16px;min-width:220px;font-family:DM Sans,sans-serif">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <span style="font-size:32px">${emoji}</span>
        <div>
          <div style="font-family:Sora,sans-serif;font-weight:700;font-size:16px;color:#e2e8f0">${name}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.45)">${district.province} · ${district.elevation}m</div>
        </div>
      </div>
      ${fc ? `
        <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-bottom:10px">${desc}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
          <div style="background:rgba(255,255,255,0.06);border-radius:8px;padding:8px;text-align:center">
            <div style="font-size:22px;font-weight:700;color:${tempColor(fc.tempMax)};font-family:Sora">${fc.tempMax?.toFixed(1) ?? '—'}°C</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.4)">MAX</div>
          </div>
          <div style="background:rgba(255,255,255,0.06);border-radius:8px;padding:8px;text-align:center">
            <div style="font-size:22px;font-weight:700;color:#90cdf4;font-family:Sora">${fc.tempMin?.toFixed(1) ?? '—'}°C</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.4)">MIN</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:${severeFlags.length ? '10px' : '0'}">
          <div style="text-align:center">
            <div style="font-size:13px;font-weight:600;color:#90cdf4">${fc.precipitation?.toFixed(1) ?? '0'}mm</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.4)">Rain</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:13px;font-weight:600;color:#e2e8f0">${fc.windSpeed?.toFixed(0) ?? '—'}km/h</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.4)">Wind</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:13px;font-weight:600;color:#e2e8f0">${fc.precipProb?.toFixed(0) ?? '—'}%</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.4)">Rain %</div>
          </div>
        </div>
        ${severeFlags.length ? `
          <div style="background:rgba(197,48,48,0.15);border:1px solid rgba(252,129,129,0.3);border-radius:8px;padding:8px;margin-bottom:0">
            ${severeFlags.map(f => `<div style="font-size:12px;color:#fc8181;margin:2px 0">${f}</div>`).join('')}
          </div>
        ` : ''}
      ` : `<div style="color:rgba(255,255,255,0.4);font-size:13px">Forecast loading...</div>`}
    </div>
  `;
}

export default function MapView() {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { mapData, activeLayer, lang, setSelectedDistrict, setDistrictForecast, setSidebarTab } = useStore();

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: NEPAL_CENTER,
      zoom: 7,
      minZoom: 6,
      maxZoom: 12,
      zoomControl: false,
      attributionControl: true,
      maxBounds: [[23, 77], [33, 92]],
      maxBoundsViscosity: 0.8,
    });

    // Dark base tile — OpenStreetMap with dark filter (free)
    const tile = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    });
    tile.addTo(map);
    tileLayerRef.current = tile;

    // Add zoom control bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    map.fitBounds(NEPAL_BOUNDS, { padding: [40, 40] });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const handleDistrictClick = useCallback(async (district: MapDistrict) => {
    setSelectedDistrict(district);
    setSidebarTab('forecast');
    try {
      const forecast = await api.getForecast(district.id, 7);
      setDistrictForecast(forecast);
    } catch (e) {
      setDistrictForecast([]);
    }
  }, [setSelectedDistrict, setDistrictForecast, setSidebarTab]);

  // Update markers when data/layer changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapData.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    mapData.forEach(district => {
      const icon = createDistrictIcon(district, activeLayer);
      const marker = L.marker([district.lat, district.lon], { icon });

      marker.bindPopup(() => buildPopupHTML(district, lang), {
        maxWidth: 280,
        className: 'meromausam-popup',
      });

      marker.on('click', () => {
        handleDistrictClick(district);
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });
  }, [mapData, activeLayer, lang, handleDistrictClick]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ zIndex: 1 }}
    />
  );
}
