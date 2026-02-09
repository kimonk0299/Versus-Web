import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { shuffleArray } from '@/lib/bracket/algorithm';
import { MAX_CAST_ORDER } from '@/lib/constants';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Get lobby
    const { data: lobby, error: lobbyError } = await supabase
      .from('lobbies')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (lobbyError || !lobby) {
      return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
    }

    // Check if single actor mode
    const isSingleActorMode = lobby.actor1_id === lobby.actor2_id;

    if (isSingleActorMode) {
      // Fetch movies directly from TMDb
      const tmdbApiKey = process.env.TMDB_API_KEY;
      const tmdbResponse = await fetch(
        `https://api.themoviedb.org/3/person/${lobby.actor1_id}/movie_credits?api_key=${tmdbApiKey}`
      );

      if (!tmdbResponse.ok) {
        throw new Error('Failed to fetch movies from TMDb');
      }

      const creditsData = await tmdbResponse.json();

      // Process movies (same logic as getTopMovies)
      const movies = creditsData.cast
        .filter((item: any) => item.title != null)
        .filter((item: any) => item.order < MAX_CAST_ORDER)
        .map((castItem: any) => {
          const releaseYear = castItem.release_date
            ? parseInt(castItem.release_date.substring(0, 4), 10)
            : 0;

          return {
            id: castItem.id,
            title: castItem.title,
            posterPath: castItem.poster_path,
            backdropPath: castItem.backdrop_path,
            releaseDate: castItem.release_date,
            releaseYear,
            voteAverage: castItem.vote_average,
            voteCount: castItem.vote_count,
            overview: castItem.overview,
            popularity: castItem.vote_count * castItem.vote_average,
            character: castItem.character,
          };
        });

      // Deduplicate by movie ID
      const uniqueMovies = movies.reduce((acc: any[], movie: any) => {
        if (!acc.find(m => m.id === movie.id)) {
          acc.push(movie);
        }
        return acc;
      }, []);

      // Sort by popularity and take top N
      uniqueMovies.sort((a: any, b: any) => b.popularity - a.popularity);
      const topMovies = uniqueMovies.slice(0, lobby.movie_count);

      const shuffled = shuffleArray(topMovies, lobby.id) as any[];

      // Create Round 1 matchups (pair adjacent movies)
      const round1Matchups: number[][] = [];
      for (let i = 0; i < shuffled.length; i += 2) {
        if (i + 1 < shuffled.length) {
          round1Matchups.push([shuffled[i].id, shuffled[i + 1].id]);
        }
      }

      // Store movies and matchups
      const moviesJson = shuffled.map(m => ({
        id: m.id,
        title: m.title,
        posterPath: m.posterPath,
        releaseYear: m.releaseYear,
      }));

      await supabase
        .from('lobbies')
        .update({
          current_matchup: 1,
          current_round: 1,
          round_start_matchup: 1,  // Round 1 starts at global matchup 1
          round_matchups: round1Matchups,
          all_movies: moviesJson,
        })
        .eq('id', lobby.id);

      console.log('Game started with', round1Matchups.length, 'matchups in Round 1');
    } else {
      // Versus mode - just start normally
      await supabase
        .from('lobbies')
        .update({ current_matchup: 1 })
        .eq('id', lobby.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Start game error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
