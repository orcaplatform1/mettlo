import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Permission, Role } from '@mettlo/types';
import type { AuthedRequest, AuthUser } from './request';

export const IS_PUBLIC = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC, true);

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const PERMISSION_KEY = 'permission';
export const RequirePermission = (p: Permission) => SetMetadata(PERMISSION_KEY, p);

export const SCOPE_KEY = 'allowedScopes';
/** Varsayılan sadece 'full' oturum. 2FA kurulum uçları '2fa_setup' kapsamına da izin verir. */
export const AllowScopes = (...s: Array<'full' | '2fa_setup'>) => SetMetadata(SCOPE_KEY, s);

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest<AuthedRequest>().user as AuthUser;
});
