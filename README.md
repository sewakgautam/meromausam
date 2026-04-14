# 🌦️ MeroMausam — मेरो मौसम
**Nepal's Weather Intelligence Platform**

> Real-time weather forecasts, satellite imagery, and severe weather alerts for all 77 districts of Nepal. Built for local users, in Nepali and English.

---

## 🗺️ What it does

- **Interactive map** of Nepal with live weather overlays — temperature, rainfall, wind, satellite conditions
- **77 district forecasts** updated every 3 hours from Open-Meteo (free, no API key)
- **DHM Nepal scraper** — pulls official bulletins and warnings from dhm.gov.np
- **Severe weather alerts** — auto-generated from forecast thresholds + DHM data
- **Email subscriptions** — daily digest at 6am NPT + immediate severe weather alerts
- **Bilingual** — full Nepali (Devanagari) + English support
- **100% free data sources** — no paid APIs

---

## 📡 Data Sources (all free)

| Source | What | How |
|--------|------|-----|
| [Open-Meteo](https://open-meteo.com) | Hourly + daily forecasts for all districts | Free REST API |
| [DHM Nepal](https://dhm.gov.np) | Official bulletins, warnings, observations | Web scraper |
| [Himawari-9 via RAMMB](https://rammb-slider.cira.colostate.edu) | Satellite cloud imagery | Free tiles |
| [NASA GIBS](https://wiki.earthdata.nasa.gov/display/GIBS) | MODIS cloud, temp, precipitation tiles | Free WMTS |
| [CARTO Dark Tiles](https://carto.com/basemaps) | Dark map base tiles | Free |

---

## 🚀 Quick Start

### Prerequisites
- Docker + Docker Compose
- (Optional) Gmail account for email alerts

### 1. Clone and configure

```bash
git clone <repo>
cd meromausam
cp .env.example .env
# Edit .env with your email settings
```

### 2. Launch

```bash
docker compose up -d
```

That's it. Open **http://localhost** in your browser.

First run takes ~3 minutes to:
1. Start PostgreSQL + Redis
2. Build and launch backend + frontend
3. Seed all 77 Nepal districts
4. Fetch initial weather data from Open-Meteo

---

## 🏗️ Architecture

```
meromausam/
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── scrapers/        # Open-Meteo, DHM, Satellite scrapers
│   │   ├── api/             # Weather, Alerts, Subscriptions controllers
│   │   ├── jobs/            # Cron jobs (data refresh, email sends)
│   │   └── models/          # Prisma service + district seed data
│   └── prisma/schema.prisma # PostgreSQL schema
│
├── frontend/                # React + Vite + Tailwind
│   └── src/
│       ├── components/      # Map, Sidebar, Panels, TopBar
│       ├── stores/          # Zustand state
│       └── utils/           # API client, weather helpers
│
├── nginx/                   # Reverse proxy config
└── docker-compose.yml       # Full stack orchestration
```

### Services
| Service | Port | Purpose |
|---------|------|---------|
| nginx | 80 | Reverse proxy |
| frontend | 3000 | React app |
| backend | 3001 | NestJS API |
| db | 5432 | PostgreSQL + PostGIS |
| redis | 6379 | Queue + cache |

---

## ⏰ Data Refresh Schedule

| Job | Frequency | What |
|-----|-----------|------|
| Open-Meteo forecast | Every 3 hours | 7-day forecasts all 77 districts |
| Satellite frames | Every 30 min | Himawari + NASA GIBS metadata |
| DHM scraper | Every 6 hours | Bulletins + warnings |
| Severe alert check | Every hour | Auto-generate alerts from thresholds |
| Daily digest emails | 6:00 AM NPT | Email to confirmed subscribers |
| Severe alert emails | Triggered | On new red/orange alerts |

---

## 📧 Email Setup (optional)

For email alerts, add to `.env`:

**Gmail (recommended for testing):**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx   # App Password (not your login password)
```
Create a Gmail App Password: Google Account → Security → 2-Step Verification → App passwords

**Free production alternatives:**
- [Brevo](https://brevo.com) — 300 emails/day free
- [Mailjet](https://mailjet.com) — 200 emails/day free
- [Resend](https://resend.com) — 3,000 emails/month free

---

## 🗺️ Map Layers

| Layer | Shows | Color scale |
|-------|-------|------------|
| Temperature | Max daily temp per district | Blue (cold) → Green → Yellow → Red (hot) |
| Precipitation | Daily rainfall in mm | Transparent (dry) → Dark blue (heavy) |
| Wind | Wind speed km/h | Blue (calm) → Red (severe) |
| Satellite | Weather condition icons | Emoji per WMO weather code |

---

## 🔧 API Endpoints

```
GET  /api/weather/overview          — National summary + all districts
GET  /api/weather/map/data          — Map markers data
GET  /api/weather/district/:id      — Single district weather
GET  /api/weather/district/:id/forecast?days=7
GET  /api/weather/alerts/active     — All active alerts
GET  /api/weather/satellite/frames  — Latest satellite imagery metadata
GET  /api/weather/bulletin/latest   — Latest DHM bulletin

POST /api/subscriptions             — Subscribe email
GET  /api/subscriptions/confirm/:token
DELETE /api/subscriptions/:token    — Unsubscribe
```

---

## 🛣️ Roadmap

- [ ] SMS alerts via Sparrow SMS (Nepal-based, free tier)
- [ ] Historical data charts (temperature/rainfall trends)
- [ ] River flood risk integration (from FloodWatch)
- [ ] Mobile PWA (add to homescreen)
- [ ] Monsoon onset tracker
- [ ] Air quality overlay (WAQI free API)
- [ ] Nepali language voice summary

---

## 📝 License

MIT — free to use, deploy, and build upon.

**Data attribution:** DHM Nepal · Open-Meteo · NASA GIBS · RAMMB/CIRA · OpenStreetMap · CARTO
