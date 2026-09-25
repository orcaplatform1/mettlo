import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { can, type Permission, type Role } from '@mettlo/types';
import { AllowScopes, IS_PUBLIC, PERMISSION_KEY, ROLES_KEY, SCOPE_KEY } from './decorators';
import { PrismaService } from './prisma.service';
import type { AuthedRequest } from './request';

/** Global: her istek JWT ile doğrulanır (@Public() hariç). Oturum iptal/hesap askıya alma anında etkili olur. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()]);
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();

    const header = req.headers['authorization'];
    const raw = (Array.isArray(header) ? header[0] : header) ?? '';
    const token = raw.startsWith('Bearer ') ? raw.slice(7) : undefined;

    if (!token) {
      if (isPublic) return true;
      throw new UnauthorizedException('Oturum gerekli');
    }

    let payload: { sub: string; role: Role; sid: string; scope: 'full' | '2fa_setup' };
    try {
      payload = await this.jwt.verifyAsync(token);
    } catch {
      if (isPublic) return true;
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş oturum');
    }

    const session = await this.prisma.session.findUnique({
      where: { id: payload.sid },
      select: { revokedAt: true, expiresAt: true, user: { select: { id: true, role: true, status: true } } },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date() || session.user.id !== payload.sub) {
      if (isPublic) return true;
      throw new UnauthorizedException('Oturum sonlandırılmış');
    }
    const { status, role } = session.user;
    if (status === 'SUSPENDED' || status === 'BANNED' || status === 'DELETED') {
      if (isPublic) return true;
      throw new ForbiddenException('Hesap kullanıma kapalı');
    }

    // Rol her zaman DB'den (token eski rol taşıyor olabilir)
    req.user = { id: session.user.id, role: role as Role, sid: payload.sid, scope: payload.scope };

    const allowed = this.reflector.getAllAndOverride<Array<'full' | '2fa_setup'>>(SCOPE_KEY, [ctx.getHandler(), ctx.getClass()]) ?? ['full'];
    if (!isPublic && !allowed.includes(payload.scope)) {
      throw new ForbiddenException('Önce iki adımlı doğrulamayı (2FA) tamamlayın');
    }
    return true;
  }
}

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    const perm = this.reflector.getAllAndOverride<Permission>(PERMISSION_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (!roles && !perm) return true;
    const user = req.user;
    if (!user) throw new UnauthorizedException('Oturum gerekli');
    if (roles && !roles.includes(user.role)) throw new ForbiddenException('Yetkiniz yok');
    if (perm && !can(user.role, perm)) throw new ForbiddenException('Yetkiniz yok');
    return true;
  }
}

export { AllowScopes };
