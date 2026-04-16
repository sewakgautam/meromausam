# How IDW Works in MeroMausam
### Inverse Distance Weighting — explained step by step, no maths degree required

---

## The Problem We Had to Solve

We have weather data for **77 district headquarters** across Nepal.
Each one is a single dot — a GPS coordinate with a temperature (or wind speed, or rainfall) attached.

```
Kathmandu  (27.7°N, 85.3°E)  → 28°C
Pokhara    (28.2°N, 83.9°E)  → 25°C
Dharan     (26.8°N, 87.3°E)  → 32°C
Jumla      (29.3°N, 82.2°E)  → 12°C
... 73 more dots
```

But a map isn't just 77 dots. A map is millions of pixels. The user wants to see a smooth, continuous colour everywhere — not 77 isolated blobs.

**The question is: what temperature do we draw for a pixel that sits between Kathmandu and Pokhara?**

We don't have a measurement there. We have to *estimate* it. That estimation is called **interpolation**, and the method we use is called **IDW — Inverse Distance Weighting**.

---

## The Core Idea in One Sentence

**"The closer a known data point is to you, the more it should influence your estimate."**

That's it. That's IDW. Everything else is just executing that idea with math.

---

## A Real-World Analogy

Imagine you're in a room with 4 heaters in the corners. You want to know how warm a spot in the middle of the room feels.

- The heater 1 metre away from you matters a lot.
- The heater 5 metres away matters much less.
- You don't just average all four equally — the close one dominates.

IDW does exactly this, but for weather data across a map.

---

## Step-by-Step: How IDW Runs in This Project

### Step 0 — What data we start with

After fetching forecasts from Open-Meteo, we have 77 district objects that look like this:

```
District: Kathmandu
  lat: 27.7172
  lon: 85.3240
  forecast.tempMax: 28.4°C

District: Pokhara
  lat: 28.2096
  lon: 83.9856
  forecast.tempMax: 24.9°C

... 75 more
```

---

### Step 1 — Build a grid over Nepal

We divide Nepal into a regular grid of **44 columns × 22 rows = 968 cells**.

Each cell is roughly **0.2° × 0.2°** (about 22km × 19km).

```
Nepal bounding box:
  Lat: 26.2°N  →  30.6°N   (height)
  Lon: 79.8°E  →  88.4°E   (width)

Grid spacing:
  DLON = (88.4 - 79.8) / 43 ≈ 0.20°
  DLAT = (30.6 - 26.2) / 21 ≈ 0.21°
```

Think of it like laying a fishing net over a map of Nepal. Each intersection of the net is a grid point we need to fill with an estimated temperature.

```
·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  (row 21, northernmost)
·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·
·  ·  ·  K  ·  ·  ·  ·  ·  ·  ·   ← K = Kathmandu nearby
·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·
·  ·  P  ·  ·  ·  ·  ·  ·  ·  ·   ← P = Pokhara nearby
·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·
·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  (row 0, southernmost)
```

Every `·` needs a temperature value estimated from the 77 known district points.

---

### Step 2 — For each grid point, run IDW

For every single grid point (all 968 of them), we run this calculation:

```
For grid point at (lat=28.0°, lon=84.5°):

  Look at ALL 77 districts.
  For each district:
    1. Calculate the distance from this grid point to that district
    2. Compute weight = 1 / distance²
    3. Multiply the district's temperature by that weight

  Final estimate = sum of (temp × weight) / sum of all weights
```

The `distance²` in the denominator is the key. Squaring the distance punishes far-away points much harder. A district that is **twice** as far gets only **¼** the influence (not ½).

---

### Step 3 — The Distance Calculation (with one trick)

We're working in latitude/longitude degrees, not kilometres. A degree of longitude near the equator covers ~111km, but near Nepal (28°N) it covers about **97km** because the Earth curves. Degrees of latitude are always ~111km.

So if we just used raw degree differences, east-west distances would be wrong. We fix this with a **cosine correction**:

```typescript
// From windGrid.ts line 33
const dLat = p.lat - lat;
const dLon = (p.lon - lon) * Math.cos((lat * Math.PI) / 180);
const d2 = dLat * dLat + dLon * dLon;
```

`Math.cos(28° in radians) ≈ 0.883`

So a 1° longitude gap near Nepal is treated as 0.883° rather than 1°. This makes the distance calculation geometrically correct across Nepal's latitude.

---

### Step 4 — The Weight Formula

```typescript
// From windGrid.ts line 36
const w = 1 / Math.pow(d2, power / 2);
// where power = 2, so this is: w = 1 / d2
// which is the same as: w = 1 / distance²
```

Let's see what this means with a real example:

```
Grid point: (28.0°N, 84.5°E)

Kathmandu (27.72°N, 85.32°E):
  dLat = 27.72 - 28.0 = -0.28
  dLon = (85.32 - 84.5) × 0.883 = 0.724
  d² = 0.28² + 0.724² = 0.078 + 0.524 = 0.602
  weight = 1 / 0.602 = 1.66    ← fairly far

Pokhara (28.21°N, 83.99°E):
  dLat = 28.21 - 28.0 = 0.21
  dLon = (83.99 - 84.5) × 0.883 = -0.450
  d² = 0.21² + 0.450² = 0.044 + 0.203 = 0.247
  weight = 1 / 0.247 = 4.05    ← closer, much higher weight

Jumla (29.27°N, 82.18°E):
  dLat = 29.27 - 28.0 = 1.27
  dLon = (82.18 - 84.5) × 0.883 = -2.048
  d² = 1.27² + 2.048² = 1.613 + 4.194 = 5.807
  weight = 1 / 5.807 = 0.17    ← far away, tiny weight
```

---

### Step 5 — The Final Estimate

```
Kathmandu temp = 28.4°C,  weight = 1.66
Pokhara temp   = 24.9°C,  weight = 4.05
Jumla temp     = 12.0°C,  weight = 0.17
... (74 more districts with their own weights)

Estimated temp at (28.0°N, 84.5°E)
  = (28.4 × 1.66 + 24.9 × 4.05 + 12.0 × 0.17 + ...) 
    ÷ 
    (1.66 + 4.05 + 0.17 + ...)

  ≈ 25.8°C
```

Pokhara was closest, so the result pulls toward Pokhara's 24.9°C more than Kathmandu's 28.4°C. Makes sense geographically — the point is closer to Pokhara.

---

### Step 6 — Special case: exact hit

```typescript
// windGrid.ts line 35
if (d2 < 1e-10) return p.val; // exact hit
```

If the grid point happens to land exactly on a district's coordinates, the distance is essentially zero, which would cause division by zero (`1/0 = ∞`). We catch this: if the distance is tiny, just return that district's value directly. No calculation needed.

---

### Step 7 — Store in a flat array

The 968 grid results are stored in a `Float32Array` — a compact, fixed-size array of 32-bit floating point numbers. Fast to write, fast to read.

```typescript
// Index formula: row × number_of_columns + column
values[row * NX + col] = idw(pts, lat, lon);
```

Row 0 = southernmost strip of Nepal
Row 21 = northernmost strip
Col 0 = westernmost strip
Col 43 = easternmost strip

---

### Step 8 — Reading back from the grid (Bilinear interpolation)

The grid has 968 known values. But when GradientCanvas asks "what's the temperature at this pixel?", the pixel coordinates rarely fall exactly on a grid point — they fall *between* grid points.

So we do a second, simpler interpolation called **bilinear interpolation** to read from the grid smoothly.

```
Grid has values at 4 nearby corners (A, B, C, D):

  A ------- B
  |    *    |
  |  (pixel)|
  C ------- D

We blend A↔B based on how far horizontally the pixel is.
We blend C↔D the same way.
Then we blend those two results vertically.
```

In code (`sampleScalarGrid`, line 185–198):
```typescript
const fc = col - c0;  // how far between left and right column (0.0 to 1.0)
const fr = row - r0;  // how far between bottom and top row   (0.0 to 1.0)

return (
  (values[topLeft]    * (1 - fc) + values[topRight]    * fc) * (1 - fr) +
  (values[bottomLeft] * (1 - fc) + values[bottomRight]  * fc) * fr
);
```

This gives a silky smooth result — no pixelated blocky edges.

---

## IDW Is Used Twice in This Project

### Use 1 — Temperature and Precipitation heatmap

**File:** `buildScalarGrid()` in [windGrid.ts](frontend/src/utils/windGrid.ts)
**Called from:** [GradientCanvas.tsx](frontend/src/components/GradientCanvas.tsx)

Steps:
1. Take 77 district `tempMax` values (or `precipitation` values)
2. IDW → fill a 44×22 grid with estimated values
3. GradientCanvas renders the map at ¼ resolution (350×200 pixels)
4. For each pixel: convert screen coordinates → lat/lon → sample the grid with bilinear interpolation → pick a colour → paint the pixel
5. Scale back up with smoothing → smooth heatmap

---

### Use 2 — Wind field for animated particles

**File:** `buildWindGrid()` in [windGrid.ts](frontend/src/utils/windGrid.ts)
**Called from:** [MapView.tsx](frontend/src/components/MapView.tsx) → [WindCanvas.tsx](frontend/src/components/WindCanvas.tsx)

Wind is more complex because it has **direction**, not just magnitude. You can't IDW the speed and direction directly (a north wind and a south wind don't average to "no wind").

So we split wind into two components first:
```typescript
// windGrid.ts lines 53-56
const rad = (dir * Math.PI) / 180;
u = -speed * Math.sin(rad);   // east-west component
v = -speed * Math.cos(rad);   // north-south component
```

Then we IDW `u` and `v` **separately** on two grids. This is the physically correct approach — the same way meteorologists work with wind vectors.

When a wind particle in WindCanvas asks "which way should I move?", it calls `sampleWindGrid()` which bilinear-interpolates the U and V grids at the particle's current lat/lon, then moves the particle accordingly.

---

## Why Not Just Use a Simpler Method?

| Option | What it does | Why we didn't use it |
|---|---|---|
| **Average all 77 values** | Returns one number for the whole country | Useless — Kathmandu is 1400m, Terai is 100m |
| **Nearest neighbour** | Colour each pixel with the closest district only | Creates hard-edged Voronoi cells — ugly and geographically misleading |
| **Linear average of closest N** | Simple average of 3–5 nearest points | Doesn't respect distance properly — a point 1km away and 50km away have equal say |
| **Kriging** | Statistically optimal interpolation | Requires knowing the spatial correlation structure of the data. Far more complex to implement, not necessary for weather visualisation |
| **IDW** ✅ | Weighted by inverse distance squared | Simple, fast, smooth, physically intuitive, works well for weather data over moderate distances |

IDW is the standard method used in meteorological visualisation tools (including Windy.com, QGIS, ArcGIS weather layers) exactly because it's fast enough to run in real-time and produces visually sensible results.

---

## The Full Pipeline, End to End

```
Open-Meteo API
    ↓
77 district forecasts (tempMax, windSpeed, windDir, precipitation)
    ↓
  [buildScalarGrid / buildWindGrid]
  For each of 968 grid cells:
    → run IDW against all 77 points
    → store estimated value in Float32Array
    ↓
  GradientCanvas renders (every pan/zoom):
    For each of ~70,000 low-res pixels:
      → containerPoint → latLng
      → sampleScalarGrid (bilinear interpolation)
      → tempToWindyColor / precipToWindyColor
      → write RGBA to ImageData
    → scale up 4× with smoothing
    → paint onto canvas over the map
    ↓
  WindCanvas runs (60fps animation):
    For each of 3,500 particles each frame:
      → current lat/lon
      → sampleWindGrid (bilinear interpolation of U + V grids)
      → move particle by U×dt, V×dt
      → draw coloured line segment from old to new position
```

---

## Numbers at a Glance

| What | Value |
|---|---|
| Known data points (districts) | 77 |
| Grid size | 44 × 22 = 968 cells |
| Grid spacing | ~0.2° ≈ 20km |
| IDW power (p) | 2 (distance squared) |
| IDW computations per grid build | 968 cells × 77 districts = **74,536 multiplications** |
| Grid builds per data refresh | 3 (temperature, precipitation, wind U, wind V) |
| Canvas render resolution | ¼ scale (~350×200 px) |
| Bilinear lookups per canvas render | ~70,000 |
| Wind particles animated per frame | 3,500 |
| Wind grid lookups per frame | 3,500 |
| Animation target | 60 fps |

---

*Implementation: [`frontend/src/utils/windGrid.ts`](frontend/src/utils/windGrid.ts)*
*Used in: [`GradientCanvas.tsx`](frontend/src/components/GradientCanvas.tsx) and [`WindCanvas.tsx`](frontend/src/components/WindCanvas.tsx)*
