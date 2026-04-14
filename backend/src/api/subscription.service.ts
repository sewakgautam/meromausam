import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../models/prisma.service';
import { EmailService } from './email.service';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async subscribe(data: {
    email: string;
    districtId: string;
    alertTypes: string[];
    language?: string;
  }) {
    const district = await this.prisma.district.findUnique({ where: { id: data.districtId } });
    if (!district) return { error: 'District not found' };

    const existing = await this.prisma.subscription.findFirst({
      where: { email: data.email, districtId: data.districtId },
    });

    if (existing) {
      if (existing.confirmed) {
        return { message: 'Already subscribed', status: 'active' };
      }
      // Resend confirmation
      await this.emailService.sendConfirmationEmail(existing.email, existing.token, district.name);
      return { message: 'Confirmation email resent', status: 'pending' };
    }

    const sub = await this.prisma.subscription.create({
      data: {
        email: data.email,
        districtId: data.districtId,
        alertTypes: data.alertTypes || ['rain', 'thunder', 'flood', 'hail', 'snow'],
        language: data.language || 'en',
      },
    });

    await this.emailService.sendConfirmationEmail(sub.email, sub.token, district.name);
    this.logger.log(`New subscription: ${data.email} → ${district.name}`);

    return { message: 'Check your email to confirm subscription', status: 'pending', id: sub.id };
  }

  async confirm(token: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { token } });
    if (!sub) return { error: 'Invalid or expired token' };

    await this.prisma.subscription.update({
      where: { token },
      data: { confirmed: true },
    });

    return { message: 'Subscription confirmed! You will receive weather alerts.', status: 'confirmed' };
  }

  async unsubscribe(token: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { token } });
    if (!sub) return { error: 'Invalid token' };

    await this.prisma.subscription.update({
      where: { token },
      data: { isActive: false },
    });

    return { message: 'Unsubscribed successfully' };
  }

  async getStatus(email: string, districtId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { email, districtId },
    });
    if (!sub) return { subscribed: false };
    return {
      subscribed: true,
      confirmed: sub.confirmed,
      isActive: sub.isActive,
      alertTypes: sub.alertTypes,
    };
  }
}
