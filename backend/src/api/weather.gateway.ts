import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../models/prisma.service';

@WebSocketGateway({ cors: { origin: '*' }, path: '/ws' })
export class WeatherGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(WeatherGateway.name);
  private connectedClients = 0;

  constructor(private prisma: PrismaService) {}

  handleConnection(client: Socket) {
    this.connectedClients++;
    this.logger.log(`Client connected: ${client.id} (total: ${this.connectedClients})`);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients--;
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe_district')
  handleSubscribeDistrict(client: Socket, districtId: string) {
    client.join(`district:${districtId}`);
    this.logger.log(`Client ${client.id} subscribed to district: ${districtId}`);
  }

  @SubscribeMessage('get_overview')
  async handleGetOverview(client: Socket) {
    const data = await this.getQuickOverview();
    client.emit('overview_update', data);
  }

  async broadcastWeatherUpdate(districtId: string, data: any) {
    this.server.to(`district:${districtId}`).emit('weather_update', data);
  }

  async broadcastAlert(alert: any) {
    this.server.emit('new_alert', alert);
    this.logger.log(`Broadcast alert: ${alert.title}`);
  }

  async broadcastOverviewUpdate() {
    const data = await this.getQuickOverview();
    this.server.emit('overview_update', data);
  }

  private async getQuickOverview() {
    const alerts = await this.prisma.weatherAlert.count({
      where: { isActive: true, validUntil: { gte: new Date() } },
    });
    return { activeAlerts: alerts, updatedAt: new Date() };
  }
}
