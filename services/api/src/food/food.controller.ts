import {
  Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query,
} from '@nestjs/common';
import { CurrentUser, Public } from '../common/decorators';
import type { AuthUser } from '../common/request';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';

// ── Herkese açık: menü görüntüleme ──────────────────────────────────────────

@Controller('business/:businessId/menu')
export class PublicFoodMenuController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async getMenu(@Param('businessId') businessId: string) {
    const business = await this.prisma.businessAccount.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, slug: true, status: true },
    });
    if (!business || business.status === 'CLOSED') throw new NotFoundException('İşletme bulunamadı.');
    const categories = await this.prisma.foodCategory.findMany({
      where: { businessId },
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          where: { status: 'ACTIVE' },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    return { business, categories };
  }

  @Public()
  @Get(':itemId')
  async getItem(@Param('businessId') businessId: string, @Param('itemId') itemId: string) {
    const item = await this.prisma.foodItem.findFirst({ where: { id: itemId, businessId } });
    if (!item) throw new NotFoundException();
    return item;
  }
}

// ── İşletme sahibi: menü yönetimi ───────────────────────────────────────────

@Controller('business/:businessId/menu/manage')
export class BusinessFoodMenuController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private async verifyOwner(businessId: string, userId: string) {
    const b = await this.prisma.businessAccount.findFirst({ where: { id: businessId, ownerId: userId } });
    if (!b) throw new NotFoundException('İşletme bulunamadı veya erişim izniniz yok.');
    return b;
  }

  // Kategori CRUD
  @Post('categories')
  async createCategory(
    @Param('businessId') businessId: string,
    @CurrentUser() u: AuthUser,
    @Body() dto: { name: string; sortOrder?: number },
  ) {
    await this.verifyOwner(businessId, u.id);
    return this.prisma.foodCategory.create({
      data: { businessId, name: dto.name, sortOrder: dto.sortOrder ?? 0 },
    });
  }

  @Patch('categories/:categoryId')
  async updateCategory(
    @Param('businessId') businessId: string,
    @Param('categoryId') categoryId: string,
    @CurrentUser() u: AuthUser,
    @Body() dto: { name?: string; sortOrder?: number },
  ) {
    await this.verifyOwner(businessId, u.id);
    return this.prisma.foodCategory.update({ where: { id: categoryId }, data: dto });
  }

  @Delete('categories/:categoryId')
  async deleteCategory(
    @Param('businessId') businessId: string,
    @Param('categoryId') categoryId: string,
    @CurrentUser() u: AuthUser,
  ) {
    await this.verifyOwner(businessId, u.id);
    await this.prisma.foodCategory.delete({ where: { id: categoryId } });
    return { ok: true };
  }

  // Ürün CRUD
  @Post('items')
  async createItem(
    @Param('businessId') businessId: string,
    @CurrentUser() u: AuthUser,
    @Body() dto: {
      name: string; priceKurus: number; categoryId?: string; description?: string;
      imageUrl?: string; deliveryMode?: string; allergens?: string;
      isGlutenFree?: boolean; isVegan?: boolean; isVegetarian?: boolean;
      preparationMinutes?: number; nutritionJson?: unknown; sortOrder?: number;
    },
  ) {
    await this.verifyOwner(businessId, u.id);
    return this.prisma.foodItem.create({
      data: {
        businessId,
        name: dto.name,
        priceKurus: dto.priceKurus,
        categoryId: dto.categoryId,
        description: dto.description,
        imageUrl: dto.imageUrl,
        deliveryMode: (dto.deliveryMode as any) ?? 'BOTH',
        allergens: dto.allergens,
        isGlutenFree: dto.isGlutenFree ?? false,
        isVegan: dto.isVegan ?? false,
        isVegetarian: dto.isVegetarian ?? false,
        preparationMinutes: dto.preparationMinutes,
        nutritionJson: dto.nutritionJson as any,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  @Patch('items/:itemId')
  async updateItem(
    @Param('businessId') businessId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() u: AuthUser,
    @Body() dto: Partial<{
      name: string; priceKurus: number; categoryId: string | null; description: string;
      imageUrl: string; deliveryMode: string; status: string; allergens: string;
      isGlutenFree: boolean; isVegan: boolean; isVegetarian: boolean;
      preparationMinutes: number; nutritionJson: unknown; sortOrder: number;
    }>,
  ) {
    await this.verifyOwner(businessId, u.id);
    const { deliveryMode, status, categoryId, nutritionJson, ...rest } = dto;
    return this.prisma.foodItem.update({
      where: { id: itemId },
      data: {
        ...rest,
        ...(categoryId !== undefined ? { categoryId: categoryId ?? null } : {}),
        ...(nutritionJson !== undefined ? { nutritionJson: nutritionJson as any } : {}),
        ...(deliveryMode ? { deliveryMode: deliveryMode as any } : {}),
        ...(status ? { status: status as any } : {}),
      },
    });
  }

  @Delete('items/:itemId')
  async deleteItem(
    @Param('businessId') businessId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() u: AuthUser,
  ) {
    await this.verifyOwner(businessId, u.id);
    await this.prisma.foodItem.delete({ where: { id: itemId } });
    return { ok: true };
  }
}

// ── Sipariş ──────────────────────────────────────────────────────────────────

@Controller('food-orders')
export class FoodOrderController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async createOrder(
    @CurrentUser() u: AuthUser,
    @Body() dto: {
      businessId: string;
      deliveryMode: string;
      note?: string;
      items: Array<{ foodItemId: string; quantity: number; note?: string }>;
    },
  ) {
    // Ürünleri fiyatlarıyla getir
    const itemIds = dto.items.map(i => i.foodItemId);
    const foodItems = await this.prisma.foodItem.findMany({
      where: { id: { in: itemIds }, businessId: dto.businessId, status: 'ACTIVE' },
    });
    if (foodItems.length !== itemIds.length) throw new NotFoundException('Bazı ürünler aktif değil veya bulunamadı.');

    const itemMap = new Map(foodItems.map(fi => [fi.id, fi]));
    let totalKurus = 0;
    const lineItems = dto.items.map(i => {
      const fi = itemMap.get(i.foodItemId)!;
      totalKurus += fi.priceKurus * i.quantity;
      return { foodItemId: i.foodItemId, quantity: i.quantity, unitKurus: fi.priceKurus, note: i.note };
    });

    const order = await this.prisma.foodOrder.create({
      data: {
        businessId: dto.businessId,
        customerId: u.id,
        deliveryMode: dto.deliveryMode as any,
        totalKurus,
        note: dto.note,
        items: { createMany: { data: lineItems } },
      },
      include: { items: true },
    });
    return order;
  }

  @Get()
  async listMyOrders(@CurrentUser() u: AuthUser, @Query('page') page?: string) {
    const skip = ((Number(page ?? 1) - 1)) * 20;
    const [items, total] = await Promise.all([
      this.prisma.foodOrder.findMany({
        where: { customerId: u.id },
        include: { items: { include: { foodItem: { select: { name: true, imageUrl: true } } } }, business: { select: { name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: 20,
      }),
      this.prisma.foodOrder.count({ where: { customerId: u.id } }),
    ]);
    return { items, total };
  }

  @Get(':id')
  async getOrder(@Param('id') id: string, @CurrentUser() u: AuthUser) {
    const order = await this.prisma.foodOrder.findFirst({
      where: { id, customerId: u.id },
      include: { items: { include: { foodItem: true } }, business: { select: { name: true, slug: true } } },
    });
    if (!order) throw new NotFoundException();
    return order;
  }

  @Get('business/:businessId')
  async listBusinessOrders(
    @Param('businessId') businessId: string,
    @CurrentUser() u: AuthUser,
    @Query('status') status?: string,
    @Query('page') page?: string,
  ) {
    const business = await this.prisma.businessAccount.findFirst({ where: { id: businessId, ownerId: u.id } });
    if (!business) throw new NotFoundException();
    const skip = ((Number(page ?? 1) - 1)) * 30;
    const where = { businessId, ...(status ? { status: status as any } : {}) };
    const [items, total] = await Promise.all([
      this.prisma.foodOrder.findMany({
        where, include: { items: { include: { foodItem: { select: { name: true } } } }, customer: { select: { name: true, username: true } } },
        orderBy: { createdAt: 'desc' }, skip, take: 30,
      }),
      this.prisma.foodOrder.count({ where }),
    ]);
    return { items, total };
  }

  @Patch(':id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @CurrentUser() u: AuthUser,
    @Body() dto: { status: string },
  ) {
    const order = await this.prisma.foodOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException();
    const business = await this.prisma.businessAccount.findFirst({ where: { id: order.businessId, ownerId: u.id } });
    if (!business) throw new NotFoundException();
    return this.prisma.foodOrder.update({ where: { id }, data: { status: dto.status as any } });
  }
}
