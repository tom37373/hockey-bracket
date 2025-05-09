import { NextResponse } from 'next/server';
import {
  getFamilyMemberById,
  getFamilyMembers,
  getBracketMatchups,
  getConfidenceRatings,
  BracketMatchup
} from '@/utils/data';

// Number of Monte Carlo simulations to run
const SIMULATIONS = 100000;

type TeamWins = Record<number, number>;
type FamilyScore = { familyMemberId: string; score: number };

/**
 * Simulate the remainder of a best-of-7 series, starting from existing scores.
 * Updates teamWins with only the additional wins from simulated games.
 */
function simulateSeries(
  team1: number,
  team2: number,
  initial1: number,
  initial2: number,
  teamWins: TeamWins
) {
  let wins1 = initial1;
  let wins2 = initial2;
  // Simulate until one reaches 4 total wins
  while (wins1 < 4 && wins2 < 4) {
    if (Math.random() < 0.5) wins1++;
    else wins2++;
  }
  // Record only the new wins beyond the initial
  const added1 = wins1 - initial1;
  const added2 = wins2 - initial2;
  teamWins[team1] = (teamWins[team1] || 0) + added1;
  teamWins[team2] = (teamWins[team2] || 0) + added2;
  return wins1 === 4 ? team1 : team2;
}

/**
 * Run one full tournament simulation, accounting for completed games and partial series.
 * Returns total team wins across all games (completed + simulated).
 */
function simulateTournament(rawMatchups: BracketMatchup[]): TeamWins {
  // Prepopulate teamWins with all existing scores
  const teamWins: TeamWins = {};
  rawMatchups.forEach(m => {
    if (m.score1 != null && m.team1Id != null) {
      teamWins[m.team1Id] = (teamWins[m.team1Id] || 0) + m.score1;
    }
    if (m.score2 != null && m.team2Id != null) {
      teamWins[m.team2Id] = (teamWins[m.team2Id] || 0) + m.score2;
    }
  });

  // Group matchups by round
  const rounds: Record<number, BracketMatchup[]> = {};
  rawMatchups.forEach(m => {
    if (!rounds[m.round]) rounds[m.round] = [];
    rounds[m.round].push({ ...m });
  });

  let currentWinners: number[] = [];
  const sortedRounds = Object.keys(rounds)
    .map(r => parseInt(r, 10))
    .sort((a, b) => a - b);

  sortedRounds.forEach(roundNum => {
    const matchups = rounds[roundNum].sort((a, b) => a.position - b.position);
    currentWinners = [];

    matchups.forEach(m => {
      const t1 = m.team1Id!;
      const t2 = m.team2Id!;
      const s1 = m.score1 || 0;
      const s2 = m.score2 || 0;
      let winner: number;

      // If series already decided (4 wins), use actual winner; else simulate remainder
      if (s1 === 4 || s2 === 4) {
        winner = s1 === 4 ? t1 : t2;
      } else {
        winner = simulateSeries(t1, t2, s1, s2, teamWins);
      }

      currentWinners.push(winner);
    });

    // Assign winners into next round slots
    const nextRound = rounds[roundNum + 1];
    if (nextRound) {
      nextRound.sort((a, b) => a.position - b.position).forEach((m, idx) => {
        const slot = idx * 2;
        m.team1Id = currentWinners[slot];
        m.team2Id = currentWinners[slot + 1];
      });
    }
  });

  return teamWins;
}

/**
 * Calculate each family member's score from team wins and their confidence ratings.
 */
function calculateFamilyScores(
  ratingsByMember: Record<string, Record<number, number>>,
  teamWins: TeamWins
): FamilyScore[] {
  return Object.entries(ratingsByMember).map(([memberId, ratings]) => {
    const score = Object.entries(teamWins).reduce((sum, [teamIdStr, wins]) => {
      const teamId = parseInt(teamIdStr, 10);
      return sum + (ratings[teamId] || 0) * wins;
    }, 0);
    return { familyMemberId: memberId, score };
  });
}

/**
 * Main function: Monte Carlo simulation to estimate bracket win odds.
 */
function calculateBracketOdds() {
  const familyMembers = getFamilyMembers();
  const rawMatchups = getBracketMatchups();
  const confidenceRatings = getConfidenceRatings();

  // Organize ratings for quick lookup
  const ratingsByMember: Record<string, Record<number, number>> = {};
  familyMembers.forEach(m => (ratingsByMember[m.id] = {}));
  confidenceRatings.forEach(r => {
    if (ratingsByMember[r.familyMemberId]) {
      ratingsByMember[r.familyMemberId][r.teamId] = r.rating;
    }
  });

  // Tally how many tournament wins each member accumulates
  const winCounts: Record<string, number> = {};
  familyMembers.forEach(m => (winCounts[m.id] = 0));

  for (let i = 0; i < SIMULATIONS; i++) {
    const teamWins = simulateTournament(rawMatchups);
    const scores = calculateFamilyScores(ratingsByMember, teamWins);
    const maxScore = Math.max(...scores.map(s => s.score));
    const winners = scores.filter(s => s.score === maxScore);
    const share = 1 / winners.length;
    winners.forEach(w => (winCounts[w.familyMemberId] += share));
  }

  // Convert to percentage odds
  return familyMembers.map(m => {
    const pct = (winCounts[m.id] / SIMULATIONS) * 100;
    const odds = pct < 10 ? Math.round(pct * 10) / 10 : Math.round(pct);
    return { familyMemberId: m.id, odds };
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const familyMemberId = searchParams.get('familyMemberId');
    const odds = calculateBracketOdds();

    if (familyMemberId) {
      const memberOdds = odds.find(o => o.familyMemberId === familyMemberId);
      if (!memberOdds) {
        return NextResponse.json({ error: 'Odds not found' }, { status: 404 });
      }
      return NextResponse.json(memberOdds);
    }

    if (searchParams.get('includeNames') === 'true') {
      const withNames = odds.map(o => {
        const member = getFamilyMemberById(o.familyMemberId);
        return { ...o, name: member?.name || 'Unknown' };
      });
      return NextResponse.json(withNames);
    }

    return NextResponse.json(odds);
  } catch (err) {
    console.error('Error fetching bracket odds:', err);
    return NextResponse.json({ error: 'Failed to fetch odds' }, { status: 500 });
  }
}
