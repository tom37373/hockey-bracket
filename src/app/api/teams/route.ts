import { NextResponse } from 'next/server';
import { getTeams } from '@/utils/data';

export async function GET() {
  try {
    const teams = getTeams();
    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}
