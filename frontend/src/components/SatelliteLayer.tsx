import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

type Band = 'viirs_day' | 'viirs_noaa' | 'falsecolor';

// GIBS WMTS — using VIIRS products (Suomi-NPP / NOAA-20) which are operational
// through the mid-2020s. MODIS Terra (1999) may be end-of-life by 2026.
// GIBS typically lags 1-2 days; 2 days ago is safe.
function gibsDate() {
  const d = new Date();
  d.setDate(d.getDate() - 2);
  return d.toISOString().slice(0, 10);
}

const DATE = gibsDate();

// WMTS URL pattern for GIBS: .../Layer/default/Date/GoogleMapsCompatible/{z}/{y}/{x}.jpg
// {z} = TileMatrix, {y} = TileRow, {x} = TileCol
function gibsUrl(layer: string, ext = 'jpg') {
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${DATE}/GoogleMapsCompatible/{z}/{y}/{x}.${ext}`;
}

const BANDS: Record<Band, { label: string; icon: string; note: string; url: string }> = {
  viirs_day: {
    label: 'VIIRS Day',
    icon: '🌍',
    note: `VIIRS Suomi-NPP · ${DATE}`,
    // Suomi-NPP VIIRS True Color — launched 2011, operational through 2020s
    url: gibsUrl('VIIRS_SNPP_CorrectedReflectance_TrueColor'),
  },
  viirs_noaa: {
    label: 'VIIRS NOAA-20',
    icon: '🌊',
    note: `VIIRS NOAA-20 · ${DATE}`,
    // NOAA-20 VIIRS True Color — launched 2017, newer instrument
    url: gibsUrl('VIIRS_NOAA20_CorrectedReflectance_TrueColor'),
  },
  falsecolor: {
    label: 'False Color',
    icon: '🔥',
    note: `VIIRS Bands M11-I2-I1 · ${DATE}`,
    // VIIRS false color: highlights burn scars (red), snow (cyan), veg (green)
    url: gibsUrl('VIIRS_SNPP_CorrectedReflectance_BandsM11-I2-I1'),
  },
};

interface Props {
  map: L.Map | null;
  visible: boolean;
}

export default function SatelliteLayer({ map, visible }: Props) {
  const [band, setBand] = useState<Band>('viirs_day');
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const layerRef = useRef<L.TileLayer | null>(null);

  // Create a dedicated pane above the basemap once, on mount
  useEffect(() => {
    if (!map) return;
    if (!map.getPane('satellitePane')) {
      const pane = map.createPane('satellitePane');
      pane.style.zIndex = '350'; // above tilePane (200) and shadowPane (500>overlayPane)
      pane.style.pointerEvents = 'none';
    }
  }, [map]);

  useEffect(() => {
    if (!map) return;

    if (!visible) {
      if (layerRef.current) {
        layerRef.current.remove();
        layerRef.current = null;
      }
      return;
    }

    if (layerRef.current) {
      layerRef.current.remove();
      layerRef.current = null;
    }

    setTilesLoaded(false);
    const cfg = BANDS[band];

    const layer = L.tileLayer(cfg.url, {
      maxNativeZoom: 8,
      maxZoom: 13,
      opacity: 1.0,
      attribution: '© NASA GIBS / VIIRS',
      pane: 'satellitePane',
      crossOrigin: '',
    });

    const onLoad    = () => setTilesLoaded(true);
    const onLoading = () => setTilesLoaded(false);
    layer.on('load', onLoad);
    layer.on('loading', onLoading);

    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      layer.off('load', onLoad);
      layer.off('loading', onLoading);
      layer.remove();
      layerRef.current = null;
    };
  }, [map, visible, band]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 60,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1001,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: 'rgba(10,22,40,0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(144,205,244,0.2)',
        borderRadius: '12px',
        padding: '5px 8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        fontSize: '11px', fontWeight: 700, color: '#90cdf4',
        paddingRight: '8px', borderRight: '1px solid rgba(144,205,244,0.15)',
        marginRight: '2px',
      }}>
        🛰️ NASA GIBS
      </span>

      {(Object.entries(BANDS) as [Band, typeof BANDS[Band]][]).map(([key, cfg]) => (
        <button
          key={key}
          onClick={() => setBand(key)}
          style={{
            padding: '5px 12px',
            borderRadius: '8px',
            border: band === key ? '1px solid rgba(144,205,244,0.4)' : '1px solid transparent',
            background: band === key ? 'rgba(49,130,206,0.25)' : 'transparent',
            color: band === key ? '#90cdf4' : 'rgba(255,255,255,0.5)',
            fontSize: '12px',
            fontWeight: band === key ? 700 : 500,
            cursor: 'pointer',
            transition: 'all 0.12s',
          }}
        >
          {cfg.icon} {cfg.label}
        </button>
      ))}

      <span style={{
        fontSize: '10px', color: 'rgba(144,205,244,0.5)',
        paddingLeft: '8px', borderLeft: '1px solid rgba(144,205,244,0.15)',
        marginLeft: '2px',
      }}>
        {tilesLoaded ? BANDS[band].note : '⏳ Loading…'}
      </span>
    </div>
  );
}
