import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { actor1_id, actor2_id, actor1_name, actor2_name, movie_count, host_name } = body;

    // Clean up old lobbies (older than 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from('lobbies')
      .delete()
      .lt('created_at', oneDayAgo);

    // Generate unique 3-letter code
    let code: string;
    let attempts = 0;
    do {
      code = generateCode();
      attempts++;
      if (attempts > 10) {
        return NextResponse.json({ error: 'Failed to generate unique code' }, { status: 500 });
      }

      // Check if code exists
      const { data: existing } = await supabase
        .from('lobbies')
        .select('code')
        .eq('code', code)
        .single();

      if (!existing) break;
    } while (true);

    // Create lobby
    const { data: lobby, error: lobbyError } = await supabase
      .from('lobbies')
      .insert({
        code,
        actor1_id,
        actor2_id,
        actor1_name,
        actor2_name,
        movie_count,
        current_matchup: 0,
        is_active: true,
      })
      .select()
      .single();

    if (lobbyError) {
      console.error('Lobby creation error:', lobbyError);
      return NextResponse.json({ error: lobbyError.message }, { status: 500 });
    }

    // Add host as participant
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .insert({
        lobby_id: lobby.id,
        name: host_name,
        is_host: true,
      })
      .select()
      .single();

    if (participantError) {
      console.error('Participant creation error:', participantError);
      return NextResponse.json({ error: participantError.message }, { status: 500 });
    }

    return NextResponse.json({ lobby, participant });
  } catch (error) {
    console.error('Create lobby error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 3; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
