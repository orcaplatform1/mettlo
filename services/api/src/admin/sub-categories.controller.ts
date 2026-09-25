import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Req } from '@nestjs/common';
import { z } from 'zod';
import { AuditService } from '../common/audit.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { PrismaService } from '../common/prisma.service';
import { SeoService } from '../common/seo.service';
import { uniqueSlug } from '../common/slug';
import { clientIp, userAgent, type AuthedRequest, type AuthUser } from '../common/request';
import { ZodPipe } from '../common/zod.pipe';

const createSchema = z.object({ branchSlug: z.string().max(60), name: z.string().trim().min(2).max(140), sortOrder: z.number().int().min(0).max(999).optional() });
const updateSchema = z.object({ name: z.string().trim().min(2).max(140).optional(), isActive: z.boolean().optional(), sortOrder: z.number().int().min(0).max(999).optional() }).strict();

/** Branş alt kategorileri: yalnızca SUPER_ADMIN yönetir (`system:settings`). Yeni kategori migration gerektirmez. */
@Controller('admin/sub-categories')
export class AdminSubCategoriesController {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly seo: SeoService) {}

  @RequirePermission('system:settings')
  @Get()
  async list() {
    const branches = await this.prisma.branch.findMany({ orderBy: { sortOrder: 'asc' }, select: { slug: true, name: true, isActive: true, subCategories: { orderBy: { sortOrder: 'asc' }, select: { id: true, slug: true, name: true, isActive: true, sortOrder: true, _count: { select: { coaches: true } } } } } });
    return branches.map((b) => ({ ...b, subCategories: b.subCategories.map(({ _count, ...x }) => ({ ...x, coachCount: _count.coaches })) }));
  }

  @RequirePermission('system:settings')
  @Post()
  async create(@CurrentUser() me: AuthUser, @Body(new ZodPipe(createSchema)) b: z.infer<typeof createSchema>, @Req() req: AuthedRequest) {
    const branch = await this.prisma.branch.findUnique({ where: { slug: b.branchSlug }, select: { id: true } });
    if (!branch) throw new BadRequestException('Branş bulunamadı');
    const slug = await uniqueSlug(b.name, async (s) => !!(await this.prisma.branchSubCategory.findUnique({ where: { slug: s }, select: { id: true } })), 'alt-kategori');
    const last = await this.prisma.branchSubCategory.aggregate({ where: { branchId: branch.id }, _max: { sortOrder: true } });
    const row = await this.prisma.branchSubCategory.create({ data: { branchId: branch.id, name: b.name, slug, sortOrder: b.sortOrder ?? (last._max.sortOrder ?? 0) + 1 } });
    await this.audit.record({ actorId: me.id, actorRole: me.role, action: 'subcategory.create', targetType: 'branch_sub_category', targetId: row.id, metadata: { slug, branch: b.branchSlug }, ip: clientIp(req), userAgent: userAgent(req) });
    this.seo.notify(['/coaches']);
    return row;
  }

  @RequirePermission('system:settings')
  @Patch(':id')
  async update(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body(new ZodPipe(updateSchema)) b: z.infer<typeof updateSchema>, @Req() req: AuthedRequest) {
    const r = await this.prisma.branchSubCategory.updateMany({ where: { id }, data: b });
    if (!r.count) throw new NotFoundException('Alt kategori bulunamadı');
    await this.audit.record({ actorId: me.id, actorRole: me.role, action: 'subcategory.update', targetType: 'branch_sub_category', targetId: id, metadata: b, ip: clientIp(req), userAgent: userAgent(req) });
    this.seo.notify(['/coaches']);
    return { ok: true };
  }

  /** Silinince koçlardaki seçimler de kalkar. Geçici kapatmak için isActive=false kullanın. */
  @RequirePermission('system:settings')
  @Delete(':id')
  async remove(@CurrentUser() me: AuthUser, @Param('id') id: string, @Req() req: AuthedRequest) {
    const r = await this.prisma.branchSubCategory.deleteMany({ where: { id } });
    if (!r.count) throw new NotFoundException('Alt kategori bulunamadı');
    await this.audit.record({ actorId: me.id, actorRole: me.role, action: 'subcategory.delete', targetType: 'branch_sub_category', targetId: id, ip: clientIp(req), userAgent: userAgent(req) });
    this.seo.notify(['/coaches']);
    return { ok: true };
  }
}
