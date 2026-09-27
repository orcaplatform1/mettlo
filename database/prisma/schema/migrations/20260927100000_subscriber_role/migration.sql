-- SUBSCRIBER rolü ekleniyor: ücretsiz üye (MEMBER) ile koç (CREATOR) arasında yeni katman.
-- Abonelik başarılı olunca MEMBER → SUBSCRIBER, abonelik bitince SUBSCRIBER → MEMBER.
-- NOT: PostgreSQL'de enum değeri ekleme ve kullanma ayrı commit'lerde olmalı.
-- Bu dosya yalnızca enum değerini ekler; backfill ayrı migration'da.

ALTER TYPE "UserRole" ADD VALUE 'SUBSCRIBER' AFTER 'MEMBER';
