import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name } = body;

    // Find lobby by code
    const { data: lobby, error: lobbyError } = await supabase
      .from('lobbies')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (lobbyError || !lobby) {
      return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
    }

    // Check if game already started (current_matchup > 0)
    if (lobby.current_matchup > 0) {
      return NextResponse.json({ error: 'Game already in progress' }, { status: 400 });
    }

    // Add participant
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .insert({
        lobby_id: lobby.id,
        name,
        is_host: false,
      })
      .select()
      .single();

    if (participantError) {
      console.error('Join lobby error:', participantError);
      return NextResponse.json({ error: participantError.message }, { status: 500 });
    }

    return NextResponse.json({ lobby, participant });
  } catch (error) {
    console.error('Join lobby error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
