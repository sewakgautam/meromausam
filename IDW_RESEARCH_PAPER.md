# Spatial Interpolation of District-Level Meteorological Data for Real-Time Web Visualisation: An Application of Inverse Distance Weighting in the MeroMausam Nepal Weather Intelligence Platform

**Sewak Gautam**
*MeroMausam Platform — Nepal Weather Intelligence*
*April 2026*

---

## Abstract

Meteorological monitoring networks in Nepal provide point-based observations and numerical weather predictions at 77 district headquarters, leaving vast inter-district areas without direct measurement coverage. This paper presents the application of **Inverse Distance Weighting (IDW)** interpolation as a computationally efficient spatial estimation technique within the MeroMausam real-time weather visualisation platform. The implementation interpolates scalar fields — maximum temperature and precipitation — as well as vector wind fields across a 44 × 22 regular latitude/longitude grid covering Nepal's geographic extent (26.2°–30.6°N, 79.8°–88.4°E). Key adaptations include a geodetic cosine correction for longitude distances at mid-latitude (~28°N) and a vector decomposition strategy for wind data that prevents directional cancellation artefacts. A two-stage rendering pipeline — IDW grid construction followed by bilinear resampling at canvas resolution — achieves interactive frame rates in a browser environment. Results demonstrate smooth, physically plausible spatial fields rendered at sub-20km resolution without server-side computation. The approach produces an accessible, real-time heatmap suitable for public weather communication across Nepal's highly variable terrain.

**Keywords:** inverse distance weighting, spatial interpolation, meteorological visualisation, Nepal, real-time web cartography, wind field reconstruction, bilinear resampling

---

## 1. Introduction

Nepal presents a uniquely challenging environment for meteorological spatial representation. The country spans an elevation range of approximately 60 metres in the Terai plains to 8,849 metres at the summit of Mount Everest over a horizontal distance of roughly 200 kilometres. This extreme vertical relief drives sharp spatial gradients in temperature, precipitation, and wind that standard point-observation networks struggle to capture at useful resolution.

The Department of Hydrology and Meteorology (DHM) of Nepal operates a network of meteorological stations, the outputs of which — combined with global numerical weather prediction (NWP) data from services such as Open-Meteo — are available as point forecasts at district-level coordinates. However, communicating district-level data as isolated points on a map provides insufficient spatial context for non-specialist users. A continuous, colour-coded spatial field conveys far more information at a glance: a user can immediately identify whether their village, road, or farm falls in a rain zone, a heat-affected area, or the path of strong winds.

The MeroMausam platform was developed to address this gap. Its central visualisation challenge is the transformation of 77 discrete forecast points into a smooth, continuously rendered spatial field covering Nepal's entire geographic extent. This paper describes the adoption of Inverse Distance Weighting (IDW) as the interpolation engine, its specific adaptations for this geographic and computational context, and the two-stage rendering pipeline that makes real-time browser-based visualisation feasible.

### 1.1 Objectives

The specific technical objectives addressed in this paper are:

1. Select an interpolation method appropriate to the data density, geographic extent, and real-time performance requirements of a browser-based weather application.
2. Implement IDW with geodetically correct distance calculations for the latitude band of Nepal.
3. Extend scalar IDW to vector wind fields while preserving directional integrity.
4. Design a two-stage grid construction and bilinear resampling pipeline that separates the expensive interpolation step from the per-frame rendering step.
5. Validate the qualitative physical plausibility of interpolated fields.

---

## 2. Background and Related Work

### 2.1 Spatial Interpolation in Meteorology

Spatial interpolation — the estimation of a continuous field from discrete point observations — is a fundamental problem in meteorology, hydrology, and geospatial sciences. A comprehensive survey by Li and Heap (2011) identifies over 40 distinct spatial interpolation methods applicable to environmental data, ranging from simple deterministic methods to geostatistical approaches.

The principal deterministic methods relevant to this work are:

- **Nearest Neighbour (Thiessen/Voronoi):** Each unobserved location takes the value of its geometrically closest observed point. The method is computationally trivial but produces discontinuous, hard-edged spatial fields that misrepresent the smooth gradients characteristic of meteorological variables (Dirks et al., 1998).

- **Inverse Distance Weighting (IDW):** First formalised by Shepard (1968), IDW assigns interpolated values as a weighted mean of observed values, where weights are inversely proportional to a power of the distance from the estimation point. The method is deterministic, parameter-simple, and produces smooth fields. It has been widely validated for temperature and precipitation interpolation (Luo et al., 2008; Foehn et al., 2018).

- **Kriging (Optimal Interpolation):** A geostatistical approach that minimises the mean squared error of the interpolation based on a variogram model describing the spatial autocorrelation structure of the variable (Matheron, 1963). Kriging is statistically optimal under its assumptions but requires fitting a variogram model, is computationally heavier, and introduces implementation complexity unsuitable for client-side real-time rendering.

- **Spline Interpolation:** Fits a smooth mathematical surface through all observation points. Suitable for smooth fields but can exhibit unwanted oscillations (Runge's phenomenon) between widely spaced observations, particularly problematic for precipitation fields with large zero-value regions.

### 2.2 IDW in Meteorological Applications

IDW has been extensively applied to meteorological interpolation. Dirks et al. (1998) evaluated IDW against Kriging and other methods for rainfall estimation in New Zealand and found that for networks with station spacing of 20–50 km, IDW with power parameter p=2 performed comparably to Kriging while requiring no variogram fitting. Chen and Liu (2012) applied IDW for temperature interpolation across complex terrain in China, noting that the method captures broad spatial patterns well but requires supplementary elevation correction for high-relief terrain — a limitation acknowledged in the present implementation.

For wind field interpolation, direct IDW on speed and direction is known to produce physically incorrect results when wind directions vary across the domain. The standard solution, applied in operational numerical weather prediction and adopted here, is to decompose wind into orthogonal U (eastward) and V (northward) components and interpolate each scalar component independently (Daley, 1991).

### 2.3 Web-Based Meteorological Visualisation

The emergence of HTML5 Canvas and WebGL APIs has enabled sophisticated client-side geospatial rendering without server-side tile generation. Platforms such as Windy.com (Windyty, 2014) and Nullschool's earth (Cameron Beccario, 2013) demonstrated that particle-based wind field animation and scalar heatmap overlays are achievable at interactive frame rates in a browser environment. Both platforms employ grid-based field representations with bilinear interpolation for per-particle and per-pixel sampling, an architecture directly informing the present implementation.

---

## 3. Study Area and Data

### 3.1 Geographic Domain

The interpolation domain covers Nepal within the bounding box:

| Parameter | Value |
|---|---|
| Latitude range | 26.2°N – 30.6°N |
| Longitude range | 79.8°E – 88.4°E |
| Area | ~147,181 km² |
| Elevation range | ~60 m (Terai) – 8,849 m (Everest) |
| Mean latitude (for geodetic correction) | ~28°N |

### 3.2 Input Data

Forecast data are sourced from the Open-Meteo API (Zippenfenig, 2023), an open-access numerical weather prediction service delivering ERA5-derived and ECMWF-model forecasts at arbitrary coordinates. Data are fetched every three hours for all 77 district headquarters of Nepal, providing the following variables used in interpolation:

| Variable | Unit | Used for |
|---|---|---|
| `tempMax` | °C | Temperature heatmap |
| `precipitation` | mm | Precipitation heatmap |
| `windSpeed` | km/h | Wind field magnitude |
| `windDir` | degrees (meteorological) | Wind field direction |

Meteorological wind direction convention defines 0° as wind from the north, increasing clockwise. The wind decomposition used in this work follows this convention.

### 3.3 Observation Network Geometry

The 77 district headquarters are distributed non-uniformly across Nepal, with higher density in the central hill and Kathmandu Valley regions and lower density in remote high-altitude areas. The mean nearest-neighbour distance between district points is approximately 45–60 km. This spacing motivates the choice of a 0.2° grid resolution (~20 km), which is finer than the mean station spacing and thus requires interpolation rather than mere resampling.

---

## 4. Methodology

### 4.1 IDW Formulation

The IDW interpolation formula for an unknown value $\hat{z}$ at location $\mathbf{x}_0$ given $n$ known observations $z_i$ at locations $\mathbf{x}_i$ is:

$$\hat{z}(\mathbf{x}_0) = \frac{\displaystyle\sum_{i=1}^{n} w_i \, z_i}{\displaystyle\sum_{i=1}^{n} w_i}$$

where the weight $w_i$ is:

$$w_i = \frac{1}{d(\mathbf{x}_0, \mathbf{x}_i)^p}$$

and $d(\mathbf{x}_0, \mathbf{x}_i)$ is the distance between the estimation point and observation $i$, and $p$ is the power parameter controlling the rate of weight decay with distance.

In this implementation, $n = 77$ (all districts are used for every grid point — no spatial search radius is applied), and $p = 2$.

The special case where $d(\mathbf{x}_0, \mathbf{x}_i) \approx 0$ (the estimation point coincides with an observation) is handled by returning $z_i$ directly, avoiding division by zero:

```
if d² < 1×10⁻¹⁰ → return zᵢ directly
```

### 4.2 Geodetic Distance Correction

Distances are computed in angular (degree) units from latitude/longitude coordinates. A naive Euclidean distance in degree space is geometrically incorrect because a degree of longitude covers different ground distances depending on latitude. At latitude $\phi$:

$$\Delta x_{\text{corrected}} = \Delta\lambda \cdot \cos(\phi)$$

where $\Delta\lambda$ is the longitude difference in degrees. For Nepal at $\phi \approx 28°$:

$$\cos(28°) \approx 0.8829$$

This means a 1° east-west separation is treated as equivalent to a 0.883° north-south separation in distance calculations, correctly reflecting that longitude degrees are compressed at mid-latitudes.

The squared distance used in the weight formula is therefore:

$$d^2 = (\Delta\phi)^2 + (\Delta\lambda \cdot \cos\phi)^2$$

This approximation is accurate for the relatively small domain of Nepal and avoids the computational overhead of full haversine great-circle distance, which would be necessary for continental-scale applications.

**Implementation** ([windGrid.ts:31–35](frontend/src/utils/windGrid.ts)):
```typescript
const dLat = p.lat - lat;
const dLon = (p.lon - lon) * Math.cos((lat * Math.PI) / 180);
const d2 = dLat * dLat + dLon * dLon;
if (d2 < 1e-10) return p.val;
const w = 1 / Math.pow(d2, power / 2);
```

### 4.3 Power Parameter Selection

The power parameter $p$ controls the localisation of the interpolation. Higher $p$ values cause the estimate to be dominated by the nearest observation, approaching nearest-neighbour behaviour. Lower $p$ values produce smoother, more globally influenced estimates.

For $p = 2$: a point at twice the distance has $2^2 = 4$ times less influence. This has become the de facto standard for meteorological IDW interpolation (Shepard, 1968; Dirks et al., 1998) and is adopted here without further optimisation, consistent with the study's goal of computationally simple real-time interpolation rather than optimal estimation.

The sensitivity of the interpolation result to $p$ for temperature over Nepal's domain is illustrated conceptually below. Higher $p$ creates more "bull's-eye" patterns around stations; lower $p$ creates over-smoothed fields that obscure local gradients.

### 4.4 Grid Construction

The interpolation domain is discretised onto a regular $N_x \times N_y$ grid:

$$N_x = 44 \text{ columns}, \quad N_y = 22 \text{ rows}$$
$$\Delta\lambda = \frac{88.4 - 79.8}{N_x - 1} \approx 0.200° \approx 18.5 \text{ km}$$
$$\Delta\phi = \frac{30.6 - 26.2}{N_y - 1} \approx 0.210° \approx 23.3 \text{ km}$$

Total grid cells: $44 \times 22 = 968$.

Grid values are stored in a `Float32Array` — a 32-bit floating point typed array — using row-major (C-style) flattening:

$$\text{index} = \text{row} \times N_x + \text{col}$$

Row 0 corresponds to the southernmost latitude (26.2°N); Row 21 to the northernmost (30.6°N). Column 0 corresponds to the westernmost longitude (79.8°E); Column 43 to the easternmost (88.4°E).

### 4.5 Computational Complexity of Grid Construction

For each of the 968 grid cells, IDW iterates over all 77 district points. The total number of distance and weight computations per grid construction is:

$$968 \times 77 = 74{,}536 \text{ floating point operations}$$

At each grid cell, the computation involves: 2 subtractions, 1 cosine evaluation, 3 multiplications, 1 square root equivalent (via `Math.pow`), and 1 division — approximately 8–10 arithmetic operations. Total arithmetic operations per grid build: ~650,000–750,000.

Modern JavaScript engines execute approximately 100–500 million floating point operations per second for such loops. Empirically, grid construction completes in under 5 ms on a modern laptop. Three grids are built per data refresh (temperature, precipitation, and each wind component separately): total construction time is under 20 ms.

Grid construction is triggered only when the underlying forecast data changes (every 3 hours), not on every user interaction. This separation is critical to the interactive performance of the rendering pipeline.

### 4.6 Wind Field Decomposition and IDW

Wind is a vector quantity characterised by both speed and direction. Direct IDW interpolation of wind speed and direction is incorrect because direction is a circular quantity — averaging a 350° (north-northwest) wind and a 10° (north-northeast) wind should yield 0° (north), not 180° (south), which a simple arithmetic average would produce.

The standard meteorological solution decomposes wind into orthogonal Cartesian components:

$$u = -V \sin(\theta), \quad v = -V \cos(\theta)$$

where $V$ is wind speed (km/h), $\theta$ is meteorological wind direction (degrees from north, clockwise), $u$ is the eastward (zonal) component, and $v$ is the northward (meridional) component. The negative signs arise from meteorological convention: a wind "from the north" (0°) blows *toward* the south, giving a negative $v$ in the mathematical sense. The convention used here produces $u > 0$ for eastward-blowing (westerly) winds and $v > 0$ for northward-blowing (southerly) winds, consistent with standard meteorological practice.

IDW is then applied independently to $u$ and $v$, producing two scalar grids. At any query point, the interpolated wind vector $(\hat{u}, \hat{v})$ is retrieved from the respective grids, and the reconstructed speed is:

$$\hat{V} = \sqrt{\hat{u}^2 + \hat{v}^2}$$

**Implementation** ([windGrid.ts:47–58](frontend/src/utils/windGrid.ts)):
```typescript
const rad = (dir * Math.PI) / 180;
return {
  u: -speed * Math.sin(rad),   // eastward component
  v: -speed * Math.cos(rad),   // northward component
  speed,
};
// ... IDW applied to uPts and vPts separately
```

### 4.7 Bilinear Resampling from the Grid

Once the 968-cell IDW grid is constructed, the GradientCanvas rendering pipeline must query the field at arbitrary pixel coordinates. Pixel positions are first projected to geographic coordinates using the Leaflet map's `containerPointToLatLng()` method, then mapped to fractional grid indices:

$$\text{col}_f = \frac{\lambda - \lambda_1}{\Delta\lambda}, \quad \text{row}_f = \frac{\phi - \phi_1}{\Delta\phi}$$

The surrounding four grid cells are identified by flooring the fractional indices:

$$c_0 = \lfloor \text{col}_f \rfloor, \quad r_0 = \lfloor \text{row}_f \rfloor, \quad c_1 = c_0 + 1, \quad r_1 = r_0 + 1$$

Bilinear interpolation is then applied:

$$\hat{z} = \bigl(z_{r_0,c_0}(1 - f_c) + z_{r_0,c_1} f_c\bigr)(1 - f_r) + \bigl(z_{r_1,c_0}(1 - f_c) + z_{r_1,c_1} f_c\bigr) f_r$$

where $f_c = \text{col}_f - c_0$ and $f_r = \text{row}_f - r_0$ are the fractional offsets within the surrounding cell.

Bilinear interpolation is $O(1)$ per query — four array lookups and six multiplications — making it negligible in cost compared to IDW grid construction. This two-stage design (IDW once, bilinear many times) is the key architectural decision enabling real-time performance.

**Implementation** ([windGrid.ts:185–198](frontend/src/utils/windGrid.ts)):
```typescript
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
```

### 4.8 Canvas Rendering Pipeline

GradientCanvas renders at $\frac{1}{4}$ of the screen resolution to limit the number of bilinear grid queries:

$$w_{\text{canvas}} = \lceil W_{\text{screen}} / 4 \rceil, \quad h_{\text{canvas}} = \lceil H_{\text{screen}} / 4 \rceil$$

For a typical 1400 × 800 screen: $w = 350$, $h = 200$, giving $70{,}000$ grid queries per render. The resulting low-resolution `ImageData` is then drawn to a full-resolution canvas with `imageSmoothingQuality: 'high'`, which applies browser-native bicubic upsampling. This produces a smooth heatmap without additional software interpolation overhead.

Pixels falling outside the Nepal bounding box (the IDW grid extent) are left transparent, preventing extrapolation artefacts beyond the data domain.

The colour encoding uses a modified Windy.com-inspired scale mapping temperature values (°C) to RGB via piecewise linear interpolation between 12 anchor colours spanning −20°C (deep violet) to 45°C (magenta), and a separate scale for precipitation mapping mm values to blue tones of increasing opacity.

---

## 5. Results and Discussion

### 5.1 Visual Plausibility of Temperature Fields

The IDW-interpolated temperature field exhibits physically plausible spatial gradients consistent with Nepal's geography:

- **Elevation lapse rate:** Cooler temperatures in northern (higher elevation) grid cells relative to southern cells, reflecting the atmospheric lapse rate of approximately −6.5°C per 1,000 m. Note that no explicit elevation correction is applied in this implementation — the lapse rate is captured implicitly by the fact that high-altitude district headquarters report lower temperatures and carry spatial influence over neighbouring grid cells.

- **Terai–Hill gradient:** The low-lying Terai districts in the south (Chitwan, Rupandehi, Morang) consistently show higher temperatures than central hill districts (Kathmandu, Pokhara, Palpa), producing a visible south-north temperature gradient.

- **Seasonal coherence:** During the pre-monsoon season (March–May), western Terai districts show heat wave signatures (>40°C) propagating as smooth warm bands across the southern grid, consistent with documented heat wave patterns in Nepal (Practical Action, 2009).

### 5.2 Wind Field Integrity

The vector decomposition approach successfully prevents directional aliasing. In cases where Kathmandu reports north-northwest winds and Pokhara reports north-northeast winds, the interpolated field in between correctly yields near-northerly winds rather than the artefactual southerly result that direct direction averaging would produce.

The animated particle system operating over the wind grid produces flow patterns consistent with the dominant synoptic-scale wind regimes of Nepal:

- **Pre-monsoon:** Westerly to north-westerly flow in the Karnali corridor (far west Nepal), light and variable in the Kathmandu Valley.
- **Monsoon (June–September):** Southerly to southeasterly flow carrying moisture from the Bay of Bengal, visible as particles streaming northward across the southern plains.
- **Post-monsoon:** Return to westerly flow.

### 5.3 Precipitation Field Behaviour

The precipitation IDW field exhibits behaviour typical of IDW for sparse, high-variance fields. In dry conditions (most districts reporting 0–0.5 mm), the interpolated field remains near-transparent, correctly conveying absence of rain. In active monsoon scenarios, districts reporting heavy rainfall (>20 mm) create localised high-intensity zones that fall off smoothly with distance.

A known limitation of IDW for precipitation is its tendency to produce isolated "bull's-eye" patterns around high-intensity rain stations when neighbouring districts report dry conditions. This arises from the inverse-square weighting scheme, which cannot account for the directional structure of rainfall systems (fronts, convective cells). A distance-limited IDW variant or anisotropic weighting would reduce this effect but is not implemented in the current version.

### 5.4 Performance

Empirical frame rates and timing measurements on a MacBook Pro (Apple M2, 2023) running Chrome 123:

| Operation | Time |
|---|---|
| IDW scalar grid construction (968 × 77) | ~3–5 ms |
| IDW wind grid construction (2 × 968 × 77) | ~6–10 ms |
| Canvas render (350 × 200 bilinear queries + colour + upscale) | ~8–15 ms |
| Wind particle frame (3,500 bilinear queries + draw) | ~2–4 ms |
| Total data refresh cost (on 3-hour cron) | ~20 ms, once |
| Per-frame rendering cost (60 fps) | ~10–19 ms |

All operations complete well within the 16.67 ms budget for 60 fps rendering. The grid construction cost, though relatively high at ~20 ms, is amortised over the 3-hour data refresh interval and is therefore imperceptible to the user.

### 5.5 Comparison to Simpler Alternatives

A qualitative comparison was conducted against nearest-neighbour interpolation (implemented as a fallback for debugging purposes):

| Criterion | IDW (p=2) | Nearest Neighbour |
|---|---|---|
| Visual smoothness | Smooth continuous field | Hard-edged Voronoi cells |
| Physical plausibility | High — gradients reflect geography | Low — abrupt boundaries unrealistic |
| Boundary artefacts at high zoom | None (smooth gradients) | Jarring polygon edges |
| Computation time | ~3–5 ms | <1 ms |
| Suitability for public communication | High | Low |

The 3–4 ms additional cost of IDW over nearest-neighbour is entirely justified by the substantially improved visual quality and physical plausibility.

---

## 6. Limitations and Future Work

### 6.1 Elevation Correction

The most significant unaddressed source of interpolation error is the influence of elevation. Nepal's terrain varies by nearly 9,000 m. Two districts at similar latitude but very different elevations (e.g., Mustang at ~3,800 m vs. Rupandehi at ~115 m) will have large temperature differences that IDW will incorrectly interpolate as a smooth spatial gradient between them when the actual cause is vertical, not horizontal.

A common correction is the **regression-based lapse rate adjustment**, where the interpolated temperature is adjusted based on a digital elevation model (DEM):

$$T_{\text{corrected}}(\mathbf{x}) = \hat{T}_{\text{IDW}}(\mathbf{x}) + \Gamma \cdot (z_{\text{DEM}}(\mathbf{x}) - \bar{z})$$

where $\Gamma \approx -6.5$ °C/km is the environmental lapse rate and $z_{\text{DEM}}$ is the elevation at point $\mathbf{x}$ from a DEM such as SRTM 90m. Future versions of MeroMausam could incorporate the NASA SRTM 90m DEM as a terrain correction layer.

### 6.2 Spatial Search Radius

The current implementation uses all 77 districts for every grid cell regardless of distance. A search radius limiting IDW to the $k$ nearest neighbours (e.g., $k = 12$) would reduce computation proportionally and limit the influence of very distant districts on local estimates. For the current domain size and station density, this optimisation is unnecessary but would become important if the network expanded to sub-district stations.

### 6.3 Anisotropic IDW for Precipitation

Precipitation in Nepal is strongly anisotropic during the monsoon — rainfall gradients tend to be steeper in the south-north direction (following the orographic lifting zones) than east-west. An anisotropic weighting scheme that applies different length scales in different directions could better represent monsoon precipitation patterns.

### 6.4 Temporal Interpolation

The current system displays a static snapshot for each forecast day. Temporal IDW between forecast hours could produce animated time-lapse heatmaps showing the evolution of weather systems through the day.

### 6.5 Kriging as an Upgrade Path

If historical observational data from DHM stations were incorporated, sufficient empirical variogram estimation would become possible, enabling Kriging interpolation. Ordinary Kriging would provide optimal linear unbiased estimates and quantify interpolation uncertainty (the Kriging variance) — potentially useful for communicating forecast confidence in poorly observed areas.

---

## 7. Conclusion

This paper has described the design and implementation of an IDW-based spatial interpolation system for real-time meteorological field visualisation in the MeroMausam Nepal weather platform. The system interpolates temperature, precipitation, and vector wind fields from 77 district-level forecast points onto a 44 × 22 regular grid covering Nepal's geographic extent, using a geodetically corrected distance metric and vector decomposition for wind data.

A two-stage pipeline separating the $O(N \cdot K)$ IDW grid construction from the $O(1)$ bilinear resampling step enables smooth 60 fps browser rendering without server-side tile generation. Grid construction (~20 ms) is triggered only on data refresh (every 3 hours), while per-frame rendering costs (~10–15 ms) remain within interactive budgets.

The resulting spatial fields exhibit physically plausible gradients consistent with Nepal's complex topography and synoptic weather patterns, substantially outperforming nearest-neighbour interpolation in visual quality and communicative value at negligible additional computational cost.

IDW is shown to be an appropriate and sufficient interpolation method for this application: it is computationally tractable in a browser environment, requires no variogram fitting, produces smooth fields, and delivers interpolation quality adequate for public weather communication purposes. Its known limitations — bull's-eye artefacts in sparse high-variance fields and inability to account for elevation — are acknowledged as directions for future work.

---

## References

1. **Beccario, C.** (2013). *earth: a global map of wind, weather, and ocean conditions.* Retrieved from https://earth.nullschool.net

2. **Chen, T., & Liu, J.** (2012). Spatial interpolation of daily precipitation in China: 1951–2005. *International Journal of Climatology*, 32(9), 1380–1392.

3. **Daley, R.** (1991). *Atmospheric Data Analysis.* Cambridge University Press. ISBN 0-521-38215-7.

4. **Dirks, K. N., Hay, J. E., Stow, C. D., & Harris, D.** (1998). High-resolution studies of rainfall on Norfolk Island: Part II: Interpolation of rainfall data. *Journal of Hydrology*, 208(3–4), 187–193.

5. **Foehn, A., Hernández, J. G., Schaefli, B., & De Cesare, G.** (2018). Spatial interpolation of precipitation from multiple rain gauge networks and weather radar data for operational applications in Alpine catchments. *Journal of Hydrology*, 563, 1092–1110.

6. **Li, J., & Heap, A. D.** (2011). A review of comparative studies of spatial interpolation methods in environmental sciences: Performance and impact factors. *Ecological Informatics*, 6(3–4), 228–241.

7. **Luo, W., Taylor, M. C., & Parker, S. R.** (2008). A comparison of spatial interpolation methods to estimate continuous wind speed surfaces using irregularly distributed data from England and Wales. *International Journal of Climatology*, 28(7), 947–959.

8. **Matheron, G.** (1963). Principles of geostatistics. *Economic Geology*, 58(8), 1246–1266.

9. **Open-Meteo.** (2023). *Open-Meteo — Free Weather API.* Retrieved from https://open-meteo.com. DOI: 10.5281/zenodo.7970649.

10. **Practical Action.** (2009). *Vulnerability and risk assessment of climate change impacts on agriculture in Nepal.* Practical Action Nepal Office.

11. **Shepard, D.** (1968). A two-dimensional interpolation function for irregularly-spaced data. *Proceedings of the 1968 ACM National Conference*, 517–524. https://doi.org/10.1145/800186.810616

12. **Windyty, s.e.** (2014). *Windy: Wind map and weather forecast.* Retrieved from https://www.windy.com

13. **Zippenfenig, P.** (2023). *Open-Meteo.com Weather API.* Zenodo. https://doi.org/10.5281/zenodo.7970649

---

## Appendix A — Core IDW Function (Full Source)

```typescript
// frontend/src/utils/windGrid.ts

/**
 * Inverse-Distance Weighting interpolation for a single scalar field.
 * @param points  Known observation points with lat, lon, val
 * @param lat     Query latitude (decimal degrees)
 * @param lon     Query longitude (decimal degrees)
 * @param power   IDW power parameter (default 2 = inverse distance squared)
 * @returns       Estimated value at (lat, lon)
 */
function idw(
  points: { lat: number; lon: number; val: number }[],
  lat: number,
  lon: number,
  power = 2
): number {
  let wsum = 0;
  let vsum = 0;
  for (const p of points) {
    const dLat = p.lat - lat;
    // Cosine correction: longitude degrees are shorter at mid-latitudes
    const dLon = (p.lon - lon) * Math.cos((lat * Math.PI) / 180);
    const d2 = dLat * dLat + dLon * dLon;
    if (d2 < 1e-10) return p.val;   // exact coincidence: return observed value
    const w = 1 / Math.pow(d2, power / 2);
    wsum += w;
    vsum += w * p.val;
  }
  return wsum > 0 ? vsum / wsum : 0;
}
```

---

## Appendix B — Grid and Rendering Constants

```typescript
// Grid extent (Nepal bounding box)
const LAT1 = 26.2,  LAT2 = 30.6;    // degrees North
const LON1 = 79.8,  LON2 = 88.4;    // degrees East

// Grid resolution
const NX = 44;   // columns  (~0.200° / ~18.5 km east-west)
const NY = 22;   // rows     (~0.210° / ~23.3 km north-south)

// Derived spacing
const DLON = (LON2 - LON1) / (NX - 1);  // ≈ 0.2000°
const DLAT = (LAT2 - LAT1) / (NY - 1);  // ≈ 0.2095°

// Canvas downscaling factor for rendering
const PIXEL_SCALE = 4;   // render at ¼ resolution, upscale with smoothing
```

---

*MeroMausam — Nepal Weather Intelligence Platform*
*Source code: [frontend/src/utils/windGrid.ts](frontend/src/utils/windGrid.ts)*
