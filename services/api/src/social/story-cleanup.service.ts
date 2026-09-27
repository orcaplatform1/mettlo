import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class StoryCleanupService implements OnModuleInit {
  private readonly logger = new Logger(StoryCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.cleanup();
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  private async cleanup() {
    const expired = await this.prisma.story.findMany({
      where: { expiresAt: { lt: new Date() } },
      select: { id: true, mediaUrl: true },
    });
    if (!expired.length) return;
    for (const s of expired) {
      if (s.mediaUrl?.startsWith('/uploads/')) {
        const p = join(process.cwd(), '../../', s.mediaUrl);
        if (existsSync(p)) { try { unlinkSync(p); } catch {} }
      }
    }
    await this.prisma.story.deleteMany({ where: { id: { in: expired.map((s) => s.id) } } });
    this.logger.log(`${expired.length} süresi dolmuş hikaye silindi`);
  }
}
