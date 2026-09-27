-- İşletme profili ek alanlar: telefon (herkese açık), çalışma saatleri, fitness branşları
ALTER TABLE "business_accounts"
  ADD COLUMN IF NOT EXISTS "phonePublic"      VARCHAR(30),
  ADD COLUMN IF NOT EXISTS "businessHours"    JSONB,
  ADD COLUMN IF NOT EXISTS "fitnessBranches"  TEXT[] NOT NULL DEFAULT '{}';

-- İşletme fotoğraf galerisi
CREATE TABLE IF NOT EXISTS "business_photos" (
  "id"         TEXT PRIMARY KEY,
  "businessId" TEXT NOT NULL REFERENCES "business_accounts"("id") ON DELETE CASCADE,
  "url"        TEXT NOT NULL,
  "caption"    VARCHAR(200),
  "sortOrder"  INTEGER NOT NULL DEFAULT 0,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "business_photos_businessId_sortOrder_idx" ON "business_photos"("businessId", "sortOrder");

-- İşletme kampanyaları
CREATE TABLE IF NOT EXISTS "business_campaigns" (
  "id"          TEXT PRIMARY KEY,
  "businessId"  TEXT NOT NULL REFERENCES "business_accounts"("id") ON DELETE CASCADE,
  "title"       VARCHAR(120) NOT NULL,
  "description" TEXT,
  "imageUrl"    TEXT,
  "startsAt"    TIMESTAMP(3) NOT NULL,
  "endsAt"      TIMESTAMP(3),
  "isActive"    BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "business_campaigns_businessId_isActive_endsAt_idx" ON "business_campaigns"("businessId", "isActive", "endsAt");
