# MeroMausam — मेरो मौसम
### What is this project? (Explained like you're telling a friend over tea)

---

## The One-Line Answer

**MeroMausam is a live weather dashboard for all 77 districts of Nepal — it shows rain, wind, temperature and danger alerts on a map, updates automatically, and can email you when a storm is coming to your district.**

---

## The Problem It Solves

Nepal's official weather department (DHM) publishes forecasts, but:
- Their website is hard to read
- Data is not shown on a visual map
- There's no easy way to get alerted when something dangerous is coming to *your* specific district
- Everything is in English or technical language

MeroMausam takes all that raw data and turns it into a map anyone can understand.

---

## How It Works — The Big Picture

Think of it like a news channel for weather. There are three jobs happening behind the scenes:

```
[Weather Sources] → [Our Brain] → [Your Screen]
```

1. **Weather Sources** — external services that have the actual weather data
2. **Our Brain (the backend)** — a server that collects, stores, and processes that data
3. **Your Screen (the frontend)** — the interactive map you see in the browser

---

## Step 1 — Where Does the Weather Data Come From?

The system pulls from **3 real sources**, automatically, every few hours:

### 🌐 Open-Meteo (the main one)
- A free, open weather API used by researchers worldwide
- We call it every **3 hours** for all 77 districts
- It gives us: temperature, rainfall, wind speed, wind direction, snowfall, cloud cover, humidity, UV index, and a weather "code" (like code 95 = thunderstorm)
- Think of it like asking a very smart calculator: *"Given the atmosphere data right now over Kathmandu, what will the weather be for the next 7 days?"*

### 🏛️ DHM Nepal (Department of Hydrology and Meteorology)
- Nepal's own official weather authority
- We scrape (automatically read) their website every **6 hours**
- This gives us official weather bulletins and warnings issued by the Nepal government
- Think of it as checking the government's notice board and copying down whatever new warning they posted

### 🛰️ NASA GIBS + Himawari-9 Satellite
- Free satellite imagery from NASA and the Japanese Meteorological Agency
- Actual photos of clouds over Nepal taken from space
- Updated every **30 minutes**
- This powers the "Satellite" layer on the map — real cloud cover you can see

---

## Step 2 — What Does the Backend Do With All That?

The backend is the engine room. It's built with **NestJS** (a Node.js framework) and stores everything in a **PostgreSQL database** via Prisma.

Here's what it does automatically, on a schedule:

| When | What happens |
|---|---|
| Every 3 hours | Fetches 7-day forecasts for all 77 districts from Open-Meteo |
| Every 3 hours | Checks if any district has dangerous weather → creates alerts |
| Every 6 hours | Scrapes DHM Nepal's website for official warnings |
| Every 30 min | Updates satellite imagery metadata |
| Every hour | Checks if severe alerts need to be emailed to subscribers |
| 6 AM Nepal time | Sends daily weather digest emails to all subscribers |

### The Alert Brain
After every weather fetch, the system automatically reads through all the forecasts and asks: *"Is anything dangerous happening in the next 48 hours?"*

It looks for:
- Thunderstorms (बज्रपात)
- Heavy rain (भारी वर्षा) — over 20mm
- Hailstorms (असिना)
- Snowfall (हिमपात)
- Heat waves (तापलहर) — over 40°C
- Extreme wind (over 60 km/h)

If it finds something, it creates a **red** (extreme) or **orange** (warning) alert and stores it. If the danger period has passed, the alert is automatically deactivated.

### Real-Time Updates (WebSocket)
The backend also has a live connection system. When new data arrives, it can push updates to your browser instantly — no need to refresh the page. Think of it like WhatsApp messages vs. emails. You subscribe to a district's "room" and get notified in real time.

---

## Step 3 — What Do You See on Screen?

The frontend is built with **React** and **Leaflet** (a mapping library).

### The Map
The base map is CartoCDN's light map (like a clean version of Google Maps). On top of that, we draw our own layers:

**🌡️ Temperature Layer**
- Every district's max temperature is stored as a point on the map
- We run a math algorithm (IDW — Inverse Distance Weighting) to fill in the space *between* districts with estimated temperatures
- Then we colour every pixel: deep blue = cold, green = mild, yellow = warm, orange/red = hot
- Result: a smooth continuous heatmap over Nepal, not just dots

**🌧️ Precipitation Layer**
- Same idea but for rainfall in millimetres
- Dry areas are transparent, light rain is light blue, heavy rain is dark purple/red

**💨 Wind Layer**
- 3,500 tiny animated particles fly across the screen
- Each particle moves in the actual wind direction for that location (from a grid we compute using the district data)
- The colour changes: blue = calm, teal = gentle breeze, yellow = strong, orange/red = dangerous
- This is what meteorologists call a "streamline" or "particle flow" visualization — same style as windy.com

**🛰️ Satellite Layer**
- Switches the base map from CartoCDN tiles to NASA satellite imagery
- Three modes: True Color (what your eye would see from space), Infrared (shows cloud-top temperatures), Cloud Cover
- Data is from yesterday (NASA has a ~1 day processing lag)

### Clicking a District
When you click any district dot on the map, a sidebar opens showing:
- Today's max/min temperature
- Rainfall, wind speed, precipitation probability
- 7-day forecast chart
- Any active severe weather alerts for that district

### The Alert Banner
If any orange or red alert is active anywhere in Nepal, a scrolling ticker appears at the top of the screen — like a news channel breaking news bar — showing the warning in both English and Nepali.

### The Time Slider
The 7 buttons at the bottom (Today, Tomorrow, +2, +3...) let you scrub through 7 days of forecasts. The entire map re-renders with that day's data.

---

## The Email Subscription System

A user can subscribe to any district by entering their email. Here's the flow:

```
User enters email → System saves subscription (unconfirmed)
→ Sends confirmation email → User clicks link → Subscription activated
→ Every morning at 6 AM: receives daily weather digest
→ If orange/red alert happens: receives instant alert email
```

The confirmation step exists so that no one can sign someone else up for spam. The email is sent via Outlook SMTP (`info@krishipatro.com`).

---

## The Tech Stack — What Is All This Built With?

| Part | Technology | What It's Like |
|---|---|---|
| Map UI | React + Leaflet | The interactive webpage |
| State management | Zustand | The memory that holds map data |
| Wind/gradient drawing | HTML5 Canvas | Like a digital painting layer on top of the map |
| Backend server | NestJS (Node.js) | The brain that handles all requests |
| Database | PostgreSQL + Prisma | The filing cabinet storing all weather data |
| Scheduled jobs | @nestjs/schedule (cron) | An alarm clock that triggers data fetches |
| Real-time | Socket.io WebSocket | Live push notifications to the browser |
| Email | Nodemailer + Outlook SMTP | Sends alert and digest emails |
| Satellite tiles | NASA GIBS WMTS | Free satellite imagery over Nepal |
| Weather data | Open-Meteo API | Free 7-day forecast for any coordinates |
| Government data | DHM Nepal (web scraping) | Reads Nepal's official weather website |

---

## Folder Structure — What Lives Where

```
meromausam-platform/
│
├── frontend/          ← Everything you see in the browser
│   └── src/
│       ├── components/    ← Each piece of the UI (map, sidebar, topbar...)
│       ├── stores/        ← The app's memory (what data is loaded, which layer is active)
│       └── utils/         ← Helper math (wind grid, colour scales, weather codes)
│
└── backend/           ← The server (runs 24/7, not in your browser)
    └── src/
        ├── api/           ← Endpoints the frontend calls (get forecasts, subscribe...)
        ├── scrapers/      ← Robots that fetch data from Open-Meteo, DHM, NASA
        ├── jobs/          ← The cron scheduler (runs scrapers on a timer)
        └── models/        ← Database setup and queries
```

---

## A Typical Day in the Life of MeroMausam

```
3:00 AM  → Cron fires: fetch 7-day forecasts for all 77 districts from Open-Meteo
3:05 AM  → Alert brain runs: finds heavy rain warning in Sindhupalchok → creates orange alert
3:05 AM  → 15 subscribers in Sindhupalchok receive an email: "Heavy Rainfall Warning"
6:00 AM  → Cron fires: send morning digest to all active subscribers across Nepal
6:00 AM  → Sewak opens meromausam.np in his browser
6:00 AM  → Browser calls /api/weather/forecast-matrix → gets 7-day data for all 77 districts
6:01 AM  → Map loads with temperature heatmap, wind particles animated, alert ticker scrolling
9:00 AM  → Cron fires again: fresh forecasts fetched, map data updated in database
9:00 AM  → Any browser open to the site receives the update live via WebSocket
```

---

## Why Is This Useful?

Nepal has extreme geography — from the Terai plains at 60m elevation to Himalayan peaks at 8,000m+ — all within ~200km. Weather can be drastically different between neighbouring districts. A flash flood warning in Chitwan is irrelevant to someone in Jumla. This system gives **district-level, actionable weather intelligence** to people who need it, in both English and Nepali, for free.

---

*Built with ❤️ for Nepal. Data from DHM Nepal, Open-Meteo, and NASA GIBS.*
