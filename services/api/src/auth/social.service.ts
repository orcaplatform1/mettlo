import { BadRequestException, ForbiddenException, HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, createSign, randomBytes, timingSafeEqual } from 'node:crypto';
import { registerSchema } from '@mettlo/validation';
import { env } from '../common/env';
import { PrismaService } from '../common/prisma.service';
import { AuthService } from './auth.service';

export type Provider = 'google' | 'apple';
interface Identity { provider: Provider; sub: string; email: string; emailVerified: boolean; name: string }
interface Pending { p: Provider; sub: string; email: string; name: string; exp: number }

const b64u = (b: Buffer | string) => Buffer.from(b).toString('base64url');
const fromB64u = (s: string) => Buffer.from(s, 'base64url');

/**
 * Google ve Apple ile giriş (yetkilendirme kodu akışı). Yalnızca ÜYE hesapları içindir; koç ve yönetim hesapları şifre + 2FA ile girer.
 * Yapılandırma (ortam değişkenleri) yoksa uçlar 501 döner; web arayüzü bunu dostça bir mesaja çevirir.
 */
@Injectable()
export class SocialService {
  constructor(private readonly prisma: PrismaService, private readonly auth: AuthService) {}

  providers() {
    return {
      google: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      apple: !!(env.APPLE_CLIENT_ID && env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY),
    };
  }

  private sign(payload: Pending): string {
    const body = b64u(JSON.stringify(payload));
    const mac = createHmac('sha256', `${env.FIELD_ENCRYPTION_KEY}:social`).update(body).digest();
    return `${body}.${b64u(mac)}`;
  }
  private verify(token: string): Pending {
    const [body, mac] = token.split('.');
    if (!body || !mac) throw new BadRequestException('Geçersiz veya süresi dolmuş işlem');
    const expect = createHmac('sha256', `${env.FIELD_ENCRYPTION_KEY}:social`).update(body).digest();
    const got = fromB64u(mac);
    if (got.length !== expect.length || !timingSafeEqual(got, expect)) throw new BadRequestException('Geçersiz veya süresi dolmuş işlem');
    const p = JSON.parse(fromB64u(body).toString('utf8')) as Pending;
    if (p.exp < Date.now()) throw new BadRequestException('İşlemin süresi doldu; lütfen yeniden dene');
    return p;
  }

  private async googleIdentity(code: string, redirectUri: string, nonce: string): Promise<Identity> {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID!, client_secret: env.GOOGLE_CLIENT_SECRET!, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
    });
    const j: any = await r.json().catch(() => ({}));
    if (!r.ok || !j.id_token) throw new UnauthorizedException('Google doğrulaması başarısız');
    // id_token'ı Google'ın kendi doğrulama ucuna yaptır (imza ve süre kontrolü Google'da)
    const t = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(j.id_token)}`);
    const info: any = await t.json().catch(() => ({}));
    if (!t.ok || info.aud !== env.GOOGLE_CLIENT_ID || !['accounts.google.com', 'https://accounts.google.com'].includes(info.iss) || Number(info.exp) * 1000 < Date.now()) throw new UnauthorizedException('Google doğrulaması başarısız');
    if (info.nonce && info.nonce !== nonce) throw new UnauthorizedException('Google doğrulaması başarısız');
    if (!info.email) throw new BadRequestException('Google hesabından e-posta alınamadı');
    return { provider: 'google', sub: String(info.sub), email: String(info.email).toLowerCase(), emailVerified: info.email_verified === 'true' || info.email_verified === true, name: String(info.name ?? info.email).slice(0, 80) };
  }

  private appleClientSecret(): string {
    const now = Math.floor(Date.now() / 1000);
    const head = b64u(JSON.stringify({ alg: 'ES256', kid: env.APPLE_KEY_ID }));
    const body = b64u(JSON.stringify({ iss: env.APPLE_TEAM_ID, iat: now, exp: now + 300, aud: 'https://appleid.apple.com', sub: env.APPLE_CLIENT_ID }));
    const sig = createSign('SHA256').update(`${head}.${body}`).sign({ key: env.APPLE_PRIVATE_KEY!.replace(/\\n/g, '\n'), dsaEncoding: 'ieee-p1363' });
    return `${head}.${body}.${b64u(sig)}`;
  }

  private async appleIdentity(code: string, redirectUri: string, nonce: string, appleUser?: string): Promise<Identity> {
    const r = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: env.APPLE_CLIENT_ID!, client_secret: this.appleClientSecret(), redirect_uri: redirectUri, grant_type: 'authorization_code' }),
    });
    const j: any = await r.json().catch(() => ({}));
    if (!r.ok || !j.id_token) throw new UnauthorizedException('Apple doğrulaması başarısız');
    // id_token doğrudan Apple'ın token ucundan TLS ile alındı (OIDC: bu durumda imza doğrulaması zorunlu değildir); talepler kontrol edilir.
    const claims: any = JSON.parse(fromB64u(String(j.id_token).split('.')[1] ?? '').toString('utf8'));
    if (claims.iss !== 'https://appleid.apple.com' || claims.aud !== env.APPLE_CLIENT_ID || Number(claims.exp) * 1000 < Date.now()) throw new UnauthorizedException('Apple doğrulaması başarısız');
    if (claims.nonce && claims.nonce !== nonce) throw new UnauthorizedException('Apple doğrulaması başarısız');
    if (!claims.email) throw new BadRequestException('Apple hesabından e-posta alınamadı');
    let name = String(claims.email).split('@')[0];
    try { const u = appleUser ? JSON.parse(appleUser) : null; if (u?.name) name = `${u.name.firstName ?? ''} ${u.name.lastName ?? ''}`.trim() || name; } catch { /* isim yalnızca ilk girişte gelir */ }
    return { provider: 'apple', sub: String(claims.sub), email: String(claims.email).toLowerCase(), emailVerified: claims.email_verified === 'true' || claims.email_verified === true, name: name.slice(0, 80) };
  }

  /** Sağlayıcıdan gelen kimliği doğrular; hesap varsa oturum açar, yoksa profil tamamlama belirteci döner. */
  async exchange(provider: Provider, code: string, redirectUri: string, nonce: string, ip?: string, ua?: string, appleUser?: string) {
    if (!this.providers()[provider]) throw new HttpException({ code: 'SOCIAL_NOT_CONFIGURED', message: 'Bu giriş yöntemi henüz yapılandırılmadı' }, 501);
    const id = provider === 'google' ? await this.googleIdentity(code, redirectUri, nonce) : await this.appleIdentity(code, redirectUri, nonce, appleUser);
    const col = provider === 'google' ? 'googleId' : 'appleId';
    let user = await this.prisma.user.findFirst({ where: { [col]: id.sub } as any });
    if (!user && id.emailVerified) {
      const byEmail = await this.prisma.user.findUnique({ where: { email: id.email } });
      if (byEmail) {
        if (byEmail.role !== 'MEMBER') throw new ForbiddenException('Bu e-posta bir koç veya yönetim hesabına ait; şifreyle giriş yapmalısın');
        user = await this.prisma.user.update({ where: { id: byEmail.id }, data: { [col]: id.sub } as any });
      }
    }
    if (user) return this.auth.loginSocial(user.id, provider, ip, ua);
    if (!id.emailVerified) throw new ForbiddenException('E-posta adresin doğrulanmamış; başka bir yöntemle kayıt ol');
    return { status: 'needs_profile' as const, pendingToken: this.sign({ p: provider, sub: id.sub, email: id.email, name: id.name, exp: Date.now() + 15 * 60_000 }), profile: { provider, email: id.email, name: id.name } };
  }

  /** Yeni sosyal kullanıcı: kullanıcı adı, telefon, doğum tarihi ve onaylar alınır; şifresiz üye hesabı açılır. */
  async complete(input: Record<string, unknown>, ip?: string, ua?: string) {
    const pending = this.verify(String(input.pendingToken ?? ''));
    const parsed = registerSchema.safeParse({
      email: pending.email, name: pending.name.length >= 2 ? pending.name : 'Üye', username: input.username, phone: input.phone, birthDate: input.birthDate,
      password: `Aa1${randomBytes(6).toString('hex')}`, acceptTerms: input.acceptTerms, acceptKvkk: input.acceptKvkk, marketingConsent: !!input.marketingConsent,
    });
    if (!parsed.success) throw new BadRequestException({ message: 'Geçersiz istek', errors: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) });
    const col = pending.p === 'google' ? 'googleId' : 'appleId';
    if (await this.prisma.user.findFirst({ where: { [col]: pending.sub } as any, select: { id: true } })) throw new BadRequestException('Bu hesap zaten kayıtlı; giriş yap');
    const reg: any = await this.auth.register(parsed.data, ip, ua, { passwordless: true, emailVerified: true, [col]: pending.sub });
    return this.auth.loginSocial(reg.user.id, pending.p, ip, ua);
  }
}
