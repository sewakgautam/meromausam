import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaService } from '../models/prisma.service';

@Injectable()
export class DhmScraper {
  private readonly logger = new Logger(DhmScraper.name);
  private readonly BASE_URL = 'https://www.dhm.gov.np';

  constructor(private prisma: PrismaService) {}

  async scrapeWeatherBulletin() {
    this.logger.log('📡 Scraping DHM weather bulletins...');
    try {
      await this.scrapeDailyForecast();
      await this.scrapeWeatherWarnings();
    } catch (err) {
      this.logger.error(`DHM scrape failed: ${err.message}`);
    }
  }

  private async scrapeDailyForecast() {
    try {
      const { data: html } = await axios.get(
        `${this.BASE_URL}/meteorological-forecasting`,
        { timeout: 15000, headers: { 'User-Agent': 'MeroMausam/1.0 Nepal Weather Platform' } }
      );

      const $ = cheerio.load(html);
      
      // Scrape forecast text sections
      const forecasts: string[] = [];
      $('.forecast-content, .weather-forecast, .bulletin-content, article p').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 50) forecasts.push(text);
      });

      if (forecasts.length > 0) {
        await this.prisma.dhmBulletin.create({
          data: {
            title: `DHM Daily Forecast - ${new Date().toDateString()}`,
            content: forecasts.join('\n\n'),
            bulletinDate: new Date(),
            bulletinType: 'daily',
            url: `${this.BASE_URL}/meteorological-forecasting`,
          },
        });
        this.logger.log(`✅ Saved DHM daily forecast bulletin`);
      }
    } catch (err) {
      this.logger.warn(`DHM daily forecast scrape failed: ${err.message}`);
    }
  }

  private async scrapeWeatherWarnings() {
    try {
      const { data: html } = await axios.get(
        `${this.BASE_URL}/weather-warning`,
        { timeout: 15000, headers: { 'User-Agent': 'MeroMausam/1.0 Nepal Weather Platform' } }
      );

      const $ = cheerio.load(html);
      
      const warnings: Array<{ title: string; content: string; severity: string }> = [];
      
      // Try to find warning items
      $('.warning-item, .alert-item, .warning-content, .weather-warning').each((_, el) => {
        const title = $(el).find('h2, h3, h4, .title').first().text().trim() || 'Weather Warning';
        const content = $(el).find('p, .content, .description').first().text().trim();
        const severity = this.detectSeverity(title + ' ' + content);
        
        if (content) {
          warnings.push({ title, content, severity });
        }
      });

      // Save warnings as alerts
      for (const w of warnings) {
        await this.prisma.weatherAlert.upsert({
          where: {
            id: `dhm-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          },
          update: {},
          create: {
            id: `dhm-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            title: w.title,
            description: w.content,
            severity: w.severity,
            alertType: this.detectAlertType(w.title + ' ' + w.content),
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
            source: 'dhm',
          },
        });
      }

      if (warnings.length > 0) {
        this.logger.log(`✅ Saved ${warnings.length} DHM warnings`);
      }
    } catch (err) {
      this.logger.warn(`DHM warnings scrape failed: ${err.message}`);
    }
  }

  private detectSeverity(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('extreme') || lower.includes('red') || lower.includes('very heavy')) return 'red';
    if (lower.includes('warning') || lower.includes('orange') || lower.includes('heavy')) return 'orange';
    if (lower.includes('watch') || lower.includes('yellow') || lower.includes('moderate')) return 'yellow';
    return 'green';
  }

  private detectAlertType(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('thunder') || lower.includes('lightning') || lower.includes('बज्र')) return 'thunder';
    if (lower.includes('flood') || lower.includes('बाढी')) return 'flood';
    if (lower.includes('snow') || lower.includes('हिमपात')) return 'snow';
    if (lower.includes('hail') || lower.includes('असिना')) return 'hail';
    if (lower.includes('heat') || lower.includes('तापक्रम')) return 'heatwave';
    if (lower.includes('fog') || lower.includes('कुहिरो')) return 'fog';
    if (lower.includes('wind') || lower.includes('हावा')) return 'wind';
    if (lower.includes('cold') || lower.includes('चिसो')) return 'cold';
    return 'rain';
  }

  async scrapeCurrentObservations() {
    this.logger.log('📊 Scraping DHM station observations...');
    try {
      // Try to get station data from DHM's observation page
      const { data: html } = await axios.get(
        `${this.BASE_URL}/meteorological-observation`,
        { timeout: 15000, headers: { 'User-Agent': 'MeroMausam/1.0' } }
      );

      const $ = cheerio.load(html);
      const observations: any[] = [];

      // Parse observation tables
      $('table tr').each((_, row) => {
        const cols = $(row).find('td').map((_, td) => $(td).text().trim()).get();
        if (cols.length >= 3) {
          observations.push(cols);
        }
      });

      this.logger.log(`Found ${observations.length} station rows from DHM`);
    } catch (err) {
      this.logger.warn(`DHM observations scrape failed: ${err.message}`);
    }
  }
}
