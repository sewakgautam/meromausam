import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../models/prisma.service';

@Controller()
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get('health')
  async health() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        db: 'connected',
        time: new Date().toISOString(),
        uptime: Math.round(process.uptime()),
      };
    } catch {
      return { status: 'degraded', db: 'disconnected' };
    }
  }

  @Get()
  root() {
    return {
      name: 'MeroMausam API',
      version: '1.0.0',
      description: 'Nepal Weather Intelligence Platform',
      docs: '/health',
    };
  }
}
