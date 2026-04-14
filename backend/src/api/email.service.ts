import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../models/prisma.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private prisma: PrismaService) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendConfirmationEmail(email: string, token: string, districtName: string) {
    const confirmUrl = `${process.env.APP_URL || 'http://localhost'}/api/subscriptions/confirm/${token}`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body { font-family: 'Segoe UI', sans-serif; background: #f0f4f8; margin: 0; padding: 20px; }
.card { background: white; border-radius: 16px; padding: 32px; max-width: 480px; margin: 0 auto; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
.header { text-align: center; margin-bottom: 24px; }
.logo { font-size: 32px; }
h1 { color: #1a365d; font-size: 22px; margin: 8px 0; }
p { color: #4a5568; line-height: 1.6; }
.btn { display: block; background: linear-gradient(135deg, #2b6cb0, #3182ce); color: white; text-decoration: none; padding: 14px 24px; border-radius: 10px; text-align: center; font-weight: 600; margin: 24px 0; font-size: 16px; }
.district { background: #ebf8ff; border-left: 4px solid #3182ce; padding: 12px 16px; border-radius: 8px; color: #2b6cb0; font-weight: 600; }
.footer { text-align: center; color: #a0aec0; font-size: 12px; margin-top: 24px; }
</style></head>
<body>
<div class="card">
  <div class="header">
    <div class="logo">🌦️</div>
    <h1>MeroMausam — मेरो मौसम</h1>
    <p>Nepal's Weather Intelligence Platform</p>
  </div>
  <p>You've subscribed for weather alerts for:</p>
  <div class="district">📍 ${districtName}</div>
  <p>Click below to confirm your subscription and start receiving daily forecasts and severe weather alerts.</p>
  <a href="${confirmUrl}" class="btn">✅ Confirm Subscription</a>
  <p style="font-size:13px;color:#718096">If you didn't sign up, you can ignore this email. This link expires in 24 hours.</p>
  <div class="footer">MeroMausam • Nepal Weather Intelligence • Data from DHM Nepal & Open-Meteo</div>
</div>
</body>
</html>`;

    try {
      await this.transporter.sendMail({
        from: `"MeroMausam 🌦️" <${process.env.FROM_EMAIL || 'alerts@meromausam.np'}>`,
        to: email,
        subject: `Confirm your MeroMausam alert for ${districtName}`,
        html,
      });
      this.logger.log(`📧 Confirmation email sent to ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send confirmation email: ${err.message}`);
    }
  }

  async sendDailyDigests() {
    const subs = await this.prisma.subscription.findMany({
      where: { isActive: true, confirmed: true },
      include: { district: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let sent = 0;
    for (const sub of subs) {
      try {
        const forecasts = await this.prisma.forecast.findMany({
          where: {
            districtId: sub.districtId,
            validTime: { gte: today },
          },
          orderBy: { validTime: 'asc' },
          take: 5,
        });

        if (forecasts.length === 0) continue;

        const today_fc = forecasts[0];
        const isNepali = sub.language === 'np';

        const weatherEmoji = (code: number) => {
          if (code === 0 || code === 1) return '☀️';
          if (code <= 3) return '⛅';
          if (code <= 48) return '🌫️';
          if (code <= 67) return '🌧️';
          if (code <= 77) return '❄️';
          if (code <= 82) return '🌦️';
          if (code <= 86) return '🌨️';
          if (code >= 95) return '⛈️';
          return '🌤️';
        };

        const emoji = weatherEmoji(today_fc.weatherCode || 0);
        const district = sub.district;
        const severeFlags = [];
        if (today_fc.isThunderstorm) severeFlags.push(isNepali ? '⚡ बज्रपात संभव' : '⚡ Thunderstorm possible');
        if (today_fc.isHeavyRain) severeFlags.push(isNepali ? '🌧️ भारी वर्षा' : '🌧️ Heavy rainfall');
        if (today_fc.isHailstone) severeFlags.push(isNepali ? '🌨️ असिना संभव' : '🌨️ Hailstorm possible');
        if (today_fc.isSnow) severeFlags.push(isNepali ? '❄️ हिमपात' : '❄️ Snowfall expected');

        const subject = isNepali
          ? `${emoji} ${district.nameNepali} को आजको मौसम — ${today_fc.weatherDescNp}`
          : `${emoji} ${district.name} Weather — ${today_fc.weatherDesc}`;

        const html = this.buildDigestEmail(district, forecasts, isNepali, severeFlags, emoji);

        await this.transporter.sendMail({
          from: `"MeroMausam 🌦️" <${process.env.FROM_EMAIL}>`,
          to: sub.email,
          subject,
          html,
        });

        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: { lastSentAt: new Date() },
        });

        sent++;
      } catch (err) {
        this.logger.error(`Failed digest for ${sub.email}: ${err.message}`);
      }
    }

    this.logger.log(`📧 Sent ${sent} daily digest emails`);
  }

  async sendSevereAlerts() {
    const recent = new Date(Date.now() - 60 * 60 * 1000); // last 1 hour

    const alerts = await this.prisma.weatherAlert.findMany({
      where: {
        isActive: true,
        severity: { in: ['orange', 'red'] },
        createdAt: { gte: recent },
      },
    });

    if (alerts.length === 0) return;

    for (const alert of alerts) {
      const subs = await this.prisma.subscription.findMany({
        where: {
          isActive: true,
          confirmed: true,
          ...(alert.districtId ? { districtId: alert.districtId } : {}),
          alertTypes: { hasSome: [alert.alertType] },
        },
        include: { district: true },
      });

      for (const sub of subs) {
        try {
          const severityColor = alert.severity === 'red' ? '#c53030' : '#dd6b20';
          const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:'Segoe UI',sans-serif;background:#f0f4f8;margin:0;padding:20px}
.card{background:white;border-radius:16px;padding:32px;max-width:480px;margin:0 auto}
.alert-banner{background:${severityColor};color:white;padding:16px 20px;border-radius:10px;margin-bottom:20px}
.alert-banner h2{margin:0;font-size:18px}
p{color:#4a5568;line-height:1.6}
.footer{text-align:center;color:#a0aec0;font-size:12px;margin-top:24px}
</style></head><body>
<div class="card">
  <div class="alert-banner">
    <h2>⚠️ ${alert.title}</h2>
    <div style="font-size:13px;opacity:0.9">${sub.district.name} • ${alert.severity.toUpperCase()}</div>
  </div>
  ${alert.titleNp ? `<p style="font-size:16px;font-weight:600;color:#2d3748">🇳🇵 ${alert.titleNp}</p>` : ''}
  <p>${alert.description}</p>
  ${alert.descNp ? `<p style="color:#718096">${alert.descNp}</p>` : ''}
  <p style="font-size:13px">Valid until: ${alert.validUntil.toLocaleString('en-NP', { timeZone: 'Asia/Kathmandu' })}</p>
  <div class="footer">MeroMausam • Nepal Weather Intelligence • <a href="${process.env.APP_URL}">meromausam.np</a></div>
</div></body></html>`;

          await this.transporter.sendMail({
            from: `"MeroMausam ⚠️" <${process.env.FROM_EMAIL}>`,
            to: sub.email,
            subject: `⚠️ ${alert.title} — ${sub.district.name}`,
            html,
          });
        } catch (err) {
          this.logger.error(`Severe alert email failed: ${err.message}`);
        }
      }
    }
  }

  private buildDigestEmail(district: any, forecasts: any[], isNepali: boolean, severeFlags: string[], emoji: string): string {
    const fc = forecasts[0];
    const rows = forecasts.map(f => {
      const d = new Date(f.validTime);
      const dayName = d.toLocaleDateString('en-NP', { weekday: 'short', timeZone: 'Asia/Kathmandu' });
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${dayName}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${isNepali ? f.weatherDescNp : f.weatherDesc}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${f.tempMax?.toFixed(0)}° / ${f.tempMin?.toFixed(0)}°</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${f.precipitation?.toFixed(1) || '0'}mm</td>
      </tr>`;
    }).join('');

    const severeBanner = severeFlags.length > 0 ? `
      <div style="background:#fff5f5;border-left:4px solid #fc8181;padding:12px 16px;border-radius:8px;margin:16px 0">
        <strong style="color:#c53030">⚠️ ${isNepali ? 'विशेष सूचना' : 'Severe Weather Notice'}</strong><br>
        ${severeFlags.map(f => `<span style="color:#742a2a">${f}</span>`).join('<br>')}
      </div>` : '';

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:'Segoe UI',sans-serif;background:#f0f4f8;margin:0;padding:20px}
.card{background:white;border-radius:16px;padding:32px;max-width:520px;margin:0 auto;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
h1{color:#1a365d;font-size:20px;margin:0 0 4px}
.subtitle{color:#718096;font-size:14px}
.main-weather{display:flex;align-items:center;gap:16px;margin:20px 0;padding:20px;background:#ebf8ff;border-radius:12px}
.emoji{font-size:48px}
.temp{font-size:36px;font-weight:700;color:#2b6cb0}
table{width:100%;border-collapse:collapse;margin-top:16px}
th{text-align:left;padding:8px 12px;background:#f7fafc;color:#4a5568;font-size:13px}
td{color:#2d3748;font-size:14px}
.footer{text-align:center;color:#a0aec0;font-size:12px;margin-top:24px}
</style></head><body>
<div class="card">
  <h1>${emoji} ${isNepali ? district.nameNepali : district.name}</h1>
  <div class="subtitle">${isNepali ? 'आजको मौसम पूर्वानुमान' : "Today's Weather Forecast"} • ${new Date().toLocaleDateString('en-NP', { timeZone: 'Asia/Kathmandu', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
  <div class="main-weather">
    <div class="emoji">${emoji}</div>
    <div>
      <div class="temp">${fc.tempMax?.toFixed(0)}°C</div>
      <div style="color:#4a5568">${isNepali ? fc.weatherDescNp : fc.weatherDesc}</div>
      <div style="color:#718096;font-size:13px">Low: ${fc.tempMin?.toFixed(0)}°C • Rain: ${fc.precipitation?.toFixed(1) || '0'}mm • Wind: ${fc.windSpeed?.toFixed(0)} km/h</div>
    </div>
  </div>
  ${severeBanner}
  <table><thead><tr><th>Day</th><th>Condition</th><th>Temp</th><th>Rain</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="footer">MeroMausam • Nepal Weather Intelligence<br>Data sources: DHM Nepal, Open-Meteo, NASA GIBS</div>
</div></body></html>`;
  }
}
