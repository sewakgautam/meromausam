import { Module } from '@nestjs/common';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { HealthController } from './health.controller';

@Module({
  controllers: [WeatherController, HealthController],
  providers: [WeatherService],
  exports: [WeatherService],
})
export class WeatherModule {}
