import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './models/prisma.module';
import { WeatherModule } from './api/weather.module';
import { ScraperModule } from './scrapers/scraper.module';
import { JobsModule } from './jobs/jobs.module';
import { AlertModule } from './api/alert.module';
import { SubscriptionModule } from './api/subscription.module';
import { GatewayModule } from './api/gateway.module';
import { SeedModule } from './models/seed.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    SeedModule,
    WeatherModule,
    ScraperModule,
    JobsModule,
    AlertModule,
    SubscriptionModule,
    GatewayModule,
  ],
})
export class AppModule {}
