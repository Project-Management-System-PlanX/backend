-- Add deleted_at column to messages table
ALTER TABLE messages ADD COLUMN deleted_at TIMESTAMP(3);

-- Add work_type column to tasks table
ALTER TABLE tasks ADD COLUMN work_type TEXT;

-- Create task_attachments table
CREATE TABLE task_attachments (
    id TEXT NOT NULL PRIMARY KEY,
    task_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT task_attachments_task_id_fkey FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Create index for foreign key
CREATE INDEX task_attachments_task_id_idx ON task_attachments(task_id);
