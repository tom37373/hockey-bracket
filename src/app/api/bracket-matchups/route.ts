import { NextResponse } from 'next/server';
import { getBracketMatchups, getBracketMatchupsByRound, getBracketMatchupById, writeJsonData } from '@/utils/data';
import { BracketMatchup } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const round = searchParams.get('round');
    const matchupId = searchParams.get('id');
    
    if (matchupId) {
      const matchup = getBracketMatchupById(parseInt(matchupId));
      if (!matchup) {
        return NextResponse.json(
          { error: 'Matchup not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(matchup);
    }
    
    if (round) {
      const matchups = getBracketMatchupsByRound(parseInt(round));
      return NextResponse.json(matchups);
    }
    
    const matchups = getBracketMatchups();
    return NextResponse.json(matchups);
  } catch (error) {
    console.error('Error fetching bracket matchups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bracket matchups' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const matchups = await request.json() as BracketMatchup[];
    
    if (!Array.isArray(matchups)) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected an array of matchups.' },
        { status: 400 }
      );
    }
    
    // Update the bracket matchups in the data file
    writeJsonData('bracket-matchups.json', matchups);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating bracket matchups:', error);
    return NextResponse.json(
      { error: 'Failed to update bracket matchups' },
      { status: 500 }
    );
  }
}
