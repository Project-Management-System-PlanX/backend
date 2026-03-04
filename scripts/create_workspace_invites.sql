-- ============================================
-- Create workspace_invites table
-- ============================================
-- This table is queried directly by the frontend
-- via the Supabase client, so it needs:
--   1. Database-level defaults (token, expires_at)
--   2. RLS policies for authenticated users

CREATE TABLE IF NOT EXISTS public.workspace_invites (
  id          text NOT NULL DEFAULT gen_random_uuid()::text,
  workspace_id text NOT NULL,
  token       text NOT NULL DEFAULT gen_random_uuid()::text,
  created_by  text NOT NULL,
  expires_at  timestamp without time zone NOT NULL DEFAULT (now() + interval '7 days'),
  max_uses    integer NOT NULL DEFAULT 0,
  use_count   integer NOT NULL DEFAULT 0,
  created_at  timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT workspace_invites_pkey PRIMARY KEY (id),
  CONSTRAINT workspace_invites_token_key UNIQUE (token),
  CONSTRAINT workspace_invites_workspace_id_fkey 
    FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE
);

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can read invites (needed for invite link page)
CREATE POLICY "Allow authenticated users to read invites"
  ON public.workspace_invites
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow anon users to read invites (for non-logged-in invite preview)
CREATE POLICY "Allow anon users to read invites"
  ON public.workspace_invites
  FOR SELECT
  TO anon
  USING (true);

-- Policy: Authenticated users can create invites
CREATE POLICY "Allow authenticated users to create invites"
  ON public.workspace_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Creator can update their own invites
CREATE POLICY "Allow creators to update their invites"
  ON public.workspace_invites
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid()::text);

-- ============================================
-- Optional: RPC function to increment use_count
-- (referenced in invite-service.ts)
-- ============================================
CREATE OR REPLACE FUNCTION public.increment_invite_use_count(invite_id text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.workspace_invites
  SET use_count = use_count + 1
  WHERE id = invite_id;
$$;
