import { Module } from '@nestjs/common';
import { OpenMeteoScraper } from './openmeteo.scraper';
import { DhmScraper } from './dhm.scraper';
import { SatelliteScraper } from './satellite.scraper';

@Module({
  providers: [OpenMeteoScraper, DhmScraper, SatelliteScraper],
  exports: [OpenMeteoScraper, DhmScraper, SatelliteScraper],
})
export class ScraperModule {}
