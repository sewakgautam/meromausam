import { MapDistrict } from './api';

// Nepal bounds
const LAT1 = 26.2;
const LAT2 = 30.6;
const LON1 = 79.8;
const LON2 = 88.4;
const NX = 44;   // columns (~0.2° spacing)
const NY = 22;   // rows  (~0.2° spacing)
const DLON = (LON2 - LON1) / (NX - 1);
const DLAT = (LAT2 - LAT1) / (NY - 1);

export interface WindGrid {
  lat1: number; lat2: number; lon1: number; lon2: number;
  nx: number; ny: number; dlat: number; dlon: number;
  u: Float32Array;   // eastward, index = row * nx + col
  v: Float32Array;   // northward
  speed: Float32Array;
}

export interface TempGrid {
  lat1: number; lat2: number; lon1: number; lon2: number;
  nx: number; ny: number; dlat: number; dlon: number;
  values: Float32Array;
}

/** Inverse-Distance Weighting interpolation for a single scalar field */
function idw(points: { lat: number; lon: number; val: number }[], lat: number, lon: number, power = 2): number {
  let wsum = 0;
  let vsum = 0;
  for (const p of points) {
    const dLat = p.lat - lat;
    const dLon = (p.lon - lon) * Math.cos((lat * Math.PI) / 180);
    const d2 = dLat * dLat + dLon * dLon;
    if (d2 < 1e-10) return p.val; // exact hit
    const w = 1 / Math.pow(d2, power / 2);
    wsum += w;
    vsum += w * p.val;
  }
  return wsum > 0 ? vsum / wsum : 0;
}

/** Build a wind grid from district forecast points */
export function buildWindGrid(districts: MapDistrict[]): WindGrid {
  const pts = districts
    .filter(d => d.forecast?.windSpeed != null && d.forecast?.windDir != null)
    .map(d => {
      const speed = d.forecast!.windSpeed!;
      const dir = d.forecast!.windDir!;
      const rad = (dir * Math.PI) / 180;
      return {
        lat: d.lat,
        lon: d.lon,
        u: -speed * Math.sin(rad),   // eastward component
        v: -speed * Math.cos(rad),   // northward component
        speed,
      };
    });

  const uPts = pts.map(p => ({ lat: p.lat, lon: p.lon, val: p.u }));
  const vPts = pts.map(p => ({ lat: p.lat, lon: p.lon, val: p.v }));

  const u = new Float32Array(NX * NY);
  const v = new Float32Array(NX * NY);
  const speed = new Float32Array(NX * NY);

  if (pts.length === 0) return { lat1: LAT1, lat2: LAT2, lon1: LON1, lon2: LON2, nx: NX, ny: NY, dlat: DLAT, dlon: DLON, u, v, speed };

  for (let row = 0; row < NY; row++) {
    const lat = LAT1 + row * DLAT;
    for (let col = 0; col < NX; col++) {
      const lon = LON1 + col * DLON;
      const ui = idw(uPts, lat, lon);
      const vi = idw(vPts, lat, lon);
      const idx = row * NX + col;
      u[idx] = ui;
      v[idx] = vi;
      speed[idx] = Math.sqrt(ui * ui + vi * vi);
    }
  }

  return { lat1: LAT1, lat2: LAT2, lon1: LON1, lon2: LON2, nx: NX, ny: NY, dlat: DLAT, dlon: DLON, u, v, speed };
}

/** Bilinear interpolation inside the grid */
export function sampleWindGrid(grid: WindGrid, lat: number, lon: number): { u: number; v: number; speed: number } {
  const col = (lon - grid.lon1) / grid.dlon;
  const row = (lat - grid.lat1) / grid.dlat;

  const c0 = Math.max(0, Math.min(grid.nx - 2, Math.floor(col)));
  const r0 = Math.max(0, Math.min(grid.ny - 2, Math.floor(row)));
  const c1 = c0 + 1;
  const r1 = r0 + 1;

  const fc = col - c0;
  const fr = row - r0;

  function lerp2(arr: Float32Array): number {
    const i00 = r0 * grid.nx + c0;
    const i10 = r1 * grid.nx + c0;
    const i01 = r0 * grid.nx + c1;
    const i11 = r1 * grid.nx + c1;
    return (arr[i00] * (1 - fc) + arr[i01] * fc) * (1 - fr) +
           (arr[i10] * (1 - fc) + arr[i11] * fc) * fr;
  }

  const ui = lerp2(grid.u);
  const vi = lerp2(grid.v);
  return { u: ui, v: vi, speed: Math.sqrt(ui * ui + vi * vi) };
}

/** Build a scalar grid (temperature, precipitation, etc.) */
export function buildScalarGrid(
  districts: MapDistrict[],
  getValue: (d: MapDistrict) => number | null
): TempGrid {
  const pts = districts
    .filter(d => getValue(d) != null)
    .map(d => ({ lat: d.lat, lon: d.lon, val: getValue(d)! }));

  const values = new Float32Array(NX * NY);

  if (pts.length === 0) return { lat1: LAT1, lat2: LAT2, lon1: LON1, lon2: LON2, nx: NX, ny: NY, dlat: DLAT, dlon: DLON, values };

  for (let row = 0; row < NY; row++) {
    const lat = LAT1 + row * DLAT;
    for (let col = 0; col < NX; col++) {
      const lon = LON1 + col * DLON;
      values[row * NX + col] = idw(pts, lat, lon);
    }
  }

  return { lat1: LAT1, lat2: LAT2, lon1: LON1, lon2: LON2, nx: NX, ny: NY, dlat: DLAT, dlon: DLON, values };
}

/** Windy.com temperature color scale */
export function tempToWindyColor(temp: number): [number, number, number] {
  // Windy-style: deep blue → cyan → green → yellow → orange → red → magenta
  const stops: Array<[number, [number, number, number]]> = [
    [-20, [80, 0, 160]],
    [-10, [0, 0, 255]],
    [0,   [0, 120, 255]],
    [5,   [0, 200, 255]],
    [10,  [0, 255, 200]],
    [15,  [0, 255, 100]],
    [20,  [100, 255, 0]],
    [25,  [255, 220, 0]],
    [30,  [255, 140, 0]],
    [35,  [255, 60, 0]],
    [40,  [200, 0, 60]],
    [45,  [160, 0, 160]],
  ];

  if (temp <= stops[0][0]) return stops[0][1];
  if (temp >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];

  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    if (temp >= t0 && temp <= t1) {
      const f = (temp - t0) / (t1 - t0);
      return [
        Math.round(c0[0] + f * (c1[0] - c0[0])),
        Math.round(c0[1] + f * (c1[1] - c0[1])),
        Math.round(c0[2] + f * (c1[2] - c0[2])),
      ];
    }
  }
  return [128, 128, 128];
}

/** Windy.com precipitation color scale */
export function precipToWindyColor(mm: number): [number, number, number, number] {
  if (mm < 0.1) return [0, 0, 0, 0];         // transparent
  if (mm < 0.5) return [100, 180, 255, 60];
  if (mm < 2)   return [50, 120, 255, 120];
  if (mm < 5)   return [0, 80, 220, 160];
  if (mm < 10)  return [0, 40, 180, 190];
  if (mm < 20)  return [0, 0, 140, 210];
  if (mm < 50)  return [80, 0, 100, 230];
  return [180, 0, 60, 240];
}

/** Bilinear interpolation on a prebuilt scalar grid */
export function sampleScalarGrid(grid: TempGrid, lat: number, lon: number): number {
  const col = (lon - grid.lon1) / grid.dlon;
  const row = (lat - grid.lat1) / grid.dlat;
  const c0 = Math.max(0, Math.min(grid.nx - 2, Math.floor(col)));
  const r0 = Math.max(0, Math.min(grid.ny - 2, Math.floor(row)));
  const c1 = c0 + 1, r1 = r0 + 1;
  const fc = col - c0, fr = row - r0;
  const i00 = r0 * grid.nx + c0, i10 = r1 * grid.nx + c0;
  const i01 = r0 * grid.nx + c1, i11 = r1 * grid.nx + c1;
  return (
    (grid.values[i00] * (1 - fc) + grid.values[i01] * fc) * (1 - fr) +
    (grid.values[i10] * (1 - fc) + grid.values[i11] * fc) * fr
  );
}

/** Wind speed color — vivid scale optimised for visibility on a light basemap */
export function windSpeedColor(speed: number): [number, number, number] {
  const stops: Array<[number, [number, number, number]]> = [
    [0,   [30,  110, 230]],   // strong blue
    [5,   [0,   170, 255]],   // sky blue
    [10,  [0,   210, 190]],   // cyan-teal
    [20,  [30,  190,  50]],   // green
    [30,  [220, 200,   0]],   // yellow
    [50,  [255, 110,   0]],   // orange
    [80,  [220,   0,   0]],   // red
  ];

  if (speed <= 0) return stops[0][1];
  if (speed >= 80) return stops[stops.length - 1][1];

  for (let i = 0; i < stops.length - 1; i++) {
    const [s0, c0] = stops[i];
    const [s1, c1] = stops[i + 1];
    if (speed >= s0 && speed <= s1) {
      const f = (speed - s0) / (s1 - s0);
      return [
        Math.round(c0[0] + f * (c1[0] - c0[0])),
        Math.round(c0[1] + f * (c1[1] - c0[1])),
        Math.round(c0[2] + f * (c1[2] - c0[2])),
      ];
    }
  }
  return [128, 128, 128];
}
