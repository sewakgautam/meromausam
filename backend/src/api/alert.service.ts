import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../models/prisma.service';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(private prisma: PrismaService) {}

  async checkAndCreateAlerts() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 2);

    const severeForecasts = await this.prisma.forecast.findMany({
      where: {
        validTime: { gte: today, lte: tomorrow },
        OR: [
          { severity: 'warning' },
          { severity: 'extreme' },
          { isThunderstorm: true },
          { isHeavyRain: true },
          { isHailstone: true },
        ],
      },
      include: { district: true },
    });

    for (const f of severeForecasts) {
      const type = f.isThunderstorm ? 'thunder'
        : f.isHailstone ? 'hail'
        : f.isHeavyRain ? 'rain'
        : f.isSnow ? 'snow'
        : f.isHeatwave ? 'heatwave'
        : 'rain';

      const titleMap: Record<string, { en: string; np: string }> = {
        thunder: { en: 'Thunderstorm Warning', np: 'बज्रपात चेतावनी' },
        hail: { en: 'Hailstorm Warning', np: 'असिना चेतावनी' },
        rain: { en: 'Heavy Rainfall Warning', np: 'भारी वर्षा चेतावनी' },
        snow: { en: 'Snowfall Warning', np: 'हिमपात चेतावनी' },
        heatwave: { en: 'Heat Wave Warning', np: 'तापलहर चेतावनी' },
        flood: { en: 'Flood Warning', np: 'बाढी चेतावनी' },
        fog: { en: 'Dense Fog Warning', np: 'घना कुहिरो चेतावनी' },
        cold: { en: 'Cold Wave Warning', np: 'शीतलहर चेतावनी' },
        wind: { en: 'Strong Wind Warning', np: 'तेज हावा चेतावनी' },
      };

      const titles = titleMap[type] || { en: 'Weather Warning', np: 'मौसम चेतावनी' };

      const desc = `${f.weatherDesc} expected in ${f.district.name}. Max temp: ${f.tempMax?.toFixed(1)}°C, Precipitation: ${f.precipitation?.toFixed(1)}mm, Wind: ${f.windSpeed?.toFixed(1)} km/h`;
      const descNp = `${f.district.nameNepali}मा ${f.weatherDescNp} अपेक्षित। अधिकतम तापक्रम: ${f.tempMax?.toFixed(1)}°C, वर्षा: ${f.precipitation?.toFixed(1)}mm`;

      await this.prisma.weatherAlert.upsert({
        where: { id: `auto-${f.districtId}-${f.validTime.toISOString().slice(0, 10)}-${type}` },
        update: { description: desc, descNp, isActive: true },
        create: {
          id: `auto-${f.districtId}-${f.validTime.toISOString().slice(0, 10)}-${type}`,
          districtId: f.districtId,
          province: f.district.province,
          title: titles.en,
          titleNp: titles.np,
          description: desc,
          descNp,
          severity: f.severity === 'extreme' ? 'red' : 'orange',
          alertType: type,
          validFrom: f.validTime,
          validUntil: new Date(f.validTime.getTime() + 24 * 60 * 60 * 1000),
          source: 'system',
        },
      });
    }

    // Deactivate expired alerts
    await this.prisma.weatherAlert.updateMany({
      where: { validUntil: { lt: new Date() }, isActive: true },
      data: { isActive: false },
    });

    if (severeForecasts.length > 0) {
      this.logger.log(`✅ Created/updated ${severeForecasts.length} weather alerts`);
    }
  }
}
