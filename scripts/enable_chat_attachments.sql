-- Run this script in your Supabase SQL Editor to enable file attachments for messages

-- Add file metadata columns to the existing messages table
ALTER TABLE "messages" 
ADD COLUMN IF NOT EXISTS "file_url" TEXT,
ADD COLUMN IF NOT EXISTS "file_name" TEXT,
ADD COLUMN IF NOT EXISTS "file_type" TEXT,
ADD COLUMN IF NOT EXISTS "file_size" INTEGER;

-- Create the storage bucket for chat attachments if it doesn't already exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat_attachments', 'chat_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to the attachments so anyone in the app can view them
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'chat_attachments');

-- Allow authenticated users to upload their own attachments
DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload attachments" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'chat_attachments' 
    AND auth.role() = 'authenticated'
);
