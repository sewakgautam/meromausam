import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../models/prisma.service';

@Injectable()
export class SatelliteScraper {
  private readonly logger = new Logger(SatelliteScraper.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Himawari-9 (JMA) provides free real-time satellite imagery
   * The RAMMB/CIRA Slider provides WMS tiles for free
   */
  async fetchHimawariFrames() {
    this.logger.log('🛰️ Fetching Himawari satellite metadata...');
    
    try {
      // RAMMB SLIDER provides free Himawari data
      const now = new Date();
      // Round to nearest 10 minutes (Himawari updates every 10 min)
      now.setMinutes(Math.floor(now.getMinutes() / 10) * 10, 0, 0);
      
      const timestamps = [];
      for (let i = 0; i < 12; i++) {
        const t = new Date(now.getTime() - i * 10 * 60 * 1000);
        timestamps.push(t);
      }

      for (const ts of timestamps.slice(0, 6)) {
        const dateStr = ts.toISOString().replace(/[-:]/g, '').slice(0, 12) + '00';
        
        // Himawari infrared cloud imagery URL from RAMMB SLIDER
        const imageUrl = `https://rammb-slider.cira.colostate.edu/data/imagery/${
          ts.toISOString().slice(0, 10).replace(/-/g, '')
        }/himawari---full_disk/band_13/${dateStr}_4_full_disk.jpg`;

        // WMS tile URL for map overlay
        const tileUrl = `https://nctc.jma.go.jp/tiles/himawari8/band13/{z}/{x}/{y}.png?time=${ts.toISOString()}`;

        await this.prisma.satelliteFrame.upsert({
          where: { id: `himawari-${dateStr}` },
          update: { imageUrl, fetchedAt: new Date() },
          create: {
            id: `himawari-${dateStr}`,
            source: 'himawari',
            band: 'infrared',
            region: 'nepal',
            frameTime: ts,
            imageUrl,
            tileUrl,
          },
        });
      }

      this.logger.log('✅ Himawari frame metadata saved');
    } catch (err) {
      this.logger.warn(`Himawari fetch failed: ${err.message}`);
    }
  }

  /**
   * NASA GIBS (Global Imagery Browse Services) provides free map tiles
   * https://wiki.earthdata.nasa.gov/display/GIBS
   */
  async fetchNasaGibsInfo() {
    try {
      // GIBS provides WMTS tiles, no auth needed
      // These tile URLs work directly in Leaflet/MapLibre
      const today = new Date().toISOString().slice(0, 10);
      
      const layers = [
        {
          name: 'MODIS_Terra_CorrectedReflectance_TrueColor',
          band: 'visible',
          tileUrl: `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${today}/250m/{z}/{y}/{x}.jpg`,
        },
        {
          name: 'MODIS_Terra_Cloud_Top_Temp_Day',
          band: 'infrared',
          tileUrl: `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/MODIS_Terra_Cloud_Top_Temp_Day/default/${today}/2km/{z}/{y}/{x}.png`,
        },
        {
          name: 'GPM_L3_Half_Hourly_Rain_Rate',
          band: 'precipitation',
          tileUrl: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GPM_L3_Half_Hourly_Rain_Rate/default/${today}/2km/{z}/{y}/{x}.png`,
        },
      ];

      for (const layer of layers) {
        await this.prisma.satelliteFrame.upsert({
          where: { id: `nasa-${layer.name}-${today}` },
          update: { fetchedAt: new Date() },
          create: {
            id: `nasa-${layer.name}-${today}`,
            source: 'nasa-gibs',
            band: layer.band,
            region: 'nepal',
            frameTime: new Date(),
            imageUrl: layer.tileUrl,
            tileUrl: layer.tileUrl,
          },
        });
      }

      this.logger.log('✅ NASA GIBS layer info saved');
    } catch (err) {
      this.logger.warn(`NASA GIBS fetch failed: ${err.message}`);
    }
  }

  async getLatestFrames() {
    return this.prisma.satelliteFrame.findMany({
      orderBy: { frameTime: 'desc' },
      take: 24,
    });
  }
}
