import { NextResponse } from 'next/server';
import { 
  getConfidenceRatings, 
  getConfidenceRatingsByTeam, 
  getConfidenceRatingsByFamilyMember,
  updateConfidenceRating,
  removeConfidenceRatingsByFamilyMember
} from '@/utils/data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const familyMemberId = searchParams.get('familyMemberId');
    
    let ratings;
    
    if (teamId) {
      ratings = getConfidenceRatingsByTeam(parseInt(teamId));
    } else if (familyMemberId) {
      ratings = getConfidenceRatingsByFamilyMember(familyMemberId);
    } else {
      ratings = getConfidenceRatings();
    }
    
    return NextResponse.json(ratings);
  } catch (error) {
    console.error('Error fetching confidence ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch confidence ratings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { familyMemberId, teamId, rating } = body;
    
    // Validate inputs
    if (!familyMemberId || typeof familyMemberId !== 'string') {
      return NextResponse.json(
        { error: 'Family member ID is required and must be a string' },
        { status: 400 }
      );
    }
    
    if (!teamId || typeof teamId !== 'number') {
      return NextResponse.json(
        { error: 'Team ID is required and must be a number' },
        { status: 400 }
      );
    }
    
    if (typeof rating !== 'number' || rating < 1 || rating > 10) {
      return NextResponse.json(
        { error: 'Rating is required and must be a number between 1 and 10' },
        { status: 400 }
      );
    }
    
    updateConfidenceRating(familyMemberId, teamId, rating);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating confidence rating:', error);
    return NextResponse.json(
      { error: 'Failed to update confidence rating' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const familyMemberId = searchParams.get('familyMemberId');
    
    if (!familyMemberId) {
      return NextResponse.json(
        { error: 'Family member ID is required' },
        { status: 400 }
      );
    }
    
    removeConfidenceRatingsByFamilyMember(familyMemberId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing confidence ratings:', error);
    return NextResponse.json(
      { error: 'Failed to remove confidence ratings' },
      { status: 500 }
    );
  }
}
