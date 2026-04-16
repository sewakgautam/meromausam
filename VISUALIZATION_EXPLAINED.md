# MeroMausam — Visualization Technical Reference

How every weather layer is built, colored, and animated — from raw API numbers to pixels on screen.

---

## 1. Data Flow (top to bottom)

```
Open-Meteo / DHM API
        ↓
  backend ingest (NestJS)
        ↓
  PostgreSQL  (Forecast rows per district per day)
        ↓
  GET /api/weather/forecast-matrix   →  77 districts × 7 days
        ↓
  frontend store (Zustand) — allDaysData[dayIndex][districtIndex]
        ↓
  windGrid.ts  →  IDW interpolation  →  44×22 regular grid
        ↓
  GradientCanvas / WindCanvas  →  pixels / particles
```

Each `Forecast` row stored in the DB carries:

| Field | Unit | Used by |
|---|---|---|
| `tempMax` / `tempMin` | °C | Temperature layer |
| `precipitation` | mm / day | Rain layer |
| `windSpeed` | km/h | Wind layer |
| `windDir` | degrees (met.) | Wind layer |
| `weatherCode` | WMO code | Popup emoji |
| `precipProb` | % | Popup |
| `humidity` | % | Popup |
| `severity` | string enum | Alert badges |

---

## 2. Spatial Interpolation — IDW

All three layers need a **continuous surface** from 77 point observations. We use **Inverse-Distance Weighting (IDW)** — the simplest method that produces smooth, intuitive maps.

### How IDW works

For any grid point `(lat, lon)`, the estimated value is a weighted average of all district observations, where closer districts count more:

```
value(p) = Σ [ w_i × v_i ] / Σ w_i

w_i = 1 / d_i^power          (power = 2)
d_i = distance from p to district_i
```

**Example — estimating temperature at a mountain between Kathmandu (27°C) and Pokhara (25°C):**

```
d_Ktm   = 0.8° (~90 km)    → w = 1/0.64  = 1.56
d_Pkr   = 0.4° (~45 km)    → w = 1/0.16  = 6.25

value = (1.56×27 + 6.25×25) / (1.56+6.25)
      = (42.1 + 156.3) / 7.81
      = 25.4°C
```

Pokhara dominates because it is half the distance → squared weight is 4× larger.

### Grid resolution

```
Nepal bounds: 26.2°N–30.6°N, 79.8°E–88.4°E
Grid:         44 columns × 22 rows  (~0.2° spacing ≈ 22 km per cell)
```

File: [`frontend/src/utils/windGrid.ts` — `buildScalarGrid()` / `buildWindGrid()`](frontend/src/utils/windGrid.ts)

---

## 3. Temperature Layer

### File
[`frontend/src/components/GradientCanvas.tsx`](frontend/src/components/GradientCanvas.tsx) renders the overlay.
[`frontend/src/utils/windGrid.ts` — `tempToWindyColor()`](frontend/src/utils/windGrid.ts) maps values to colors.

### Color scale (Windy.com style)

| Temperature | Color | Hex approx |
|---|---|---|
| ≤ −20 °C | Deep violet | `#500 0A0` |
| −10 °C | Pure blue | `#0000FF` |
| 0 °C | Blue | `#0078FF` |
| 5 °C | Sky cyan | `#00C8FF` |
| 10 °C | Teal | `#00FFC8` |
| 15 °C | Green | `#00FF64` |
| 20 °C | Yellow-green | `#64FF00` |
| 25 °C | Yellow | `#FFDC00` |
| 30 °C | Orange | `#FF8C00` |
| 35 °C | Red-orange | `#FF3C00` |
| 40 °C | Deep red | `#C8003C` |
| ≥ 45 °C | Magenta | `#A000A0` |

Between any two stops the color is **linearly interpolated** (each R/G/B channel separately).

**Example — 27.5 °C sits halfway between 25 °C (yellow `255,220,0`) and 30 °C (orange `255,140,0`):**
```
R = 255 + 0.5 × (255−255) = 255
G = 220 + 0.5 × (140−220) = 180
B =   0 + 0.5 × (  0−  0) =   0
→ rgb(255, 180, 0)  — a warm amber
```

### Rendering pipeline

```
77 district tempMax values
    ↓ buildScalarGrid()  (IDW → 44×22 Float32Array)
    ↓ sampleScalarGrid() per pixel  (bilinear interpolation)
    ↓ tempToWindyColor()  →  RGBA pixel  (alpha = 150 / 255 ≈ 59 %)
    ↓ canvas.toDataURL()
    ↓ L.imageOverlay(dataUrl, NEPAL_BOUNDS)  on Leaflet overlayPane
```

The offscreen canvas is **440 × 220 px** — one canvas pixel covers ~0.02° (≈ 2 km). Leaflet stretches it to fill the Nepal bounding box at any zoom.

---

## 4. Rain (Precipitation) Layer

### File
Same pipeline as temperature — `GradientCanvas.tsx` + `precipToWindyColor()` in `windGrid.ts`.

### Color scale

| Precipitation | Color | Alpha | Meaning |
|---|---|---|---|
| < 0.1 mm | **Transparent** | 0 | Dry — basemap shows through |
| 0.1–0.5 mm | Very pale blue | 60/255 (24%) | Trace / drizzle |
| 0.5–2 mm | Light blue | 120/255 (47%) | Light rain |
| 2–5 mm | Medium blue | 160/255 (63%) | Moderate rain |
| 5–10 mm | Dark blue | 190/255 (75%) | Heavy shower |
| 10–20 mm | Navy | 210/255 (82%) | Heavy rain |
| 20–50 mm | Dark purple | 230/255 (90%) | Very heavy / flash flood risk |
| ≥ 50 mm | Crimson-purple | 240/255 (94%) | Extreme / dangerous |

**Why the dark areas?**
Dark (navy/purple) patches = ≥ 10–20 mm expected for that day. This is the IDW-interpolated value from surrounding district forecasts. The darker the area, the heavier the predicted rainfall.

**Example:**
```
Kathmandu forecast:  precipitation = 18 mm  → navy  rgb(0, 0, 140)  alpha=210
Bhaktapur forecast:  precipitation = 22 mm  → dark purple  rgb(80, 0, 100)  alpha=230
Area between them:   IDW ≈ 20 mm           → navy/purple blend
```

---

## 5. Wind Layer

### Files
- [`frontend/src/utils/windGrid.ts` — `buildWindGrid()` + `windSpeedColor()`](frontend/src/utils/windGrid.ts)
- [`frontend/src/components/WindCanvas.tsx`](frontend/src/components/WindCanvas.tsx)

### Step 1 — Vector decomposition

`windDir` is a **meteorological bearing** (0° = wind coming *from* North → blowing South).  
To get screen-space movement components:

```typescript
u = −speed × sin(dir_rad)   // eastward  (+u = blowing east)
v = −speed × cos(dir_rad)   // northward (+v = blowing north)
```

The negative signs convert "wind from direction X" → "wind moving toward direction X+180°".

**Example — 135° SE wind at 20 km/h:**
```
u = −20 × sin(135°) = −20 × 0.707 = −14.1  (blowing westward)
v = −20 × cos(135°) = −20 × −0.707 = +14.1 (blowing northward)
→ wind moving NW  ✓ (SE wind blows toward NW)
```

### Step 2 — Build wind grid

Same IDW as temperature but done separately for `u` and `v` components.  
`speed` at each grid point is recomputed as `√(u²+v²)` after interpolation.

### Step 3 — Particle animation (WindCanvas)

Each frame:
1. `sampleWindGrid()` bilinear-interpolates u/v at the particle's current lat/lon
2. Move particle: `newLat = lat + v×dt×scale`, `newLon = lon + u×dt×scale`
3. Project both old and new position to screen pixels via `map.latLngToContainerPoint()`
4. Draw a short line segment — color from `windSpeedColor(speed)`

**Zoom-adaptive scale:**
```typescript
scale = SPEED_SCALE / 2^(zoom − 7)
```
At zoom 7 (full Nepal), scale = 0.12.  
At zoom 10, scale = 0.015 → particles move slower relative to the screen but the same geographic distance, so the flow looks correct at any zoom.

**Particle count by zoom:**

| Zoom | Particles |
|---|---|
| 7 (Nepal overview) | 3,500 |
| 10 | 6,500 |
| 13 | 9,500 |
| 15 | 13,000 |
| ≥ 16 | 15,000 |

Multiplied by the **density slider** (0–2×) in the UI.

### Wind color scale

| Speed (km/h) | Color | Label |
|---|---|---|
| 0 | Strong blue `rgb(30,110,230)` | Calm |
| 5 | Sky blue `rgb(0,170,255)` | Light |
| 10 | Cyan-teal `rgb(0,210,190)` | Gentle |
| 20 | Green `rgb(30,190,50)` | Moderate |
| 30 | Yellow `rgb(220,200,0)` | Fresh |
| 50 | Orange `rgb(255,110,0)` | Strong |
| ≥ 80 | Red `rgb(220,0,0)` | Severe / Gale |

---

## 6. Severity Calculation

Severity is assigned at **ingest time** (before data reaches the frontend) and stored as a string on each `Forecast` row.

### Boolean flags on each forecast

| Flag | Condition (approximate thresholds) |
|---|---|
| `isHeavyRain` | `precipitation ≥ 15 mm` or `precipProb ≥ 80 %` |
| `isThunderstorm` | WMO code 95–99 (thunderstorm family) |
| `isHailstone` | WMO code 96, 99 |
| `isSnow` | WMO code 71–77 or `snowfall > 0` |
| `isHeatwave` | `tempMax ≥ 40 °C` |
| `isColdwave` | `tempMin ≤ −5 °C` |
| `isFog` | WMO code 45, 48 |

### Severity string enum

```
normal    →  no flags set, precipitation < 5 mm
watch     →  1 moderate flag  (e.g. heavy rain alone)
warning   →  isThunderstorm OR isHeavyRain + high precipProb
extreme   →  multiple severe flags, or tempMax ≥ 43 °C, or snow + thunderstorm
```

The frontend uses `severity` to:
- Show the red alert strip in the sidebar (`warning` / `extreme`)
- Count `severeDistricts` in the top bar summary
- Color popup badges

---

## 7. How Wind and Rain Relate

They are **independent layers** built from separate forecast fields — but meteorologically they are strongly coupled.

### What the data actually shows

| Wind pattern | What to expect in Rain layer |
|---|---|
| Particles converging on a region | Moisture convergence → likely dark (heavy rain) patch |
| Particles diverging from a region | Dry subsidence → transparent (dry) area |
| Strong southerly flow (from Bay of Bengal) | Monsoon moisture transport → heavy rain in SE Nepal |
| Westerly particles in winter | Western disturbances → snow in mountains, light rain in Terai |

### Can you see this in the app?

Yes — if you enable **Wind layer** you see particles flowing into the dark-blue/purple zones you saw on the Rain layer. That is the model's prediction of moisture-laden air converging and precipitating.

### Example (monsoon scenario)

```
Rain layer:   Dark navy patch over Ilam, Taplejung, Panchthar
Wind layer:   Particles flowing NW from the SE corner of Nepal
Interpretation: Bay of Bengal moisture being carried inland by the monsoon
               current — the convergence in the mountains triggers orographic
               rainfall.
```

---

## 8. Can Dark Rain Areas Clear Up Later in the Day?

**Short answer: yes — use the 7-day time slider.**

### How the time slider works

```
allDaysData[0]  = today's forecast for all 77 districts
allDaysData[1]  = tomorrow's forecast
...
allDaysData[6]  = day +6 forecast

Selecting a different day calls:
    setForecastDayIndex(i)
    → mapData = allDaysData[i]
    → GradientCanvas re-renders with new precipitation values
    → WindCanvas rebuilds the wind grid from new windSpeed/windDir values
```

Each day is a **separate model forecast** (one precipitation total and one dominant wind for that 24-hour window). As you slide forward:

- A dark navy patch on day 0 may become pale blue on day 2 (shower passed)
- A dry transparent area may darken on day 3 (incoming system)
- Wind arrows may rotate as the synoptic pattern evolves

### Current limitation

The slider shows **daily totals**, not sub-daily (hourly) changes. So a region that gets 20 mm might have it all fall in a 2-hour afternoon thunderstorm, but the map shows it dark all day. Adding hourly time steps (Open-Meteo provides them) would let you watch a storm cell build and dissipate hour by hour — that is a planned future enhancement.

---

## 9. File Map

| File | Responsibility |
|---|---|
| [`backend/src/api/weather.service.ts`](backend/src/api/weather.service.ts) | DB queries, overview stats, 7-day matrix |
| [`backend/src/api/weather.controller.ts`](backend/src/api/weather.controller.ts) | REST endpoints |
| [`frontend/src/utils/api.ts`](frontend/src/utils/api.ts) | Typed fetch wrappers, `Forecast` interface |
| [`frontend/src/utils/windGrid.ts`](frontend/src/utils/windGrid.ts) | IDW, grid build/sample, all color functions |
| [`frontend/src/components/GradientCanvas.tsx`](frontend/src/components/GradientCanvas.tsx) | Temperature + rain image overlay (Leaflet) |
| [`frontend/src/components/WindCanvas.tsx`](frontend/src/components/WindCanvas.tsx) | Particle animation system |
| [`frontend/src/components/MapView.tsx`](frontend/src/components/MapView.tsx) | Map init, basemap swap, layer wiring |
| [`frontend/src/stores/appStore.ts`](frontend/src/stores/appStore.ts) | Global UI state (active layer, day index, density) |
| [`frontend/src/components/MapSidebar.tsx`](frontend/src/components/MapSidebar.tsx) | Layer selector, gradient legend, time slider |
