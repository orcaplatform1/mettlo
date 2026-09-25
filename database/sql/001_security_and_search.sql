-- Mettlo: ek güvenlik + arama SQL'i (Prisma migration'ı dışında, idempotent)

-- 1) audit_logs: yalnızca eklenir (UPDATE/DELETE engellenir)
CREATE OR REPLACE FUNCTION mettlo_audit_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_logs_no_update ON audit_logs;
CREATE TRIGGER audit_logs_no_update BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION mettlo_audit_immutable();

-- 2) Arama: trigram indeksleri (Türkçe karakter toleranslı arama için unaccent + pg_trgm)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_creator_profiles_name_trgm ON creator_profiles USING gin (lower("displayName") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_programs_title_trgm ON programs USING gin (lower(title) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (lower(name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_challenges_title_trgm ON challenges USING gin (lower(title) gin_trgm_ops);

-- 3) Tam metin arama (Türkçe yapılandırma)
CREATE INDEX IF NOT EXISTS idx_programs_fts ON programs USING gin (to_tsvector('turkish', coalesce(title,'') || ' ' || coalesce(description,'')));
CREATE INDEX IF NOT EXISTS idx_products_fts ON products USING gin (to_tsvector('turkish', coalesce(name,'') || ' ' || coalesce(description,'')));
CREATE INDEX IF NOT EXISTS idx_creator_profiles_fts ON creator_profiles USING gin (to_tsvector('turkish', coalesce("displayName",'') || ' ' || coalesce(bio,'')));
