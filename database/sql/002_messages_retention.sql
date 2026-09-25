-- Mettlo: koç–abone mesajları kullanıcılar tarafından silinemez/değiştirilemez. YALNIZCA hesap silme işi (30 gün sonra)
-- işlem içinde 'mettlo.purge_messages' bayrağını açarak o hesabın konuşmalarını siler.
CREATE OR REPLACE FUNCTION mettlo_messages_immutable() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF current_setting('mettlo.purge_messages', true) = 'on' THEN RETURN OLD; END IF;
    RAISE EXCEPTION 'messages/conversations are retained permanently and cannot be deleted';
  END IF;
  IF TG_TABLE_NAME = 'messages' AND TG_OP = 'UPDATE' THEN
    IF NEW.body IS DISTINCT FROM OLD.body OR NEW."senderId" <> OLD."senderId"
       OR NEW."conversationId" <> OLD."conversationId" OR NEW."createdAt" <> OLD."createdAt"
       OR NEW."mediaIds" IS DISTINCT FROM OLD."mediaIds" THEN
      RAISE EXCEPTION 'message content is immutable';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS messages_retention ON messages;
CREATE TRIGGER messages_retention BEFORE UPDATE OR DELETE ON messages FOR EACH ROW EXECUTE FUNCTION mettlo_messages_immutable();
DROP TRIGGER IF EXISTS conversations_retention ON conversations;
CREATE TRIGGER conversations_retention BEFORE DELETE ON conversations FOR EACH ROW EXECUTE FUNCTION mettlo_messages_immutable();
