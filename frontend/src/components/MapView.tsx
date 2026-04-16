import { useEffect, useRef, useCallback, useState } from 'react';
import L from 'leaflet';
import { useStore } from '../stores/appStore';
import { api, MapDistrict } from '../utils/api';
import { weatherEmoji, tempColor } from '../utils/weather';
import { buildWindGrid, WindGrid } from '../utils/windGrid';
import WindCanvas from './WindCanvas';
import GradientCanvas from './GradientCanvas';

const NEPAL_BOUNDS: L.LatLngBoundsExpression = [[26.3, 80.0], [30.5, 88.2]];
const NEPAL_CENTER: L.LatLngExpression = [28.3949, 84.124];

function buildPopupHTML(district: MapDistrict, lang: string): string {
  const fc = district.forecast;
  const name = lang === 'np' ? district.nameNepali : district.name;
  const emoji = fc ? weatherEmoji(fc.weatherCode) : '🌤️';
  const desc = fc ? (lang === 'np' ? fc.weatherDescNp : fc.weatherDesc) || '' : 'No data';

  const severeFlags = fc ? [
    fc.isThunderstorm && (lang === 'np' ? '⚡ बज्रपात' : '⚡ Thunderstorm'),
    fc.isHeavyRain    && (lang === 'np' ? '🌧️ भारी वर्षा' : '🌧️ Heavy Rain'),
    fc.isHailstone    && (lang === 'np' ? '🌨️ असिना' : '🌨️ Hailstone'),
    fc.isSnow         && (lang === 'np' ? '❄️ हिमपात' : '❄️ Snowfall'),
    fc.isHeatwave     && (lang === 'np' ? '🌡️ तापलहर' : '🌡️ Heat Wave'),
  ].filter(Boolean) : [];

  return `
    <div style="padding:16px;min-width:220px;font-family:DM Sans,sans-serif;background:#fff;border-radius:12px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <span style="font-size:32px">${emoji}</span>
        <div>
          <div style="font-family:Sora,sans-serif;font-weight:700;font-size:16px;color:#1a365d">${name}</div>
          <div style="font-size:12px;color:#718096">${district.province} · ${district.elevation}m</div>
        </div>
      </div>
      ${fc ? `
        <div style="font-size:13px;color:#4a5568;margin-bottom:10px">${desc}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
          <div style="background:#fff5f0;border-radius:8px;padding:8px;text-align:center">
            <div style="font-size:22px;font-weight:700;color:${tempColor(fc.tempMax)};font-family:Sora">${fc.tempMax?.toFixed(1) ?? '—'}°C</div>
            <div style="font-size:10px;color:#a0aec0">MAX</div>
          </div>
          <div style="background:#ebf8ff;border-radius:8px;padding:8px;text-align:center">
            <div style="font-size:22px;font-weight:700;color:#2b6cb0;font-family:Sora">${fc.tempMin?.toFixed(1) ?? '—'}°C</div>
            <div style="font-size:10px;color:#a0aec0">MIN</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:${severeFlags.length ? '10px' : '0'}">
          <div style="text-align:center">
            <div style="font-size:13px;font-weight:600;color:#3182ce">${fc.precipitation?.toFixed(1) ?? '0'}mm</div>
            <div style="font-size:10px;color:#a0aec0">Rain</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:13px;font-weight:600;color:#2d3748">${fc.windSpeed?.toFixed(0) ?? '—'}km/h</div>
            <div style="font-size:10px;color:#a0aec0">Wind</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:13px;font-weight:600;color:#2d3748">${fc.precipProb?.toFixed(0) ?? '—'}%</div>
            <div style="font-size:10px;color:#a0aec0">Rain%</div>
          </div>
        </div>
        ${severeFlags.length ? `
          <div style="background:#fff5f5;border:1px solid #fed7d7;border-radius:8px;padding:8px">
            ${severeFlags.map(f => `<div style="font-size:12px;color:#c53030;margin:2px 0">${f}</div>`).join('')}
          </div>
        ` : ''}
      ` : `<div style="color:#a0aec0;font-size:13px">Forecast loading...</div>`}
    </div>
  `;
}

export default function MapView() {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const lightBasemapRef = useRef<L.TileLayer | null>(null);
  const satBasemapRef = useRef<L.TileLayer | null>(null);
  const [leafletMap, setLeafletMap] = useState<L.Map | null>(null);
  const [windGrid, setWindGrid] = useState<WindGrid | null>(null);

  const { mapData, activeLayer, lang, satelliteBase, toggleSatelliteBase, particleDensity, setParticleDensity, setSelectedDistrict, setDistrictForecast, setSidebarTab } = useStore();

  // Build wind grid whenever mapData changes
  useEffect(() => {
    if (mapData.length > 0) {
      setWindGrid(buildWindGrid(mapData));
    }
  }, [mapData]);

  // Swap basemap when satellite layer or satelliteBase toggle changes
  useEffect(() => {
    const map = mapRef.current;
    const light = lightBasemapRef.current;
    const sat = satBasemapRef.current;
    if (!map || !light || !sat) return;

    const useSat = activeLayer === 'satellite' || satelliteBase;
    if (useSat) {
      if (map.hasLayer(light)) map.removeLayer(light);
      if (!map.hasLayer(sat)) sat.addTo(map);
    } else {
      if (map.hasLayer(sat)) map.removeLayer(sat);
      if (!map.hasLayer(light)) light.addTo(map);
    }
  }, [activeLayer, satelliteBase]);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: NEPAL_CENTER,
      zoom: 7,
      minZoom: 6,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: true,
      maxBounds: [[22, 76], [34, 93]],
      maxBoundsViscosity: 0.6,
    });

    // Light CartoCDN basemap (default)
    const lightLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    });
    lightLayer.addTo(map);
    lightBasemapRef.current = lightLayer;

    // Esri World Imagery (satellite basemap — no API key required)
    const satLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '© Esri, Maxar, Earthstar Geographics',
        maxZoom: 19,
      }
    );
    satBasemapRef.current = satLayer;

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    map.fitBounds(NEPAL_BOUNDS, { padding: [40, 40] });

    mapRef.current = map;
    setLeafletMap(map);

    return () => {
      map.remove();
      mapRef.current = null;
      setLeafletMap(null);
    };
  }, []);

  const handleDistrictClick = useCallback(async (district: MapDistrict) => {
    setSelectedDistrict(district);
    setSidebarTab('forecast');
    try {
      const forecast = await api.getForecast(district.id, 7);
      setDistrictForecast(forecast);
    } catch {
      setDistrictForecast([]);
    }
  }, [setSelectedDistrict, setDistrictForecast, setSidebarTab]);

  // Update district dot markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapData.length === 0) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    mapData.forEach(district => {
      const fc = district.forecast;

      // Small dot marker — let the canvas layers carry visual weight
      const size = 22;
      const icon = L.divIcon({
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        html: `<div style="
          width:${size}px;height:${size}px;
          background:rgba(255,255,255,0.92);
          border:1.5px solid rgba(49,130,206,0.55);
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          cursor:pointer;
          box-shadow:0 1px 6px rgba(0,0,0,0.18);
        ">${fc ? `<span style="color:#2b6cb0;font-size:9px;font-weight:700;font-family:Sora">${fc.tempMax?.toFixed(0) ?? ''}°</span>` : ''}</div>`,
      });

      const marker = L.marker([district.lat, district.lon], { icon });
      marker.bindPopup(() => buildPopupHTML(district, lang), {
        maxWidth: 280,
        className: 'meromausam-popup',
      });
      marker.on('click', () => handleDistrictClick(district));
      marker.addTo(map);
      markersRef.current.push(marker);
    });
  }, [mapData, lang, handleDistrictClick]);

  return (
    <div className="absolute inset-0" style={{ zIndex: 1 }}>
      {/* Leaflet base map */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Satellite basemap toggle — shown on weather layers, above zoom control */}
      {activeLayer !== 'satellite' && (
        <button
          onClick={toggleSatelliteBase}
          title={satelliteBase ? 'Switch to map view' : 'Switch to satellite view'}
          style={{
            position: 'absolute',
            bottom: 100,
            right: 10,
            zIndex: 1000,
            width: 30,
            height: 30,
            borderRadius: 4,
            border: satelliteBase
              ? '2px solid #3182ce'
              : '2px solid rgba(0,0,0,0.3)',
            background: satelliteBase ? '#ebf8ff' : 'white',
            boxShadow: '0 1px 5px rgba(0,0,0,0.35)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            transition: 'all 0.15s',
          }}
        >
          🛰️
        </button>
      )}

      {/* Smooth gradient overlay (temperature / precipitation) */}
      <GradientCanvas
        map={leafletMap}
        districts={mapData}
        layer={activeLayer}
        visible={activeLayer === 'temperature' || activeLayer === 'precipitation'}
      />

      {/* Animated wind particle canvas — always on, full opacity on wind layer */}
      <WindCanvas
        map={leafletMap}
        windGrid={windGrid}
        visible={activeLayer !== 'satellite'}
        opacity={activeLayer === 'wind' ? 1 : 0.35}
        densityMultiplier={particleDensity}
      />

      {/* Particle density slider — shown when wind particles are visible */}
      {activeLayer !== 'satellite' && (
        <div
          style={{
            position: 'absolute',
            bottom: 140,
            right: 10,
            zIndex: 1000,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0,0,0,0.12)',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            padding: '8px 10px',
            width: 148,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#2d3748', letterSpacing: '0.03em' }}>
              💨 Particles
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#3182ce', minWidth: 28, textAlign: 'right' }}>
              {Math.round(particleDensity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={particleDensity}
            onChange={e => setParticleDensity(Number(e.target.value))}
            style={{
              width: '100%',
              height: 4,
              accentColor: '#3182ce',
              cursor: 'pointer',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
            <span style={{ fontSize: 9, color: '#a0aec0' }}>Off</span>
            <span style={{ fontSize: 9, color: '#a0aec0' }}>Max</span>
          </div>
        </div>
      )}
    </div>
  );
}
