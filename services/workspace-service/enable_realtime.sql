begin;
  -- remove the supabase_realtime publication
  drop publication if exists supabase_realtime;

  -- re-create the publication
  create publication supabase_realtime;
commit;

-- add tables to publication
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table email_invitations;
