import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { EmailService } from './email.service';

@Module({
  controllers: [SubscriptionController],
  providers: [SubscriptionService, EmailService],
  exports: [SubscriptionService, EmailService],
})
export class SubscriptionModule {}
