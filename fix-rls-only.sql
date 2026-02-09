-- =====================================================
-- DISABLE RLS AND VERIFY REAL-TIME
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Disable RLS temporarily to test
ALTER TABLE lobbies DISABLE ROW LEVEL SECURITY;
ALTER TABLE participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE votes DISABLE ROW LEVEL SECURITY;

-- Step 2: Verify tables are in real-time publication (should see all 3)
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- Step 3: Check if RLS is now disabled (should see 'f' for false)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('lobbies', 'participants', 'votes');
