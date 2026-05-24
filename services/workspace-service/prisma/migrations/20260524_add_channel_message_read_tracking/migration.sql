-- Create channel_message_reads table for tracking read messages
CREATE TABLE channel_message_reads (
    id TEXT NOT NULL PRIMARY KEY,
    channel_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    read_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT channel_message_reads_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
    CONSTRAINT channel_message_reads_message_id_fkey FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Create unique constraint for channel_id and user_id
CREATE UNIQUE INDEX channel_message_reads_channel_id_user_id_key ON channel_message_reads(channel_id, user_id);

-- Create indexes for common queries
CREATE INDEX channel_message_reads_channel_id_idx ON channel_message_reads(channel_id);
CREATE INDEX channel_message_reads_user_id_idx ON channel_message_reads(user_id);
CREATE INDEX channel_message_reads_message_id_idx ON channel_message_reads(message_id);
