import { create } from 'zustand';
import { MapDistrict, Forecast, WeatherAlert, OverviewData } from '../utils/api';

interface AppStore {
  // Data
  overview: OverviewData | null;
  mapData: MapDistrict[];
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

  // Actions
  setOverview: (d: OverviewData) => void;
  setMapData: (d: MapDistrict[]) => void;
  setAlerts: (a: WeatherAlert[]) => void;
  setSelectedDistrict: (d: MapDistrict | null) => void;
  setDistrictForecast: (f: Forecast[]) => void;
  setActiveLayer: (l: AppStore['activeLayer']) => void;
  setSidebarTab: (t: AppStore['sidebarTab']) => void;
  setShowSidebar: (s: boolean) => void;
  toggleLang: () => void;
  setLoading: (v: boolean) => void;
  setAlertsLoading: (v: boolean) => void;
}

export const useStore = create<AppStore>((set) => ({
  overview: null,
  mapData: [],
  alerts: [],
  selectedDistrict: null,
  districtForecast: [],
  activeLayer: 'temperature',
  sidebarTab: 'forecast',
  showSidebar: false,
  lang: 'en',
  loading: true,
  alertsLoading: false,

  setOverview: (overview) => set({ overview }),
  setMapData: (mapData) => set({ mapData }),
  setAlerts: (alerts) => set({ alerts }),
  setSelectedDistrict: (selectedDistrict) => set({ selectedDistrict, showSidebar: !!selectedDistrict }),
  setDistrictForecast: (districtForecast) => set({ districtForecast }),
  setActiveLayer: (activeLayer) => set({ activeLayer }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  setShowSidebar: (showSidebar) => set({ showSidebar }),
  toggleLang: () => set((s) => ({ lang: s.lang === 'en' ? 'np' : 'en' })),
  setLoading: (loading) => set({ loading }),
  setAlertsLoading: (alertsLoading) => set({ alertsLoading }),
}));
