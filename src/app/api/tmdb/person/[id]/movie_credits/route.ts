import { NextRequest, NextResponse } from 'next/server';
import { TMDB_BASE_URL } from '@/lib/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'TMDb API key not configured' },
      { status: 500 }
    );
  }

  try {
    const url = `${TMDB_BASE_URL}/person/${id}/movie_credits?api_key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TMDb API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching movie credits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movie credits' },
      { status: 500 }
    );
  }
}
