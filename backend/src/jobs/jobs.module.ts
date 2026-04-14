import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { ScraperModule } from '../scrapers/scraper.module';
import { AlertModule } from '../api/alert.module';
import { SubscriptionModule } from '../api/subscription.module';

@Module({
  imports: [ScraperModule, AlertModule, SubscriptionModule],
  providers: [JobsService],
})
export class JobsModule {}
