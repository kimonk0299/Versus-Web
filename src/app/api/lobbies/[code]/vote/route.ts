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
        .select('movie_id, participant_id')
        .eq('lobby_id', lobby.id)
        .eq('matchup_index', matchup_index);

      // Get host for tiebreaker
      const { data: host } = await supabase
        .from('participants')
        .select('id')
        .eq('lobby_id', lobby.id)
        .eq('is_host', true)
        .single();

      let winnerMovieId: number | null = null;

      if (votes && votes.length > 0) {
        // Count votes
        const voteCounts: Record<number, number> = {};
        votes.forEach(v => {
          voteCounts[v.movie_id] = (voteCounts[v.movie_id] || 0) + 1;
        });

        // Get the two movies with most votes
        const sortedMovies = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
        winnerMovieId = parseInt(sortedMovies[0][0]);

        // Check for tie
        if (sortedMovies.length >= 2 && sortedMovies[0][1] === sortedMovies[1][1]) {
          // Tie! Use host's vote as tiebreaker
          if (host) {
            const hostVote = votes.find(v => v.participant_id === host.id);
            if (hostVote) {
              winnerMovieId = hostVote.movie_id;
              console.log('Tie detected, using host vote as tiebreaker:', winnerMovieId);
            }
          }
        }

        console.log('Matchup', matchup_index, 'winner:', winnerMovieId);
      }

      // Check if this is single actor knockout mode
      const isSingleActorMode = lobby.actor1_id === lobby.actor2_id;
      const roundMatchups = lobby.round_matchups as number[][] || [];

      if (isSingleActorMode && roundMatchups.length > 0 && winnerMovieId !== null) {
        // Knockout tournament logic
        const currentMatchupInRound = lobby.current_matchup;
        const totalMatchupsInRound = roundMatchups.length;

        console.log('Matchup', currentMatchupInRound, 'of', totalMatchupsInRound, 'complete. Winner:', winnerMovieId);

        if (currentMatchupInRound < totalMatchupsInRound) {
          // More matchups in this round
          await supabase
            .from('lobbies')
            .update({ current_matchup: currentMatchupInRound + 1 })
            .eq('id', lobby.id);
        } else {
          // Round complete! Collect all winners and create next round
          console.log('🏆 Round', lobby.current_round, 'complete!');
          console.log('Current matchup:', currentMatchupInRound, 'Total matchups in round:', totalMatchupsInRound);

          // Calculate the matchup_index range for this round
          const startIndex = currentMatchupInRound - totalMatchupsInRound;
          const endIndex = currentMatchupInRound - 1;
          console.log('Querying votes from matchup_index', startIndex, 'to', endIndex);

          // Get all votes for this round to determine all winners
          const { data: allRoundVotes } = await supabase
            .from('votes')
            .select('matchup_index, movie_id, participant_id')
            .eq('lobby_id', lobby.id)
            .gte('matchup_index', startIndex)
            .lte('matchup_index', endIndex);

          console.log('Found', allRoundVotes?.length, 'votes for this round');

          // Determine winner for each matchup in the round
          const winners: number[] = [];
          for (let i = 0; i < totalMatchupsInRound; i++) {
            const matchupIndex = startIndex + i;
            const matchupVotes = allRoundVotes?.filter(v => v.matchup_index === matchupIndex) || [];

            console.log('Matchup', matchupIndex, 'has', matchupVotes.length, 'votes');

            if (matchupVotes.length === 0) {
              console.error('No votes found for matchup', matchupIndex);
              continue;
            }

            const voteCounts: Record<number, number> = {};
            matchupVotes.forEach(v => {
              voteCounts[v.movie_id] = (voteCounts[v.movie_id] || 0) + 1;
            });

            const sortedMovies = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
            let matchupWinner = parseInt(sortedMovies[0][0]);

            // Tie-breaker
            if (sortedMovies.length >= 2 && sortedMovies[0][1] === sortedMovies[1][1] && host) {
              const hostVote = matchupVotes.find(v => v.participant_id === host.id);
              if (hostVote) matchupWinner = hostVote.movie_id;
            }

            console.log('Matchup', matchupIndex, 'winner:', matchupWinner);
            winners.push(matchupWinner);
          }

          console.log('Total winners collected:', winners.length);
          console.log('Winners advancing to next round:', winners);

          if (winners.length === 1) {
            // CHAMPION! Game over
            console.log('🎉 CHAMPION:', winners[0]);
            await supabase
              .from('lobbies')
              .update({
                is_active: false,
                champion_movie_id: winners[0]
              })
              .eq('id', lobby.id);
          } else {
            // Create next round matchups
            const nextRoundMatchups: number[][] = [];
            for (let i = 0; i < winners.length; i += 2) {
              if (i + 1 < winners.length) {
                nextRoundMatchups.push([winners[i], winners[i + 1]]);
              }
            }

            console.log('Creating Round', lobby.current_round + 1, 'with', nextRoundMatchups.length, 'matchups');

            // current_matchup is a GLOBAL counter - continue from where we left off
            // Round 1 ended at matchup 4 -> Round 2 starts at matchup 5
            const nextMatchupIndex = currentMatchupInRound + 1;

            await supabase
              .from('lobbies')
              .update({
                current_round: lobby.current_round + 1,
                current_matchup: nextMatchupIndex,  // Continue global counter
                round_start_matchup: nextMatchupIndex,  // Track where this round starts
                round_matchups: nextRoundMatchups,
              })
              .eq('id', lobby.id);
          }
        }
      } else {
        // Versus mode or fallback - just advance matchup
        const nextMatchup = lobby.current_matchup + 1;
        console.log('All players voted! Advancing from matchup', lobby.current_matchup, 'to', nextMatchup);

        await supabase
          .from('lobbies')
          .update({ current_matchup: nextMatchup })
          .eq('id', lobby.id);
      }
    }

    return NextResponse.json({ vote, allVoted });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
