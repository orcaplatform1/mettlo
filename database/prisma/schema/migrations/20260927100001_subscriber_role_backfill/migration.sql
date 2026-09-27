-- Mevcut aktif aboneleri SUBSCRIBER rolüne yükselt (tek seferlik backfill).
-- Önceki migration enum'u ekledi; bu migration onu kullanabilir.

UPDATE "users"
SET "role" = 'SUBSCRIBER'
WHERE "role" = 'MEMBER'
  AND "id" IN (
    SELECT DISTINCT "userId"
    FROM "entitlements"
    WHERE "status" IN ('ACTIVE', 'GRACE')
      AND ("endsAt" IS NULL OR "endsAt" > NOW())
      AND "creatorId" IS NOT NULL
  );
