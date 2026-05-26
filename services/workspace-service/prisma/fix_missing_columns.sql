-- Add missing columns to tasks table
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "workType" TEXT NOT NULL DEFAULT 'TASK';
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3);
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "parentId" TEXT;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "teamId" TEXT;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "flagged" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "restrictTo" TEXT;

-- Add foreign keys for new columns (use DO block to avoid errors if they already exist)
DO $$ BEGIN
  ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "tasks" ADD CONSTRAINT "tasks_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create task_attachments table if not exists
CREATE TABLE IF NOT EXISTS "task_attachments" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "task_attachments_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create task_links table if not exists
CREATE TABLE IF NOT EXISTS "task_links" (
    "id" TEXT NOT NULL,
    "fromTaskId" TEXT NOT NULL,
    "toTaskId" TEXT NOT NULL,
    "linkType" TEXT NOT NULL DEFAULT 'BLOCKS',
    CONSTRAINT "task_links_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "task_links" ADD CONSTRAINT "task_links_fromTaskId_fkey" FOREIGN KEY ("fromTaskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "task_links" ADD CONSTRAINT "task_links_toTaskId_fkey" FOREIGN KEY ("toTaskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "task_links_fromTaskId_toTaskId_key" ON "task_links"("fromTaskId", "toTaskId");
