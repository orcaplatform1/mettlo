import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  decryptField, encryptField, generateTotpSecret, hashPassword, hmacHash, needsRehash, randomToken, sha256, totpUri, verifyPassword, verifyTotp,
} from '@mettlo/auth';
import { requiresTwoFactor, type Role } from '@mettlo/types';
import type { LoginInput, RegisterInput } from '@mettlo/validation';
import { AuditService } from '../common/audit.service';
import { env } from '../common/env';
import { PrismaService } from '../common/prisma.service';

const REFRESH_DAYS = 30;
const SETUP_MINUTES = 15;
// Kullanıcı bulunamadığında da argon2 zamanı harcansın (zamanlama ile e-posta keşfini önler)
const DUMMY_HASH = '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$5rV1cFq0k4v8y3n8u1Xw3l9m8mVq7JvVQpH0wq5m7oA';

export interface SafeUser {
  id: string;
  username: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: Role;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  private safe(u: any): SafeUser {
    return {
      id: u.id, username: u.username, email: u.email, name: u.name, avatarUrl: u.avatarUrl ?? null,
      role: u.role, twoFactorEnabled: u.twoFactorEnabled, emailVerified: !!u.emailVerifiedAt,
    };
  }

  async register(input: RegisterInput, ip?: string, ua?: string, opts: { passwordless?: boolean; googleId?: string; appleId?: string; emailVerified?: boolean } = {}) {
    const emailHash = hmacHash(input.email, env.FIELD_ENCRYPTION_KEY);
    const banned = await this.prisma.bannedIdentifier.findFirst({ where: { kind: 'email', valueHash: emailHash } });
    if (banned) throw new ForbiddenException('Bu e-posta ile kayıt yapılamaz');

    // Telefon "+90" + 10 hane olarak şifreli saklanır; tekillik ve ban kontrolü için HMAC tutulur
    const phoneFull = `+90${input.phone}`;
    const phoneHash = hmacHash(phoneFull, env.FIELD_ENCRYPTION_KEY);
    const bannedPhone = await this.prisma.bannedIdentifier.findFirst({ where: { kind: 'phone', valueHash: phoneHash } });
    if (bannedPhone) throw new ForbiddenException('Bu telefon ile kayıt yapılamaz');

    const taken = await this.prisma.user.findFirst({
      where: { OR: [{ email: input.email }, { username: input.username }, { personalInfo: { phoneHash } }] },
      select: { id: true, username: true, email: true },
    });
    if (taken) {
      if (taken.username === input.username) throw new ConflictException('Bu kullanıcı adı alınmış');
      throw new ConflictException('Bu e-posta veya telefon ile zaten bir hesap var');
    }

    const passwordHash = opts.passwordless ? null : await hashPassword(input.password);
    const user = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: input.email, username: input.username, name: input.name, passwordHash,
          ...(opts.googleId ? { googleId: opts.googleId } : {}), ...(opts.appleId ? { appleId: opts.appleId } : {}), ...(opts.emailVerified ? { emailVerifiedAt: new Date() } : {}),
          birthDate: input.birthDate, role: 'MEMBER',
          memberProfile: { create: {} },
          personalInfo: {
            create: {
              phoneEnc: encryptField(phoneFull, env.FIELD_ENCRYPTION_KEY),
              phoneHash,
              registrationIp: ip,
              registrationUserAgent: ua,
            },
          },
        },
      });
      const v = 'v1-2026-09';
      await tx.kvkkConsent.createMany({
        data: [
          { userId: u.id, type: 'TERMS', textVersion: v, ip, userAgent: ua },
          { userId: u.id, type: 'KVKK', textVersion: v, ip, userAgent: ua },
          ...(input.marketingConsent ? [{ userId: u.id, type: 'MARKETING' as const, textVersion: v, ip, userAgent: ua }] : []),
        ],
      });
      if (input.marketingConsent) {
        await tx.iysConsent.createMany({
          data: [
            { userId: u.id, channel: 'EMAIL', granted: true, source: 'signup' },
            { userId: u.id, channel: 'SMS', granted: true, source: 'signup' },
          ],
        });
      }
      const token = randomToken();
      await tx.authToken.create({
        data: { userId: u.id, type: 'EMAIL_VERIFY', tokenHash: sha256(token), expiresAt: new Date(Date.now() + 48 * 3600_000) },
      });
      return u;
    });
    return { user: this.safe(user), profilePath: `/member/${user.username}` };
  }

  private async expireSanctions(userId: string) {
    const now = new Date();
    await this.prisma.accountSanction.updateMany({
      where: { userId, status: 'ACTIVE', endsAt: { lt: now } },
      data: { status: 'EXPIRED' },
    });
    const active = await this.prisma.accountSanction.count({
      where: { userId, status: 'ACTIVE', type: { in: ['SUSPENSION', 'BAN'] } },
    });
    if (active === 0) {
      await this.prisma.user.updateMany({ where: { id: userId, status: 'SUSPENDED' }, data: { status: 'ACTIVE', statusReason: null } });
    }
  }

  async login(input: LoginInput, ip?: string, ua?: string) {
    let user = await this.prisma.user.findUnique({ where: { username: input.username } });
    const ok = await verifyPassword(user?.passwordHash ?? DUMMY_HASH, input.password);
    if (!user || !ok) {
      await this.audit.record({ action: 'auth.login_failed', targetType: 'user', targetId: user?.id, ip, userAgent: ua, metadata: { username: input.username } });
      throw new UnauthorizedException('Kullanıcı adı veya şifre hatalı');
    }

    if (user.status === 'SUSPENDED') {
      await this.expireSanctions(user.id);
      user = (await this.prisma.user.findUnique({ where: { id: user.id } }))!;
    }
    if (user.status === 'BANNED') throw new ForbiddenException('Hesabınız kalıcı olarak kapatılmıştır');
    if (user.status === 'SUSPENDED') throw new ForbiddenException('Hesabınız geçici olarak askıya alınmıştır');
    if (user.status === 'DELETED') throw new UnauthorizedException('Kullanıcı adı veya şifre hatalı');

    const role = user.role as Role;
    if (requiresTwoFactor(role)) {
      if (!user.twoFactorEnabled || !user.twoFactorSecretEnc) {
        // 2FA kurulana kadar sadece kurulum kapsamlı kısa ömürlü oturum
        const tokens = await this.issue(user.id, role, 'setup', ip, ua);
        return { status: '2fa_setup_required' as const, accessToken: tokens.accessToken, user: this.safe(user) };
      }
      if (!input.totp) throw new UnauthorizedException({ code: 'TOTP_REQUIRED', message: 'Doğrulama kodu gerekli' });
      const secret = decryptField(user.twoFactorSecretEnc, env.FIELD_ENCRYPTION_KEY);
      if (!verifyTotp(secret, input.totp)) {
        await this.audit.record({ actorId: user.id, action: 'auth.totp_failed', ip, userAgent: ua });
        throw new UnauthorizedException({ code: 'TOTP_INVALID', message: 'Doğrulama kodu hatalı' });
      }
    }

    if (user.passwordHash && (await needsRehash(user.passwordHash))) {
      await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(input.password) } });
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const tokens = await this.issue(user.id, role, 'full', ip, ua);
    await this.audit.record({ actorId: user.id, actorRole: role, action: 'auth.login', ip, userAgent: ua });
    return {
      status: 'ok' as const,
      ...tokens,
      user: this.safe(user),
      pendingDeletion: user.status === 'PENDING_DELETION',
    };
  }

  /** Sosyal giriş (Google/Apple) sonrası oturum: yalnızca MEMBER hesapları ve iki adımlı doğrulaması olmayanlar. */
  async loginSocial(userId: string, method: 'google' | 'apple', ip?: string, ua?: string) {
    let user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (user.status === 'SUSPENDED') { await this.expireSanctions(user.id); user = (await this.prisma.user.findUnique({ where: { id: user.id } }))!; }
    if (user.status === 'BANNED') throw new ForbiddenException('Hesabınız kalıcı olarak kapatılmıştır');
    if (user.status === 'SUSPENDED') throw new ForbiddenException('Hesabınız geçici olarak askıya alınmıştır');
    if (user.status === 'DELETED') throw new UnauthorizedException();
    if (user.role !== 'MEMBER') throw new ForbiddenException('Koç ve yönetim hesapları şifre ve doğrulama koduyla giriş yapmalıdır');
    if (user.twoFactorEnabled) throw new ForbiddenException('Bu hesapta iki adımlı doğrulama açık; kullanıcı adı ve şifrenle giriş yap');
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const tokens = await this.issue(user.id, user.role as Role, 'full', ip, ua);
    await this.audit.record({ actorId: user.id, actorRole: user.role as Role, action: 'auth.login', ip, userAgent: ua, metadata: { method } });
    return { status: 'ok' as const, ...tokens, user: this.safe(user), pendingDeletion: user.status === 'PENDING_DELETION' };
  }

  private async issue(userId: string, role: Role, kind: 'full' | 'setup', ip?: string, ua?: string) {
    const refreshToken = randomToken(48);
    const expiresAt = new Date(Date.now() + (kind === 'full' ? REFRESH_DAYS * 24 * 3600_000 : SETUP_MINUTES * 60_000));
    const session = await this.prisma.session.create({
      data: { userId, refreshTokenHash: sha256(refreshToken), ip, userAgent: ua, expiresAt },
    });
    const accessToken = await this.jwt.signAsync(
      { sub: userId, role, sid: session.id, scope: kind === 'full' ? 'full' : '2fa_setup' },
      { expiresIn: (kind === 'full' ? env.JWT_ACCESS_TTL : `${SETUP_MINUTES}m`) as any },
    );
    return kind === 'full' ? { accessToken, refreshToken } : { accessToken, refreshToken: undefined };
  }

  async refresh(refreshToken: string, ip?: string, ua?: string) {
    if (!refreshToken || refreshToken.length < 40) throw new UnauthorizedException();
    const hash = sha256(refreshToken);
    const s = await this.prisma.session.findUnique({ where: { refreshTokenHash: hash }, include: { user: true } });
    if (!s) throw new UnauthorizedException();
    if (s.revokedAt) {
      // 15 sn içinde tekrar gelen istek meşru paralel istek olabilir (sekme/prefetch yarışı): sadece reddet
      if (Date.now() - s.revokedAt.getTime() < 15_000) throw new UnauthorizedException();
      // Daha eski kullanılmış refresh token tekrar geldi → çalınmış olabilir: kullanıcının bütün oturumlarını kapat
      await this.prisma.session.updateMany({ where: { userId: s.userId, revokedAt: null }, data: { revokedAt: new Date() } });
      await this.audit.record({ actorId: s.userId, action: 'auth.refresh_reuse_detected', ip, userAgent: ua });
      throw new UnauthorizedException();
    }
    if (s.expiresAt < new Date() || ['SUSPENDED', 'BANNED', 'DELETED'].includes(s.user.status)) throw new UnauthorizedException();

    // Atomik döndürme: aynı token iki kez kullanılamaz
    const rotated = await this.prisma.session.updateMany({ where: { id: s.id, revokedAt: null }, data: { revokedAt: new Date() } });
    if (rotated.count === 0) throw new UnauthorizedException();
    const tokens = await this.issue(s.userId, s.user.role as Role, 'full', ip, ua);
    return { status: 'ok' as const, ...tokens, user: this.safe(s.user) };
  }

  async logout(sid: string) {
    await this.prisma.session.updateMany({ where: { id: sid, revokedAt: null }, data: { revokedAt: new Date() } });
    return { ok: true };
  }

  async me(userId: string) {
    const u = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { creatorProfile: { select: { status: true, isPublic: true, displayName: true } } },
    });
    return { ...this.safe(u), status: u.status, creator: u.creatorProfile };
  }

  // ---------- 2FA ----------
  async twoFactorSetup(userId: string) {
    const u = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (u.twoFactorEnabled) throw new BadRequestException('2FA zaten etkin');
    const secret = generateTotpSecret();
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorSecretEnc: encryptField(secret, env.FIELD_ENCRYPTION_KEY) } });
    return { secret, otpauthUri: totpUri(secret, u.email) };
  }

  async twoFactorEnable(userId: string, sid: string, code: string, ip?: string, ua?: string) {
    const u = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!u.twoFactorSecretEnc) throw new BadRequestException('Önce 2FA kurulumunu başlatın');
    const secret = decryptField(u.twoFactorSecretEnc, env.FIELD_ENCRYPTION_KEY);
    if (!verifyTotp(secret, code)) throw new BadRequestException('Doğrulama kodu hatalı');
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
    await this.prisma.session.updateMany({ where: { id: sid }, data: { revokedAt: new Date() } });
    const tokens = await this.issue(userId, u.role as Role, 'full', ip, ua);
    await this.audit.record({ actorId: userId, actorRole: u.role as Role, action: 'auth.2fa_enabled', ip, userAgent: ua });
    return { status: 'ok' as const, ...tokens, user: this.safe({ ...u, twoFactorEnabled: true }) };
  }
}
