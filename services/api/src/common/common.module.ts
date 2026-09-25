import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { env } from './env';
import { PrismaService } from './prisma.service';
import { AuditService } from './audit.service';
import { SeoService } from './seo.service';

@Global()
@Module({
  imports: [JwtModule.register({ secret: env.JWT_ACCESS_SECRET, signOptions: { expiresIn: env.JWT_ACCESS_TTL as any } })],
  providers: [PrismaService, AuditService, SeoService],
  exports: [PrismaService, AuditService, SeoService, JwtModule],
})
export class CommonModule {}
