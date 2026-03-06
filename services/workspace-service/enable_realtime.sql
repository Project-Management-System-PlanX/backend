begin;
  -- remove the supabase_realtime publication
  drop publication if exists supabase_realtime;

  -- re-create the publication
  create publication supabase_realtime;
commit;

-- add table to publication
alter publication supabase_realtime add table messages;
