import { Controller, Post, Get, Delete, Body, Param, Query } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private subService: SubscriptionService) {}

  @Post()
  async subscribe(@Body() body: {
    email: string;
    districtId: string;
    alertTypes: string[];
    language?: string;
  }) {
    return this.subService.subscribe(body);
  }

  @Get('confirm/:token')
  async confirm(@Param('token') token: string) {
    return this.subService.confirm(token);
  }

  @Delete(':token')
  async unsubscribe(@Param('token') token: string) {
    return this.subService.unsubscribe(token);
  }

  @Get('status')
  async status(@Query('email') email: string, @Query('districtId') districtId: string) {
    return this.subService.getStatus(email, districtId);
  }
}
