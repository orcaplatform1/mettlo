-- Branş birleştirme / yeniden adlandırma (2026-09-25). Tekrar çalıştırılabilir (idempotent).
--  outdoor       -> running ("Koşu & Outdoor")
--  mind-wellness -> meditation ("Meditasyon")
--  functional    -> hiit-cardio ("HIIT & Kardiyo")
DO $$
DECLARE run_id text; out_id text;
BEGIN
  SELECT id INTO run_id FROM branches WHERE slug = 'running';
  SELECT id INTO out_id FROM branches WHERE slug = 'outdoor';
  IF run_id IS NOT NULL AND out_id IS NOT NULL THEN
    -- Koç branşları: outdoor'daki koçlar koşuya taşınır (zaten koşuda olanlarda çift kayıt oluşmaz)
    DELETE FROM creator_branches cb WHERE cb."branchId" = out_id AND EXISTS (SELECT 1 FROM creator_branches x WHERE x."creatorId" = cb."creatorId" AND x."branchId" = run_id);
    UPDATE creator_branches SET "branchId" = run_id WHERE "branchId" = out_id;
    DELETE FROM branch_metric_sets m WHERE m."branchId" = out_id AND EXISTS (SELECT 1 FROM branch_metric_sets x WHERE x.metric = m.metric AND x."branchId" = run_id);
    UPDATE branch_metric_sets SET "branchId" = run_id WHERE "branchId" = out_id;
    UPDATE content_categories SET "branchId" = run_id WHERE "branchId" = out_id;
    UPDATE branch_sub_categories SET "branchId" = run_id WHERE "branchId" = out_id;
    UPDATE creator_verifications SET "branchId" = run_id WHERE "branchId" = out_id;
    UPDATE contents SET "branchId" = run_id WHERE "branchId" = out_id;
    UPDATE workouts SET "branchId" = run_id WHERE "branchId" = out_id;
    UPDATE exercises SET "branchId" = run_id WHERE "branchId" = out_id;
    UPDATE programs SET "branchId" = run_id WHERE "branchId" = out_id;
    UPDATE class_sessions SET "branchId" = run_id WHERE "branchId" = out_id;
    DELETE FROM branches WHERE id = out_id;
  END IF;
END $$;

UPDATE branches SET name = 'Koşu & Outdoor', description = 'Dayanıklılık', "sortOrder" = 7, equipment = '{koşu ayakkabısı,trekking ayakkabısı,sırt çantası}', "updatedAt" = now() WHERE slug = 'running';
UPDATE branches SET slug = 'meditation', name = 'Meditasyon', description = 'Rehatla', "updatedAt" = now() WHERE slug = 'mind-wellness';
UPDATE branches SET slug = 'hiit-cardio', name = 'HIIT & Kardiyo', description = 'Performans', "updatedAt" = now() WHERE slug = 'functional';
UPDATE branches SET "sortOrder" = 8 WHERE slug = 'boxing-kickboxing';
UPDATE branches SET "sortOrder" = 9 WHERE slug = 'dance';
