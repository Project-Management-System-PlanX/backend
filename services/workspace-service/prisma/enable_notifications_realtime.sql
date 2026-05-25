-- Create notifications table if it doesn't already exist (using snake_case columns)
CREATE TABLE IF NOT EXISTS "notifications" (
    "id"          TEXT         NOT NULL,
    "user_id"     TEXT         NOT NULL,
    "type"        TEXT         NOT NULL,
    "title"       TEXT         NOT NULL,
    "body"        TEXT,
    "entity_id"   TEXT,
    "entity_type" TEXT,
    "is_read"     BOOLEAN      NOT NULL DEFAULT false,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx"         ON "notifications"("user_id");
CREATE INDEX IF NOT EXISTS "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- Enable Supabase Realtime for the notifications table
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
