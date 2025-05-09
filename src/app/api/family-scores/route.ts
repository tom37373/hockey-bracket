import { NextResponse } from 'next/server';
import { 
  getFamilyMembers, 
  getConfidenceRatings, 
  getBracketMatchups
} from '@/utils/data';

export async function GET() {
  try {
    // Get all family members
    const familyMembers = getFamilyMembers();
    
    // Get all bracket matchups
    const bracketMatchups = getBracketMatchups();
    
    // Count wins for each team
    const teamWins: Record<number, number> = {};
    
    bracketMatchups.forEach(matchup => {
      if (matchup.team1Id) {
        teamWins[matchup.team1Id] = (teamWins[matchup.team1Id] || 0) + matchup.score1!;
      }
      if (matchup.team2Id) {
        teamWins[matchup.team2Id] = (teamWins[matchup.team2Id] || 0) + matchup.score2!;
      }
    });
    
    // Get all confidence ratings
    const confidenceRatings = getConfidenceRatings();
    
    // Calculate scores for each family member
    const scores = familyMembers.map(member => {
      // Get this member's confidence ratings
      const memberRatings = confidenceRatings.filter(
        rating => rating.familyMemberId === member.id
      );
      
      // Calculate score: sum of (confidence rating * team wins)
      let score = 0;
      memberRatings.forEach(rating => {
        const wins = teamWins[rating.teamId] || 0;
        score += rating.rating * wins;
      });
      
      return {
        id: member.id,
        name: member.name,
        score
      };
    });
    
    // Sort by score in descending order
    scores.sort((a, b) => b.score - a.score);
    
    return NextResponse.json(scores);
  } catch (error) {
    console.error('Error calculating family scores:', error);
    return NextResponse.json(
      { error: 'Failed to calculate family scores' },
      { status: 500 }
    );
  }
}
