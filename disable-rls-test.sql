-- =====================================================
-- TEMPORARILY DISABLE RLS FOR TESTING
-- Run this in Supabase SQL Editor
-- =====================================================

-- Disable RLS on all tables temporarily
ALTER TABLE lobbies DISABLE ROW LEVEL SECURITY;
ALTER TABLE participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE votes DISABLE ROW LEVEL SECURITY;

-- Check which tables are in supabase_realtime publication
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- If the above query returns empty, add tables to publication:
ALTER PUBLICATION supabase_realtime ADD TABLE lobbies;
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;

-- Verify again
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
