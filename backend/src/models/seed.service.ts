import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

const NEPAL_DISTRICTS = [
  // Koshi Province
  { name: 'Taplejung', nameNepali: 'ताप्लेजुङ', province: 'Koshi', lat: 27.3564, lon: 87.6697, elevation: 1441 },
  { name: 'Sankhuwasabha', nameNepali: 'संखुवासभा', province: 'Koshi', lat: 27.3522, lon: 87.1167, elevation: 1220 },
  { name: 'Solukhumbu', nameNepali: 'सोलुखुम्बु', province: 'Koshi', lat: 27.6818, lon: 86.6175, elevation: 2800 },
  { name: 'Okhaldhunga', nameNepali: 'ओखलढुङ्गा', province: 'Koshi', lat: 27.3092, lon: 86.5016, elevation: 1720 },
  { name: 'Khotang', nameNepali: 'खोटाङ', province: 'Koshi', lat: 27.0232, lon: 86.8398, elevation: 1600 },
  { name: 'Bhojpur', nameNepali: 'भोजपुर', province: 'Koshi', lat: 27.1729, lon: 87.0529, elevation: 1600 },
  { name: 'Dhankuta', nameNepali: 'धनकुटा', province: 'Koshi', lat: 26.9831, lon: 87.3359, elevation: 1150 },
  { name: 'Terhathum', nameNepali: 'तेह्रथुम', province: 'Koshi', lat: 27.1171, lon: 87.5393, elevation: 1540 },
  { name: 'Panchthar', nameNepali: 'पाँचथर', province: 'Koshi', lat: 27.1442, lon: 87.7919, elevation: 1600 },
  { name: 'Ilam', nameNepali: 'इलाम', province: 'Koshi', lat: 26.9099, lon: 87.9254, elevation: 1200 },
  { name: 'Jhapa', nameNepali: 'झापा', province: 'Koshi', lat: 26.5435, lon: 87.8987, elevation: 100 },
  { name: 'Morang', nameNepali: 'मोरङ', province: 'Koshi', lat: 26.6505, lon: 87.3291, elevation: 80 },
  { name: 'Sunsari', nameNepali: 'सुनसरी', province: 'Koshi', lat: 26.6881, lon: 87.1634, elevation: 90 },
  { name: 'Udayapur', nameNepali: 'उदयपुर', province: 'Koshi', lat: 26.9204, lon: 86.5156, elevation: 610 },
  // Madhesh Province
  { name: 'Saptari', nameNepali: 'सप्तरी', province: 'Madhesh', lat: 26.6467, lon: 86.7083, elevation: 70 },
  { name: 'Siraha', nameNepali: 'सिराहा', province: 'Madhesh', lat: 26.6527, lon: 86.2042, elevation: 70 },
  { name: 'Dhanusha', nameNepali: 'धनुषा', province: 'Madhesh', lat: 26.8157, lon: 85.9278, elevation: 75 },
  { name: 'Mahottari', nameNepali: 'महोत्तरी', province: 'Madhesh', lat: 26.6508, lon: 85.7823, elevation: 70 },
  { name: 'Sarlahi', nameNepali: 'सर्लाही', province: 'Madhesh', lat: 26.9611, lon: 85.5762, elevation: 80 },
  { name: 'Rautahat', nameNepali: 'रौतहट', province: 'Madhesh', lat: 27.0209, lon: 85.2935, elevation: 80 },
  { name: 'Bara', nameNepali: 'बारा', province: 'Madhesh', lat: 27.1042, lon: 85.0073, elevation: 85 },
  { name: 'Parsa', nameNepali: 'पर्सा', province: 'Madhesh', lat: 27.1417, lon: 84.8782, elevation: 85 },
  // Bagmati Province
  { name: 'Sindhuli', nameNepali: 'सिन्धुली', province: 'Bagmati', lat: 27.2587, lon: 85.9659, elevation: 1200 },
  { name: 'Ramechhap', nameNepali: 'रामेछाप', province: 'Bagmati', lat: 27.3259, lon: 86.0835, elevation: 1050 },
  { name: 'Dolakha', nameNepali: 'दोलखा', province: 'Bagmati', lat: 27.6731, lon: 86.0983, elevation: 1600 },
  { name: 'Sindhupalchok', nameNepali: 'सिन्धुपाल्चोक', province: 'Bagmati', lat: 27.9617, lon: 85.6873, elevation: 1800 },
  { name: 'Kavrepalanchok', nameNepali: 'काभ्रेपलान्चोक', province: 'Bagmati', lat: 27.5293, lon: 85.6781, elevation: 1400 },
  { name: 'Lalitpur', nameNepali: 'ललितपुर', province: 'Bagmati', lat: 27.6644, lon: 85.3188, elevation: 1350 },
  { name: 'Bhaktapur', nameNepali: 'भक्तपुर', province: 'Bagmati', lat: 27.6722, lon: 85.4298, elevation: 1401 },
  { name: 'Kathmandu', nameNepali: 'काठमाडौं', province: 'Bagmati', lat: 27.7172, lon: 85.3240, elevation: 1400, population: 1000000 },
  { name: 'Nuwakot', nameNepali: 'नुवाकोट', province: 'Bagmati', lat: 27.9926, lon: 85.1678, elevation: 1128 },
  { name: 'Rasuwa', nameNepali: 'रसुवा', province: 'Bagmati', lat: 28.1017, lon: 85.2127, elevation: 2600 },
  { name: 'Dhading', nameNepali: 'धादिङ', province: 'Bagmati', lat: 27.8781, lon: 84.9014, elevation: 730 },
  { name: 'Makwanpur', nameNepali: 'मकवानपुर', province: 'Bagmati', lat: 27.4297, lon: 85.0573, elevation: 1000 },
  { name: 'Chitwan', nameNepali: 'चितवन', province: 'Bagmati', lat: 27.5291, lon: 84.3542, elevation: 250 },
  // Gandaki Province
  { name: 'Gorkha', nameNepali: 'गोर्खा', province: 'Gandaki', lat: 28.0043, lon: 84.6355, elevation: 1100 },
  { name: 'Lamjung', nameNepali: 'लमजुङ', province: 'Gandaki', lat: 28.2275, lon: 84.3958, elevation: 900 },
  { name: 'Tanahu', nameNepali: 'तनहुँ', province: 'Gandaki', lat: 27.9262, lon: 84.2299, elevation: 500 },
  { name: 'Syangja', nameNepali: 'स्याङ्जा', province: 'Gandaki', lat: 28.0897, lon: 83.8820, elevation: 1100 },
  { name: 'Kaski', nameNepali: 'कास्की', province: 'Gandaki', lat: 28.2096, lon: 83.9856, elevation: 820 },
  { name: 'Manang', nameNepali: 'मनाङ', province: 'Gandaki', lat: 28.6643, lon: 84.0182, elevation: 3500 },
  { name: 'Mustang', nameNepali: 'मुस्ताङ', province: 'Gandaki', lat: 28.9959, lon: 83.8560, elevation: 3700 },
  { name: 'Myagdi', nameNepali: 'म्याग्दी', province: 'Gandaki', lat: 28.3503, lon: 83.5756, elevation: 1100 },
  { name: 'Parbat', nameNepali: 'पर्वत', province: 'Gandaki', lat: 28.2348, lon: 83.6932, elevation: 900 },
  { name: 'Baglung', nameNepali: 'बागलुङ', province: 'Gandaki', lat: 28.2700, lon: 83.5864, elevation: 900 },
  { name: 'Nawalpur', nameNepali: 'नवलपुर', province: 'Gandaki', lat: 27.6980, lon: 84.0396, elevation: 200 },
  // Lumbini Province
  { name: 'Gulmi', nameNepali: 'गुल्मी', province: 'Lumbini', lat: 28.0818, lon: 83.2719, elevation: 1150 },
  { name: 'Palpa', nameNepali: 'पाल्पा', province: 'Lumbini', lat: 27.8680, lon: 83.5450, elevation: 1200 },
  { name: 'Arghakhanchi', nameNepali: 'अर्घाखाँची', province: 'Lumbini', lat: 27.9512, lon: 83.1429, elevation: 1100 },
  { name: 'Kapilvastu', nameNepali: 'कपिलवस्तु', province: 'Lumbini', lat: 27.5666, lon: 83.0558, elevation: 100 },
  { name: 'Rupandehi', nameNepali: 'रुपन्देही', province: 'Lumbini', lat: 27.5958, lon: 83.4484, elevation: 100 },
  { name: 'Nawalparasi East', nameNepali: 'नवलपरासी पूर्व', province: 'Lumbini', lat: 27.5639, lon: 83.7299, elevation: 100 },
  { name: 'Nawalparasi West', nameNepali: 'नवलपरासी पश्चिम', province: 'Lumbini', lat: 27.6909, lon: 83.9399, elevation: 120 },
  { name: 'Dang', nameNepali: 'दाङ', province: 'Lumbini', lat: 28.0818, lon: 82.3000, elevation: 600 },
  { name: 'Banke', nameNepali: 'बाँके', province: 'Lumbini', lat: 28.0500, lon: 81.6167, elevation: 165 },
  { name: 'Bardiya', nameNepali: 'बर्दिया', province: 'Lumbini', lat: 28.3500, lon: 81.4500, elevation: 175 },
  // Karnali Province
  { name: 'Dolpa', nameNepali: 'डोल्पा', province: 'Karnali', lat: 29.1167, lon: 82.9667, elevation: 3700 },
  { name: 'Mugu', nameNepali: 'मुगु', province: 'Karnali', lat: 29.5167, lon: 82.1667, elevation: 2700 },
  { name: 'Humla', nameNepali: 'हुम्ला', province: 'Karnali', lat: 29.9667, lon: 81.8333, elevation: 3000 },
  { name: 'Jumla', nameNepali: 'जुम्ला', province: 'Karnali', lat: 29.2747, lon: 82.1836, elevation: 2370 },
  { name: 'Kalikot', nameNepali: 'कालीकोट', province: 'Karnali', lat: 29.1333, lon: 81.6500, elevation: 1750 },
  { name: 'Dailekh', nameNepali: 'दैलेख', province: 'Karnali', lat: 28.8333, lon: 81.7167, elevation: 1350 },
  { name: 'Jajarkot', nameNepali: 'जाजरकोट', province: 'Karnali', lat: 28.7000, lon: 82.1833, elevation: 1350 },
  { name: 'Rukum East', nameNepali: 'रुकुम पूर्व', province: 'Karnali', lat: 28.6167, lon: 82.6500, elevation: 1700 },
  { name: 'Salyan', nameNepali: 'सल्यान', province: 'Karnali', lat: 28.3667, lon: 82.1667, elevation: 1400 },
  { name: 'Surkhet', nameNepali: 'सुर्खेत', province: 'Karnali', lat: 28.6000, lon: 81.6167, elevation: 725 },
  // Sudurpashchim Province
  { name: 'Rukum West', nameNepali: 'रुकुम पश्चिम', province: 'Sudurpashchim', lat: 28.5833, lon: 82.3500, elevation: 1600 },
  { name: 'Rolpa', nameNepali: 'रोल्पा', province: 'Sudurpashchim', lat: 28.3167, lon: 82.6667, elevation: 1500 },
  { name: 'Pyuthan', nameNepali: 'प्युठान', province: 'Sudurpashchim', lat: 28.1000, lon: 82.8333, elevation: 1100 },
  { name: 'Baglung', nameNepali: 'बागलुङ (सु)', province: 'Sudurpashchim', lat: 28.3500, lon: 83.0833, elevation: 900 },
  { name: 'Achham', nameNepali: 'अछाम', province: 'Sudurpashchim', lat: 29.0833, lon: 81.3333, elevation: 1400 },
  { name: 'Doti', nameNepali: 'डोटी', province: 'Sudurpashchim', lat: 29.2667, lon: 80.9500, elevation: 950 },
  { name: 'Bajhang', nameNepali: 'बझाङ', province: 'Sudurpashchim', lat: 29.5667, lon: 81.1833, elevation: 1900 },
  { name: 'Bajura', nameNepali: 'बाजुरा', province: 'Sudurpashchim', lat: 29.5000, lon: 81.5000, elevation: 1800 },
  { name: 'Kailali', nameNepali: 'कैलाली', province: 'Sudurpashchim', lat: 28.6167, lon: 80.6000, elevation: 200 },
  { name: 'Kanchanpur', nameNepali: 'कञ्चनपुर', province: 'Sudurpashchim', lat: 28.8333, lon: 80.2000, elevation: 175 },
  { name: 'Dadeldhura', nameNepali: 'डडेल्धुरा', province: 'Sudurpashchim', lat: 29.3167, lon: 80.5833, elevation: 1700 },
  { name: 'Baitadi', nameNepali: 'बैतडी', province: 'Sudurpashchim', lat: 29.5333, lon: 80.4167, elevation: 1450 },
  { name: 'Darchula', nameNepali: 'दार्चुला', province: 'Sudurpashchim', lat: 29.8500, lon: 80.5500, elevation: 1100 },
];

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDistricts();
  }

  async seedDistricts() {
    const count = await this.prisma.district.count();
    if (count > 0) {
      this.logger.log(`Districts already seeded (${count} records)`);
      return;
    }

    this.logger.log('Seeding Nepal districts...');
    
    for (const d of NEPAL_DISTRICTS) {
      await this.prisma.district.upsert({
        where: { id: d.name.toLowerCase().replace(/\s+/g, '-') },
        update: {},
        create: {
          id: d.name.toLowerCase().replace(/\s+/g, '-'),
          name: d.name,
          nameNepali: d.nameNepali,
          province: d.province,
          lat: d.lat,
          lon: d.lon,
          elevation: d.elevation || 0,
          population: (d as any).population || 0,
        },
      });
    }

    this.logger.log(`✅ Seeded ${NEPAL_DISTRICTS.length} districts`);
  }
}
