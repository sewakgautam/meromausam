import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OpenMeteoScraper } from '../scrapers/openmeteo.scraper';
import { DhmScraper } from '../scrapers/dhm.scraper';
import { SatelliteScraper } from '../scrapers/satellite.scraper';
import { AlertService } from '../api/alert.service';
import { EmailService } from '../api/email.service';

@Injectable()
export class JobsService implements OnModuleInit {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private openMeteo: OpenMeteoScraper,
    private dhm: DhmScraper,
    private satellite: SatelliteScraper,
    private alertService: AlertService,
    private emailService: EmailService,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 Running initial data fetch on startup...');
    // Stagger startup fetches
    setTimeout(() => this.fetchWeatherData(), 3000);
    setTimeout(() => this.fetchSatelliteData(), 8000);
    setTimeout(() => this.fetchDhmData(), 15000);
  }

  // Fetch Open-Meteo every 3 hours
  @Cron('0 */3 * * *')
  async fetchWeatherData() {
    this.logger.log('⏰ Cron: Fetching weather forecasts...');
    try {
      await this.openMeteo.fetchAllDistricts();
      await this.alertService.checkAndCreateAlerts();
    } catch (err) {
      this.logger.error(`Weather fetch cron failed: ${err.message}`);
    }
  }

  // Fetch satellite imagery every 30 minutes
  @Cron('*/30 * * * *')
  async fetchSatelliteData() {
    this.logger.log('⏰ Cron: Fetching satellite data...');
    try {
      await this.satellite.fetchHimawariFrames();
      await this.satellite.fetchNasaGibsInfo();
    } catch (err) {
      this.logger.error(`Satellite fetch cron failed: ${err.message}`);
    }
  }

  // Scrape DHM every 6 hours
  @Cron('0 */6 * * *')
  async fetchDhmData() {
    this.logger.log('⏰ Cron: Scraping DHM data...');
    try {
      await this.dhm.scrapeWeatherBulletin();
    } catch (err) {
      this.logger.error(`DHM scrape cron failed: ${err.message}`);
    }
  }

  // Send daily digest at 6 AM Nepal time (12:15 AM UTC)
  @Cron('15 0 * * *')
  async sendDailyDigest() {
    this.logger.log('⏰ Cron: Sending daily digest emails...');
    try {
      await this.emailService.sendDailyDigests();
    } catch (err) {
      this.logger.error(`Daily digest cron failed: ${err.message}`);
    }
  }

  // Check for severe weather alerts every hour
  @Cron(CronExpression.EVERY_HOUR)
  async checkSevereWeather() {
    this.logger.log('⏰ Cron: Checking severe weather...');
    try {
      await this.alertService.checkAndCreateAlerts();
      await this.emailService.sendSevereAlerts();
    } catch (err) {
      this.logger.error(`Severe weather check failed: ${err.message}`);
    }
  }
}
