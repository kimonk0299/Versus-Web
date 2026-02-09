import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { participant_id, matchup_index, movie_id } = body;

    // Get lobby
    const { data: lobby, error: lobbyError } = await supabase
      .from('lobbies')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (lobbyError || !lobby) {
      return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
    }

    // Insert vote (will fail if duplicate due to UNIQUE constraint)
    const { data: vote, error: voteError } = await supabase
      .from('votes')
      .insert({
        lobby_id: lobby.id,
        participant_id,
        matchup_index,
        movie_id,
      })
      .select()
      .single();

    if (voteError) {
      if (voteError.code === '23505') { // Duplicate key
        return NextResponse.json({ error: 'Already voted for this matchup' }, { status: 400 });
      }
      return NextResponse.json({ error: voteError.message }, { status: 500 });
    }

    // Check if all participants have voted for this matchup
    const { count: participantCount } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .eq('lobby_id', lobby.id);

    const { count: voteCount } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('lobby_id', lobby.id)
      .eq('matchup_index', matchup_index);

    const allVoted = voteCount === participantCount;

    // If all voted, determine winner and advance
    if (allVoted) {
      // Count votes for each movie
      const { data: votes } = await supabase
        .from('votes')
        .select('movie_id')
        .eq('lobby_id', lobby.id)
        .eq('matchup_index', matchup_index);

      // Advance to next matchup
      await supabase
        .from('lobbies')
        .update({ current_matchup: matchup_index + 1 })
        .eq('id', lobby.id);
    }

    return NextResponse.json({ vote, allVoted });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
