import { Controller, Get, Param, Query } from '@nestjs/common';
import { WeatherService } from './weather.service';

@Controller('weather')
export class WeatherController {
  constructor(private weatherService: WeatherService) {}

  @Get('districts')
  async getAllDistricts() {
    return this.weatherService.getAllDistricts();
  }

  @Get('overview')
  async getOverview() {
    return this.weatherService.getNepalOverview();
  }

  @Get('district/:id')
  async getDistrict(@Param('id') id: string) {
    return this.weatherService.getDistrictWeather(id);
  }

  @Get('district/:id/forecast')
  async getForecast(@Param('id') id: string, @Query('days') days: string) {
    return this.weatherService.getDistrictForecast(id, parseInt(days) || 7);
  }

  @Get('alerts/active')
  async getActiveAlerts() {
    return this.weatherService.getActiveAlerts();
  }

  @Get('satellite/frames')
  async getSatelliteFrames() {
    return this.weatherService.getSatelliteFrames();
  }

  @Get('map/data')
  async getMapData() {
    return this.weatherService.getMapData();
  }

  @Get('bulletin/latest')
  async getLatestBulletin() {
    return this.weatherService.getLatestBulletin();
  }
}
