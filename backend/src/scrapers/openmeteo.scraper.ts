import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../models/prisma.service';

// WMO Weather Code to description mapping
const WEATHER_CODES: Record<number, { en: string; np: string; severe: Partial<Record<string, boolean>> }> = {
  0: { en: 'Clear sky', np: 'सफा आकाश', severe: {} },
  1: { en: 'Mainly clear', np: 'मुख्यतः सफा', severe: {} },
  2: { en: 'Partly cloudy', np: 'आंशिक बादल', severe: {} },
  3: { en: 'Overcast', np: 'बादल लागेको', severe: {} },
  45: { en: 'Foggy', np: 'कुहिरो', severe: { isFog: true } },
  48: { en: 'Icy fog', np: 'हिमाली कुहिरो', severe: { isFog: true } },
  51: { en: 'Light drizzle', np: 'हल्का झरी', severe: {} },
  53: { en: 'Moderate drizzle', np: 'मध्यम झरी', severe: {} },
  55: { en: 'Heavy drizzle', np: 'भारी झरी', severe: {} },
  61: { en: 'Slight rain', np: 'हल्का वर्षा', severe: {} },
  63: { en: 'Moderate rain', np: 'मध्यम वर्षा', severe: {} },
  65: { en: 'Heavy rain', np: 'भारी वर्षा', severe: { isHeavyRain: true } },
  71: { en: 'Slight snowfall', np: 'हल्का हिमपात', severe: { isSnow: true } },
  73: { en: 'Moderate snowfall', np: 'मध्यम हिमपात', severe: { isSnow: true } },
  75: { en: 'Heavy snowfall', np: 'भारी हिमपात', severe: { isSnow: true } },
  77: { en: 'Snow grains', np: 'हिमकण', severe: { isSnow: true } },
  80: { en: 'Slight rain showers', np: 'हल्का वर्षा', severe: {} },
  81: { en: 'Moderate rain showers', np: 'मध्यम वर्षा', severe: { isHeavyRain: true } },
  82: { en: 'Violent rain showers', np: 'तीव्र वर्षा', severe: { isHeavyRain: true } },
  85: { en: 'Slight snow showers', np: 'हल्का हिमपात', severe: { isSnow: true } },
  86: { en: 'Heavy snow showers', np: 'भारी हिमपात', severe: { isSnow: true } },
  95: { en: 'Thunderstorm', np: 'बज्रपात', severe: { isThunderstorm: true } },
  96: { en: 'Thunderstorm with hail', np: 'असिनासहित बज्रपात', severe: { isThunderstorm: true, isHailstone: true } },
  99: { en: 'Thunderstorm with heavy hail', np: 'भारी असिनासहित बज्रपात', severe: { isThunderstorm: true, isHailstone: true } },
};

function getSeverity(tempMax: number, precipMm: number, windKmh: number, code: number): string {
  if (precipMm > 50 || [96, 99].includes(code) || windKmh > 80) return 'extreme';
  if (precipMm > 20 || [95].includes(code) || tempMax > 40 || windKmh > 60) return 'warning';
  if (precipMm > 10 || tempMax > 38 || windKmh > 40) return 'watch';
  return 'normal';
}

@Injectable()
export class OpenMeteoScraper {
  private readonly logger = new Logger(OpenMeteoScraper.name);
  private readonly BASE_URL = 'https://api.open-meteo.com/v1/forecast';

  constructor(private prisma: PrismaService) {}

  async fetchAllDistricts() {
    this.logger.log('🌤️ Starting Open-Meteo fetch for all districts...');
    const districts = await this.prisma.district.findMany();
    let success = 0;

    // Batch 10 at a time to avoid rate limiting
    for (let i = 0; i < districts.length; i += 10) {
      const batch = districts.slice(i, i + 10);
      await Promise.all(batch.map(d => this.fetchDistrict(d).then(() => success++).catch(() => {})));
      await new Promise(r => setTimeout(r, 2000)); // 2s between batches to avoid rate limit
    }

    this.logger.log(`✅ Fetched forecasts for ${success}/${districts.length} districts`);
  }

  async fetchDistrict(district: { id: string; lat: number; lon: number; name: string }) {
    try {
      const params = {
        latitude: district.lat,
        longitude: district.lon,
        hourly: [
          'temperature_2m', 'relative_humidity_2m', 'precipitation_probability',
          'precipitation', 'weather_code', 'pressure_msl', 'surface_pressure',
          'cloud_cover', 'visibility', 'wind_speed_10m', 'wind_direction_10m',
          'wind_gusts_10m', 'uv_index', 'snowfall', 'apparent_temperature',
        ].join(','),
        daily: [
          'weather_code', 'temperature_2m_max', 'temperature_2m_min',
          'apparent_temperature_max', 'precipitation_sum', 'precipitation_probability_max',
          'wind_speed_10m_max', 'wind_gusts_10m_max', 'wind_direction_10m_dominant',
          'snowfall_sum', 'uv_index_max', 'sunrise', 'sunset',
        ].join(','),
        timezone: 'Asia/Kathmandu',
        forecast_days: 7,
      };

      const { data } = await axios.get(this.BASE_URL, { params, timeout: 15000 });

      const { daily } = data;
      
      // Delete old forecasts for this district
      await this.prisma.forecast.deleteMany({
        where: {
          districtId: district.id,
          validTime: { gte: new Date() },
        },
      });

      // Insert new daily forecasts
      const forecasts = daily.time.map((dateStr: string, idx: number) => {
        const code = daily.weather_code[idx] || 0;
        const weatherInfo = WEATHER_CODES[code] || { en: 'Unknown', np: 'अज्ञात', severe: {} };
        const tempMax = daily.temperature_2m_max[idx] || 25;
        const precip = daily.precipitation_sum[idx] || 0;
        const wind = daily.wind_speed_10m_max[idx] || 0;

        return {
          districtId: district.id,
          validTime: new Date(dateStr),
          source: 'open-meteo',
          tempMax,
          tempMin: daily.temperature_2m_min[idx],
          feelsLike: daily.apparent_temperature_max[idx],
          precipitation: precip,
          precipProb: daily.precipitation_probability_max[idx],
          snowfall: daily.snowfall_sum[idx],
          weatherCode: code,
          weatherDesc: weatherInfo.en,
          weatherDescNp: weatherInfo.np,
          windSpeed: wind,
          windDir: daily.wind_direction_10m_dominant[idx],
          windGust: daily.wind_gusts_10m_max[idx],
          uvIndex: daily.uv_index_max[idx],
          isThunderstorm: !!(weatherInfo.severe as any).isThunderstorm,
          isHeavyRain: !!(weatherInfo.severe as any).isHeavyRain,
          isHailstone: !!(weatherInfo.severe as any).isHailstone,
          isSnow: !!(weatherInfo.severe as any).isSnow,
          isFog: !!(weatherInfo.severe as any).isFog,
          isHeatwave: tempMax > 38,
          isColdwave: (daily.temperature_2m_min[idx] || 20) < 5,
          severity: getSeverity(tempMax, precip, wind, code),
        };
      });

      await this.prisma.forecast.createMany({ data: forecasts });

      return forecasts;
    } catch (err) {
      this.logger.error(`Failed to fetch ${district.name}: ${err.message}`);
      throw err;
    }
  }
}
