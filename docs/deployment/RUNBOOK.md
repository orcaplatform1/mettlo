# Mettlo — Çalıştırma Kılavuzu (VPS)

## Mimari (bu sunucu)
- **nginx** (`/etc/nginx/sites-available/mettlo.tr`): `/` → member-web :3300, `/api/` → API :3301, `/creator` → :3302, `/admin` → :3303.
- **PM2** `mettlo` kullanıcısı altında (root'un PM2'sinden ayrı): `mettlo-api`, `mettlo-member-web`, `mettlo-creator-web`, `mettlo-admin-web`. Açılışta `pm2-mettlo` systemd servisi geri yükler.
- **PostgreSQL 16** (`mettlo` veritabanı, `mettlo_user`), **Redis** (db 5) — ikisi de yalnızca 127.0.0.1.
- Aynı sunucuda başka siteler var (kriptobeyan, traders.tr, zesta.tr): onların nginx/PM2/DB'lerine dokunulmaz. **`pkill -f` kullanmayın.**

## Dağıtım
```
/root/mettlo-deploy.sh                 # hepsi (api member creator admin)
/root/mettlo-deploy.sh api member      # yalnızca seçilenler
```
Betik: sahipliği `mettlo` yapar → derler → ilgili PM2 sürecini yeniden başlatır.

## Veritabanı
- Şema: `database/prisma/schema/*.prisma`; migration'lar `database/prisma/schema/migrations/`.
- Uygulama: `cd packages/database && pnpm exec dotenv -e ../../.env -- prisma migrate deploy --schema ../../database/prisma/schema`
- Enum değişimi gibi "uyarılı" migration'lar için: `prisma migrate diff ... --script` ile SQL üretip klasör oluşturun, sonra `migrate deploy`.
- Ek SQL (audit_logs değiştirilemez; mesajlar kullanıcıca silinemez, yalnızca hesap silme işi siler, arama indeksleri): `database/sql/*.sql` (sırayla uygulanır).
- Yedek: her gün 03:30 `/usr/local/bin/mettlo-backup.sh` → `/var/backups/mettlo/*.dump` (14 gün). Geri yükleme: `sudo -u postgres pg_restore -d <db> < dosya.dump`.
- **`.env` içindeki `FIELD_ENCRYPTION_KEY` yedeklenmelidir**: kaybolursa şifreli telefon/adres verileri çözülemez.

## Testler
`/tmp/.../run-api-test.sh` benzeri: ayrı `mettlo_test` veritabanı + 3391 portunda API açar, `tests/integration/api.test.mjs` (330+ kontrol) çalıştırır. Canlı veriye dokunmaz.

## SSL
DNS yayılınca: `certbot --nginx -d mettlo.tr -d www.mettlo.tr --redirect` (çerezler `X-Forwarded-Proto` ile otomatik `Secure` olur). Sonra nginx 443 bloğuna HSTS eklenir.

## Ortam değişkenleri
`.env` (git dışı, chmod 600). Örnek: `.env.example`. Ödeme/e-posta/canlı anahtarları (iyzico, SES, LiveKit, Bunny) sonradan doldurulur.

## Sırlar ve erişim
- Süper admin: kullanıcı adı `mettlo_admin` (ilk şifre `/root/mettlo-superadmin.txt`; ilk girişte 2FA kurulumu zorunlu; sonra dosyayı silin).
- Kişisel veri (telefon, adres) AES-256-GCM ile şifreli; e-posta/telefon/doğum tarihi/kişisel bilgiler ve Koç Mesaj Kutusu **yalnızca SUPER_ADMIN**; her erişim `audit_logs`'a (silinemez) yazılır.
