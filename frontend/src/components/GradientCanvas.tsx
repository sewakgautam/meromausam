import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapDistrict } from '../utils/api';
import {
  buildScalarGrid, sampleScalarGrid,
  tempToWindyColor, precipToWindyColor,
} from '../utils/windGrid';

// Nepal bounding box for the image overlay
const NEPAL_BOUNDS: L.LatLngBoundsExpression = [[26.2, 79.8], [30.6, 88.4]];

// Offscreen canvas resolution — higher = sharper gradient, slower CPU
const RENDER_W = 440;
const RENDER_H = 220;

const LAT1 = 26.2, LAT2 = 30.6;
const LON1 = 79.8, LON2 = 88.4;

interface Props {
  map: L.Map | null;
  districts: MapDistrict[];
  layer: 'temperature' | 'precipitation' | 'wind' | 'satellite';
  visible: boolean;
}

function buildDataUrl(
  districts: MapDistrict[],
  layer: 'temperature' | 'precipitation',
): string | null {
  const grid = layer === 'temperature'
    ? buildScalarGrid(districts, d => d.forecast?.tempMax ?? null)
    : buildScalarGrid(districts, d => d.forecast?.precipitation ?? null);

  const canvas = document.createElement('canvas');
  canvas.width  = RENDER_W;
  canvas.height = RENDER_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const imageData = new ImageData(RENDER_W, RENDER_H);
  const data = imageData.data;
  let hasPixels = false;

  for (let py = 0; py < RENDER_H; py++) {
    // Top of canvas = LAT2 (north), bottom = LAT1 (south)
    const lat = LAT2 - (py / RENDER_H) * (LAT2 - LAT1);
    for (let px = 0; px < RENDER_W; px++) {
      const lon = LON1 + (px / RENDER_W) * (LON2 - LON1);
      const val = sampleScalarGrid(grid, lat, lon);
      const idx = (py * RENDER_W + px) * 4;

      if (layer === 'temperature') {
        const [r, g, b] = tempToWindyColor(val);
        data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = 150;
        hasPixels = true;
      } else {
        if (val < 0.1) continue;
        const [r, g, b, a] = precipToWindyColor(val);
        data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = a;
        hasPixels = true;
      }
    }
  }

  if (!hasPixels) return null;
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

export default function GradientCanvas({ map, districts, layer, visible }: Props) {
  const overlayRef = useRef<L.ImageOverlay | null>(null);

  useEffect(() => {
    if (!map || !visible || (layer !== 'temperature' && layer !== 'precipitation')) {
      if (overlayRef.current) {
        overlayRef.current.remove();
        overlayRef.current = null;
      }
      return;
    }

    if (districts.length === 0) return;

    const dataUrl = buildDataUrl(districts, layer as 'temperature' | 'precipitation');
    if (!dataUrl) return;

    if (overlayRef.current) {
      overlayRef.current.setUrl(dataUrl);
    } else {
      overlayRef.current = L.imageOverlay(dataUrl, NEPAL_BOUNDS, {
        opacity: 0.72,
        interactive: false,
        // Render above base tiles but below markers
        pane: 'overlayPane',
      }).addTo(map);
    }

    return () => {
      if (overlayRef.current) {
        overlayRef.current.remove();
        overlayRef.current = null;
      }
    };
  }, [map, visible, layer, districts]);

  // Nothing to render in the React tree — Leaflet owns the overlay
  return null;
}
