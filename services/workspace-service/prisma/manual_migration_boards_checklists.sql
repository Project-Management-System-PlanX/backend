-- Migration: Add boards, checklists, and activity logs
-- Run after `prisma generate` succeeds

-- Boards
CREATE TABLE IF NOT EXISTS "boards" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "spaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Board',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "boards_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "boards_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Board Columns
CREATE TABLE IF NOT EXISTS "board_columns" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "boardId" TEXT NOT NULL,
    "statusId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "board_columns_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "board_columns_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "board_columns_boardId_statusId_key" UNIQUE ("boardId", "statusId")
);

-- Checklists
CREATE TABLE IF NOT EXISTS "checklists" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Checklist',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "checklists_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "checklists_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Checklist Items
CREATE TABLE IF NOT EXISTS "checklist_items" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "checklistId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "assigneeId" TEXT,
    "dueDate" TIMESTAMP(3),
    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "checklist_items_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Activity Logs
CREATE TABLE IF NOT EXISTS "activity_logs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "activity_logs_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "activity_logs_taskId_idx" ON "activity_logs"("taskId");
CREATE INDEX IF NOT EXISTS "activity_logs_userId_idx" ON "activity_logs"("userId");

-- Enable Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE task_statuses;
ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE task_labels;
ALTER PUBLICATION supabase_realtime ADD TABLE task_attachments;
ALTER PUBLICATION supabase_realtime ADD TABLE checklists;
ALTER PUBLICATION supabase_realtime ADD TABLE checklist_items;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE boards;
ALTER PUBLICATION supabase_realtime ADD TABLE board_columns;
