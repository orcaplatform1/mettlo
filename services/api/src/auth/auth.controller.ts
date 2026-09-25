import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from '@mettlo/validation';
import { AllowScopes, CurrentUser, Public } from '../common/decorators';
import { clientIp, userAgent, type AuthedRequest, type AuthUser } from '../common/request';
import { ZodPipe } from '../common/zod.pipe';
import { AuthService } from './auth.service';
import { SocialService } from './social.service';

const refreshSchema = z.object({ refreshToken: z.string().min(40).max(200) });
const codeSchema = z.object({ code: z.string().regex(/^\d{6}$/) });

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly social: SocialService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 3600_000 } })
  @Post('register')
  register(@Body(new ZodPipe(registerSchema)) body: RegisterInput, @Req() req: AuthedRequest) {
    return this.auth.register(body, clientIp(req), userAgent(req));
  }

  @Public()
  @Get('social/providers')
  socialProviders() { return this.social.providers(); }

  @Public()
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('social/exchange')
  socialExchange(@Body(new ZodPipe(z.object({ provider: z.enum(['google', 'apple']), code: z.string().min(10).max(4000), redirectUri: z.string().url().max(300), nonce: z.string().min(8).max(200), appleUser: z.string().max(2000).optional() }))) b: { provider: 'google' | 'apple'; code: string; redirectUri: string; nonce: string; appleUser?: string }, @Req() req: AuthedRequest) {
    return this.social.exchange(b.provider, b.code, b.redirectUri, b.nonce, clientIp(req), userAgent(req), b.appleUser);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 3600_000 } })
  @Post('social/complete')
  socialComplete(@Body() b: Record<string, unknown>, @Req() req: AuthedRequest) {
    return this.social.complete(b ?? {}, clientIp(req), userAgent(req));
  }

  @Public()
  @HttpCode(200)
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Post('login')
  login(@Body(new ZodPipe(loginSchema)) body: LoginInput, @Req() req: AuthedRequest) {
    return this.auth.login(body, clientIp(req), userAgent(req));
  }

  @Public()
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('refresh')
  refresh(@Body(new ZodPipe(refreshSchema)) body: { refreshToken: string }, @Req() req: AuthedRequest) {
    return this.auth.refresh(body.refreshToken, clientIp(req), userAgent(req));
  }

  @HttpCode(200)
  @Post('logout')
  logout(@CurrentUser() u: AuthUser) {
    return this.auth.logout(u.sid);
  }

  @Get('me')
  me(@CurrentUser() u: AuthUser) {
    return this.auth.me(u.id);
  }

  @AllowScopes('full', '2fa_setup')
  @Post('2fa/setup')
  @HttpCode(200)
  setup(@CurrentUser() u: AuthUser) {
    return this.auth.twoFactorSetup(u.id);
  }

  @AllowScopes('full', '2fa_setup')
  @Post('2fa/enable')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  enable(@CurrentUser() u: AuthUser, @Body(new ZodPipe(codeSchema)) body: { code: string }, @Req() req: AuthedRequest) {
    return this.auth.twoFactorEnable(u.id, u.sid, body.code, clientIp(req), userAgent(req));
  }
}
