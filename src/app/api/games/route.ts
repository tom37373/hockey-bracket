import { NextResponse } from 'next/server';
import { getGames, getLiveGames, getUpcomingGames, getCompletedGames, getGameById } from '@/utils/data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const gameId = searchParams.get('id');
    
    let games;
    
    if (gameId) {
      const game = getGameById(parseInt(gameId));
      if (!game) {
        return NextResponse.json(
          { error: 'Game not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(game);
    }
    
    if (status === 'live') {
      games = getLiveGames();
    } else if (status === 'upcoming') {
      games = getUpcomingGames();
    } else if (status === 'completed' || status === 'final') {
      games = getCompletedGames();
    } else {
      games = getGames();
    }
    
    return NextResponse.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}
