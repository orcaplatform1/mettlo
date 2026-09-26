import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Public } from '../common/decorators';

@Public()
@Controller('location')
export class LocationController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('cities')
  async getCities() {
    return this.prisma.turkeyCity.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, plateCode: true },
    });
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
