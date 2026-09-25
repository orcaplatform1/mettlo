# Mettlo

Creator-first, multi-branch movement & wellness platform. https://mettlo.tr

Mimari: `docs/architecture/mettlo-architecture-rev6.txt` — Tasarim: `docs/design/mettlo-design-system.txt`

## Yapi
- `apps/member-web` — herkese acik site + uye paneli (Next.js), port 3300
- `apps/creator-web` — koc paneli (Next.js), port 3302
- `apps/admin-web` — yonetim paneli (Next.js), port 3303
- `apps/member-mobile` — Flutter (Dart) mobil uygulama, iOS + Android. iOS derlemesi Linux VPS'te yapilamaz (macOS/Xcode veya bulut CI gerekir)
- `services/api` — NestJS API (`/api/v1`), port 3301
- `services/workers` — BullMQ worker'lari
- `packages/*` — paylasilan paketler
- `database/prisma/schema` — Prisma semasi (mimari bolum 56)

## URL kurali
Butun URL'ler Ingilizce ve kucuk harf; tum roller icin tek profil adresi: `/profile/ahmetyilmaz`, `/program/8-week-strength`, `/store`, `/pricing`.
Turkce karakterler slug'da ASCII'ye cevrilir (`packages/utils/slug`).

## Guvenlik
Sirlar sadece sunucudaki `.env` icinde; git'e girmez. Veri erisim kurali: kisisel bilgi ve mesaj icerigi yalnizca SUPER_ADMIN.

## Durum (2026-09-25)
Web (herkese açık site, üye/koç/yönetim panelleri) ve API çekirdeği hazır; testler: `tests/integration/api.test.mjs`.
Ayrıntılar: `docs/deployment/RUNBOOK.md`, `docs/api/ENDPOINTS.md`, `docs/architecture/DECISIONS.md`.
Henüz yok (harici anahtar/sözleşme gerektirir): iyzico ödeme, e-posta (SES), SMS/IYS, LiveKit/Zoom canlı, Bunny video, e-Fatura, push.
