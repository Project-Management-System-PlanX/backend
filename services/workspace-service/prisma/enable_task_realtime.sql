-- Enable Supabase Realtime on task-related tables
-- Run this in Supabase SQL Editor after migration

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
