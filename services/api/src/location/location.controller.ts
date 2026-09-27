import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Public } from '../common/decorators';

@Public()
@Controller('location')
export class LocationController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('cities')
  async getCities() {
    const all = await this.prisma.turkeyCity.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, plateCode: true },
    });
    const pinned = ['İstanbul', 'Ankara', 'İzmir'];
    const pinnedCities = pinned.map(n => all.find(c => c.name === n)).filter(Boolean);
    const rest = all.filter(c => !pinned.includes(c.name));
    return [...pinnedCities, ...rest];
  }

  @Get('districts/:cityId')
  async getDistricts(@Param('cityId', ParseIntPipe) cityId: number) {
    return this.prisma.turkeyDistrict.findMany({
      where: { cityId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    });
  }
}
