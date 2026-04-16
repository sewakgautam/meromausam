const API = import.meta.env.VITE_API_URL || '/api';

export interface District {
  id: string;
  name: string;
  nameNepali: string;
  province: string;
  lat: number;
  lon: number;
  elevation: number;
}

export interface Forecast {
  id: string;
  districtId: string;
  validTime: string;
  tempMax: number | null;
  tempMin: number | null;
  feelsLike: number | null;
  precipitation: number | null;
  precipProb: number | null;
  snowfall: number | null;
  weatherCode: number | null;
  weatherDesc: string | null;
  weatherDescNp: string | null;
  windSpeed: number | null;
  windDir: number | null;
  windGust: number | null;
  humidity: number | null;
  uvIndex: number | null;
  cloudCover: number | null;
  isThunderstorm: boolean;
  isHeavyRain: boolean;
  isHailstone: boolean;
  isSnow: boolean;
  isFog: boolean;
  isHeatwave: boolean;
  isColdwave: boolean;
  severity: string;
}

export interface WeatherAlert {
  id: string;
  districtId: string | null;
  province: string | null;
  title: string;
  titleNp: string | null;
  description: string;
  descNp: string | null;
  severity: string;
  alertType: string;
  validFrom: string;
  validUntil: string;
}

export interface MapDistrict extends District {
  forecast: Forecast | null;
}

export interface OverviewData {
  summary: {
    totalDistricts: number;
    avgTemp: number;
    rainyDistricts: number;
    severeDistricts: number;
    activeAlerts: number;
    updatedAt: string;
  };
  districts: MapDistrict[];
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export const api = {
  getOverview: () => get<OverviewData>('/weather/overview'),
  getMapData: () => get<MapDistrict[]>('/weather/map/data'),
  getForecastMatrix: () => get<MapDistrict[][]>('/weather/forecast-matrix'),
  getDistrict: (id: string) => get<{ district: District; forecast: Forecast | null; alerts: WeatherAlert[] }>(`/weather/district/${id}`),
  getForecast: (id: string, days = 7) => get<Forecast[]>(`/weather/district/${id}/forecast?days=${days}`),
  getAlerts: () => get<WeatherAlert[]>('/weather/alerts/active'),
  getSatellite: () => get<Record<string, any[]>>('/weather/satellite/frames'),
  getBulletin: () => get<any>('/weather/bulletin/latest'),
  subscribe: (data: { email: string; districtId: string; alertTypes: string[]; language: string }) =>
    post<{ message: string; status: string }>('/subscriptions', data),
  confirm: (token: string) => get<{ message: string }>(`/subscriptions/confirm/${token}`),
};
