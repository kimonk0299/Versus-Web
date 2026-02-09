# Multiplayer Setup Instructions

## 1. Create Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project
4. Wait for project to be provisioned (~2 minutes)

## 2. Set Up Database

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase-schema.sql`
4. Paste into the SQL editor
5. Click **Run** to execute the schema

## 3. Get API Credentials

1. In Supabase dashboard, go to **Project Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

## 4. Configure Environment Variables

1. Open `.env.local` in your project root
2. Add these lines:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Existing TMDb key
TMDB_API_KEY=your-tmdb-key
```

3. **IMPORTANT:** Replace the placeholder values with your actual Supabase credentials
4. Restart your dev server: Stop (Ctrl+C) and run `npm run dev` again

## 5. Test Multiplayer

1. On home page, select two actors (e.g., "Tom Cruise VS Brad Pitt")
2. Click **MULTIPLAYER MODE**
3. Click **CREATE LOBBY**
4. Enter your name and create lobby
5. You'll get a 3-letter code (e.g., "ABC")
6. Open the app in another browser/tab
7. Click **MULTIPLAYER MODE** → **JOIN LOBBY**
8. Enter the code and a different name
9. Both players should see each other in the waiting room!

## How It Works

**Create Lobby Flow:**
1. Host selects actors and movie count
2. Clicks "Create Lobby" → Gets 3-letter code
3. Waits in lobby room for players to join

**Join Lobby Flow:**
1. Players enter the 3-letter code
2. Enter their name
3. Join the lobby waiting room

**Voting:**
1. Host starts the game when ready
2. All players see the same matchup
3. Everyone votes independently
4. When all votes are in → Auto-advance to next matchup
5. Shows vote count: "Waiting for 2/5 players..."
6. Final results show which actor won overall

## Troubleshooting

**"Lobby not found"** → Check the code is correct (case-insensitive)

**"Game already in progress"** → Can't join after voting starts

**Database errors** → Make sure you ran the SQL schema in Supabase

**Environment variables not working** → Restart dev server after editing `.env.local`

**Real-time not working** → Check Supabase RLS policies are set correctly

## Next Steps

After basic testing works, you can:
- Add lobby chat
- Show individual vote results after each round
- Add rematch feature
- Add spectator mode
- Customize lobby settings (time limits, etc.)
