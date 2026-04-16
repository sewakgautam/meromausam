import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { WindGrid, sampleWindGrid, windSpeedColor } from '../utils/windGrid';

// Nepal hard bounds — particles that drift outside get reset
const NEPAL_LAT1 = 25.5, NEPAL_LAT2 = 31.0;
const NEPAL_LON1 = 79.0, NEPAL_LON2 = 89.0;

const MAX_AGE = 100;
const SPEED_SCALE = 0.12;

/** Particle count scales with zoom — more detail when zoomed in */
function particleCount(zoom: number): number {
  if (zoom <= 7)  return 3500;
  if (zoom <= 8)  return 4500;
  if (zoom <= 9)  return 5500;
  if (zoom <= 10) return 6500;
  if (zoom <= 11) return 7500;
  if (zoom <= 12) return 8500;
  if (zoom <= 13) return 9500;
  if (zoom <= 14) return 11000;
  if (zoom <= 15) return 13000;
  return 15000;
}

/** Line width grows a little when zoomed in for a finer/richer look */
function lineWidth(zoom: number, speed: number): number {
  const base = zoom >= 13 ? 1.8 : zoom >= 10 ? 1.6 : 1.3;
  return speed > 30 ? base + 0.4 : base;
}

interface Particle {
  lat: number;
  lon: number;
  age: number;
  maxAge: number;
}

interface Props {
  map: L.Map | null;
  windGrid: WindGrid | null;
  visible: boolean;
  opacity?: number;
  densityMultiplier?: number;   // 0–2, default 1
}

export default function WindCanvas({ map, windGrid, visible, opacity = 1, densityMultiplier = 1 }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const ptRef      = useRef<Particle[]>([]);
  const rafRef     = useRef<number>(0);

  /** Spawn a single particle inside the current viewport (clipped to Nepal) */
  const randomInView = useCallback((): [number, number] => {
    if (!map) return [28.0 + Math.random() * 2, 83.0 + Math.random() * 3];
    const b = map.getBounds();
    const s  = Math.max(b.getSouth(), NEPAL_LAT1);
    const n  = Math.min(b.getNorth(), NEPAL_LAT2);
    const w  = Math.max(b.getWest(),  NEPAL_LON1);
    const e  = Math.min(b.getEast(),  NEPAL_LON2);
    // If bounds are outside Nepal entirely, fall back to center Nepal
    if (s >= n || w >= e) return [27.7 + Math.random() * 2, 83.0 + Math.random() * 3];
    return [s + Math.random() * (n - s), w + Math.random() * (e - w)];
  }, [map]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = map?.getContainer();
    if (!canvas || !container) return;
    const { width, height } = container.getBoundingClientRect();
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width  = width;
      canvas.height = height;
    }
  }, [map]);

  /** (Re)initialize the particle pool for current zoom */
  const initParticles = useCallback(() => {
    if (!map) return;
    const count = Math.round(particleCount(map.getZoom()) * densityMultiplier);
    ptRef.current = Array.from({ length: count }, () => {
      const [lat, lon] = randomInView();
      return {
        lat, lon,
        age:    Math.floor(Math.random() * MAX_AGE),
        maxAge: MAX_AGE * (0.6 + Math.random() * 0.4),
      };
    });
  }, [map, randomInView]);

  useEffect(() => {
    if (!map || !visible || !windGrid) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    initParticles();

    // Reinit particles on zoom/pan so they stay in the visible area
    const onZoom = () => initParticles();
    const onMove = () => {
      // On pan, 30 % of particles have drifted out — softly refresh them
      const pts = ptRef.current;
      const b   = map.getBounds();
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (!b.contains([p.lat, p.lon])) {
          const [lat, lon] = randomInView();
          pts[i] = { lat, lon, age: 0, maxAge: MAX_AGE * (0.6 + Math.random() * 0.4) };
        }
      }
    };
    map.on('zoomend', onZoom);
    map.on('moveend', onMove);

    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;
    let lastTime = 0;

    function draw(now: number) {
      const dt = Math.min((now - lastTime) / 16.67, 3);
      lastTime = now;

      resizeCanvas();

      // Fade trail
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = 'rgba(0,0,0,0.93)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';

      const zoom = map.getZoom();
      const scale = SPEED_SCALE / Math.pow(2, zoom - 7);
      const pts  = ptRef.current;

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.age++;

        if (p.age > p.maxAge) {
          const [lat, lon] = randomInView();
          pts[i] = { lat, lon, age: 0, maxAge: MAX_AGE * (0.6 + Math.random() * 0.4) };
          continue;
        }

        const wind = sampleWindGrid(windGrid, p.lat, p.lon);
        if (wind.speed < 0.3) continue;

        const newLat = p.lat + wind.v * dt * scale * 0.01;
        const newLon = p.lon + wind.u * dt * scale * 0.01;

        // Reset if drifted outside extended Nepal box
        if (newLat < NEPAL_LAT1 || newLat > NEPAL_LAT2 ||
            newLon < NEPAL_LON1 || newLon > NEPAL_LON2) {
          const [lat, lon] = randomInView();
          pts[i] = { lat, lon, age: 0, maxAge: MAX_AGE * (0.6 + Math.random() * 0.4) };
          continue;
        }

        const p0 = map.latLngToContainerPoint([p.lat,   p.lon  ]);
        const p1 = map.latLngToContainerPoint([newLat,  newLon ]);

        p.lat = newLat;
        p.lon = newLon;

        const ageFrac = p.age / p.maxAge;
        const alpha   = ageFrac < 0.1  ? ageFrac / 0.1
                      : ageFrac > 0.85 ? (1 - ageFrac) / 0.15
                      : 1;
        if (alpha <= 0) continue;

        const [r, g, b] = windSpeedColor(wind.speed);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = `rgba(${r},${g},${b},${(alpha * 0.9).toFixed(2)})`;
        ctx.lineWidth   = lineWidth(zoom, wind.speed);
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      map.off('zoomend', onZoom);
      map.off('moveend', onMove);
    };
  }, [map, windGrid, visible, densityMultiplier, initParticles, resizeCanvas, randomInView]);

  // Clear canvas when hidden
  useEffect(() => {
    if (!visible) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [visible]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 400,
        opacity: visible ? opacity : 0,
        transition: 'opacity 0.4s',
      }}
    />
  );
}
