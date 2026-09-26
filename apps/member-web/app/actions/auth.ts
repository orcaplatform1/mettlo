'use server';
import { redirect } from 'next/navigation';
import { ApiError, apiFetch, clearSession, clientIpFromHeaders, clientUserAgent, getAccessToken, homeForRole, setSessionCookies, setSetupCookie, COOKIE_SETUP } from '@mettlo/web-core';
import { loginSchema, registerSchema } from '@mettlo/validation';
import { cookies } from 'next/headers';

export interface AuthState {
  error?: string;
  needTotp?: boolean;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
}

/** next parametresi yalnızca bu site içi bir yol olabilir (open-redirect koruması) */
function safeNext(v: FormDataEntryValue | null): string | undefined {
  const s = typeof v === 'string' ? v : '';
  return s.startsWith('/') && !s.startsWith('//') && !s.includes('\\') ? s : undefined;
}

async function fwdHeaders() {
  const ip = await clientIpFromHeaders();
  const ua = await clientUserAgent();
  return { ...(ip ? { 'x-forwarded-for': ip } : {}), ...(ua ? { 'user-agent': ua } : {}) };
}

function mapZod(issues: Array<{ path: PropertyKey[]; message: string }>) {
  const out: Record<string, string> = {};
  for (const i of issues) { const k = String(i.path[0] ?? 'form'); if (!out[k]) out[k] = i.message; }
  return out;
}

function mapApiErrors(e: ApiError): Record<string, string> | undefined {
  const arr = e.body?.errors;
  if (!Array.isArray(arr)) return undefined;
  const out: Record<string, string> = {};
  for (const i of arr) { const k = String(i.path || 'form').split('.')[0]; if (!out[k]) out[k] = i.message; }
  return out;
}

export async function loginAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const raw = { username: String(fd.get('username') ?? ''), password: String(fd.get('password') ?? ''), totp: String(fd.get('totp') ?? '') || undefined };
  const values = { username: raw.username };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: mapZod(parsed.error.issues), values };

  let res: any;
  try {
    res = await apiFetch('/auth/login', { method: 'POST', body: parsed.data, headers: await fwdHeaders() });
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.body?.code === 'TOTP_REQUIRED') return { needTotp: true, values };
      if (e.body?.code === 'TOTP_INVALID') return { needTotp: true, error: 'Doğrulama kodu hatalı. Lütfen tekrar deneyin.', values };
      if (e.status === 429) return { error: 'Çok fazla deneme yaptınız. Lütfen bir dakika sonra tekrar deneyin.', values };
      if (e.status === 403) return { error: e.message || 'Bu hesap şu an kullanıma kapalı.', values };
      if (e.status === 401 || e.status === 400) return { error: 'Kullanıcı adı veya şifre hatalı.', values };
    }
    return { error: 'Şu an giriş yapılamıyor. Lütfen biraz sonra tekrar deneyin.', values };
  }

  if (res.status === '2fa_setup_required') {
    await setSetupCookie(res.accessToken);
    redirect('/login/2fa-setup');
  }
  await setSessionCookies(res);
  redirect(safeNext(fd.get('next')) ?? homeForRole(res.user.role));
}

export async function registerAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const cityIdRaw = fd.get('cityId'); const districtIdRaw = fd.get('districtId');
  const raw = {
    email: String(fd.get('email') ?? ''), username: String(fd.get('username') ?? ''), name: String(fd.get('name') ?? ''),
    phone: String(fd.get('phone') ?? ''), password: String(fd.get('password') ?? ''), birthDate: String(fd.get('birthDate') ?? ''),
    acceptTerms: fd.get('acceptTerms') === 'on', acceptKvkk: fd.get('acceptKvkk') === 'on', marketingConsent: fd.get('marketingConsent') === 'on',
    cityId: cityIdRaw ? parseInt(String(cityIdRaw), 10) || undefined : undefined,
    districtId: districtIdRaw ? parseInt(String(districtIdRaw), 10) || undefined : undefined,
  };
  const values = { email: raw.email, username: raw.username, name: raw.name, phone: raw.phone, birthDate: raw.birthDate };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: mapZod(parsed.error.issues), values };
  if (raw.password !== String(fd.get('passwordConfirm') ?? '')) return { fieldErrors: { passwordConfirm: 'Şifreler eşleşmiyor' }, values };

  try {
    await apiFetch('/auth/register', { method: 'POST', body: { ...parsed.data, birthDate: raw.birthDate }, headers: await fwdHeaders() });
  } catch (e) {
    if (e instanceof ApiError) {
      const fe = mapApiErrors(e);
      if (fe) return { fieldErrors: fe, values };
      if (e.status === 409) {
        const m = e.message || '';
        return m.includes('kullanıcı adı') ? { fieldErrors: { username: m }, values } : { error: m || 'Bu bilgilerle zaten bir hesap var.', values };
      }
      if (e.status === 429) return { error: 'Çok fazla kayıt denemesi yapıldı. Lütfen daha sonra tekrar deneyin.', values };
      if (e.status === 403) return { error: e.message, values };
    }
    return { error: 'Kayıt şu an tamamlanamadı. Lütfen biraz sonra tekrar deneyin.', values };
  }

  // Kayıttan sonra otomatik giriş
  try {
    const res = await apiFetch('/auth/login', { method: 'POST', body: { username: parsed.data.username, password: raw.password }, headers: await fwdHeaders() });
    await setSessionCookies(res);
  } catch {
    redirect('/login');
  }
  redirect(safeNext(fd.get('next')) ?? '/app');
}

/** Tek adımda üyelik + koç başvurusu (herkese açık form). Hata durumunda hesap OLUŞTURULMAZ. */
export async function registerCoachAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const raw = {
    email: String(fd.get('email') ?? ''), username: String(fd.get('username') ?? ''), name: String(fd.get('name') ?? ''),
    phone: String(fd.get('phone') ?? ''), password: String(fd.get('password') ?? ''), birthDate: String(fd.get('birthDate') ?? ''),
    acceptTerms: fd.get('acceptTerms') === 'on', acceptKvkk: fd.get('acceptKvkk') === 'on', marketingConsent: fd.get('marketingConsent') === 'on',
  };
  const values = { email: raw.email, username: raw.username, name: raw.name, phone: raw.phone, birthDate: raw.birthDate };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: mapZod(parsed.error.issues), values };
  if (raw.password !== String(fd.get('passwordConfirm') ?? '')) return { fieldErrors: { passwordConfirm: 'Şifreler eşleşmiyor' }, values };
  const s = (k: string) => String(fd.get(k) ?? '').trim();
  const year = s('careerStartYear');
  const application = {
    displayName: s('displayName'), headline: s('headline') || undefined, bio: s('bio') || undefined, whyChooseMe: s('whyChooseMe') || undefined,
    branchSlugs: fd.getAll('branchSlugs').map(String), subCategoryIds: fd.getAll('subCategoryIds').map(String), credentials: s('credentials') || undefined,
    expertise: s('expertise').split(',').map((x) => x.trim()).filter(Boolean).slice(0, 10),
    careerStartYear: year ? Number(year) : undefined, declaredActiveStudents: Number(s('declaredActiveStudents') || 0),
  };
  try {
    await apiFetch('/creators/register-and-apply', { method: 'POST', body: { account: { ...parsed.data, birthDate: raw.birthDate }, application }, headers: await fwdHeaders() });
  } catch (e) {
    if (e instanceof ApiError) {
      const arr = e.body?.errors;
      if (Array.isArray(arr) && arr.length) {
        const fe: Record<string, string> = {};
        for (const i of arr) { const parts = String(i.path || 'form').split('.'); const k = parts.length > 1 && (parts[0] === 'account' || parts[0] === 'application') ? parts[1]! : parts[0]!; if (!fe[k]) fe[k] = i.message; }
        return { fieldErrors: fe, error: 'Formda düzeltilmesi gereken alanlar var.', values };
      }
      if (e.status === 409) { const m = e.message || ''; return m.includes('kullanıcı adı') ? { fieldErrors: { username: m }, values } : { error: m || 'Bu bilgilerle zaten bir hesap var.', values }; }
      if (e.status === 429) return { error: 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar dene.', values };
      if (e.status === 403 || e.status === 400) return { error: e.message, values };
    }
    return { error: 'Başvuru şu an tamamlanamadı. Lütfen biraz sonra tekrar dene.', values };
  }
  try {
    const res = await apiFetch('/auth/login', { method: 'POST', body: { username: parsed.data.username, password: raw.password }, headers: await fwdHeaders() });
    await setSessionCookies(res);
  } catch { redirect('/login'); }
  redirect('/app/become-coach');
}

export async function enableTwoFactorAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const code = String(fd.get('code') ?? '').trim();
  if (!/^\d{6}$/.test(code)) return { fieldErrors: { code: '6 haneli doğrulama kodunu girin' } };
  const setup = (await cookies()).get(COOKIE_SETUP)?.value;
  if (!setup) redirect('/login');
  try {
    const res = await apiFetch('/auth/2fa/enable', { method: 'POST', token: setup, body: { code }, headers: await fwdHeaders() });
    await setSessionCookies(res);
    redirect(homeForRole(res.user.role));
  } catch (e) {
    if (e instanceof ApiError && (e.status === 400 || e.status === 401)) return { fieldErrors: { code: 'Kod hatalı. Uygulamadaki güncel kodu girin.' } };
    if (e instanceof ApiError && e.status === 403) redirect('/login');
    throw e;
  }
}

export async function logoutAction() {
  const token = await getAccessToken();
  if (token) { try { await apiFetch('/auth/logout', { method: 'POST', token }); } catch { /* oturum zaten kapalı */ } }
  await clearSession();
  redirect('/');
}

/** Sosyal girişten gelen yeni kullanıcı: kullanıcı adı, telefon, doğum tarihi ve onaylar tamamlanınca hesap açılır. */
export async function completeSocialAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const token = (await cookies()).get('mettlo_social_pending')?.value;
  if (!token) redirect('/login?social=error');
  const s = (k: string) => String(fd.get(k) ?? '').trim();
  const values = { username: s('username'), phone: s('phone'), birthDate: s('birthDate') };
  let res: any;
  try {
    res = await apiFetch('/auth/social/complete', { method: 'POST', body: { pendingToken: token, ...values, acceptTerms: fd.get('acceptTerms') === 'on', acceptKvkk: fd.get('acceptKvkk') === 'on', marketingConsent: fd.get('marketingConsent') === 'on' }, headers: await fwdHeaders() });
  } catch (e) {
    if (e instanceof ApiError) {
      const fe = mapApiErrors(e);
      if (fe) return { fieldErrors: fe, values };
      if (e.status === 409) { const m = e.message || ''; return m.includes('kullanıcı adı') ? { fieldErrors: { username: m }, values } : { error: m || 'Bu bilgilerle zaten bir hesap var.', values }; }
      if (e.status === 400) redirect('/login?social=error');
      return { error: e.message, values };
    }
    return { error: 'Kayıt tamamlanamadı. Lütfen tekrar dene.', values };
  }
  await setSessionCookies(res);
  (await cookies()).delete('mettlo_social_pending');
  redirect('/app');
}
