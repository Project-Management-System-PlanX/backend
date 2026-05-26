-- Enable Supabase Realtime for tables used for live task updates.
-- Run this once in the Supabase SQL Editor.

DO $$
BEGIN
    -- Enable realtime for tasks table
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    -- Enable realtime for task_comments table
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    -- Enable realtime for task_members table
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE task_members;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    -- Enable realtime for notifications table (snake_case columns)
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;
