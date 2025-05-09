import fs from 'fs';
import path from 'path';

// Define types for our data
export type FamilyMember = {
  id: string;
  name: string;
};

export type Team = {
  id: number;
  name: string;
  conference: string;
  division: string;
  seed: number;
  isEliminated: boolean;
};

export type ConfidenceRating = {
  familyMemberId: string;
  teamId: number;
  rating: number;
};

export type Game = {
  id: number;
  homeTeamId: number;
  awayTeamId: number;
  homeScore?: number;
  awayScore?: number;
  status: 'live' | 'upcoming' | 'final';
  period?: string;
  timeRemaining?: string;
  date?: string;
  time?: string;
};


export type BracketMatchup = {
  id: number;
  round: number;
  position: number;
  team1Id: number | null;
  team2Id: number | null;
  score1: number | null;
  score2: number | null;
  isCompleted: boolean;
  winnerId: number | null;
};

export type BracketOdds = {
  familyMemberId: string;
  odds: number;
};

// Helper function to get the data directory path
const getDataPath = (fileName: string) => {
  return path.join(process.cwd(), 'src', 'data', fileName);
};

// Generic function to read JSON data
export const readJsonData = <T>(fileName: string): T => {
  const filePath = getDataPath(fileName);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(fileContent) as T;
};

// Generic function to write JSON data
export const writeJsonData = <T>(fileName: string, data: T): void => {
  const filePath = getDataPath(fileName);
  const fileContent = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, fileContent, 'utf-8');
};

// Functions to add, update, and remove data
export const addFamilyMember = (name: string): FamilyMember => {
  const familyMembers = getFamilyMembers();
  
  // Generate a new ID (simple increment of the highest existing ID)
  const maxId = Math.max(...familyMembers.map(member => parseInt(member.id)), 0);
  const newId = (maxId + 1).toString();
  
  const newMember: FamilyMember = {
    id: newId,
    name
  };
  
  // Add to the array and write back to file
  familyMembers.push(newMember);
  writeJsonData('family-members.json', familyMembers);
  
  // Create default confidence ratings for the new member
  const teams = getTeams();
  const ratings: ConfidenceRating[] = [];
  
  teams.forEach(team => {
    ratings.push({
      familyMemberId: newId,
      teamId: team.id,
      rating: 5 // Default rating
    });
  });
  
  // Add the new ratings
  const allRatings = getConfidenceRatings();
  writeJsonData('confidence-ratings.json', [...allRatings, ...ratings]);
  
  return newMember;
};

export const removeFamilyMember = (id: string): void => {
  // Remove the family member
  const familyMembers = getFamilyMembers();
  const updatedMembers = familyMembers.filter(member => member.id !== id);
  writeJsonData('family-members.json', updatedMembers);
  
  // Remove their confidence ratings
  removeConfidenceRatingsByFamilyMember(id);
};

export const updateConfidenceRating = (
  familyMemberId: string, 
  teamId: number, 
  rating: number
): void => {
  const ratings = getConfidenceRatings();
  
  // Find the index of the rating to update
  const index = ratings.findIndex(
    r => r.familyMemberId === familyMemberId && r.teamId === teamId
  );
  
  if (index !== -1) {
    // Update existing rating
    ratings[index].rating = rating;
  } else {
    // Create new rating if it doesn't exist
    ratings.push({
      familyMemberId,
      teamId,
      rating
    });
  }
  
  writeJsonData('confidence-ratings.json', ratings);
};

export const removeConfidenceRatingsByFamilyMember = (familyMemberId: string): void => {
  const ratings = getConfidenceRatings();
  const updatedRatings = ratings.filter(rating => rating.familyMemberId !== familyMemberId);
  writeJsonData('confidence-ratings.json', updatedRatings);
};

// Specific functions for each data type
export const getFamilyMembers = (): FamilyMember[] => {
  return readJsonData<FamilyMember[]>('family-members.json');
};

export const getTeams = (): Team[] => {
  return readJsonData<Team[]>('teams.json');
};

export const getConfidenceRatings = (): ConfidenceRating[] => {
  return readJsonData<ConfidenceRating[]>('confidence-ratings.json');
};

export const getGames = (): Game[] => {
  return readJsonData<Game[]>('games.json');
};

// This function is no longer needed as rooting preferences are now dynamically calculated
// export const getRootingPreferences = (): RootingPreference[] => {
//   return readJsonData<RootingPreference[]>('rooting-preferences.json');
// };

export const getBracketMatchups = (): BracketMatchup[] => {
  return readJsonData<BracketMatchup[]>('bracket-matchups.json');
};

export const getBracketOdds = (): BracketOdds[] => {
  return readJsonData<BracketOdds[]>('bracket-odds.json');
};

// Helper functions to get related data
export const getTeamById = (teamId: number): Team | undefined => {
  const teams = getTeams();
  return teams.find(team => team.id === teamId);
};

export const getFamilyMemberById = (familyMemberId: string): FamilyMember | undefined => {
  const familyMembers = getFamilyMembers();
  return familyMembers.find(member => member.id === familyMemberId);
};

export const getConfidenceRatingsByTeam = (teamId: number): ConfidenceRating[] => {
  const ratings = getConfidenceRatings();
  return ratings.filter(rating => rating.teamId === teamId);
};

export const getConfidenceRatingsByFamilyMember = (familyMemberId: string): ConfidenceRating[] => {
  const ratings = getConfidenceRatings();
  return ratings.filter(rating => rating.familyMemberId === familyMemberId);
};

export const getGameById = (gameId: number): Game | undefined => {
  const games = getGames();
  return games.find(game => game.id === gameId);
};

export const getLiveGames = (): Game[] => {
  const games = getGames();
  return games.filter(game => game.status === 'live');
};

export const getUpcomingGames = (): Game[] => {
  const games = getGames();
  return games.filter(game => game.status === 'upcoming');
};

export const getCompletedGames = (): Game[] => {
  const games = getGames();
  return games.filter(game => game.status === 'final');
};

// These functions are no longer needed as rooting preferences are now dynamically calculated
// export const getRootingPreferencesByGame = (gameId: number): RootingPreference[] => {
//   const preferences = getRootingPreferences();
//   return preferences.filter(pref => pref.gameId === gameId);
// };

// export const getRootingPreferencesByTeam = (teamId: number): RootingPreference[] => {
//   const preferences = getRootingPreferences();
//   return preferences.filter(pref => pref.teamId === teamId);
// };

export const getBracketMatchupsByRound = (round: number): BracketMatchup[] => {
  const matchups = getBracketMatchups();
  return matchups.filter(matchup => matchup.round === round);
};

export const getBracketMatchupById = (matchupId: number): BracketMatchup | undefined => {
  const matchups = getBracketMatchups();
  return matchups.find(matchup => matchup.id === matchupId);
};

// Cache for storing simulation results
const oddsCache: Record<string, Record<string, number>> = {};

// Helper function to clear the odds cache
export const clearOddsCache = (): void => {
  Object.keys(oddsCache).forEach(key => delete oddsCache[key]);
};

// Number of Monte Carlo simulations to run
const SIMULATIONS = 100000; // Increased back to 100,000 for more accurate results

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
  rawMatchups.forEach((m: BracketMatchup) => {
    if (m.score1 != null && m.team1Id != null) {
      teamWins[m.team1Id] = (teamWins[m.team1Id] || 0) + m.score1;
    }
    if (m.score2 != null && m.team2Id != null) {
      teamWins[m.team2Id] = (teamWins[m.team2Id] || 0) + m.score2;
    }
  });

  // Group matchups by round
  const rounds: Record<number, BracketMatchup[]> = {};
  rawMatchups.forEach((m: BracketMatchup) => {
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

    matchups.forEach((m: BracketMatchup) => {
      if (m.team1Id === null || m.team2Id === null) {
        // Skip matchups without teams assigned yet
        return;
      }
      
      const t1 = m.team1Id;
      const t2 = m.team2Id;
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
      nextRound.sort((a, b) => a.position - b.position).forEach((m: BracketMatchup, idx) => {
        if (idx * 2 < currentWinners.length) {
          m.team1Id = currentWinners[idx * 2];
        }
        if (idx * 2 + 1 < currentWinners.length) {
          m.team2Id = currentWinners[idx * 2 + 1];
        }
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
 * Calculate bracket odds for all family members based on the provided matchups.
 */
function simulateBracketOddsForAllMembers(matchups: BracketMatchup[]): Record<string, number> {
  // Get all family members
  const familyMembers = getFamilyMembers();
  
  // Get confidence ratings
  const confidenceRatings = getConfidenceRatings();
  
  // Organize ratings for quick lookup
  const ratingsByMember: Record<string, Record<number, number>> = {};
  familyMembers.forEach((m: FamilyMember) => (ratingsByMember[m.id] = {}));
  confidenceRatings.forEach((r: ConfidenceRating) => {
    if (ratingsByMember[r.familyMemberId]) {
      ratingsByMember[r.familyMemberId][r.teamId] = r.rating;
    }
  });
  
  // Tally how many tournament wins each member accumulates
  const winCounts: Record<string, number> = {};
  familyMembers.forEach((m: FamilyMember) => (winCounts[m.id] = 0));
  
  for (let i = 0; i < SIMULATIONS; i++) {
    const teamWins = simulateTournament(matchups);
    const scores = calculateFamilyScores(ratingsByMember, teamWins);
    const maxScore = Math.max(...scores.map(s => s.score));
    const winners = scores.filter(s => s.score === maxScore);
    const share = 1 / winners.length;
    winners.forEach((w: FamilyScore) => (winCounts[w.familyMemberId] += share));
  }
  
  // Convert to percentage odds for all family members
  const odds: Record<string, number> = {};
  familyMembers.forEach((m: FamilyMember) => {
    odds[m.id] = (winCounts[m.id] / SIMULATIONS) * 100;
  });
  
  return odds;
}

/**
 * Simulate tournament odds for all family members with a specific game outcome forced.
 */
function simulateOddsWithGameOutcome(
  gameId: number,
  winningTeamId: number
): Record<string, number> {
  // Create a cache key
  const cacheKey = `${gameId}-${winningTeamId}`;
  
  // Check if result is already in cache
  if (oddsCache[cacheKey]) {
    return oddsCache[cacheKey];
  }
  
  // Get all bracket matchups
  const rawMatchups = getBracketMatchups();
  
  // Create a copy of matchups to modify for simulation
  const matchups = JSON.parse(JSON.stringify(rawMatchups));
  
  // Find the matchup for this game
  const game = getGameById(gameId);
  if (!game) return {};
  
  // Find the corresponding bracket matchup
  // First, try to find a direct match by ID
  let matchupIndex = matchups.findIndex((m: BracketMatchup) => m.id === gameId);
  
  // If not found, look for a matchup with the same teams in the current round (Round 2)
  if (matchupIndex === -1) {
    // Get all Round 2 matchups (current round based on bracket-matchups.json)
    const round2Matchups = matchups.filter((m: BracketMatchup) => m.round === 2);
    
    // Find the matchup that has these two teams
    const foundMatchup = round2Matchups.find((m: BracketMatchup) => {
      if (m.team1Id === null || m.team2Id === null) return false;
      
      // Check if this matchup has both teams from the game (in any order)
      return (
        (m.team1Id === game.homeTeamId && m.team2Id === game.awayTeamId) ||
        (m.team1Id === game.awayTeamId && m.team2Id === game.homeTeamId)
      );
    });
    
    if (foundMatchup) {
      matchupIndex = matchups.indexOf(foundMatchup);
    }
  }
  
  // If still not found, try a more lenient approach with all rounds
  if (matchupIndex === -1) {
    const foundMatchup = matchups.find((m: BracketMatchup) => {
      if (m.team1Id === null || m.team2Id === null) return false;
      
      // Check if this matchup has both teams from the game (in any order)
      return (
        (m.team1Id === game.homeTeamId && m.team2Id === game.awayTeamId) ||
        (m.team1Id === game.awayTeamId && m.team2Id === game.homeTeamId)
      );
    });
    
    if (foundMatchup) {
      matchupIndex = matchups.indexOf(foundMatchup);
    }
  }
  
  if (matchupIndex !== -1) {
    const matchup = matchups[matchupIndex];
    
    // Store original scores to restore later
    const originalScore1 = matchup.score1;
    const originalScore2 = matchup.score2;
    const originalWinnerId = matchup.winnerId;
    
    // Determine which team in the matchup corresponds to the winning team
    if (matchup.team1Id === winningTeamId) {
      // If team1 is winning, increment their score by 1 (don't set to 4 directly)
      matchup.score1 = (matchup.score1 || 0) + 1;
      
      // If this win would make them reach 4, set them as the winner
      if (matchup.score1 >= 4) {
        matchup.winnerId = winningTeamId;
        matchup.isCompleted = true;
      }
    } else if (matchup.team2Id === winningTeamId) {
      // If team2 is winning, increment their score by 1
      matchup.score2 = (matchup.score2 || 0) + 1;
      
      // If this win would make them reach 4, set them as the winner
      if (matchup.score2 >= 4) {
        matchup.winnerId = winningTeamId;
        matchup.isCompleted = true;
      }
    }
    
    // Run the simulation
    const odds = simulateBracketOddsForAllMembers(matchups);
    
    // Restore original state
    matchup.score1 = originalScore1;
    matchup.score2 = originalScore2;
    matchup.winnerId = originalWinnerId;
    matchup.isCompleted = originalWinnerId !== null;
    
    return odds;
  }
  
  // Get all family members
  const familyMembers = getFamilyMembers();
  
  // Get confidence ratings
  const confidenceRatings = getConfidenceRatings();
  
  // Organize ratings for quick lookup
  const ratingsByMember: Record<string, Record<number, number>> = {};
  familyMembers.forEach((m: FamilyMember) => (ratingsByMember[m.id] = {}));
  confidenceRatings.forEach((r: ConfidenceRating) => {
    if (ratingsByMember[r.familyMemberId]) {
      ratingsByMember[r.familyMemberId][r.teamId] = r.rating;
    }
  });
  
  // Tally how many tournament wins each member accumulates
  const winCounts: Record<string, number> = {};
  familyMembers.forEach((m: FamilyMember) => (winCounts[m.id] = 0));
  
  for (let i = 0; i < SIMULATIONS; i++) {
    const teamWins = simulateTournament(matchups);
    const scores = calculateFamilyScores(ratingsByMember, teamWins);
    const maxScore = Math.max(...scores.map(s => s.score));
    const winners = scores.filter(s => s.score === maxScore);
    const share = 1 / winners.length;
    winners.forEach((w: FamilyScore) => (winCounts[w.familyMemberId] += share));
  }
  
  // Convert to percentage odds for all family members
  const odds: Record<string, number> = {};
  familyMembers.forEach((m: FamilyMember) => {
    odds[m.id] = (winCounts[m.id] / SIMULATIONS) * 100;
  });
  
  // Store result in cache
  oddsCache[cacheKey] = odds;
  
  return odds;
}


// Helper function to get confidence ratings for a team by all family members
export const getTeamConfidenceRatings = (teamId: number): Record<string, number> => {
  const ratings = getConfidenceRatingsByTeam(teamId);
  const result: Record<string, number> = {};
  
  ratings.forEach((rating: ConfidenceRating) => {
    const member = getFamilyMemberById(rating.familyMemberId);
    if (member) {
      result[member.name] = rating.rating;
    }
  });
  
  return result;
};
