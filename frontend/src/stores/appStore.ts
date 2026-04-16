import { create } from 'zustand';
import { MapDistrict, Forecast, WeatherAlert, OverviewData } from '../utils/api';

interface AppStore {
  // Data
  overview: OverviewData | null;
  mapData: MapDistrict[];          // current day (derived from allDaysData[forecastDayIndex])
  allDaysData: MapDistrict[][];    // 7 days × 78 districts
  alerts: WeatherAlert[];
  selectedDistrict: MapDistrict | null;
  districtForecast: Forecast[];

  // UI state
  activeLayer: 'temperature' | 'precipitation' | 'wind' | 'satellite';
  sidebarTab: 'forecast' | 'alerts' | 'subscribe';
  showSidebar: boolean;
  lang: 'en' | 'np';
  loading: boolean;
  alertsLoading: boolean;
  forecastDayIndex: number;        // 0 = today … 6 = +6 days
  satelliteBase: boolean;          // show satellite basemap under weather layers
  particleDensity: number;         // 0–2 multiplier for wind particle count

  // Actions
  setOverview: (d: OverviewData) => void;
  setMapData: (d: MapDistrict[]) => void;
  setAllDaysData: (d: MapDistrict[][]) => void;
  setAlerts: (a: WeatherAlert[]) => void;
  setSelectedDistrict: (d: MapDistrict | null) => void;
  setDistrictForecast: (f: Forecast[]) => void;
  setActiveLayer: (l: AppStore['activeLayer']) => void;
  setSidebarTab: (t: AppStore['sidebarTab']) => void;
  setShowSidebar: (s: boolean) => void;
  toggleLang: () => void;
  setLoading: (v: boolean) => void;
  setAlertsLoading: (v: boolean) => void;
  setForecastDayIndex: (i: number) => void;
  toggleSatelliteBase: () => void;
  setParticleDensity: (v: number) => void;
}

export const useStore = create<AppStore>((set, get) => ({
  overview: null,
  mapData: [],
  allDaysData: [],
  alerts: [],
  selectedDistrict: null,
  districtForecast: [],
  activeLayer: 'temperature',
  sidebarTab: 'forecast',
  showSidebar: false,
  lang: 'en',
  loading: true,
  alertsLoading: false,
  forecastDayIndex: 0,
  satelliteBase: false,
  particleDensity: 1,

  setOverview: (overview) => set({ overview }),
  setMapData: (mapData) => set({ mapData }),
  setAllDaysData: (allDaysData) => {
    const forecastDayIndex = get().forecastDayIndex;
    const mapData = allDaysData[forecastDayIndex] ?? allDaysData[0] ?? [];
    set({ allDaysData, mapData });
  },
  setAlerts: (alerts) => set({ alerts }),
  setSelectedDistrict: (selectedDistrict) => set({ selectedDistrict, showSidebar: !!selectedDistrict }),
  setDistrictForecast: (districtForecast) => set({ districtForecast }),
  setActiveLayer: (activeLayer) => set({ activeLayer }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  setShowSidebar: (showSidebar) => set({ showSidebar }),
  toggleLang: () => set((s) => ({ lang: s.lang === 'en' ? 'np' : 'en' })),
  setLoading: (loading) => set({ loading }),
  setAlertsLoading: (alertsLoading) => set({ alertsLoading }),
  setForecastDayIndex: (forecastDayIndex) => {
    const { allDaysData } = get();
    const mapData = allDaysData[forecastDayIndex] ?? allDaysData[0] ?? [];
    set({ forecastDayIndex, mapData });
  },
  toggleSatelliteBase: () => set((s) => ({ satelliteBase: !s.satelliteBase })),
  setParticleDensity: (particleDensity) => set({ particleDensity }),
}));
