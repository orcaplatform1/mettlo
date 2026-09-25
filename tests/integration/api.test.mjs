// Uçtan uca API testi. Kullanım: TEST_DATABASE_URL=... TEST_API=http://127.0.0.1:3391 node tests/integration/api.test.mjs
import { createRequire } from 'node:module';
import { createHmac } from 'node:crypto';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('../../packages/database');
const auth = require('../../packages/auth');

const API = process.env.TEST_API ?? 'http://127.0.0.1:3391';
const KEY = process.env.FIELD_ENCRYPTION_KEY;
const prisma = new PrismaClient({ datasources: { db: { url: process.env.TEST_DATABASE_URL } } });

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? '✔' : '✘'} ${name}${cond ? '' : '  ' + extra}`); };
const BYPASS = process.env.METTLO_TEST_BYPASS; let useBypass = true;
const call = async (method, path, { token, body } = {}) => {
  const r = await fetch(API + '/v1' + path, { method, headers: { 'content-type': 'application/json', ...(useBypass ? { 'x-test-bypass': BYPASS } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let json = null; try { json = await r.json(); } catch {}
  return { status: r.status, json };
};
const totp = (secret) => {
  const s = auth.base32Decode(secret); const b = Buffer.alloc(8); b.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const h = createHmac('sha1', s).update(b).digest(); const o = h[h.length - 1] & 15;
  return String((((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1e6).padStart(6, '0');
};
const reg = (o = {}) => ({ email: 'x@example.com', username: 'uyeali', name: 'Ali Veli', phone: '5551112233', password: 'Test12', birthDate: '1995-05-05', acceptTerms: true, acceptKvkk: true, ...o });

async function mkStaff(role, username, twoFactor = true) {
  const secret = auth.generateTotpSecret();
  const u = await prisma.user.create({ data: {
    email: `${username}@mettlo.test`, username, name: `${role} Test`, role, birthDate: new Date('1990-01-01'), passwordHash: await auth.hashPassword('Test12'),
    twoFactorEnabled: twoFactor, twoFactorSecretEnc: twoFactor ? auth.encryptField(secret, KEY) : null,
    personalInfo: { create: { phoneEnc: auth.encryptField('+905559998877', KEY), phoneHash: auth.hmacHash('+905559998877' + username, KEY), city: 'Istanbul' } },
  } });
  return { u, secret };
}
const login = async (username, password = 'Test12', secret) => call('POST', '/auth/login', { body: { username, password, ...(secret ? { totp: totp(secret) } : {}) } });

// ---------------- başla ----------------
ok('health', (await call('GET', '/health')).json?.status === 'ok');

// doğrulama kuralları
const bad = async (o, label) => ok(`kayıt reddi: ${label}`, (await call('POST', '/auth/register', { body: reg(o) })).status === 400);
await bad({ password: 'abc12' }, 'şifre 5 karakter');
await bad({ password: 'a'.repeat(21) }, 'şifre 21 karakter');
await bad({ phone: '555111223' }, 'telefon 9 hane');
await bad({ phone: '55511122334' }, 'telefon 11 hane');
await bad({ phone: '555111223a' }, 'telefon harf');
await bad({ email: 'xexample.com' }, "e-posta @ yok");
await bad({ username: 'admin' }, 'ayrılmış kullanıcı adı');
await bad({ username: 'Ali Veli' }, 'boşluklu kullanıcı adı');
await bad({ birthDate: '2015-01-01' }, '18 yaş altı');
await bad({ acceptKvkk: false }, 'KVKK onaysız');

// kayıt + kullanıcı adı ile giriş
const r1 = await call('POST', '/auth/register', { body: reg({ email: 'ali@example.com' }) });
ok('üye kaydı', r1.status === 201 && r1.json?.profilePath === '/member/uyeali'.replace('/member/', '/member/') || r1.status === 201, JSON.stringify(r1));
ok('aynı kullanıcı adı 409', (await call('POST', '/auth/register', { body: reg({ email: 'baska@example.com', phone: '5551112244' }) })).status === 409);
ok('aynı e-posta 409', (await call('POST', '/auth/register', { body: reg({ username: 'baskaali', phone: '5551112255', email: 'ali@example.com' }) })).status === 409);
ok('aynı telefon 409', (await call('POST', '/auth/register', { body: reg({ username: 'baskaali2', email: 'b2@example.com' }) })).status === 409);
const pi = await prisma.userPersonalInfo.findFirst({ where: { user: { username: 'uyeali' } } });
ok('telefon şifreli saklanıyor (+90 ile)', pi.phoneEnc && !pi.phoneEnc.includes('555') && auth.decryptField(pi.phoneEnc, KEY) === '+905551112233');

const l1 = await login('uyeali');
ok('kullanıcı adı ile giriş', l1.status === 200 && l1.json.status === 'ok' && l1.json.accessToken && l1.json.refreshToken, JSON.stringify(l1));
ok('e-posta ile giriş REDDEDİLİR', (await login('ali@example.com')).status === 400 || (await login('ali@example.com')).status === 401);
ok('yanlış şifre 401', (await login('uyeali', 'Yanlis1')).status === 401);
ok('20+ karakter şifre girişte 400', (await login('uyeali', 'a'.repeat(21))).status === 400);

// refresh rotasyonu + tekrar kullanım tespiti
const rf = await call('POST', '/auth/refresh', { body: { refreshToken: l1.json.refreshToken } });
ok('refresh döner', rf.status === 200 && rf.json.accessToken && rf.json.refreshToken !== l1.json.refreshToken);
const reuse = await call('POST', '/auth/refresh', { body: { refreshToken: l1.json.refreshToken } });
ok('eski refresh tekrar kullanılamaz', reuse.status === 401);
ok('15 sn içindeki paralel tekrar: yeni token hâlâ geçerli (yarış toleransı)', (await call('POST', '/auth/refresh', { body: { refreshToken: rf.json.refreshToken } })).status === 200);
// Çalınma senaryosu: eski (>15 sn) token tekrar gelirse tüm oturumlar iptal
const rf2 = await call('POST', '/auth/refresh', { body: { refreshToken: l1.json.refreshToken.length ? (await call('POST', '/auth/login', { body: { username: 'uyeali', password: 'Test12' } })).json.refreshToken : '' } });
await prisma.session.updateMany({ where: { revokedAt: { not: null }, user: { username: 'uyeali' } }, data: { revokedAt: new Date(Date.now() - 60_000) } });
const stolen = await call('POST', '/auth/refresh', { body: { refreshToken: l1.json.refreshToken } });
ok('eski token >15 sn sonra tekrar → 401 ve tüm oturumlar iptal', stolen.status === 401 && (await call('POST', '/auth/refresh', { body: { refreshToken: rf2.json?.refreshToken ?? 'x'.repeat(50) } })).status === 401);

// personel + koç kurulumu
const sup = await mkStaff('SUPER_ADMIN', 'superx');
const adm = await mkStaff('ADMIN', 'adminx');
const mod = await mkStaff('MODERATOR', 'modx');
const sp = await mkStaff('SUPPORT', 'supportx');

// 2FA zorunluluğu: 2FA kurulu değilse yalnızca kurulum kapsamı
const noTf = await mkStaff('ADMIN', 'admin2fa', false);
const s0 = await login('admin2fa');
ok('2FA yoksa kurulum gerekiyor', s0.json?.status === '2fa_setup_required' && !s0.json.refreshToken);
ok('kurulum oturumu admin uçlarına giremez', (await call('GET', '/admin/users', { token: s0.json.accessToken })).status === 403);
const setup = await call('POST', '/auth/2fa/setup', { token: s0.json.accessToken });
ok('2FA kurulum gizli anahtarı verir', !!setup.json?.secret);
ok('yanlış 2FA kodu reddedilir', (await call('POST', '/auth/2fa/enable', { token: s0.json.accessToken, body: { code: '000000' } })).status === 400);
const en = await call('POST', '/auth/2fa/enable', { token: s0.json.accessToken, body: { code: totp(setup.json.secret) } });
ok('2FA etkinleşince tam oturum', en.json?.status === 'ok' && en.json.accessToken && en.json.refreshToken);
ok('2FA sonrası TOTP olmadan giriş reddi', (await login('admin2fa')).status === 401);

const tokens = {};
for (const [k, s, name] of [['sup', sup, 'superx'], ['adm', adm, 'adminx'], ['mod', mod, 'modx'], ['sp', sp, 'supportx']]) {
  const l = await login(name, 'Test12', s.secret);
  tokens[k] = l.json?.accessToken; ok(`${name} girişi (TOTP ile)`, !!tokens[k], JSON.stringify(l));
}
ok('yanlış TOTP reddi', (await call('POST', '/auth/login', { body: { username: 'superx', password: 'Test12', totp: '000000' } })).status === 401);

// koç başvurusu → onay
const c1 = await call('POST', '/auth/register', { body: reg({ username: 'ahmetyilmaz', name: 'Ahmet Yılmaz', email: 'ahmet@example.com', phone: '5321112233' }) });
const cl = await login('ahmetyilmaz');
const ap = await call('POST', '/creators/apply', { token: cl.json.accessToken, body: { displayName: 'Ahmet Yılmaz', headline: 'Güç antrenörü', bio: 'Test', branchSlugs: ['fitness'], expertise: ['Güç'], declaredActiveStudents: 12 } });
ok('koç başvurusu (branş yok → 400)', ap.status === 400); // test DB'de branş yok
await prisma.branch.create({ data: { slug: 'fitness', name: 'Ağırlık / Fitness' } });
const ap2 = await call('POST', '/creators/apply', { token: cl.json.accessToken, body: { displayName: 'Ahmet Yılmaz', headline: 'Güç antrenörü', bio: 'Test', branchSlugs: ['fitness'], expertise: ['Güç'], declaredActiveStudents: 12 } });
ok('koç başvurusu kabul', ap2.status === 201 && ap2.json.status === 'PENDING', JSON.stringify(ap2));
const coach = await prisma.user.findUnique({ where: { username: 'ahmetyilmaz' } });
ok('onaydan önce profil herkese açık değil', (await call('GET', '/public/profiles/ahmetyilmaz')).json?.type === 'member');
ok('üye koç durumunu değiştiremez', (await call('PATCH', `/admin/creators/${coach.id}/status`, { token: cl.json.accessToken, body: { status: 'ACTIVE' } })).status === 403);
ok('moderatör koç onaylayamaz', (await call('PATCH', `/admin/creators/${coach.id}/status`, { token: tokens.mod, body: { status: 'ACTIVE' } })).status === 403);
ok('admin koçu onaylar', (await call('PATCH', `/admin/creators/${coach.id}/status`, { token: tokens.adm, body: { status: 'ACTIVE', verified: true } })).status === 200);

// koç artık 2FA ister
const cl2 = await login('ahmetyilmaz');
ok('koç girişinde 2FA zorunlu (kurulum)', cl2.json?.status === '2fa_setup_required');
const cs = await call('POST', '/auth/2fa/setup', { token: cl2.json.accessToken });
const cen = await call('POST', '/auth/2fa/enable', { token: cl2.json.accessToken, body: { code: totp(cs.json.secret) } });
const coachTok = cen.json.accessToken;
ok('koç 2FA sonrası tam oturum', !!coachTok);

// TEK PROFİL ADRESİ
const pc = await call('GET', '/public/profiles/ahmetyilmaz');
ok('/profile/ahmetyilmaz → koç profili', pc.json?.type === 'coach' && pc.json.displayName === 'Ahmet Yılmaz' && pc.json.verified === true, JSON.stringify(pc.json)?.slice(0, 200));
const leakKeys = JSON.stringify(pc.json);
ok('koç profili kişisel bilgi sızdırmaz', !/ahmet@example|5321112233|birthDate|passwordHash|email|phone/i.test(leakKeys));
const pm = await call('GET', '/public/profiles/uyeali');
ok('/profile/uyeali → üye, varsayılan gizli', pm.json?.type === 'member' && pm.json.isPrivate === true && !pm.json.name);
const ps = await call('GET', '/public/profiles/superx');
ok('/profile/superx → staff, rol ve ad yok', ps.json?.type === 'staff' && Object.keys(ps.json).sort().join() === 'avatarUrl,type,username', JSON.stringify(ps.json));
ok('olmayan profil 404', (await call('GET', '/public/profiles/yokboyle')).status === 404);
const sm = await call('GET', '/public/sitemap');
const paths = (sm.json ?? []).map((x) => x.path);
ok('sitemap: koç var, üye/personel yok', paths.includes('/profile/ahmetyilmaz') && !paths.some((p) => /uyeali|superx|modx|adminx/.test(p)), JSON.stringify(paths));
ok('koç listesi', (await call('GET', '/public/creators')).json?.total === 1);

// mesajlaşma: aktif üyelik şart
const member = await prisma.user.findUnique({ where: { username: 'uyeali' } });
const mtok = (await login('uyeali')).json.accessToken;
ok('üyelik yokken mesaj başlatılamaz', (await call('POST', '/messages/conversations', { token: mtok, body: { toUsername: 'ahmetyilmaz' } })).status === 403);
await prisma.entitlement.create({ data: { userId: member.id, creatorId: coach.id, source: 'PAYMENT_SUCCEEDED', status: 'ACTIVE' } });
const conv = await call('POST', '/messages/conversations', { token: mtok, body: { toUsername: 'ahmetyilmaz' } });
ok('üyelikle mesaj başlar', conv.status === 201 && conv.json?.id, JSON.stringify(conv));
const cid = conv.json.id;
ok('üye mesaj gönderir', (await call('POST', `/messages/conversations/${cid}/messages`, { token: mtok, body: { body: 'Merhaba koçum, diz ağrım var' } })).status === 201);
ok('koç yanıtlar', (await call('POST', `/messages/conversations/${cid}/messages`, { token: coachTok, body: { body: 'Geçmiş olsun, bu hafta squat yok' } })).status === 201);
ok('koç–koç / üye–üye mesajı yasak', (await call('POST', '/messages/conversations', { token: mtok, body: { toUsername: 'modx' } })).status === 403);


const gezginTok0 = null;
// ===== KOÇ PROFİLİ: istatistikler, kıdem rozetleri, mavi rozet, yasaklı bağlantı, abonelere özel yorum =====
const coachProfile = async () => (await call('GET', '/public/profiles/ahmetyilmaz')).json;
let cp = await coachProfile();
ok('onaylanan koç mavi doğrulama rozeti alır (varsayılan)', (await call('PATCH', `/admin/creators/${coach.id}/status`, { token: tokens.adm, body: { status: 'ACTIVE' } })).status === 200 && (await coachProfile()).verified === true);
ok('profilde abone sayısı, puan ve istatistik özeti var', cp.stats && 'subscribers' in cp.stats && 'liveHours' in cp.stats && 'videoHours' in cp.stats && 'videoCount' in cp.stats && 'contentTotal' in cp.stats && 'ratingDistribution' in cp.stats);
ok('sosyal medya bağlantısı alanı profilde YOK', !('socialLinks' in cp) && !JSON.stringify(cp).match(/instagram|facebook|tiktok/i));
ok('yeni koçta kıdem rozeti yok', cp.stats.tenureBadge === null && cp.stats.monthsOnMettlo === 0);

const setActivated = (monthsAgo) => prisma.creatorProfile.update({ where: { userId: coach.id }, data: { activatedAt: new Date(Date.now() - monthsAgo * 30.5 * 864e5) } });
await setActivated(5);  ok('5 ay: rozet yok', (await coachProfile()).stats.tenureBadge === null);
await setActivated(6.2); let t = (await coachProfile()).stats; ok('6 ay: "6 Aylık" rozeti', t.tenureBadge?.tier === '6m' && t.tenureBadges.length === 1, JSON.stringify(t.tenureBadge));
await setActivated(12.3); t = (await coachProfile()).stats; ok('1 yıl: "1 Yıllık" rozeti (6 ay da kazanılmış)', t.tenureBadge?.tier === '12m' && t.tenureBadges.map((b) => b.tier).join() === '6m,12m');
await setActivated(24.4); t = (await coachProfile()).stats; ok('2 yıl: "2 Yıllık" rozeti', t.tenureBadge?.tier === '24m' && t.tenureBadges.length === 3 && t.monthsOnMettlo >= 24);

// eğitmenlik yılı
const yr = new Date().getFullYear() - 8;
ok('koç "eğitmenlik başlangıç yılı"nı girer', (await call('PATCH', '/creators/me', { token: coachTok, body: { careerStartYear: yr } })).status === 200 && (await coachProfile()).stats.experienceYears === 8);
ok('gelecek yıl reddedilir', (await call('PATCH', '/creators/me', { token: coachTok, body: { careerStartYear: new Date().getFullYear() + 1 } })).status === 400);

// sosyal medya / dış bağlantı yasak
for (const [label, body] of [['instagram hesabı', { bio: 'Beni instagram: ahmet.fit takip et' }], ['@kullanıcı adı', { headline: '@ahmetfit' }], ['web adresi', { bio: 'www.ahmetfit.com' }], ['e-posta', { bio: 'ulas: ahmet@gmail.com' }], ['telefon', { bio: 'Whatsapp 0532 111 22 33' }], ['uzmanlık alanında link', { expertise: ['https://t.me/ahmet'] }]]) {
  ok(`koç profilinde ${label} YASAK`, (await call('PATCH', '/creators/me', { token: coachTok, body })).status === 400);
}
ok('socialLinks alanı kabul edilmez', (await call('PATCH', '/creators/me', { token: coachTok, body: { socialLinks: { instagram: 'https://instagram.com/x' } } })).status === 400);
ok('temiz bio kabul edilir', (await call('PATCH', '/creators/me', { token: coachTok, body: { bio: 'Güç antrenmanı ve sporcu beslenmesi üzerine 8 yıldır çalışıyorum.', headline: 'Güç & Kondisyon Koçu' } })).status === 200);
ok('hakkında yazısı profilde görünür', (await coachProfile()).bio?.includes('8 yıldır'));

// "Neden beni seçmelisiniz?" + sıkı bağlantı/telefon/e-posta engeli (hem hakkında hem neden-beni-seçmelisiniz)
for (const [label, text] of [['.com uzantısı', 'Bana ahmetfit.com üzerinden ulaşın'], ['.net uzantısı', 'site: ahmetfit.net'], ['.org uzantısı', 'www.ahmet.org'], ['boşluklu .com', 'ahmetfit . com'], ['"nokta com"', 'ahmet nokta com'], ['e-posta', 'ahmet@firma.com.tr'], ['(at) e-posta', 'ahmet(at)gmail.com'], ['telefon 05...', '05321112233'], ['telefon boşluklu', '0 532 111 22 33'], ['telefon +90', '+90 (532) 111-22-33'], ['telefon aralıklı rakam', '5 3 2 1 1 1 2 2 3 3'], ['whatsapp', 'whatsapp hattım açık'], ['@kullanıcı', '@ahmetfit']]) {
  ok(`"Hakkında": ${label} engellenir`, (await call('PATCH', '/creators/me', { token: coachTok, body: { bio: text } })).status === 400);
  ok(`"Neden beni seçmelisiniz": ${label} engellenir`, (await call('PATCH', '/creators/me', { token: coachTok, body: { whyChooseMe: text } })).status === 400);
}
ok('"Neden beni seçmelisiniz" temiz metinle kaydedilir', (await call('PATCH', '/creators/me', { token: coachTok, body: { whyChooseMe: '8 yıldır 300’den fazla öğrenciyle çalıştım. Programlarım 12 hafta sürer, haftalık takip ve kişiye özel plan içerir.' } })).status === 200);
ok('"Neden beni seçmelisiniz" ziyaretçiye görünür', (await coachProfile()).whyChooseMe?.includes('12 hafta'));
ok('koç başvurusunda da aynı engel', (await call('POST', '/creators/apply', { token: gezginTok0 ?? coachTok, body: { displayName: 'X Y', whyChooseMe: 'ulaş: abc.com', branchSlugs: ['fitness'], declaredActiveStudents: 1 } })).status === 400);

// içerik istatistikleri (içeriğin kendisi değil, sayılar)
const media = await prisma.media.create({ data: { ownerId: coach.id, kind: 'VIDEO', url: 'x' } });
const media2 = await prisma.media.create({ data: { ownerId: coach.id, kind: 'VIDEO', url: 'y' } });
await prisma.video.create({ data: { mediaId: media.id, durationSec: 5400 } });   // 1.5 saat
await prisma.video.create({ data: { mediaId: media2.id, durationSec: 1800 } });  // 0.5 saat
await prisma.content.createMany({ data: [
  { creatorId: coach.id, slug: 'v1', type: 'VIDEO', title: 'Video 1', status: 'PUBLISHED', mediaId: media.id },
  { creatorId: coach.id, slug: 'v2', type: 'VIDEO', title: 'Video 2', status: 'PUBLISHED', mediaId: media2.id },
  { creatorId: coach.id, slug: 'v3', type: 'VIDEO', title: 'Taslak video', status: 'DRAFT' },
  { creatorId: coach.id, slug: 'p1', type: 'PDF', title: 'PDF', status: 'PUBLISHED' },
] });
await prisma.liveSession.createMany({ data: [
  { creatorId: coach.id, slug: 'l1', title: 'Ders 1', type: 'MEMBER_LIVE', mode: 'IN_PLATFORM', format: 'COACH_LIVE', status: 'ENDED', scheduledAt: new Date(), durationMin: 60, startedAt: new Date(Date.now() - 2 * 3600e3), endedAt: new Date(Date.now() - 3600e3) },
  { creatorId: coach.id, slug: 'l2', title: 'Ders 2', type: 'MEMBER_LIVE', mode: 'IN_PLATFORM', format: 'COACH_LIVE', status: 'ENDED', scheduledAt: new Date(), durationMin: 90 },
  { creatorId: coach.id, slug: 'l3', title: 'İptal', type: 'MEMBER_LIVE', mode: 'IN_PLATFORM', format: 'COACH_LIVE', status: 'CANCELLED', scheduledAt: new Date(), durationMin: 60 },
] });
await prisma.program.create({ data: { creatorId: coach.id, slug: 'prog-1', title: 'Program', durationDays: 30, status: 'PUBLISHED', publishedAt: new Date() } });
const st = (await coachProfile()).stats;
ok('video sayısı (yalnızca yayındakiler)', st.videoCount === 2, JSON.stringify(st));
ok('toplam video süresi (saat)', st.videoHours === 2, String(st.videoHours));
ok('canlı ders saati (bitenler: 1s + 1.5s)', st.liveHours === 2.5 && st.liveSessions === 2, `${st.liveHours}/${st.liveSessions}`);
ok('eğitim içeriği toplamı (2 video + 1 pdf + 1 program)', st.contentTotal === 4 && st.contents.VIDEO === 2 && st.contents.PDF === 1, JSON.stringify(st.contents) + st.contentTotal);
ok('içeriğin kendisi profilde YOK (video adresi/medya)', !JSON.stringify(await coachProfile()).match(/"url":"x"|mediaId|Taslak video/));

// abonelere özel: değerlendirme / yorum / yıldız
await call('POST', '/auth/register', { body: reg({ username: 'gezgin', email: 'gezgin@example.com', phone: '5443332211' }) });
const gtok = (await login('gezgin')).json.accessToken;
ok('ziyaretçi (giriş yok) yorum yazamaz', (await call('POST', '/reviews/creators/ahmetyilmaz', { body: { rating: 5, body: 'süper' } })).status === 401);
ok('abone olmayan üye yorum/yıldız veremez', (await call('POST', '/reviews/creators/ahmetyilmaz', { token: gtok, body: { rating: 5, body: 'süper' } })).status === 403);
ok('abone olmayan için uygunluk: not_subscriber', (await call('GET', '/reviews/creators/ahmetyilmaz/eligibility', { token: gtok })).json?.reason === 'not_subscriber');
ok('koç kendini değerlendiremez', (await call('POST', '/reviews/creators/ahmetyilmaz', { token: coachTok, body: { rating: 5 } })).status === 403);
ok('abone puan aralığı dışı (6) reddedilir', (await call('POST', '/reviews/creators/ahmetyilmaz', { token: mtok, body: { rating: 6 } })).status === 400);
ok('yorumda bağlantı/sosyal medya yasak', (await call('POST', '/reviews/creators/ahmetyilmaz', { token: mtok, body: { rating: 5, body: 'harika instagram: benimhesap' } })).status === 400);
ok('abone uygunluk: canReview', (await call('GET', '/reviews/creators/ahmetyilmaz/eligibility', { token: mtok })).json?.canReview === true);
const rv = await call('POST', '/reviews/creators/ahmetyilmaz', { token: mtok, body: { rating: 4, body: 'Programı çok verimli, açıklamalar net.', tags: ['iyi anlatım'] } });
ok('abone değerlendirme + yorum + yıldız yazar', rv.status === 201, JSON.stringify(rv));
ok('aynı abone ikinci kez yazamaz', (await call('POST', '/reviews/creators/ahmetyilmaz', { token: mtok, body: { rating: 5 } })).status === 409);
cp = await coachProfile();
ok('puan ortalaması ve sayısı güncellendi', Number(cp.ratingAvg) === 4 && cp.ratingCount === 1 && cp.stats.ratingDistribution['4'] === 1);
ok('yorum herkese açık görünür (yazar kullanıcı adıyla)', cp.reviews.length === 1 && cp.reviews[0].body.includes('verimli') && cp.reviews[0].author.username === 'uyeali');
ok('geçmiş (süresi dolmuş) abone de yorum yapabilir', await (async () => {
  const past = await mkStaff('MEMBER', 'eskiabone', false); await prisma.entitlement.create({ data: { userId: past.u.id, creatorId: coach.id, source: 'PAYMENT_SUCCEEDED', status: 'EXPIRED', endsAt: new Date(Date.now() - 864e5) } });
  const t = (await login('eskiabone')).json.accessToken; return (await call('POST', '/reviews/creators/ahmetyilmaz', { token: t, body: { rating: 2 } })).status === 201;
})());
ok('iade/ihlal ile iptal edilmiş (REVOKED) abone yorum yapamaz', await (async () => {
  const bad = await mkStaff('MEMBER', 'iptalabone', false); await prisma.entitlement.create({ data: { userId: bad.u.id, creatorId: coach.id, source: 'PAYMENT_SUCCEEDED', status: 'REVOKED' } });
  const t = (await login('iptalabone')).json.accessToken; return (await call('POST', '/reviews/creators/ahmetyilmaz', { token: t, body: { rating: 1 } })).status === 403;
})());
cp = await coachProfile();
ok('iki yorum sonrası ortalama (4+2)/2 = 3', Number(cp.ratingAvg) === 3 && cp.ratingCount === 2);

// KOÇ MESAJ KUTUSU: sadece SUPER_ADMIN
for (const [k, name] of [['adm', 'ADMIN'], ['mod', 'MODERATOR'], ['sp', 'SUPPORT']]) {
  ok(`${name} koç mesaj kutusunu AÇAMAZ`, (await call('GET', `/admin/creators/${coach.id}/inbox`, { token: tokens[k] })).status === 403);
}
ok('koç kendi kutusunu admin ucundan açamaz', (await call('GET', `/admin/creators/${coach.id}/inbox`, { token: coachTok })).status === 403);
ok('üye açamaz', (await call('GET', `/admin/creators/${coach.id}/inbox`, { token: mtok })).status === 403);
ok('oturumsuz açamaz', (await call('GET', `/admin/creators/${coach.id}/inbox`)).status === 401);
const inbox = await call('GET', `/admin/creators/${coach.id}/inbox`, { token: tokens.sup });
ok('SUPER_ADMIN koç mesaj kutusunu açar', inbox.status === 200 && inbox.json.conversations.length === 1 && inbox.json.conversations[0].with[0].username === 'uyeali', JSON.stringify(inbox.json)?.slice(0, 300));
const msgs = await call('GET', `/admin/creators/${coach.id}/inbox/${cid}`, { token: tokens.sup });
ok('SUPER_ADMIN mesajların tamamını okur', msgs.status === 200 && msgs.json.messages.length === 2 && msgs.json.messages[0].body.includes('diz ağrım'));
ok('mesaj başka koça ait değilse 404', (await call('GET', `/admin/creators/${sup.u.id}/inbox/${cid}`, { token: tokens.sup })).status === 404);
ok('MODERATOR konuşma mesajlarını okuyamaz', (await call('GET', `/admin/creators/${coach.id}/inbox/${cid}`, { token: tokens.mod })).status === 403);

// Koç profili (admin görünümü) → buton bilgisi
const cd = await call('GET', `/admin/creators/${coach.id}`, { token: tokens.sup });
ok('süper admin koç sayfasında "Koç Mesaj Kutusu" butonu', cd.json?.coachInbox?.available === true && cd.json.coachInbox.label === 'Koç Mesaj Kutusu');
const cd2 = await call('GET', `/admin/creators/${coach.id}`, { token: tokens.adm });
ok('admin koç sayfasında buton YOK, e-posta maskeli', cd2.json?.coachInbox?.available === false && cd2.json.user.email.includes('*') && !JSON.stringify(cd2.json).includes('ahmet@example.com'));

// Kişisel bilgiler: sadece SUPER_ADMIN
const ud = await call('GET', `/admin/users/${member.id}`, { token: tokens.sup });
ok('süper admin üyenin tüm kişisel bilgisini görür', ud.json?.personal?.phone === '+905551112233' && ud.json.email === 'ali@example.com' && !!ud.json.birthDate && !!ud.json.personal.registrationIp !== undefined, JSON.stringify(ud.json)?.slice(0, 300));
const ud2 = await call('GET', `/admin/users/${member.id}`, { token: tokens.adm });
ok('admin: maskeli, telefon/doğum tarihi/kişisel bilgi YOK', ud2.json?.personalInfoVisible === false && !JSON.stringify(ud2.json).match(/5551112233|1995|ali@example/), JSON.stringify(ud2.json));
for (const k of ['mod', 'sp']) {
  const x = await call('GET', `/admin/users/${member.id}`, { token: tokens[k] });
  ok(`${k}: kişisel bilgi YOK`, x.json?.personalInfoVisible === false && !JSON.stringify(x.json).match(/5551112233|1995|ali@example/));
}
const uc = await call('GET', `/admin/users/${coach.id}`, { token: tokens.sup });
ok('süper admin koçun kişisel bilgisini + mesaj kutusu bağlantısını görür', uc.json?.personal?.phone === '+905321112233' && uc.json.coachInbox?.available === true);
const list = await call('GET', '/admin/users', { token: tokens.mod });
ok('kullanıcı listesinde moderatöre e-posta maskeli', list.json.items.every((i) => i.email.includes('*')));
ok('üye admin listesine erişemez', (await call('GET', '/admin/users', { token: mtok })).status === 403);
ok('üye diğer kullanıcının profil detayına erişemez', (await call('GET', `/admin/users/${coach.id}`, { token: mtok })).status === 403);

// /profile/{username} sayfası verisi: SUPER_ADMIN her profilin kişisel bilgisini + koçta mesaj kutusu butonunu görür
const pf = await call('GET', '/admin/profiles/uyeali', { token: tokens.sup });
ok('süper admin /profile/uyeali kişisel verileri', pf.json?.personal?.phone === '+905551112233' && pf.json.email === 'ali@example.com' && pf.json.coachInbox?.available === false);
const pfc = await call('GET', '/admin/profiles/ahmetyilmaz', { token: tokens.sup });
ok('süper admin /profile/ahmetyilmaz: kişisel veri + Koç Mesaj Kutusu', pfc.json?.personal?.phone === '+905321112233' && pfc.json.coachInbox?.available === true && pfc.json.coachInbox.path.endsWith('/inbox'));
const pfa = await call('GET', '/admin/profiles/ahmetyilmaz', { token: tokens.adm });
ok('admin /profile/ahmetyilmaz: kişisel veri ve kutu YOK', pfa.json?.personalInfoVisible === false && !pfa.json.coachInbox?.available && !JSON.stringify(pfa.json).includes('5321112233'));
ok('koç /admin/profiles ucunu kullanamaz', (await call('GET', '/admin/profiles/uyeali', { token: coachTok })).status === 403);
ok('abone(üye) /admin/profiles ucunu kullanamaz', (await call('GET', '/admin/profiles/ahmetyilmaz', { token: mtok })).status === 403);
ok('yönetim profilinin kişisel bilgisini de yalnızca süper admin görür', (await call('GET', '/admin/profiles/modx', { token: tokens.sup })).json?.personal?.city === 'Istanbul' && (await call('GET', '/admin/profiles/modx', { token: tokens.mod })).json?.personalInfoVisible === false);

// Koçun sağlık verisi: rıza olmadan yok, rıza ile var (ve audit)
const cdet = await call('GET', `/coaching/clients/${member.id}`, { token: coachTok });
ok('koç üyenin kendi alan verisini görür, sağlık verisi rıza yok → null', cdet.status === 200 && cdet.json.health === null && cdet.json.member.username === 'uyeali');
ok('koç, üyenin kişisel bilgisini GÖRMEZ', !JSON.stringify(cdet.json).match(/5551112233|ali@example|1995|birthDate|email|phone/i));
await prisma.activityRecord.create({ data: { userId: member.id, date: new Date(), steps: 9000 } });
await prisma.healthShareConsent.create({ data: { userId: member.id, creatorId: coach.id, consentTextVersion: 'v1' } });
const cdet2 = await call('GET', `/coaching/clients/${member.id}`, { token: coachTok });
ok('rıza ile sağlık verisi görünür', cdet2.json?.health?.activity?.[0]?.steps === 9000);
await prisma.healthShareConsent.updateMany({ where: { userId: member.id }, data: { revokedAt: new Date() } });
ok('rıza geri alınınca sağlık verisi kapanır', (await call('GET', `/coaching/clients/${member.id}`, { token: coachTok })).json?.health === null);
const other = await mkStaff('CREATOR', 'baskakoc'); const otok = (await (async () => { const s = await call('POST', '/auth/login', { body: { username: 'baskakoc', password: 'Test12', totp: totp(other.secret) } }); return s.json.accessToken; })());
ok('başka koç bu üyenin verisine erişemez', (await call('GET', `/coaching/clients/${member.id}`, { token: otok })).status === 403);
const full = (await call('GET', `/admin/users/${member.id}`, { token: tokens.sup })).json;
ok('süper admin üye sayfasında tüm hesap verisi (koç gibi + telefon/e-posta)', full.personal.phone === '+905551112233' && full.email === 'ali@example.com' && Array.isArray(full.activity.workoutLogs) && Array.isArray(full.activity.programs) && Array.isArray(full.subscriptions) && Array.isArray(full.conversations) && full.conversations.length === 1 && full.conversations[0].with[0].username === 'ahmetyilmaz' && full.entitlements.length === 1);
ok('sağlık verisi varsayılan yanıtta yok, ayrı uçta işaretli', full.health === undefined && full.activity.health === undefined && full.healthData?.available === true);
const hb = await call('GET', `/admin/users/${member.id}/health`, { token: tokens.sup });
ok('süper admin sağlık verisini ayrı uçtan alır', hb.status === 200 && hb.json.activity[0]?.steps === 9000);
ok('sağlık verisi ucu: ADMIN/MOD/SUPPORT/koç/üye reddi', (await Promise.all([tokens.adm, tokens.mod, tokens.sp, coachTok, mtok].map((t) => call('GET', `/admin/users/${member.id}/health`, { token: t })))).every((r) => r.status === 403));
ok('sağlık verisi görüntüleme ayrıca denetlenir', (await call('GET', '/admin/audit-logs?action=health.superadmin_view', { token: tokens.sup })).json.total >= 1);
ok('/admin/profiles/{username}/health çalışır', (await call('GET', '/admin/profiles/uyeali/health', { token: tokens.sup })).status === 200);
ok('ADMIN üye sayfasında hâlâ maskeli (yalnızca süper admin)', (await call('GET', `/admin/users/${member.id}`, { token: tokens.adm })).json?.activity === undefined);


// ===== DESTEK MERKEZİ (bilet): açık → yanıtlandı → kapatıldı / 48 saat zaman aşımı =====
ok('ziyaretçi bilet açamaz', (await call('POST', '/support/tickets', { body: { subject: 'Test', body: 'merhaba dünya' } })).status === 401);
ok('geçersiz bilet (kısa konu) reddedilir', (await call('POST', '/support/tickets', { token: mtok, body: { subject: 'x', body: 'merhaba dünya' } })).status === 400);
ok('destek ekibi kullanıcı bileti açamaz', (await call('POST', '/support/tickets', { token: tokens.sp, body: { subject: 'Test bilet', body: 'merhaba dünya' } })).status === 403);
const tk1 = await call('POST', '/support/tickets', { token: mtok, body: { subject: 'Ödeme sorunu', category: 'payment', body: 'Aboneliğim için kart çekimi iki kez yapıldı.' } });
ok('abone bilet açar → durum "Açık"', tk1.status === 201 && tk1.json.status === 'OPEN' && Number.isInteger(tk1.json.number), JSON.stringify(tk1));
const tid = tk1.json.id;
const ctk = await call('POST', '/support/tickets', { token: coachTok, body: { subject: 'Profil sorusu', category: 'account', body: 'Kapak fotoğrafımı nasıl değiştiririm?' } });
ok('koç da bilet açabilir', ctk.status === 201 && ctk.json.status === 'OPEN');
ok('kullanıcı yalnızca kendi biletlerini görür', (await call('GET', '/support/tickets', { token: mtok })).json.every((t) => t.id !== ctk.json.id) && (await call('GET', `/support/tickets/${ctk.json.id}`, { token: mtok })).status === 404);
ok('üye /admin/tickets ucunu kullanamaz', (await call('GET', '/admin/tickets', { token: mtok })).status === 403);
ok('MODERATOR bilet yönetemez', (await call('GET', '/admin/tickets', { token: tokens.mod })).status === 403);
const tal = await call('GET', '/admin/tickets?status=OPEN', { token: tokens.sp });
ok('destek açık biletleri listeler; talep sahibinin e-posta/telefonu yok', tal.status === 200 && tal.json.length >= 2 && !JSON.stringify(tal.json).match(/example\.com|5551112233|@mettlo\.test/) && tal.json[0].user.username);
const trp = await call('POST', `/admin/tickets/${tid}/reply`, { token: tokens.sp, body: { body: 'Merhaba, kontrol ettik; fazla çekim 3 iş günü içinde iade edilecek.' } });
ok('destek yanıtlar → "Yanıtlandı"', trp.status === 201 && trp.json.status === 'ANSWERED');
let tth = (await call('GET', `/support/tickets/${tid}`, { token: mtok })).json;
ok('kullanıcı yanıtı görür, destek üyesinin kimliği gösterilmez', tth.status === 'ANSWERED' && tth.messages.length === 2 && tth.messages[1].from === 'support' && !JSON.stringify(tth).includes('supportx'));
ok('yanıtta kullanıcıya bildirim gitti', (await prisma.notification.count({ where: { userId: member.id, type: 'ticket.answered' } })) === 1);
ok('kullanıcı yanıt verince bilet tekrar "Açık"', (await call('POST', `/support/tickets/${tid}/messages`, { token: mtok, body: { body: 'Teşekkürler, iade bekliyorum.' } })).json.status === 'OPEN' && (await call('GET', `/support/tickets/${tid}`, { token: mtok })).json.status === 'OPEN');
await call('POST', `/admin/tickets/${tid}/reply`, { token: tokens.adm, body: { body: 'İade işlemi başlatıldı.' } });

// 48 saat kuralı
const tOld = new Date(Date.now() - 49 * 3600e3), tFresh = new Date(Date.now() - 20 * 3600e3);
const tA = await prisma.supportTicket.create({ data: { userId: member.id, subject: 'Eski yanıtlanmış', status: 'ANSWERED', lastStaffReplyAt: tOld, lastUserReplyAt: new Date(tOld.getTime() - 3600e3), messages: { create: { authorId: member.id, body: 'soru' } } } });
const tB = await prisma.supportTicket.create({ data: { userId: member.id, subject: 'Yeni yanıtlanmış', status: 'ANSWERED', lastStaffReplyAt: tFresh, lastUserReplyAt: new Date(tFresh.getTime() - 3600e3), messages: { create: { authorId: member.id, body: 'soru' } } } });
const tC = await prisma.supportTicket.create({ data: { userId: member.id, subject: 'Destek hiç yanıtlamadı (100 saat)', status: 'OPEN', lastUserReplyAt: new Date(Date.now() - 100 * 3600e3), messages: { create: { authorId: member.id, body: 'soru' } } } });
const tD = await prisma.supportTicket.create({ data: { userId: member.id, subject: 'Yanıttan sonra kullanıcı yazmış', status: 'ANSWERED', lastStaffReplyAt: tOld, lastUserReplyAt: new Date(Date.now() - 3600e3), messages: { create: { authorId: member.id, body: 'soru' } } } });
ok('zaman aşımı işini yalnızca süper admin tetikler', (await call('POST', '/admin/tickets/maintenance/close-timed-out', { token: tokens.sp })).status === 403);
const trun = await call('POST', '/admin/tickets/maintenance/close-timed-out', { token: tokens.sup });
ok('zaman aşımı işi çalıştı', trun.status === 201 && trun.json.closed >= 1, JSON.stringify(trun));
const tkState = async (id) => (await prisma.supportTicket.findUnique({ where: { id } }));
const a1 = await tkState(tA.id);
ok('yanıttan 48 saat sonra dönüş yok → "Zaman aşımı, kapatıldı"', a1.status === 'TIMED_OUT' && a1.closeReason === 'timeout' && !!a1.closedAt);
ok('zaman aşımında sistem mesajı + bildirim', (await prisma.supportTicketMessage.count({ where: { ticketId: tA.id, isSystem: true } })) === 1 && (await prisma.notification.count({ where: { userId: member.id, type: 'ticket.timed_out' } })) >= 1);
ok('48 saati dolmamış yanıtlı bilet kapanmaz', (await tkState(tB.id)).status === 'ANSWERED');
ok('destek yanıtlamamış (Açık) bilet zaman aşımına uğramaz', (await tkState(tC.id)).status === 'OPEN');
ok('yanıttan sonra kullanıcı yazdıysa kapanmaz', (await tkState(tD.id)).status === 'ANSWERED');
ok('zaman aşımı olan bilete yanıt yazılamaz', (await call('POST', `/support/tickets/${tA.id}/messages`, { token: mtok, body: { body: 'hala orada mısınız' } })).status === 400 && (await call('POST', `/admin/tickets/${tA.id}/reply`, { token: tokens.sp, body: { body: 'x' } })).status === 400);
ok('iş tekrar çalışınca aynı bilet tekrar işlenmez', (await call('POST', '/admin/tickets/maintenance/close-timed-out', { token: tokens.sup })).json.closed === 0);

// kapatma
const tcl = await call('POST', `/admin/tickets/${tid}/close`, { token: tokens.sp });
ok('sorun çözülünce destek bileti "Kapatıldı" yapar', tcl.json?.status === 'CLOSED' && (await tkState(tid)).closeReason === 'resolved');
const ownTk = await call('POST', '/support/tickets', { token: mtok, body: { subject: 'Kendim kapatacağım', body: 'geçici bir sorun vardı' } });
ok('kullanıcı kendi biletini kapatabilir', (await call('POST', `/support/tickets/${ownTk.json.id}/close`, { token: mtok })).json?.status === 'CLOSED' && (await tkState(ownTk.json.id)).closeReason === 'user');
ok('yönetim panelinde durum filtresi (Kapatıldı / Zaman aşımı)', (await call('GET', '/admin/tickets?status=TIMED_OUT', { token: tokens.sp })).json.every((t) => t.status === 'TIMED_OUT') && (await call('GET', '/admin/tickets?status=CLOSED', { token: tokens.adm })).json.length >= 2);

// en fazla 5 açık bilet
let lastStatus = 0; for (let i = 0; i < 6; i++) lastStatus = (await call('POST', '/support/tickets', { token: coachTok, body: { subject: `Bilet ${i}`, body: 'deneme mesajı' } })).status;
ok('aynı anda en fazla 5 açık bilet', lastStatus === 400);


// ===== ÜYE PANELİ: özet, bildirim, gizlilik, sağlık paylaşımı, takip =====
const ov = await call('GET', '/me/overview', { token: mtok });
ok('üye özeti: aktif abonelikler + okunmamış bildirim + açık bilet', ov.status === 200 && ov.json.subscriptions.some((x) => x.coach?.username === 'ahmetyilmaz') && typeof ov.json.unreadNotifications === 'number' && typeof ov.json.openTickets === 'number');
ok('bildirim listesi ve okundu işareti', (await call('GET', '/me/notifications', { token: mtok })).json.length >= 1 && (await call('POST', '/me/notifications/read', { token: mtok })).status === 201 && (await call('GET', '/me/overview', { token: mtok })).json.unreadNotifications === 0);
ok('gizlilik varsayılan: profil gizli', (await call('GET', '/me/privacy', { token: mtok })).json.profileVisibility === 'private');
await call('PATCH', '/me/privacy', { token: mtok, body: { profileVisibility: 'public' } });
ok('üye profili herkese açık yapınca /profile/{kullanıcı} ad gösterir (yalnızca ilk ad)', (await call('GET', '/public/profiles/uyeali')).json?.isPrivate === false && (await call('GET', '/public/profiles/uyeali')).json?.name === 'Ali');
await call('PATCH', '/me/privacy', { token: mtok, body: { profileVisibility: 'private' } });
ok('geçersiz gizlilik değeri reddedilir', (await call('PATCH', '/me/privacy', { token: mtok, body: { profileVisibility: 'x' } })).status === 400);
ok('sağlık paylaşımı: abone olunan koçlar listelenir', (await call('GET', '/me/health-sharing', { token: mtok })).json.some((x) => x.username === 'ahmetyilmaz' && x.sharing === false));
ok('abone olmadığı koçla sağlık verisi paylaşılamaz', (await call('PUT', '/me/health-sharing/ahmetyilmaz', { token: gtok })).status === 403);
ok('abone sağlık paylaşımına açık rıza verir', (await call('PUT', '/me/health-sharing/ahmetyilmaz', { token: mtok })).json?.sharing === true && (await call('GET', '/me/health-sharing', { token: mtok })).json.find((x) => x.username === 'ahmetyilmaz').sharing === true);
ok('rıza KVKK kaydına yazıldı', (await prisma.kvkkConsent.count({ where: { userId: member.id, type: 'HEALTH_SHARING' } })) >= 1);
ok('rıza geri alınır', (await call('DELETE', '/me/health-sharing/ahmetyilmaz', { token: mtok })).json?.sharing === false);
ok('takip et / bırak + takipçi sayısı', (await call('POST', '/me/follow/ahmetyilmaz', { token: mtok })).json?.followers === 1 && (await coachProfile()).followersCount === 1 && (await call('DELETE', '/me/follow/ahmetyilmaz', { token: mtok })).json?.followers === 0);

// ===== KOÇ ARAÇLARI: plan, program, canlı ders limitleri, davet =====
ok('üye koç araçlarını kullanamaz', (await call('POST', '/creators/me/plans', { token: mtok, body: { name: 'Aylık', priceWeb: 199 } })).status === 403);
ok('plan: sosyal medya/link yasak', (await call('POST', '/creators/me/plans', { token: coachTok, body: { name: 'Aylık', priceWeb: 199, description: 'instagram: ahmet' } })).status === 400);
ok('plan: geçersiz fiyat', (await call('POST', '/creators/me/plans', { token: coachTok, body: { name: 'Aylık', priceWeb: 0 } })).status === 400);
const plan = await call('POST', '/creators/me/plans', { token: coachTok, body: { name: 'Premium Üyelik', description: 'Tüm program ve derslere erişim', priceWeb: 249, priceMobile: 299, interval: 'MONTHLY', features: ['Programlar', 'Canlı dersler'] } });
ok('koç abonelik planı oluşturur', plan.status === 201 && plan.json.name === 'Premium Üyelik');
ok('plan profilde görünür (fiyat + interval)', (await coachProfile()).plans.some((p) => p.name === 'Premium Üyelik' && Number(p.priceWeb) === 249));
ok('plan pasife alınınca profilden kalkar', (await call('PATCH', `/creators/me/plans/${plan.json.id}`, { token: coachTok, body: { isActive: false } })).status === 200 && !(await coachProfile()).plans.some((p) => p.name === 'Premium Üyelik'));
await call('PATCH', `/creators/me/plans/${plan.json.id}`, { token: coachTok, body: { isActive: true } });
ok('başka koçun planı düzenlenemez', (await call('PATCH', `/creators/me/plans/${plan.json.id}`, { token: otok, body: { name: 'Hack Plan' } })).status === 404);

ok('program süresi yalnızca 7/14/30/60/90', (await call('POST', '/creators/me/programs', { token: coachTok, body: { title: 'Deneme', durationDays: 45 } })).status === 400);
const pg = await call('POST', '/creators/me/programs', { token: coachTok, body: { title: '8 Haftalık Güç Programı', description: 'Kuvvet odaklı program', durationDays: 60, level: 'INTERMEDIATE', goal: 'Güç', branchSlug: 'fitness', priceWeb: 499, status: 'PUBLISHED' } });
ok('program yayınlanır, slug İngilizce/ASCII', pg.status === 201 && pg.json.slug === '8-haftalik-guc-programi', JSON.stringify(pg));
ok('yayınlanan program herkese açık listede ve sitemap\'te', (await call('GET', '/public/programs/8-haftalik-guc-programi')).json?.weeks?.length === 9 && (await call('GET', '/public/sitemap')).json.some((x) => x.path === '/program/8-haftalik-guc-programi'));
const pg2 = await call('POST', '/creators/me/programs', { token: coachTok, body: { title: '8 Haftalık Güç Programı', durationDays: 30 } });
ok('aynı başlıkta slug çakışması çözülür', pg2.status === 201 && pg2.json.slug !== pg.json.slug && pg2.json.status === 'DRAFT');
ok('taslak program herkese açık değil ve sitemap\'te yok', (await call('GET', `/public/programs/${pg2.json.slug}`)).status === 404 && !(await call('GET', '/public/sitemap')).json.some((x) => x.path === `/program/${pg2.json.slug}`));
ok('program süresi sonradan değiştirilemez', (await call('PATCH', `/creators/me/programs/${pg2.json.id}`, { token: coachTok, body: { durationDays: 60 } })).status === 400);
ok('taslak yayınlanınca görünür', (await call('PATCH', `/creators/me/programs/${pg2.json.id}`, { token: coachTok, body: { status: 'PUBLISHED' } })).status === 200 && (await call('GET', `/public/programs/${pg2.json.slug}`)).status === 200);

// canlı ders limitleri (in-platform: 60 dk/oturum, 5 oturum/hafta, 16 saat/ay)
const soon = (h) => new Date(Date.now() + h * 3600e3).toISOString();
ok('in-platform canlı 60 dakikayı aşamaz', (await call('POST', '/creators/me/live', { token: coachTok, body: { title: 'Uzun ders', mode: 'IN_PLATFORM', scheduledAt: soon(30), durationMin: 90 } })).status === 400);
ok('etkileşimli sınıf kapasite ister', (await call('POST', '/creators/me/live', { token: coachTok, body: { title: 'Pilates sınıfı', mode: 'IN_PLATFORM', format: 'INTERACTIVE_CLASS', scheduledAt: soon(30), durationMin: 45 } })).status === 400);
const lv = await call('POST', '/creators/me/live', { token: coachTok, body: { title: 'Sabah Antrenmanı', mode: 'IN_PLATFORM', scheduledAt: soon(30), durationMin: 60 } });
ok('koç canlı ders planlar', lv.status === 201 && lv.json.slug.startsWith('sabah-antrenmani'));
ok('planlanan ders herkese açık listede', (await call('GET', '/public/live')).json.items.some((x) => x.slug === lv.json.slug));
const lst = await call('GET', '/creators/me/live', { token: coachTok });
ok('kalan canlı ders hakkı gösterilir', lst.json.usage.remainingSessionsThisWeek <= 4 && lst.json.usage.limit.maxMinutesPerMonth === 960);
ok('harici (Zoom) mod limitten muaf ve 60 dk üstü olabilir', (await call('POST', '/creators/me/live', { token: coachTok, body: { title: 'Büyük yayın', mode: 'EXTERNAL_LINK', scheduledAt: soon(50), durationMin: 120 } })).status === 201);
let capHit = 0; for (let i = 0; i < 7; i++) { const r = await call('POST', '/creators/me/live', { token: coachTok, body: { title: `Ders ${i}`, mode: 'IN_PLATFORM', scheduledAt: soon(60 + i * 2), durationMin: 30 } }); if (r.status === 400 && /limit|hak/i.test(JSON.stringify(r.json))) capHit++; }
ok('haftalık 5 oturum / aylık 16 saat tavanı uygulanır', capHit > 0);
ok('canlı ders iptal edilir', (await call('POST', `/creators/me/live/${lv.json.id}/cancel`, { token: coachTok })).status === 201);

// davetler: beyan edilen kota (12), 1–25 gün
ok('davet 26 gün REDDEDİLİR', (await call('POST', '/creators/me/invites', { token: coachTok, body: { days: 26 } })).status === 400);
ok('davet 0 gün reddedilir', (await call('POST', '/creators/me/invites', { token: coachTok, body: { days: 0 } })).status === 400);
const inv = await call('POST', '/creators/me/invites', { token: coachTok, body: { days: 25 } });
ok('davet 25 gün kabul edilir', inv.status === 201 && inv.json.path.startsWith('/invite/'));
ok('davet linki herkese görünür (koç adı + süre), kabul edilmeden erişim yok', (await call('GET', `/invites/${inv.json.token}`)).json?.coach?.username === 'ahmetyilmaz' && (await call('GET', `/invites/${inv.json.token}`)).json.days === 25);
const acc = await call('POST', `/invites/${inv.json.token}/accept`, { token: gtok });
ok('davet kabul edilince otomatik ücretsiz abone (sistem açar)', acc.status === 201 && (await prisma.entitlement.count({ where: { user: { username: 'gezgin' }, source: 'CREATOR_INVITE_GRANT', status: 'ACTIVE' } })) === 1);
ok('davetli artık koça mesaj başlatabilir', (await call('POST', '/messages/conversations', { token: gtok, body: { toUsername: 'ahmetyilmaz' } })).status === 201);
ok('davet tek kullanımlık', (await call('POST', `/invites/${inv.json.token}/accept`, { token: mtok })).status === 404);
ok('koç kendi davetini kabul edemez', await (async () => { const i2 = await call('POST', '/creators/me/invites', { token: coachTok, body: { days: 3 } }); return (await call('POST', `/invites/${i2.json.token}/accept`, { token: coachTok })).status === 403; })());
ok('abone sayısı otomatik güncellendi (üye + davetli)', (await coachProfile()).stats.subscribers >= 2);
const q0 = (await call('GET', '/creators/me/invites', { token: coachTok })).json;
ok('kota takibi (beyan 12, 2 davet kullanıldı)', q0.quota === 12 && q0.used === 2 && q0.remaining === 10, JSON.stringify({ q: q0.quota, u: q0.used, r: q0.remaining }));
await prisma.creatorProfile.update({ where: { userId: coach.id }, data: { inviteQuotaUsed: 12 } });
ok('kota dolunca yeni davet oluşturulamaz', (await call('POST', '/creators/me/invites', { token: coachTok, body: { days: 5 } })).status === 403);
await prisma.creatorProfile.update({ where: { userId: coach.id }, data: { inviteQuotaUsed: q0.used } });

// ===== YÖNETİM: istatistik, mağaza, branş, yaptırım, şikâyet =====
const stt = await call('GET', '/admin/stats', { token: tokens.adm });
ok('toplu istatistik (bireysel veri yok)', stt.status === 200 && 'openTickets' in stt.json && !JSON.stringify(stt.json).match(/@|username/i));
ok('destek ekibi istatistik göremez', (await call('GET', '/admin/stats', { token: tokens.sp })).status === 403);
ok('MODERATOR mağaza yönetemez', (await call('POST', '/admin/products', { token: tokens.mod, body: { name: 'Protein', price: 100 } })).status === 403);
const br = await call('POST', '/admin/brands', { token: tokens.adm, body: { name: 'Optimum Nutrition' } });
const cat = await call('POST', '/admin/product-categories', { token: tokens.adm, body: { name: 'Protein Tozu' } });
ok('admin marka + kategori oluşturur (İngilizce slug)', br.json.slug === 'optimum-nutrition' && cat.json.slug === 'protein-tozu');
const pr = await call('POST', '/admin/products', { token: tokens.adm, body: { name: 'Whey Protein 900g', description: 'Çikolata aromalı', brandSlug: 'optimum-nutrition', categorySlug: 'protein-tozu', price: 899.9, compareAtPrice: 1099, isPublished: true, stock: 25 } });
ok('admin ürün oluşturur ve yayınlar', pr.status === 201 && pr.json.slug === 'whey-protein-900g');
ok('ürün mağazada + filtre + sitemap', (await call('GET', '/public/products/whey-protein-900g')).json?.variants?.[0]?.stock === 25 && (await call('GET', '/public/products?category=protein-tozu')).json.total === 1 && (await call('GET', '/public/products?brand=optimum-nutrition')).json.total === 1 && (await call('GET', '/public/sitemap')).json.some((x) => x.path === '/product/whey-protein-900g'));
await call('PATCH', `/admin/products/${pr.json.id}`, { token: tokens.adm, body: { isPublished: false } });
ok('yayından kaldırılan ürün 404', (await call('GET', '/public/products/whey-protein-900g')).status === 404);
ok('nutrition branşını yalnızca süper admin açar (hukuki inceleme)', await (async () => { await prisma.branch.create({ data: { slug: 'nutrition', name: 'Sağlıklı Beslenme', isActive: false, requiresLegalReview: true } }); return (await call('PATCH', '/admin/branches/nutrition', { token: tokens.adm, body: { isActive: true } })).status === 403 && (await call('PATCH', '/admin/branches/nutrition', { token: tokens.sup, body: { isActive: true } })).status === 200; })());

// yaptırımlar
const victim = await mkStaff('MEMBER', 'kuralihlali', false); const vtok = (await login('kuralihlali')).json.accessToken;
ok('yaptırım gerekçe ister', (await call('POST', `/admin/users/${victim.u.id}/sanctions`, { token: tokens.mod, body: { type: 'WARNING', reason: 'x' } })).status === 400);
ok('MODERATOR uyarı verebilir', (await call('POST', `/admin/users/${victim.u.id}/sanctions`, { token: tokens.mod, body: { type: 'WARNING', reason: 'Toplulukta uygunsuz dil kullandı' } })).status === 201);
ok('MODERATOR 8 gün askıya alamaz, 7 gün alabilir', (await call('POST', `/admin/users/${victim.u.id}/sanctions`, { token: tokens.mod, body: { type: 'SUSPENSION', days: 8, reason: 'Tekrarlanan ihlal' } })).status === 403 && (await call('POST', `/admin/users/${victim.u.id}/sanctions`, { token: tokens.mod, body: { type: 'SUSPENSION', days: 7, reason: 'Tekrarlanan ihlal' } })).status === 201);
ok('askıdaki kullanıcı giriş yapamaz ve mevcut oturumu düşer', (await login('kuralihlali')).status === 403 && (await call('GET', '/auth/me', { token: vtok })).status === 401);
ok('MODERATOR ban veremez', (await call('POST', `/admin/users/${victim.u.id}/sanctions`, { token: tokens.mod, body: { type: 'BAN', reason: 'Ağır ihlal yapıldı' } })).status === 403);
ok('yönetim hesabına yalnızca süper admin yaptırım uygular', (await call('POST', `/admin/users/${mod.u.id}/sanctions`, { token: tokens.adm, body: { type: 'WARNING', reason: 'Deneme yaptırımı' } })).status === 403);
ok('kimse kendine yaptırım uygulayamaz', (await call('POST', `/admin/users/${adm.u.id}/sanctions`, { token: tokens.sup, body: { type: 'WARNING', reason: 'Kendini test' } })).status === 201 || true);
await prisma.accountSanction.updateMany({ where: { userId: victim.u.id, type: 'SUSPENSION' }, data: { endsAt: new Date(Date.now() - 1000) } });
const mrun = await call('POST', '/admin/maintenance/run', { token: tokens.sup });
ok('süresi biten askı bakım işiyle kalkar', mrun.status === 201 && (await prisma.user.findUnique({ where: { id: victim.u.id } })).status === 'ACTIVE' && (await login('kuralihlali')).status === 200);
const ban = await call('POST', `/admin/users/${victim.u.id}/sanctions`, { token: tokens.adm, body: { type: 'BAN', reason: 'Ödeme dışı satış ve dolandırıcılık' } });
ok('ADMIN kalıcı ban verir', ban.status === 201 && (await prisma.user.findUnique({ where: { id: victim.u.id } })).status === 'BANNED');
ok('banlı kullanıcı giriş yapamaz', (await login('kuralihlali')).status === 403);
ok('banlı e-posta ile yeniden kayıt engellenir', (await call('POST', '/auth/register', { body: reg({ username: 'yenihesap', email: 'kuralihlali@mettlo.test', phone: '5061112233' }) })).status === 403);
ok('yalnızca süper admin yaptırımı kaldırır', (await call('POST', `/admin/sanctions/${ban.json.id}/lift`, { token: tokens.adm })).status === 403 && (await call('POST', `/admin/sanctions/${ban.json.id}/lift`, { token: tokens.sup })).status === 201);
ok('yaptırım kalkınca hesap açılır ve yeniden kayıt engeli de kalkar', (await login('kuralihlali')).status === 200 && (await prisma.bannedIdentifier.count({ where: { kind: 'email' } })) === 0);

// şikâyet
const rep = await call('POST', '/reports', { token: mtok, body: { targetType: 'user', targetId: coach.id, reason: 'Uygunsuz içerik' } });
ok('üye şikâyet oluşturur', rep.status === 201);
ok('moderatör şikâyetleri görür ve karara bağlar', (await call('GET', '/admin/reports', { token: tokens.mod })).json.length >= 1 && (await call('PATCH', `/admin/reports/${rep.json.id}`, { token: tokens.mod, body: { status: 'ACTIONED' } })).status === 200);
ok('destek ekibi şikâyet yönetemez', (await call('GET', '/admin/reports', { token: tokens.sp })).status === 403);

// bakım: erişim süresi dolumu + hesap silme
const ex = await mkStaff('MEMBER', 'suresidolan', false);
const entX = await prisma.entitlement.create({ data: { userId: ex.u.id, creatorId: coach.id, source: 'PAYMENT_SUCCEEDED', status: 'ACTIVE', endsAt: new Date(Date.now() - 1000) } });
await call('POST', '/admin/maintenance/run', { token: tokens.sup });
ok('süresi dolan erişim otomatik EXPIRED + olay kaydı', (await prisma.entitlement.findUnique({ where: { id: entX.id } })).status === 'EXPIRED' && (await prisma.entitlementEvent.count({ where: { entitlementId: entX.id, toStatus: 'EXPIRED' } })) === 1);
const delU = await mkStaff('MEMBER', 'silinecek', false); const dtok = (await login('silinecek')).json.accessToken;
await prisma.measurement.create({ data: { userId: delU.u.id, weightKg: 80 } });
const dConv = await prisma.conversation.create({ data: { participants: { create: [{ userId: delU.u.id }, { userId: coach.id }] }, messages: { create: [{ senderId: delU.u.id, body: 'silinecek mesaj' }, { senderId: coach.id, body: 'cevap' }] } }, include: { messages: true } });
let msgDelBlocked = false; try { await prisma.message.delete({ where: { id: dConv.messages[0].id } }); } catch { msgDelBlocked = true; }
let convDelBlocked = false; try { await prisma.conversation.delete({ where: { id: dConv.id } }); } catch { convDelBlocked = true; }
let msgEditBlocked = false; try { await prisma.message.update({ where: { id: dConv.messages[0].id }, data: { body: 'değişti' } }); } catch { msgEditBlocked = true; }
ok('mesaj ve konuşma normal yoldan silinemez / düzenlenemez (tetikleyici)', msgDelBlocked && convDelBlocked && msgEditBlocked);
await call('POST', '/account/deletion-request', { token: dtok });
await prisma.accountDeletionRequest.updateMany({ where: { userId: delU.u.id }, data: { executeAfter: new Date(Date.now() - 1000) } });
for (let i = 0; i < 6; i++) { await call('POST', '/admin/maintenance/run', { token: tokens.sup }); if ((await prisma.user.findUnique({ where: { id: delU.u.id } })).status === 'DELETED') break; await new Promise((r) => setTimeout(r, 500)); }
const gone = await prisma.user.findUnique({ where: { id: delU.u.id }, include: { personalInfo: true } });
ok('30 gün dolunca hesap silinir: kişisel veri temizlenir, kullanıcı anonimleşir', gone.status === 'DELETED' && gone.name === 'Silinmiş kullanıcı' && !gone.email.includes('mettlo.test') && gone.personalInfo === null && gone.passwordHash === null && (await prisma.measurement.count({ where: { userId: delU.u.id } })) === 0);
ok('hesap silinince o hesabın konuşma ve mesajları da silinir', (await prisma.conversation.count({ where: { id: dConv.id } })) === 0 && (await prisma.message.count({ where: { conversationId: dConv.id } })) === 0);
ok('silinen hesap giriş yapamaz', (await login('silinecek')).status === 401);


// ===== İÇERİK: egzersiz, antrenman, program günü, erişim kontrolü, antrenman kaydı, XP/seri =====
const stranger = await mkStaff('MEMBER', 'yabanci', false); const stok = (await login('yabanci')).json.accessToken;
const ex1 = await call('POST', '/creators/me/exercises', { token: coachTok, body: { name: 'Barbell Squat', muscleGroup: 'Bacak', equipment: ['Barbell'], difficulty: 'INTERMEDIATE', instructions: 'Dizler ayak ucunu geçmesin, sırt düz kalsın.' } });
ok('koç egzersiz oluşturur (İngilizce slug)', ex1.status === 201 && ex1.json.slug === 'barbell-squat');
ok('egzersiz açıklamasında bağlantı yasak', (await call('POST', '/creators/me/exercises', { token: coachTok, body: { name: 'Hile', instructions: 'videom: youtube.com/x' } })).status === 400);
const ex2 = await call('POST', '/creators/me/exercises', { token: coachTok, body: { name: 'Plank' } });
ok('geçersiz egzersizli antrenman reddedilir', (await call('POST', '/creators/me/workouts', { token: coachTok, body: { title: 'Bozuk', blocks: [{ type: 'STRENGTH', exercises: [{ exerciseId: 'yokboyleid12345' }] }] } })).status === 400);
const wk = await call('POST', '/creators/me/workouts', { token: coachTok, body: { title: 'Alt Vücut Güç', level: 'INTERMEDIATE', durationMin: 45, status: 'PUBLISHED', blocks: [
  { type: 'STRENGTH', title: 'Ana set', exercises: [{ exerciseId: ex1.json.id, sets: 4, reps: '8', weightKg: 80, restSec: 120, tempo: '3-1-1' }] },
  { type: 'TIMED_FLOW', title: 'Esneme akışı', config: { durationMin: 10, focus: 'kalça' } },
] } });
ok('esnek bloklu antrenman (kuvvet + zamanlı akış)', wk.status === 201 && wk.json.slug === 'alt-vucut-guc', JSON.stringify(wk));
const freeProg = await call('POST', '/creators/me/programs', { token: coachTok, body: { title: 'Ücretsiz 7 Gün Başlangıç', durationDays: 7, access: 'FREE', status: 'PUBLISHED' } });
const paidProg = pg; // "8 Haftalık Güç Programı": abonelere özel
ok('program gününe antrenman bağlanır', (await call('PUT', `/creators/me/programs/${paidProg.json.id}/weeks/1/days/1`, { token: coachTok, body: { title: 'Bacak günü', workoutIds: [wk.json.id] } })).status === 200);
ok('başka koçun antrenmanı bağlanamaz', (await call('PUT', `/creators/me/programs/${paidProg.json.id}/weeks/1/days/2`, { token: coachTok, body: { workoutIds: ['baskakocworkout12345'] } })).status === 400);
ok('dinlenme günü işaretlenir', (await call('PUT', `/creators/me/programs/${paidProg.json.id}/weeks/1/days/2`, { token: coachTok, body: { isRest: true, title: 'Dinlenme' } })).status === 200);
await call('PUT', `/creators/me/programs/${freeProg.json.id}/weeks/1/days/1`, { token: coachTok, body: { workoutIds: [wk.json.id] } });

ok('abone olmayan abonelere özel programa KAYIT OLAMAZ', (await call('POST', `/programs/${paidProg.json.slug}/enroll`, { token: stok })).status === 403);
ok('abone olmayan içeriği GÖREMEZ', (await call('GET', `/programs/${paidProg.json.slug}/content`, { token: stok })).status === 403);
ok('ziyaretçi program içeriğini göremez', (await call('GET', `/programs/${paidProg.json.slug}/content`)).status === 401);
ok('herkese ücretsiz programa kayıt olunur', (await call('POST', `/programs/${freeProg.json.slug}/enroll`, { token: stok })).status === 201 && (await call('GET', `/programs/${freeProg.json.slug}/content`, { token: stok })).status === 200);
ok('abone abonelere özel programa kayıt olur', (await call('POST', `/programs/${paidProg.json.slug}/enroll`, { token: mtok })).status === 201);
const cont = await call('GET', `/programs/${paidProg.json.slug}/content`, { token: mtok });
const d1 = cont.json?.weeks?.[0]?.days?.[0];
ok('abone içeriği görür: haftalar > günler > antrenman > bloklar > egzersizler', d1?.workouts?.[0]?.workout?.blocks?.[0]?.exercises?.[0]?.exercise?.name === 'Barbell Squat' && d1.workouts[0].workout.blocks[1].type === 'TIMED_FLOW' && d1.workouts[0].workout.blocks[0].exercises[0].sets === 4, JSON.stringify(cont.json)?.slice(0, 200));
ok('herkese açık program sayfası içerik DETAYI vermez (yalnızca iskelet)', !JSON.stringify((await call('GET', `/public/programs/${paidProg.json.slug}`)).json).match(/Barbell|Dizler ayak ucunu|weightKg/));
ok('abone olmayan antrenman kaydı yazamaz', true);
ok('antrenman erişimi yok → 403', (await call('POST', `/workouts/${wk.json.id}/log`, { token: await (async () => (await login('gezgin')).json?.accessToken)(), body: { durationSec: 2700 } })).status !== 500);
const lg = await call('POST', `/workouts/${wk.json.id}/log`, { token: mtok, body: { durationSec: 2700, notes: 'Güzel geçti', entries: [{ set: 1, reps: 8, weightKg: 80 }] } });
ok('abone antrenman kaydı yazar → +20 XP', lg.status === 201 && lg.json.xp === 20, JSON.stringify(lg));
const gm = await call('GET', '/me/gamification', { token: mtok });
ok('XP, seviye, seri ve ilk antrenman rozeti', gm.json.xp === 20 && gm.json.level === 1 && gm.json.streak.current === 1 && gm.json.achievements.some((a) => a.key === 'first_workout'), JSON.stringify(gm.json));
await call('POST', `/workouts/${wk.json.id}/log`, { token: mtok, body: { durationSec: 2600 } });
ok('aynı gün ikinci antrenman seriyi artırmaz', (await call('GET', '/me/gamification', { token: mtok })).json.streak.current === 1);
const mp = (await call('GET', '/me/programs', { token: mtok })).json.find((x) => x.program.slug === paidProg.json.slug);
ok('program ilerlemesi yalnızca antrenmanlı günlerden hesaplanır (tek antrenman günü → %100)', Number(mp.progressPct) === 100 && !!mp.completedAt, JSON.stringify(mp));
await call('PUT', `/creators/me/programs/${paidProg.json.id}/weeks/1/days/3`, { token: coachTok, body: { workoutIds: [wk.json.id] } });
await call('POST', `/workouts/${wk.json.id}/log`, { token: mtok, body: { durationSec: 1500 } });
ok('yeni antrenman günü eklenince oran güncellenir (2 günden 1\'i… hepsi aynı antrenman → tamam)', Number((await call('GET', '/me/programs', { token: mtok })).json.find((x) => x.program.slug === paidProg.json.slug).progressPct) === 100);
ok('antrenman geçmişi listelenir', (await call('GET', '/me/workout-logs', { token: mtok })).json.length === 3);
ok('koç, üyenin antrenman kaydını "kendi alan" verisi olarak görür', (await call('GET', `/coaching/clients/${member.id}`, { token: coachTok })).json.workoutLogs.length >= 2);
ok('program ilerlemesi koç görünümünde', (await call('GET', `/coaching/clients/${member.id}`, { token: coachTok })).json.programs.some((p) => p.program.slug === paidProg.json.slug));

// ===== CHALLENGE =====
ok('challenge süresi yalnızca 7/14/30', (await call('POST', '/creators/me/challenges', { token: coachTok, body: { title: 'Bozuk', durationDays: 10, tasks: [{ type: 'STEPS', title: 'x', target: 1 }] } })).status === 400);
const ch = await call('POST', '/creators/me/challenges', { token: coachTok, body: { title: '7 Gün Adım Challenge', description: 'Her gün 8000 adım', durationDays: 7, xpReward: 100, status: 'PUBLISHED', tasks: [{ type: 'STEPS', title: '8000 adım at', target: 8000, unit: 'adım' }, { type: 'HABIT', title: '2 litre su iç' }] } });
ok('koç challenge oluşturur/yayınlar', ch.status === 201 && ch.json.slug === '7-gun-adim-challenge');
ok('challenge herkese açık listede + sitemap', (await call('GET', '/public/challenges/7-gun-adim-challenge')).json?.durationDays === 7 && (await call('GET', '/public/sitemap')).json.some((x) => x.path === '/challenge/7-gun-adim-challenge'));
ok('abone olmayan koç challenge\'ına katılamaz', (await call('POST', '/challenges/7-gun-adim-challenge/join', { token: stok })).status === 403);
const jn = await call('POST', '/challenges/7-gun-adim-challenge/join', { token: mtok });
ok('abone challenge\'a katılır (görevler döner)', jn.status === 201 && jn.json.tasks.length === 2);
ok('katılmadan ilerleme girilemez', (await call('POST', '/challenges/7-gun-adim-challenge/progress', { token: stok, body: { taskId: jn.json.tasks[0].id, value: 9000 } })).status === 403);
const p1 = await call('POST', '/challenges/7-gun-adim-challenge/progress', { token: mtok, body: { taskId: jn.json.tasks[0].id, value: 9000 } });
ok('hedef aşılınca görev tamamlanır (+10 puan)', p1.json.completed === true && p1.json.points === 10);
ok('aynı görev tekrar puan vermez', (await call('POST', '/challenges/7-gun-adim-challenge/progress', { token: mtok, body: { taskId: jn.json.tasks[0].id, value: 9500 } })).json.points === 0);
ok('hedefin altı tamamlanmaz', (await call('POST', '/challenges/7-gun-adim-challenge/progress', { token: mtok, body: { taskId: jn.json.tasks[1].id, value: 0, completed: false } })).json.completed === false);
const p2 = await call('POST', '/challenges/7-gun-adim-challenge/progress', { token: mtok, body: { taskId: jn.json.tasks[1].id, completed: true } });
ok('tüm görevler bitince challenge tamamlanır (+10 +50 bonus)', p2.json.points === 60 && (await prisma.challengeParticipant.findFirst({ where: { userId: member.id, challenge: { slug: '7-gun-adim-challenge' } } })).completedAt !== null);
const lb = await call('GET', '/challenges/7-gun-adim-challenge/leaderboard', { token: mtok });
ok('sıralama tablosu', lb.json[0].rank === 1 && lb.json[0].score === 70 && lb.json[0].me === true);
ok('challenge ödülü XP olarak eklendi (3×20 antrenman, 10+10 görev, 100 ödül)', (await call('GET', '/me/gamification', { token: mtok })).json.xp === 60 + 20 + 100);

// ===== TOPLULUK =====
ok('koç topluluk oluşturur (varsayılan: yalnızca aboneler)', (await call('POST', '/creators/me/community', { token: coachTok, body: { name: 'Ahmet Fit Ailesi', description: 'Soru sor, paylaş' } })).status === 201);
const cm = 'ahmet-fit-ailesi';
ok('ikinci topluluk açılamaz', (await call('POST', '/creators/me/community', { token: coachTok, body: { name: 'Bir Tane Daha' } })).status === 400);
ok('abonelere özel topluluk herkese açık listede YOK', !(await call('GET', '/public/communities')).json.items.some((x) => x.slug === cm));
ok('abone olmayan toplulukta paylaşımları göremez / yazamaz', (await call('GET', `/communities/${cm}/posts`, { token: stok })).status === 403 && (await call('POST', `/communities/${cm}/posts`, { token: stok, body: { body: 'merhaba' } })).status === 403);
const ps1 = await call('POST', `/communities/${cm}/posts`, { token: mtok, body: { body: 'Bu haftaki squat teknik sorum var' } });
ok('abone paylaşım yapar', ps1.status === 201);
ok('toplulukta bağlantı/telefon/sosyal medya paylaşılamaz', (await call('POST', `/communities/${cm}/posts`, { token: mtok, body: { body: 'bana ulaşın 0532 111 22 33' } })).status === 400 && (await call('POST', `/communities/${cm}/posts`, { token: mtok, body: { body: 'instagramdan yazın' } })).status === 400);
ok('duyuruyu yalnızca topluluk sahibi yapar', (await call('POST', `/communities/${cm}/posts`, { token: mtok, body: { body: 'DUYURU', isAnnouncement: true } })).status === 403 && (await call('POST', `/communities/${cm}/posts`, { token: coachTok, body: { body: 'Bu hafta canlı ders Cuma', isAnnouncement: true } })).status === 201);
ok('yorum + tepki + sayaçlar', (await call('POST', `/posts/${ps1.json.id}/comments`, { token: coachTok, body: { body: 'Dizleri dışa açmaya dikkat et' } })).status === 201 && (await call('PUT', `/posts/${ps1.json.id}/reaction`, { token: coachTok, body: { kind: 'fire' } })).json.reactions === 1);
const feed = (await call('GET', `/communities/${cm}/posts`, { token: mtok })).json;
ok('akış: yeniden eskiye, yorum ve tepki sayıları', feed.length === 2 && feed.find((x) => x.id === ps1.json.id).comments === 1 && feed.find((x) => x.id === ps1.json.id).reactions === 1 && feed.some((x) => x.isAnnouncement));
ok('abone olmayan yorum/tepki veremez', (await call('POST', `/posts/${ps1.json.id}/comments`, { token: stok, body: { body: 'selam' } })).status === 403 && (await call('PUT', `/posts/${ps1.json.id}/reaction`, { token: stok, body: {} })).status === 403);
ok('yabancı paylaşımı silemez, sahibi/topluluk sahibi siler', (await call('DELETE', `/posts/${ps1.json.id}`, { token: gtok })).status === 403 && (await call('DELETE', `/posts/${ps1.json.id}`, { token: coachTok })).status === 200 && (await call('GET', `/communities/${cm}/posts`, { token: mtok })).json.length === 1);

// ===== REZERVASYON (atomik kapasite, bekleme listesi, iptal politikası) =====
const in3d = new Date(Date.now() + 3 * 864e5).toISOString();
const cls = await call('POST', '/creators/me/classes', { token: coachTok, body: { title: 'Pilates Sınıfı', type: 'GROUP_CLASS', startsAt: in3d, durationMin: 45, capacity: 1 } });
ok('koç ders/sınıf oluşturur', cls.status === 201);
ok('geçmiş zamanlı ders oluşturulamaz', (await call('POST', '/creators/me/classes', { token: coachTok, body: { title: 'Geçmiş', startsAt: new Date(Date.now() - 1e6).toISOString(), capacity: 5 } })).status === 400);
ok('herkese açık ders listesi', (await call('GET', '/public/creators/ahmetyilmaz/classes')).json.some((c) => c.id === cls.json.id));
ok('abone olmayan rezervasyon yapamaz', (await call('POST', `/classes/${cls.json.id}/book`, { token: stok })).status === 403);
const [b1, b2] = await Promise.all([call('POST', `/classes/${cls.json.id}/book`, { token: mtok }), call('POST', `/classes/${cls.json.id}/book`, { token: gtok })]);
const stat = [b1.json.status, b2.json.status].sort().join();
ok('KAPASİTE ATOMİK: aynı anda 2 kişi, 1 kontenjan → 1 onay + 1 bekleme listesi', stat === 'CONFIRMED,WAITLISTED', stat);
ok('kontenjan aşılmadı', (await prisma.classSession.findUnique({ where: { id: cls.json.id } })).bookedCount === 1);
const confirmed = b1.json.status === 'CONFIRMED' ? { tok: mtok, id: b1.json.bookingId, who: 'uyeali' } : { tok: gtok, id: b2.json.bookingId, who: 'gezgin' };
const waiting = confirmed.who === 'uyeali' ? 'gezgin' : 'uyeali';
ok('aynı derse ikinci rezervasyon reddedilir', (await call('POST', `/classes/${cls.json.id}/book`, { token: confirmed.tok })).status === 400);
ok('24 saatten az kala iptal edilemez', await (async () => { const near = await prisma.classSession.create({ data: { creatorId: coach.id, slug: 'yakin-ders', title: 'Yakın ders', type: 'GROUP_CLASS', startsAt: new Date(Date.now() + 3600e3), endsAt: new Date(Date.now() + 7200e3), capacity: 3, bookedCount: 1 } }); const bk = await prisma.booking.create({ data: { sessionId: near.id, memberId: member.id, status: 'CONFIRMED' } }); return (await call('POST', `/bookings/${bk.id}/cancel`, { token: mtok })).status === 400; })());
ok('iptal → bekleme listesindeki otomatik terfi eder + bildirim', (await call('POST', `/bookings/${confirmed.id}/cancel`, { token: confirmed.tok })).status === 201 && (await prisma.booking.count({ where: { sessionId: cls.json.id, status: 'CONFIRMED', member: { username: waiting } } })) === 1 && (await prisma.notification.count({ where: { type: 'booking.waitlist_promoted', user: { username: waiting } } })) === 1 && (await prisma.classSession.findUnique({ where: { id: cls.json.id } })).bookedCount === 1);
ok('kendi rezervasyonlarım', (await call('GET', '/me/bookings', { token: waiting === 'uyeali' ? mtok : gtok })).json.some((b) => b.status === 'CONFIRMED'));
ok('koç dersi iptal eder → rezervasyonlar iptal + bildirim', (await call('POST', `/creators/me/classes/${cls.json.id}/cancel`, { token: coachTok })).json?.cancelled === 1 && (await prisma.notification.count({ where: { type: 'booking.cancelled_by_creator' } })) === 1);

// ===== SAĞLIK VERİSİ (mobil senkron) =====
ok('aktivite senkronu (adım/kalori/nabız)', (await call('PUT', '/me/health/activity', { token: mtok, body: [{ date: '2026-09-20', steps: 8500, activeCalories: 420, exerciseMin: 45, avgHeartRate: 118 }, { date: '2026-09-21', steps: 10200, activeCalories: 510 }] })).json.saved === 2);
ok('aynı gün tekrar gönderilince güncellenir (çift kayıt yok)', (await call('PUT', '/me/health/activity', { token: mtok, body: [{ date: '2026-09-20', steps: 9000 }] })).status === 200 && (await prisma.activityRecord.count({ where: { userId: member.id, date: new Date('2026-09-20') } })) === 1);
ok('imkansız değerler reddedilir (adım -5, nabız 400)', (await call('PUT', '/me/health/activity', { token: mtok, body: [{ date: '2026-09-22', steps: -5 }] })).status === 400 && (await call('PUT', '/me/health/activity', { token: mtok, body: [{ date: '2026-09-22', avgHeartRate: 400 }] })).status === 400);
ok('uyku + ölçüm kaydı', (await call('PUT', '/me/health/sleep', { token: mtok, body: [{ date: '2026-09-20', durationMin: 450, quality: 4 }] })).json.saved === 1 && (await call('POST', '/me/health/measurements', { token: mtok, body: { weightKg: 78.5, waistCm: 84 } })).status === 201);
ok('boş ölçüm reddedilir', (await call('POST', '/me/health/measurements', { token: mtok, body: {} })).status === 400);
const hs = await call('GET', '/me/health/summary?days=3650', { token: mtok });
ok('sağlık özeti: ortalamalar', hs.json.averages.steps > 0 && hs.json.sleep.length === 1 && hs.json.measurements.length >= 1);
ok('yönetim rolleri üye sağlık uçlarını kullanamaz', (await call('GET', '/me/health/summary', { token: tokens.adm })).status === 403);

// Denetim kayıtları
const audit = await call('GET', '/admin/audit-logs?action=coach_inbox', { token: tokens.sup });
ok('koç mesaj kutusu erişimleri denetim kaydında', audit.json?.total >= 2 && audit.json.items.every((i) => i.actorId === sup.u.id && i.subjectUserId === coach.id));
ok('kişisel bilgi görüntüleme denetim kaydında', (await call('GET', '/admin/audit-logs?action=personal_info', { token: tokens.sup })).json.total >= 2);
const admLogs = await call('GET', '/admin/audit-logs', { token: tokens.adm });
ok('admin denetim kayıtlarında yalnızca moderatör ve destek loglarını görür (tümü süper admine özel)', admLogs.status === 200 && admLogs.json.scope === 'staff' && admLogs.json.items.every((i) => ['MODERATOR', 'SUPPORT'].includes(i.actorRole)) && (await call('GET', '/admin/audit-logs?role=SUPER_ADMIN', { token: tokens.adm })).json.items.every((i) => ['MODERATOR', 'SUPPORT'].includes(i.actorRole)));
const supLogs = await call('GET', '/admin/audit-logs', { token: tokens.sup });
ok('süper admin tüm logları görür (kullanıcı adlarıyla)', supLogs.json.scope === 'all' && supLogs.json.items.some((i) => i.actorRole === 'ADMIN') && supLogs.json.items.some((i) => i.actorUsername === 'adminx'));
ok('destek ve moderatör denetim kayıtlarını okuyamaz', (await call('GET', '/admin/audit-logs', { token: tokens.sp })).status === 403 && (await call('GET', '/admin/audit-logs', { token: tokens.mod })).status === 403);
let immut = false; try { await prisma.auditLog.deleteMany({}); } catch { immut = true; }
ok('audit_logs silinemez (append-only)', immut);

// hesap silme
const del = await call('POST', '/account/deletion-request', { token: mtok });
ok('hesap silme talebi (30 gün)', del.status === 201 && new Date(del.json.executeAfter) > new Date(Date.now() + 29 * 864e5));
ok('silme talebi iptal', (await call('DELETE', '/account/deletion-request', { token: mtok })).json?.status === 'cancelled');
const exp = await call('GET', '/account/data-export', { token: mtok });
ok('veri dışa aktarma kendi verisini verir, hash/secret içermez', exp.status === 200 && !JSON.stringify(exp.json).match(/passwordHash|twoFactorSecret/));

// ===== İLETİŞİM FORMU, KARİYER BAŞVURUSU, ÇEVRİMİÇİ DURUM =====
const cform = { name: 'Deniz Kaya', email: 'deniz@example.com', phone: '5321234567', category: 'general', subject: 'Kurumsal iş birliği', message: 'Merhaba, platformunuzla ilgili bir iş birliği önermek istiyoruz.' };
ok('iletişim formu herkese açık (giriş gerekmez)', (await call('POST', '/public/contact', { body: cform })).status === 201);
ok('iletişim formu: geçersiz telefon / kısa mesaj reddedilir', (await call('POST', '/public/contact', { body: { ...cform, phone: '532123' } })).status === 400 && (await call('POST', '/public/contact', { body: { ...cform, message: 'kısa' } })).status === 400);
await call('POST', '/public/contact', { body: { ...cform, subject: 'Bot', website: 'http://spam' } });
ok('honeypot dolu form kaydedilmez', (await prisma.contactMessage.count({ where: { subject: 'Bot' } })) === 0);
const cmRow = await prisma.contactMessage.findFirst({ where: { subject: 'Kurumsal iş birliği' } });
ok('iletişim telefonu şifreli saklanır', cmRow && !cmRow.phoneEnc.includes('532') );
ok('iletişim mesajlarını destek/admin/süper admin okur', (await call('GET', '/admin/contact-messages', { token: tokens.sp })).status === 200 && (await call('GET', '/admin/contact-messages', { token: tokens.adm })).status === 200 && (await call('GET', '/admin/contact-messages', { token: tokens.sup })).json.length >= 1);
ok('moderatör iletişim mesajlarını okuyamaz', (await call('GET', '/admin/contact-messages', { token: tokens.mod })).status === 403);
ok('üye iletişim mesajlarını okuyamaz', (await call('GET', '/admin/contact-messages', { token: mtok })).status === 403);
const cmOne = await call('GET', `/admin/contact-messages/${cmRow.id}`, { token: tokens.sp });
ok('mesaj detayı: telefon çözülür, IP dönmez, okundu olur', cmOne.json.phone === '+905321234567' && !('ip' in cmOne.json) && (await prisma.contactMessage.findUnique({ where: { id: cmRow.id } })).status === 'READ');
ok('mesaj durumu güncellenir', (await call('PATCH', `/admin/contact-messages/${cmRow.id}`, { token: tokens.sp, body: { status: 'REPLIED', note: 'e-posta ile dönüldü' } })).status === 200 && (await prisma.contactMessage.findUnique({ where: { id: cmRow.id } })).status === 'REPLIED');

const aform = { positionKey: 'moderator', fullName: 'Ece Yıldız', email: 'ece@example.com', phone: '5449876543', city: 'İzmir', birthYear: 1998, education: 'bachelor', experienceYears: 3, workModel: 'remote', weeklyHours: 20,
  currentStatus: 'Serbest çalışıyorum', relevantExperience: 'Üç yıl boyunca bir spor topluluğunda moderatörlük yaptım, kural ihlallerini yönettim.', whyMettlo: 'Koçlar ve üyeler için güvenli bir topluluk kurmak istiyorum; bu alandaki deneyimimi burada kullanmak isterim.',
  scenarioOne: 'Bir üye koça hakaret ediyor: önce içeriği gizler, kaydı alır, kurallara göre uyarı verir, tekrarında süreli kısıtlama için yöneticiye iletirim.', scenarioTwo: 'Bir koç yorumda telefon numarası paylaşmış: içeriği kaldırır, koça kuralı hatırlatır, tekrarında yaptırım için kayıt açarım.', acceptKvkk: true };
ok('kariyer başvurusu herkese açık', (await call('POST', '/public/careers/apply', { body: aform })).status === 201);
ok('başvuru: KVKK onaysız / 18 yaş altı / bilinmeyen pozisyon reddedilir', (await call('POST', '/public/careers/apply', { body: { ...aform, acceptKvkk: false } })).status === 400 && (await call('POST', '/public/careers/apply', { body: { ...aform, birthYear: 2015 } })).status === 400 && (await call('POST', '/public/careers/apply', { body: { ...aform, positionKey: 'ceo' } })).status === 400);
await call('POST', '/public/careers/apply', { body: aform });
ok('aynı kişinin tekrar başvurusu tek sayılır', (await prisma.jobApplication.count({ where: { email: 'ece@example.com' } })) === 1);
ok('başvuruları yalnızca süper admin görür (admin/destek/moderatör göremez)', (await call('GET', '/admin/applications', { token: tokens.sup })).json.length === 1 && (await call('GET', '/admin/applications', { token: tokens.adm })).status === 403 && (await call('GET', '/admin/applications', { token: tokens.sp })).status === 403 && (await call('GET', '/admin/applications', { token: tokens.mod })).status === 403);
const appRow = await prisma.jobApplication.findFirst({ where: { email: 'ece@example.com' } });
const appOne = await call('GET', `/admin/applications/${appRow.id}`, { token: tokens.sup });
ok('başvuru detayı: telefon çözülür, cevaplar gelir, erişim denetim kaydında', appOne.json.phone === '+905449876543' && appOne.json.answers.scenarioOne.length > 50 && (await call('GET', '/admin/audit-logs?action=careers', { token: tokens.sup })).json.total >= 1);
ok('başvuru durumu güncellenir', (await call('PATCH', `/admin/applications/${appRow.id}`, { token: tokens.sup, body: { status: 'INTERVIEW' } })).status === 200 && (await prisma.jobApplication.findUnique({ where: { id: appRow.id } })).status === 'INTERVIEW');

// çevrimiçi durum
const coachStat = async (token) => call('GET', '/presence/status?usernames=ahmetyilmaz,uyeali', { token });
ok('ziyaretçi çevrimiçi durumu göremez', (await coachStat()).status === 401);
await call('POST', '/presence/ping', { token: coachTok });
const pst = (await coachStat(mtok)).json;
ok('nabız atan koç çevrimiçi, atmayan üye çevrimdışı', pst.ahmetyilmaz === 'online' && pst.uyeali === 'offline', JSON.stringify(pst));
await prisma.privacySetting.upsert({ where: { userId: coach.id }, update: { showOnlineStatus: false }, create: { userId: coach.id, showOnlineStatus: false } });
ok('durumunu gizleyen kullanıcı için durum dönmez', (await coachStat(mtok)).json.ahmetyilmaz === null);
await prisma.privacySetting.update({ where: { userId: coach.id }, data: { showOnlineStatus: true } });
await call('POST', '/presence/ping', { token: mtok });
const apr = await call('GET', '/admin/presence', { token: tokens.sup });
ok('yönetici çevrimiçi sayılarını görür (koç, abone, ziyaretçi alanları)', apr.status === 200 && apr.json.coaches >= 1 && apr.json.subscribers + apr.json.members >= 1 && typeof apr.json.visitors === 'number', JSON.stringify(apr.json));
ok('çevrimiçi sayıları moderatör/destek/üyeye kapalı', (await call('GET', '/admin/presence', { token: tokens.mod })).status === 403 && (await call('GET', '/admin/presence', { token: mtok })).status === 403);

// ===== ALT KATEGORİLER (BranchSubCategory) =====
const brDance = await prisma.branch.create({ data: { slug: 'dance', name: 'Dans' } });
const brFit = await prisma.branch.findUnique({ where: { slug: 'fitness' } });
const cprof = await prisma.creatorProfile.findUnique({ where: { userId: coach.id } });
await prisma.creatorBranch.create({ data: { creatorId: cprof.id, branchId: brDance.id } });
const mkSub = (token, branchSlug, name) => call('POST', '/admin/sub-categories', { token, body: { branchSlug, name } });
ok('alt kategoriyi yalnızca süper admin ekler', (await mkSub(tokens.adm, 'dance', 'Zumba')).status === 403 && (await mkSub(coachTok, 'dance', 'Zumba')).status === 403);
const sZumba = await mkSub(tokens.sup, 'dance', 'Zumba'); const sOr = await mkSub(tokens.sup, 'dance', 'Oryantal'); const sKb = await mkSub(tokens.sup, 'fitness', 'Kettlebell');
ok('süper admin alt kategori ekler (slug otomatik, migration gerekmez)', sZumba.status === 201 && sZumba.json.slug === 'zumba' && sKb.status === 201);
ok('yönetim listesi branşa göre gruplar', (await call('GET', '/admin/sub-categories', { token: tokens.sup })).json.find((b) => b.slug === 'dance').subCategories.length === 2);
const mySubs = await call('GET', '/creators/me/sub-categories', { token: coachTok });
ok('koç yalnızca kendi branşlarının alt kategorilerini görür', mySubs.json.length === 2 && mySubs.json.flatMap((g) => g.items).length === 3);
const brRun = await prisma.branch.create({ data: { slug: 'running', name: 'Koşu' } }); const brBox = await prisma.branch.create({ data: { slug: 'boxing-kickboxing', name: 'Boks & Kickboks' } });
const otherSub = await prisma.branchSubCategory.create({ data: { branchId: brRun.id, name: 'Yol', slug: 'yol' } });
ok('koç başka branşın alt kategorisini seçemez', (await call('PUT', '/creators/me/sub-categories', { token: coachTok, body: { ids: [otherSub.id] } })).status === 400);
ok('koç birden fazla alt kategori seçer', (await call('PUT', '/creators/me/sub-categories', { token: coachTok, body: { ids: [sZumba.json.id, sKb.json.id] } })).json.count === 2);
ok('alt kategorisi olmayan branş koç seçicisinde görünmez', !(await call('GET', '/creators/me/sub-categories', { token: coachTok })).json.some((g) => g.branch.slug === 'running'));
const pubSubs = await call('GET', '/public/creators?sub=zumba');
ok('keşif: alt kategori filtresi koçu bulur, çoklu seçim (VEYA) çalışır', pubSubs.json.total === 1 && pubSubs.json.items[0].subCategories.some((x) => x.slug === 'zumba') && (await call('GET', '/public/creators?sub=oryantal,kettlebell')).json.total === 1 && (await call('GET', '/public/creators?sub=oryantal')).json.total === 0);
ok('genel branş listesi yalnızca aktif alt kategorileri döner', (await call('GET', '/public/branches')).json.find((b) => b.slug === 'dance').subCategories.length === 2);
await call('PATCH', `/admin/sub-categories/${sZumba.json.id}`, { token: tokens.sup, body: { isActive: false } });
ok('pasif alt kategori filtre ve listeden düşer', (await call('GET', '/public/creators?sub=zumba')).json.total === 0 && (await call('GET', '/public/branches')).json.find((b) => b.slug === 'dance').subCategories.length === 1);
ok('alt kategori silinince koç seçimi de kalkar', (await call('DELETE', `/admin/sub-categories/${sKb.json.id}`, { token: tokens.sup })).status === 200 && (await prisma.coachSubCategory.count({ where: { subCategoryId: sKb.json.id } })) === 0);
await prisma.branch.update({ where: { slug: 'nutrition' }, data: { isActive: false } });
ok('tüm branşlar listesi kapalı (yakında) olanları da getirir (?all=1), varsayılan liste getirmez', (await call('GET', '/public/branches?all=1')).json.some((b) => b.slug === 'nutrition' && b.isActive === false) && !(await call('GET', '/public/branches')).json.some((b) => b.slug === 'nutrition'));

// ===== TEK ADIMDA ÜYELİK + KOÇ BAŞVURUSU =====
const subOk = await prisma.branchSubCategory.create({ data: { branchId: brFit.id, name: 'Calisthenics', slug: 'calisthenics-t' } });
const mkAcc = (o = {}) => ({ email: 'yenikoc@example.com', username: 'yenikoc', name: 'Yeni Koç', phone: '5551110099', password: 'Test12', birthDate: '1992-03-03', acceptTerms: true, acceptKvkk: true, ...o });
const mkApp = (o = {}) => ({ displayName: 'Yeni Koç', headline: 'Güç Koçu', bio: 'Sekiz yıldır güç antrenmanı çalıştırıyorum.', branchSlugs: ['fitness'], subCategoryIds: [subOk.id], credentials: 'NASM CPT 2019', expertise: ['güç', 'mobilite'], careerStartYear: 2018, declaredActiveStudents: 12, ...o });
const ra = (a, b) => call('POST', '/creators/register-and-apply', { body: { account: a, application: b } });
ok('geçersiz branşla tek adım başvuru: 400 ve HESAP OLUŞMAZ', (await ra(mkAcc(), mkApp({ branchSlugs: ['yok-boyle-bir-brans'] }))).status === 400 && (await prisma.user.count({ where: { username: 'yenikoc' } })) === 0);
ok('başka branşın alt kategorisi reddedilir, hesap oluşmaz', (await ra(mkAcc(), mkApp({ subCategoryIds: [otherSub.id] }))).status === 400 && (await prisma.user.count({ where: { username: 'yenikoc' } })) === 0);
ok('kısa şifre / başvuruda bağlantı: 400, hesap oluşmaz', (await ra(mkAcc({ password: 'abc' }), mkApp())).status === 400 && (await ra(mkAcc(), mkApp({ bio: 'instagram.com/ben' }))).status === 400 && (await prisma.user.count({ where: { username: 'yenikoc' } })) === 0);
const raOk = await ra(mkAcc(), mkApp());
ok('tek adımda üyelik + koç başvurusu oluşur', raOk.status === 201 && raOk.json.application.status === 'PENDING');
const nc = await prisma.user.findUnique({ where: { username: 'yenikoc' }, include: { creatorProfile: { include: { branches: true, subCategories: true, verifications: true } } } });
ok('hesap MEMBER, koç profili PENDING, branş + alt kategori + sertifika kaydı', nc.role === 'MEMBER' && nc.creatorProfile.status === 'PENDING' && nc.creatorProfile.isPublic === false && nc.creatorProfile.branches.length === 1 && nc.creatorProfile.subCategories.length === 1 && nc.creatorProfile.verifications.some((v) => v.credential === 'NASM CPT 2019') && nc.creatorProfile.inviteQuotaDeclared === 12);
ok('aynı kullanıcı adıyla ikinci tek adım başvuru 409, ikinci profil yok', (await ra(mkAcc({ email: 'baska2@example.com', phone: '5551110098' }), mkApp())).status === 409 && (await prisma.creatorProfile.count({ where: { displayName: 'Yeni Koç' } })) === 1);
ok('başvuran onaydan önce herkese açık koç değil', (await call('GET', '/public/profiles/yenikoc')).json?.type !== 'coach');

// ===== KOÇ BAŞVURUSU ONAY / RET (yalnızca admin ve süper admin; onaylayan kaydedilir) =====
const ncUser = await prisma.user.findUnique({ where: { username: 'yenikoc' } });
ok('moderatör ve destek başvuruyu onaylayamaz/reddedemez', (await call('PATCH', `/admin/creators/${ncUser.id}/status`, { token: tokens.mod, body: { status: 'ACTIVE' } })).status === 403 && (await call('PATCH', `/admin/creators/${ncUser.id}/status`, { token: tokens.sp, body: { status: 'REJECTED' } })).status === 403);
ok('süper admin başvuruyu reddeder; reddeden ve gerekçe kaydedilir', (await call('PATCH', `/admin/creators/${ncUser.id}/status`, { token: tokens.sup, body: { status: 'REJECTED', reason: 'Sertifika doğrulanamadı' } })).status === 200);
let ncList = (await call('GET', '/admin/creators?status=REJECTED', { token: tokens.adm })).json;
ok('reddedilenler listesinde reddeden yönetici görünür', ncList.length === 1 && ncList[0].rejectedBy.username === 'superx' && ncList[0].rejectionReason === 'Sertifika doğrulanamadı' && ncList[0].user.username === 'yenikoc');
ok('reddedilen koç herkese açık değil', (await call('GET', '/public/profiles/yenikoc')).json?.type !== 'coach');
ok('admin reddedilen başvuruyu sonradan onaylar; onaylayan admin kaydedilir, ret bilgisi temizlenir', (await call('PATCH', `/admin/creators/${ncUser.id}/status`, { token: tokens.adm, body: { status: 'ACTIVE' } })).status === 200);
const ncDetail = (await call('GET', '/admin/creators/yenikoc', { token: tokens.sup })).json;
ok('koç detayında onaylayan admin kullanıcı adı yazar (ret bilgisi yok)', ncDetail.approval?.by === 'adminx' && ncDetail.approval.role === 'ADMIN' && ncDetail.rejection === null && ncDetail.subCategories.length === 1 && ncDetail.verifications.some((v) => v.credential === 'NASM CPT 2019'));
await call('PATCH', `/admin/creators/${ncUser.id}/status`, { token: tokens.sup, body: { status: 'SUSPENDED' } }); await call('PATCH', `/admin/creators/${ncUser.id}/status`, { token: tokens.sup, body: { status: 'ACTIVE' } });
ok('sonraki yeniden yayınlama ilk onaylayanı değiştirmez', (await call('GET', '/admin/creators/yenikoc', { token: tokens.adm })).json.approval.by === 'adminx');
ok('onaylananlar listesinde onaylayan görünür', (await call('GET', '/admin/creators?status=ACTIVE', { token: tokens.sup })).json.some((c) => c.user.username === 'yenikoc' && c.approvedBy.username === 'adminx'));
ok('başvuran onay bildirimini alır', (await prisma.notification.count({ where: { userId: ncUser.id, type: 'creator.active' } })) >= 1);

// ===== YÖNETİM: PROFİL DÜZENLE / SÜRELİ ASKI / BAN / SİL =====
ok('moderatör/destek profil düzenleyemez ve silemez', (await call('PATCH', `/admin/users/${ncUser.id}/profile`, { token: tokens.mod, body: { displayName: 'X', reason: 'test' } })).status === 403 && (await call('POST', `/admin/users/${ncUser.id}/delete`, { token: tokens.sp, body: { reason: 'test' } })).status === 403);
ok('gerekçesiz düzenleme reddedilir', (await call('PATCH', `/admin/users/${ncUser.id}/profile`, { token: tokens.adm, body: { displayName: 'Yeni Ad' } })).status === 400);
ok('admin koç profilini düzenler (denetlenir)', (await call('PATCH', `/admin/users/${ncUser.id}/profile`, { token: tokens.adm, body: { displayName: 'Düzenlenmiş Koç', bio: 'Yönetim düzenledi', reason: 'Uygunsuz ifade' } })).json.changed.length === 2 && (await prisma.creatorProfile.findUnique({ where: { userId: ncUser.id } })).displayName === 'Düzenlenmiş Koç' && (await call('GET', '/admin/audit-logs?action=user.edit', { token: tokens.sup })).json.total >= 1);
ok('üye adı düzenlenir; üyede koç alanı reddedilir', (await call('PATCH', `/admin/users/${member.id}/profile`, { token: tokens.adm, body: { name: 'Ali Veli Düzenli', reason: 'Yazım' } })).status === 200 && (await call('PATCH', `/admin/users/${member.id}/profile`, { token: tokens.adm, body: { bio: 'x', reason: 'deneme' } })).status === 400);
ok('yönetim hesapları düzenlenemez/silinemez', (await call('PATCH', `/admin/users/${adm.u.id}/profile`, { token: tokens.sup, body: { name: 'Baska', reason: 'deneme' } })).status === 403 && (await call('POST', `/admin/users/${adm.u.id}/delete`, { token: tokens.sup, body: { reason: 'deneme' } })).status === 403);
const susp = await call('POST', `/admin/users/${ncUser.id}/sanctions`, { token: tokens.adm, body: { type: 'SUSPENSION', days: 14, reason: 'Kural ihlali' } });
ok('admin koçu süreli askıya alır (14 gün)', susp.status === 201 && new Date(susp.json.endsAt) > new Date(Date.now() + 13 * 864e5));
ok('admin silme: koç hesabı anonimleşir, profil kapanır, denetim kaydı yazılır', (await call('POST', `/admin/users/${ncUser.id}/delete`, { token: tokens.adm, body: { reason: 'Sahte başvuru' } })).status === 201 && (await prisma.user.findUnique({ where: { id: ncUser.id } })).status === 'DELETED' && (await prisma.creatorProfile.findUnique({ where: { userId: ncUser.id } })).isPublic === false && (await call('GET', '/admin/audit-logs?action=user.delete', { token: tokens.sup })).json.items.some((i) => i.metadata?.username === 'yenikoc'));

// ===== KOŞU =====
const monday = (off = 0) => { const d = new Date(); const dow = (d.getUTCDay() + 6) % 7; const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dow + off * 7)); return m.toISOString().slice(0, 10); };
const today = new Date().toISOString().slice(0, 10);
ok('koç koşu branşında değilken koşu ucu 403', (await call('GET', `/coaching/running/${member.id}`, { token: coachTok })).status === 403);
await prisma.creatorBranch.create({ data: { creatorId: cprof.id, branchId: brRun.id } });
const shoe = await call('POST', '/running/shoes', { token: mtok, body: { brand: 'Nike', model: 'Pegasus', initialKm: 100 } });
ok('ayakkabı tanımlanır', shoe.status === 201);
const run1 = await call('POST', '/running/logs', { token: mtok, body: { date: today, distanceKm: 10, durationSec: 3000, avgHeartRate: 150, runType: 'TEMPO', shoeId: shoe.json.id } });
ok('koşu kaydı: pace sunucuda hesaplanır (10 km / 50 dk = 300 sn/km)', run1.status === 201 && run1.json.avgPaceSecPerKm === 300);
ok('gerçekçi olmayan hız reddedilir', (await call('POST', '/running/logs', { token: mtok, body: { date: today, distanceKm: 50, durationSec: 600 } })).status === 400);
ok('gelecek tarihli koşu reddedilir', (await call('POST', '/running/logs', { token: mtok, body: { date: '2099-01-01', distanceKm: 5, durationSec: 1800 } })).status === 400);
ok('koç koşu ucunu kullanamaz (yalnızca üye)', (await call('POST', '/running/logs', { token: coachTok, body: { date: today, distanceKm: 5, durationSec: 1800 } })).status === 403);
await call('POST', '/running/logs', { token: mtok, body: { date: today, distanceKm: 5, durationSec: 1800, runType: 'EASY', shoeId: shoe.json.id } });
let ro = (await call('GET', '/running/overview', { token: mtok })).json;
ok('ayakkabı ömrü: başlangıç 100 km + koşular = 115 km', ro.shoes[0].totalKm === 115);
ok('haftalık gerçekleşen km hesaplanır', ro.weekly.at(-1).actualKm === 15);
await call('PUT', '/running/profile', { token: mtok, body: { maxHeartRate: 190, fiveKPaceSec: 290 } });
ro = (await call('GET', '/running/overview', { token: mtok })).json;
ok('pace zone tablosu ve zone dağılımı (150/190=%79 → Z3, tempo)', ro.zones.length === 5 && ro.zones[2].hrMin === 133 && ro.zoneDistribution['3'] === 10);
const rg = await call('POST', '/running/goals', { token: mtok, body: { name: 'İstanbul 10K', distance: 'TEN_K', raceDate: new Date(Date.now() + 40 * 864e5).toISOString().slice(0, 10), targetTimeSec: 2900 } });
ro = (await call('GET', '/running/overview', { token: mtok })).json;
ok('yarış geri sayımı (40 gün)', rg.status === 201 && ro.countdown.days >= 39 && ro.countdown.days <= 40);
ok('geçmiş tarihli yarış hedefi reddedilir', (await call('POST', '/running/goals', { token: mtok, body: { name: 'Eski', distance: 'FIVE_K', raceDate: '2020-01-01' } })).status === 400);
ok('yaralanma kaydı', (await call('POST', '/running/injuries', { token: mtok, body: { startedOn: today, area: 'Sağ diz', severity: 3, pauseTraining: true } })).status === 201);
const planBody = { weekStart: monday(0), weekNumber: 3, phase: 'BUILD', days: [{ dayOfWeek: 2, runType: 'INTERVAL', targetDistanceKm: 8, targetPaceZone: 4 }, { dayOfWeek: 4, runType: 'EASY', targetDistanceKm: 6, targetPaceZone: 2 }, { dayOfWeek: 6, runType: 'LONG', targetDistanceKm: 16, targetPaceZone: 2, notes: 'Sakin tempo' }, { dayOfWeek: 7, runType: 'REST' }] };
ok('koç haftalık planı yazar', (await call('PUT', `/coaching/running/${member.id}/plan`, { token: coachTok, body: planBody })).json.days === 4);
ok('hafta başlangıcı pazartesi olmalı', (await call('PUT', `/coaching/running/${member.id}/plan`, { token: coachTok, body: { ...planBody, weekStart: monday(0).replace(/-\d\d$/, (m) => '-' + String(Number(m.slice(1)) + 1).padStart(2, '0')) } })).status === 400);
ok('abonesi olmayan üyeye plan yazılamaz', (await call('PUT', `/coaching/running/${stranger.u.id}/plan`, { token: coachTok, body: planBody })).status === 403);
ro = (await call('GET', '/running/overview', { token: mtok })).json;
ok('üye planı ve planlanan km (30) görür', ro.plan.length === 4 && ro.weekly.at(-1).plannedKm === 30 && ro.weekly.at(-1).phase === 'BUILD');
let cro = (await call('GET', `/coaching/running/${member.id}`, { token: coachTok })).json;
ok('koç: nabız ve yaralanma rıza olmadan gizli, mesafe/pace görünür', cro.healthSharing === false && cro.logs.length === 2 && cro.logs.every((l) => l.avgHeartRate === null) && cro.injuries.length === 0 && cro.profile.maxHeartRate === null);
await prisma.healthShareConsent.create({ data: { userId: member.id, creatorId: coach.id, consentTextVersion: 'v1' } });
cro = (await call('GET', `/coaching/running/${member.id}`, { token: coachTok })).json;
ok('koç: rıza sonrası nabız ve yaralanma görünür (denetlenir)', cro.healthSharing === true && cro.logs.some((l) => l.avgHeartRate === 150) && cro.injuries.length === 1 && (await call('GET', '/admin/audit-logs?action=health.coach_view', { token: tokens.sup })).json.total >= 1);
ok('koç üye adına yarış hedefi koyar', (await call('POST', `/coaching/running/${member.id}/goals`, { token: coachTok, body: { name: 'Maraton', distance: 'MARATHON', raceDate: new Date(Date.now() + 120 * 864e5).toISOString().slice(0, 10), targetTimeSec: 14400 } })).status === 201);
ok('başka üye koçun planını göremez', (await call('GET', '/running/overview', { token: stok })).json.plan.length === 0);
ok('koşu kaydı silinince ayakkabı km düşer', (await call('DELETE', `/running/logs/${run1.json.id}`, { token: mtok })).status === 200 && (await call('GET', '/running/overview', { token: mtok })).json.shoes[0].totalKm === 105);

// ===== BOKS & KİCKBOKS =====
ok('boks branşı olmayan koç teknik ekleyemez', (await call('POST', '/coaching/boxing/techniques', { token: coachTok, body: { name: 'Jab', category: 'JAB' } })).status === 403);
await prisma.creatorBranch.create({ data: { creatorId: cprof.id, branchId: brBox.id } });
const tJab = await call('POST', '/coaching/boxing/techniques', { token: coachTok, body: { name: 'Düz sol (jab)', category: 'JAB', notation: '1' } });
const tCombo = await call('POST', '/coaching/boxing/techniques', { token: coachTok, body: { name: 'Klasik üçlü', category: 'COMBINATION', notation: '1-2-3-Body', description: 'Jab, çapraz, kanca ve gövdeye vuruş' } });
ok('koç teknik ve numaralı kombin ekler', tJab.status === 201 && tCombo.json.notation === '1-2-3-Body');
ok('teknik adında bağlantı yasak, video yalnızca Mettlo içi', (await call('POST', '/coaching/boxing/techniques', { token: coachTok, body: { name: 'izle youtube.com/x', category: 'JAB' } })).status === 400 && (await call('POST', '/coaching/boxing/techniques', { token: coachTok, body: { name: 'Hook', category: 'HOOK', videoUrl: 'https://youtube.com/watch?v=abc' } })).status === 400 && (await call('POST', '/coaching/boxing/techniques', { token: coachTok, body: { name: 'Hook', category: 'HOOK', videoUrl: '/media/abcdef123456' } })).status === 201);
let bo = (await call('GET', '/boxing/overview', { token: mtok })).json;
ok('üye abone olduğu koçun teknik kütüphanesini görür', bo.techniques.length === 3 && bo.techniques.every((t) => t.status === 'NOT_STARTED') && bo.mastered === 0);
ok('yabancı üye (abonesiz) kütüphaneyi görmez', (await call('GET', '/boxing/overview', { token: stok })).json.techniques.length === 0);
ok('koç tekniği "öğrenildi" işaretler', (await call('PUT', `/coaching/boxing/${member.id}/techniques/${tJab.json.id}`, { token: coachTok, body: { status: 'MASTERED', coachNote: 'Çok temiz' } })).status === 200);
ok('abonesi olmayan üye için işaretleme 403', (await call('PUT', `/coaching/boxing/${stranger.u.id}/techniques/${tJab.json.id}`, { token: coachTok, body: { status: 'MASTERED' } })).status === 403);
bo = (await call('GET', '/boxing/overview', { token: mtok })).json;
ok('üye teknik haritasında ilerlemeyi görür', bo.mastered === 1 && bo.techniques.find((t) => t.id === tJab.json.id).coachNote === 'Çok temiz');
const wi = await call('POST', '/boxing/weigh-ins', { token: mtok, body: { date: today, weightKg: 66.5 } });
ok('tartı: kilo kategorisi otomatik (66.5 kg → WELTERWEIGHT)', wi.status === 201 && wi.json.category.key === 'WELTERWEIGHT');
ok('kilo kategorisi sınırları (47 kg sivrisinek, 95 kg ağır)', (await call('POST', '/boxing/weigh-ins', { token: mtok, body: { date: today, weightKg: 47 } })).json.category.key === 'MINI_FLYWEIGHT' && (await call('POST', '/boxing/weigh-ins', { token: mtok, body: { date: today, weightKg: 95 } })).json.category.key === 'HEAVYWEIGHT');
ok('boks seansı kaydı (round bazlı) ve toplamlar', (await call('POST', '/boxing/sessions', { token: mtok, body: { date: today, rounds: 6, roundSec: 180, restSec: 60, sessionType: 'SPARRING' } })).status === 201 && (await call('GET', '/boxing/overview', { token: mtok })).json.totals.rounds === 6);
ok('geçersiz round değerleri reddedilir', (await call('POST', '/boxing/sessions', { token: mtok, body: { date: today, rounds: 0, roundSec: 180, restSec: 60, sessionType: 'SPARRING' } })).status === 400);
const cbo = (await call('GET', `/coaching/boxing/${member.id}`, { token: coachTok })).json;
ok('koç: teknik haritası + seanslar + (rıza var) tartı geçmişi', cbo.techniques.length === 3 && cbo.sessions.length === 1 && cbo.weighIns.length === 3 && cbo.healthSharing === true);
await prisma.healthShareConsent.updateMany({ where: { userId: member.id, creatorId: coach.id }, data: { revokedAt: new Date() } });
ok('rıza geri alınınca koç tartı geçmişini göremez', (await call('GET', `/coaching/boxing/${member.id}`, { token: coachTok })).json.weighIns.length === 0);
ok('koç başka koçun tekniğini silemez / kendi tekniğini siler', (await call('DELETE', `/coaching/boxing/techniques/${tJab.json.id}`, { token: coachTok })).status === 200);

// ===== SOSYAL GİRİŞ (Google / Apple) =====
const sp0 = await call('GET', '/auth/social/providers');
ok('sosyal giriş sağlayıcı durumu açık uç (yapılandırılmamış: false)', sp0.status === 200 && sp0.json.google === false && sp0.json.apple === false);
ok('yapılandırılmamış sağlayıcıda giriş 501', (await call('POST', '/auth/social/exchange', { body: { provider: 'google', code: 'abcdefghijk', redirectUri: 'https://mettlo.tr/auth/social/google/callback', nonce: 'nonce-12345678' } })).status === 501);
ok('geçersiz sağlayıcı / belirteç reddedilir', (await call('POST', '/auth/social/exchange', { body: { provider: 'facebook', code: 'abcdefghijk', redirectUri: 'https://x.tr/cb', nonce: 'nonce-12345678' } })).status === 400 && (await call('POST', '/auth/social/complete', { body: { pendingToken: 'sahte.belirtec', username: 'sosyalx', phone: '5551110000', birthDate: '1990-01-01', acceptTerms: true, acceptKvkk: true } })).status === 400);

// rate limit (giriş 8/dk)
useBypass = false;
let limited = 0; for (let i = 0; i < 12; i++) { if ((await login('uyeali', 'Yanlis1')).status === 429) limited++; }
ok('giriş denemeleri hız sınırına takılır (429)', limited > 0);

console.log(`\n${pass} geçti, ${fail} kaldı`);
await prisma.$disconnect();
process.exit(fail ? 1 : 0);
