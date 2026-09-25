import { Body, Controller, Get, HttpCode, NotFoundException, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { decryptField, encryptField } from '@mettlo/auth';
import { emailSchema, phoneSchema } from '@mettlo/validation';
import { AuditService } from '../common/audit.service';
import { Public, RequirePermission, CurrentUser } from '../common/decorators';
import { env } from '../common/env';
import { PrismaService } from '../common/prisma.service';
import { clientIp, userAgent, type AuthedRequest, type AuthUser } from '../common/request';
import { ZodPipe } from '../common/zod.pipe';

const CONTACT_CATEGORIES = ['general', 'partnership', 'coach', 'press', 'legal', 'other'] as const;
const contactSchema = z.object({
  name: z.string().trim().min(2, 'Ad en az 2 karakter olmalı').max(120),
  email: emailSchema,
  phone: phoneSchema,
  company: z.string().trim().max(200).optional().or(z.literal('')),
  category: z.enum(CONTACT_CATEGORIES),
  subject: z.string().trim().min(2, 'Konu gerekli').max(200),
  message: z.string().trim().min(10, 'Mesaj en az 10 karakter olmalı').max(4000),
  /** Honeypot: gerçek kullanıcılar bu alanı görmez/doldurmaz */
  website: z.string().max(0).optional().or(z.literal('')),
});

const POSITIONS = ['moderator', 'pr-specialist'] as const;
const year = new Date().getFullYear();
const longText = (min: number, max: number, label: string) => z.string().trim().min(min, `${label} en az ${min} karakter olmalı`).max(max);
const applySchema = z.object({
  positionKey: z.enum(POSITIONS),
  fullName: z.string().trim().min(3, 'Ad soyad gerekli').max(120),
  email: emailSchema,
  phone: phoneSchema,
  city: z.string().trim().min(2, 'Şehir gerekli').max(80),
  birthYear: z.number().int().min(1950).max(year - 18, '18 yaşından büyük olmalısın'),
  education: z.enum(['high_school', 'associate', 'bachelor', 'master', 'phd']),
  educationField: z.string().trim().max(160).optional().or(z.literal('')),
  experienceYears: z.number().int().min(0).max(45),
  workModel: z.enum(['remote', 'hybrid', 'onsite']),
  weeklyHours: z.number().int().min(5).max(60).optional(),
  availableFrom: z.string().trim().max(80).optional().or(z.literal('')),
  linkedinUrl: z.string().trim().url('Geçerli bir adres girin').max(300).optional().or(z.literal('')),
  currentStatus: z.string().trim().min(2, 'Mevcut durum gerekli').max(200),
  relevantExperience: longText(40, 3000, 'Deneyim açıklaması'),
  tools: z.string().trim().max(500).optional().or(z.literal('')),
  languages: z.string().trim().max(300).optional().or(z.literal('')),
  whyMettlo: longText(60, 2000, 'Motivasyon yazısı'),
  scenarioOne: longText(60, 2500, 'Senaryo cevabı'),
  scenarioTwo: longText(60, 2500, 'Senaryo cevabı'),
  acceptKvkk: z.literal(true, { error: 'KVKK aydınlatma metni onaylanmalı' }),
  website: z.string().max(0).optional().or(z.literal('')),
});

const statusSchema = z.object({ status: z.enum(['NEW', 'READ', 'REPLIED', 'ARCHIVED']).optional(), note: z.string().trim().max(2000).optional() });
const appStatusSchema = z.object({ status: z.enum(['NEW', 'REVIEWING', 'INTERVIEW', 'REJECTED', 'HIRED']).optional(), note: z.string().trim().max(4000).optional() });

/** Herkese açık formlar: iletişim ve kariyer başvurusu. Spam koruması: honeypot + IP başına hız sınırı. */
@Controller()
export class PublicFormsController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 3600_000 } })
  @Post('public/contact')
  async contact(@Body(new ZodPipe(contactSchema)) b: z.infer<typeof contactSchema>, @Req() req: AuthedRequest) {
    if (b.website) return { ok: true }; // bot: sessizce yut
    await this.prisma.contactMessage.create({
      data: { name: b.name, email: b.email, phoneEnc: encryptField(`+90${b.phone}`, env.FIELD_ENCRYPTION_KEY), company: b.company || null, category: b.category, subject: b.subject, message: b.message, ip: clientIp(req), userAgent: userAgent(req) },
    });
    return { ok: true };
  }

  @Public()
  @HttpCode(201)
  @Throttle({ default: { limit: 3, ttl: 24 * 3600_000 } })
  @Post('public/careers/apply')
  async apply(@Body(new ZodPipe(applySchema)) b: z.infer<typeof applySchema>, @Req() req: AuthedRequest) {
    if (b.website) return { ok: true };
    const dup = await this.prisma.jobApplication.findFirst({ where: { email: b.email, positionKey: b.positionKey, createdAt: { gte: new Date(Date.now() - 30 * 864e5) } }, select: { id: true } });
    if (dup) return { ok: true, duplicate: true }; // aynı kişiden 30 gün içinde tekrar başvuru sessizce tek sayılır
    const { phone, positionKey, fullName, email, city, birthYear, education, experienceYears, workModel, weeklyHours, availableFrom, linkedinUrl, acceptKvkk: _k, website: _w, ...answers } = b;
    await this.prisma.jobApplication.create({
      data: { positionKey, fullName, email, phoneEnc: encryptField(`+90${phone}`, env.FIELD_ENCRYPTION_KEY), city, birthYear, education, experienceYears, workModel, weeklyHours, availableFrom: availableFrom || null, linkedinUrl: linkedinUrl || null, answers: answers as any, ip: clientIp(req) },
    });
    return { ok: true };
  }
}

/** Yönetim: iletişim mesajları (SUPPORT, ADMIN, SUPER_ADMIN) ve kariyer başvuruları (yalnızca SUPER_ADMIN). */
@Controller('admin')
export class AdminFormsController {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  @RequirePermission('contact:handle')
  @Get('contact-messages')
  async list(@Query('status') status?: string, @Query('q') q?: string) {
    const rows = await this.prisma.contactMessage.findMany({
      where: { ...(status && ['NEW', 'READ', 'REPLIED', 'ARCHIVED'].includes(status) ? { status: status as any } : {}), ...(q ? { OR: [{ subject: { contains: q, mode: 'insensitive' } }, { name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] } : {}) },
      orderBy: { createdAt: 'desc' }, take: 200, select: { id: true, name: true, email: true, category: true, subject: true, status: true, createdAt: true },
    });
    return rows;
  }

  @RequirePermission('contact:handle')
  @Get('contact-messages/:id')
  async one(@CurrentUser() me: AuthUser, @Param('id') id: string, @Req() req: AuthedRequest) {
    const m = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!m) throw new NotFoundException('Mesaj bulunamadı');
    if (m.status === 'NEW') await this.prisma.contactMessage.update({ where: { id }, data: { status: 'READ', readAt: new Date() } });
    await this.audit.record({ actorId: me.id, actorRole: me.role, action: 'contact.view', targetType: 'contact_message', targetId: id, ip: clientIp(req), userAgent: userAgent(req) });
    const { phoneEnc, ip, userAgent: _ua, ...rest } = m;
    return { ...rest, status: m.status === 'NEW' ? 'READ' : m.status, phone: decryptField(phoneEnc, env.FIELD_ENCRYPTION_KEY) };
  }

  @RequirePermission('contact:handle')
  @Patch('contact-messages/:id')
  async update(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body(new ZodPipe(statusSchema)) b: z.infer<typeof statusSchema>) {
    const r = await this.prisma.contactMessage.updateMany({ where: { id }, data: { ...b, handledById: me.id } });
    if (!r.count) throw new NotFoundException('Mesaj bulunamadı');
    return { ok: true };
  }

  @RequirePermission('careers:manage')
  @Get('applications')
  async applications(@Query('position') position?: string, @Query('status') status?: string) {
    return this.prisma.jobApplication.findMany({
      where: { ...(position && (POSITIONS as readonly string[]).includes(position) ? { positionKey: position } : {}), ...(status ? { status: status as any } : {}) },
      orderBy: { createdAt: 'desc' }, take: 300, select: { id: true, positionKey: true, fullName: true, email: true, city: true, experienceYears: true, status: true, createdAt: true },
    });
  }

  @RequirePermission('careers:manage')
  @Get('applications/:id')
  async application(@CurrentUser() me: AuthUser, @Param('id') id: string, @Req() req: AuthedRequest) {
    const a = await this.prisma.jobApplication.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Başvuru bulunamadı');
    await this.audit.record({ actorId: me.id, actorRole: me.role, action: 'careers.view', targetType: 'job_application', targetId: id, ip: clientIp(req), userAgent: userAgent(req) });
    const { phoneEnc, ...rest } = a;
    return { ...rest, phone: decryptField(phoneEnc, env.FIELD_ENCRYPTION_KEY) };
  }

  @RequirePermission('careers:manage')
  @Patch('applications/:id')
  async updateApplication(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body(new ZodPipe(appStatusSchema)) b: z.infer<typeof appStatusSchema>, @Req() req: AuthedRequest) {
    const r = await this.prisma.jobApplication.updateMany({ where: { id }, data: b });
    if (!r.count) throw new NotFoundException('Başvuru bulunamadı');
    await this.audit.record({ actorId: me.id, actorRole: me.role, action: 'careers.update', targetType: 'job_application', targetId: id, metadata: { status: b.status }, ip: clientIp(req), userAgent: userAgent(req) });
    return { ok: true };
  }
}
