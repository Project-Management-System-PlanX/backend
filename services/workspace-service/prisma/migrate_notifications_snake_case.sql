-- ============================================================
-- Migrate notifications columns from camelCase → snake_case
-- Required because Supabase Realtime filters only work with
-- unquoted (lowercase / snake_case) column names.
-- ============================================================

-- Step 1: Rename columns (safe — IF NOT EXISTS guard via DO block)
DO $$
BEGIN
    -- userId → user_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'userId'
    ) THEN
        ALTER TABLE "notifications" RENAME COLUMN "userId" TO "user_id";
    END IF;

    -- entityId → entity_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'entityId'
    ) THEN
        ALTER TABLE "notifications" RENAME COLUMN "entityId" TO "entity_id";
    END IF;

    -- entityType → entity_type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'entityType'
    ) THEN
        ALTER TABLE "notifications" RENAME COLUMN "entityType" TO "entity_type";
    END IF;

    -- isRead → is_read
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'isRead'
    ) THEN
        ALTER TABLE "notifications" RENAME COLUMN "isRead" TO "is_read";
    END IF;

    -- createdAt → created_at
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE "notifications" RENAME COLUMN "createdAt" TO "created_at";
    END IF;
END $$;

-- Step 2: Recreate indexes with new column names
DROP INDEX IF EXISTS "notifications_userId_idx";
DROP INDEX IF EXISTS "notifications_userId_isRead_idx";

CREATE INDEX IF NOT EXISTS "notifications_user_id_idx"         ON "notifications"("user_id");
CREATE INDEX IF NOT EXISTS "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- Step 3: Re-enable Supabase Realtime (idempotent — errors silently if already added)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
