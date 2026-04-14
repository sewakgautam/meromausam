import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../models/prisma.service';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(private prisma: PrismaService) {}

  async getAllDistricts() {
    return this.prisma.district.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getDistrictWeather(districtId: string) {
    const district = await this.prisma.district.findUnique({
      where: { id: districtId },
    });
    if (!district) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const forecast = await this.prisma.forecast.findFirst({
      where: {
        districtId,
        validTime: { gte: today },
      },
      orderBy: { validTime: 'asc' },
    });

    const alerts = await this.prisma.weatherAlert.findMany({
      where: {
        OR: [
          { districtId },
          { province: district.province },
        ],
        isActive: true,
        validUntil: { gte: new Date() },
      },
    });

    return { district, forecast, alerts };
  }

  async getDistrictForecast(districtId: string, days: number = 7) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(end.getDate() + days);

    return this.prisma.forecast.findMany({
      where: {
        districtId,
        validTime: { gte: today, lte: end },
      },
      orderBy: { validTime: 'asc' },
    });
  }

  async getNepalOverview() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const districts = await this.prisma.district.findMany();
    const forecasts = await this.prisma.forecast.findMany({
      where: { validTime: { gte: today } },
      orderBy: { validTime: 'asc' },
    });

    // Group forecast by district (first/today's)
    const forecastMap: Record<string, any> = {};
    for (const f of forecasts) {
      if (!forecastMap[f.districtId]) {
        forecastMap[f.districtId] = f;
      }
    }

    const activeAlerts = await this.prisma.weatherAlert.count({
      where: { isActive: true, validUntil: { gte: new Date() } },
    });

    // Summary stats
    const temps = Object.values(forecastMap).map((f: any) => f.tempMax).filter(Boolean);
    const avgTemp = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : 0;
    const rainyDistricts = Object.values(forecastMap).filter((f: any) => (f.precipitation || 0) > 1).length;
    const severeDistricts = Object.values(forecastMap).filter((f: any) =>
      f.severity === 'warning' || f.severity === 'extreme'
    ).length;

    return {
      summary: {
        totalDistricts: districts.length,
        avgTemp: Math.round(avgTemp * 10) / 10,
        rainyDistricts,
        severeDistricts,
        activeAlerts,
        updatedAt: new Date(),
      },
      districts: districts.map(d => ({
        ...d,
        forecast: forecastMap[d.id] || null,
      })),
    };
  }

  async getActiveAlerts() {
    return this.prisma.weatherAlert.findMany({
      where: {
        isActive: true,
        validUntil: { gte: new Date() },
      },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getSatelliteFrames() {
    const frames = await this.prisma.satelliteFrame.findMany({
      orderBy: { frameTime: 'desc' },
      take: 30,
    });

    // Group by source+band
    const grouped: Record<string, any[]> = {};
    for (const f of frames) {
      const key = `${f.source}-${f.band}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(f);
    }

    return grouped;
  }

  async getMapData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const data = await this.prisma.district.findMany({
      include: {
        forecasts: {
          where: { validTime: { gte: today } },
          orderBy: { validTime: 'asc' },
          take: 1,
        },
      },
    });

    return data.map(d => ({
      id: d.id,
      name: d.name,
      nameNepali: d.nameNepali,
      province: d.province,
      lat: d.lat,
      lon: d.lon,
      elevation: d.elevation,
      forecast: d.forecasts[0] || null,
    }));
  }

  async getLatestBulletin() {
    return this.prisma.dhmBulletin.findFirst({
      orderBy: { bulletinDate: 'desc' },
    });
  }
}
