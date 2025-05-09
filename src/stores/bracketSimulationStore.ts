import { create } from 'zustand'
import { BracketMatchup, FamilyMember } from '@/types'

// Types for scores and odds
export type FamilyScore = {
  id: string;
  name: string;
  score: number;
};

export type BracketOdds = {
  familyMemberId: string;
  name: string;
  odds: number;
};

interface BracketSimulationState {
  // Original matchups from the API
  originalMatchups: BracketMatchup[]
  // Simulated matchups that can be modified
  simulatedMatchups: BracketMatchup[]
  // Flag to indicate if we're in simulation mode
  isSimulationMode: boolean
  // Family members data
  familyMembers: FamilyMember[]
  // Confidence ratings by family member and team
  confidenceRatings: Record<string, Record<number, number>>
  
  // Actions
  setOriginalMatchups: (matchups: BracketMatchup[]) => void
  incrementScore: (matchupId: number, isTeam1: boolean) => void
  decrementScore: (matchupId: number, isTeam1: boolean) => void
  resetSimulation: () => void
  toggleSimulationMode: () => void
  setFamilyMembers: (members: FamilyMember[]) => void
  setConfidenceRatings: (ratings: any[]) => void
  saveSimulatedMatchups: () => Promise<boolean>
  
  // Calculation functions
  calculateFamilyScores: () => FamilyScore[]
  calculateBracketOdds: () => BracketOdds[]
}

// Number of Monte Carlo simulations to run for odds calculation
const SIMULATIONS = 10000; // Reduced from 100,000 for better performance in the browser

type TeamWins = Record<number, number>;
type SimFamilyScore = { familyMemberId: string; score: number };

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
      nextRound.sort((a, b) => a.position - b.position).forEach((m, idx) => {
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
): SimFamilyScore[] {
  return Object.entries(ratingsByMember).map(([memberId, ratings]) => {
    const score = Object.entries(teamWins).reduce((sum, [teamIdStr, wins]) => {
      const teamId = parseInt(teamIdStr, 10);
      return sum + (ratings[teamId] || 0) * wins;
    }, 0);
    return { familyMemberId: memberId, score };
  });
}

export const useBracketSimulationStore = create<BracketSimulationState>((set, get) => ({
  originalMatchups: [],
  simulatedMatchups: [],
  isSimulationMode: false,
  familyMembers: [],
  confidenceRatings: {},
  
  setOriginalMatchups: (matchups) => {
    set({ 
      originalMatchups: matchups,
      simulatedMatchups: JSON.parse(JSON.stringify(matchups)) // Deep copy
    })
  },
  
  setFamilyMembers: (members) => {
    set({ familyMembers: members })
  },
  
  setConfidenceRatings: (ratings) => {
    // Organize ratings for quick lookup
    const ratingsByMember: Record<string, Record<number, number>> = {};
    
    // Initialize empty objects for each family member
    get().familyMembers.forEach(m => {
      ratingsByMember[m.id] = {};
    });
    
    // Populate with ratings
    ratings.forEach((r: any) => {
      if (ratingsByMember[r.familyMemberId]) {
        ratingsByMember[r.familyMemberId][r.teamId] = r.rating;
      }
    });
    
    set({ confidenceRatings: ratingsByMember });
  },
  
  incrementScore: (matchupId, isTeam1) => {
    set((state) => {
      const newMatchups = [...state.simulatedMatchups]
      const matchupIndex = newMatchups.findIndex(m => m.id === matchupId)
      
      if (matchupIndex === -1) return state
      
      const matchup = newMatchups[matchupIndex]
      
      // Increment the appropriate score, but not above 4
      if (isTeam1) {
        // Don't increment if already at 4
        if (matchup.score1 === 4) return state
        
        matchup.score1 = (matchup.score1 || 0) + 1
        
        // Check if team1 has won (reached 4 wins)
        if (matchup.score1 === 4) {
          matchup.isCompleted = true
          matchup.winnerId = matchup.team1Id
          
          // Mark team2 as eliminated
          // Find all instances of this team in the matchups and mark them as eliminated
          newMatchups.forEach(m => {
            if (m.team1Id === matchup.team2Id && m.team1) {
              m.team1.isEliminated = true
            }
            if (m.team2Id === matchup.team2Id && m.team2) {
              m.team2.isEliminated = true
            }
          })
          
          // Update next round matchup
          updateNextRoundMatchup(newMatchups, matchup)
        }
      } else {
        // Don't increment if already at 4
        if (matchup.score2 === 4) return state
        
        matchup.score2 = (matchup.score2 || 0) + 1
        
        // Check if team2 has won (reached 4 wins)
        if (matchup.score2 === 4) {
          matchup.isCompleted = true
          matchup.winnerId = matchup.team2Id
          
          // Mark team1 as eliminated
          // Find all instances of this team in the matchups and mark them as eliminated
          newMatchups.forEach(m => {
            if (m.team1Id === matchup.team1Id && m.team1) {
              m.team1.isEliminated = true
            }
            if (m.team2Id === matchup.team1Id && m.team2) {
              m.team2.isEliminated = true
            }
          })
          
          // Update next round matchup
          updateNextRoundMatchup(newMatchups, matchup)
        }
      }
      
      return { simulatedMatchups: newMatchups }
    })
  },
  
  decrementScore: (matchupId, isTeam1) => {
    set((state) => {
      const newMatchups = [...state.simulatedMatchups]
      const matchupIndex = newMatchups.findIndex(m => m.id === matchupId)
      
      if (matchupIndex === -1) return state
      
      const matchup = newMatchups[matchupIndex]
      
      // Decrement the appropriate score, but not below 0
      if (isTeam1 && matchup.score1 && matchup.score1 > 0) {
        matchup.score1 = matchup.score1 - 1
        
        // If this was previously completed, reset completion status
        if (matchup.isCompleted && matchup.winnerId === matchup.team1Id) {
          matchup.isCompleted = false
          matchup.winnerId = null
          
          // Un-eliminate team2
          if (matchup.team2Id) {
            newMatchups.forEach(m => {
              if (m.team1Id === matchup.team2Id && m.team1) {
                m.team1.isEliminated = false
              }
              if (m.team2Id === matchup.team2Id && m.team2) {
                m.team2.isEliminated = false
              }
            })
          }
          
          // Reset next round matchup
          resetNextRoundMatchup(newMatchups, matchup)
        }
      } else if (!isTeam1 && matchup.score2 && matchup.score2 > 0) {
        matchup.score2 = matchup.score2 - 1
        
        // If this was previously completed, reset completion status
        if (matchup.isCompleted && matchup.winnerId === matchup.team2Id) {
          matchup.isCompleted = false
          matchup.winnerId = null
          
          // Un-eliminate team1
          if (matchup.team1Id) {
            newMatchups.forEach(m => {
              if (m.team1Id === matchup.team1Id && m.team1) {
                m.team1.isEliminated = false
              }
              if (m.team2Id === matchup.team1Id && m.team2) {
                m.team2.isEliminated = false
              }
            })
          }
          
          // Reset next round matchup
          resetNextRoundMatchup(newMatchups, matchup)
        }
      }
      
      return { simulatedMatchups: newMatchups }
    })
  },
  
  resetSimulation: () => {
    set((state) => ({
      simulatedMatchups: JSON.parse(JSON.stringify(state.originalMatchups))
    }))
  },
  
  toggleSimulationMode: () => {
    set((state) => ({ isSimulationMode: !state.isSimulationMode }))
  },
  
  saveSimulatedMatchups: async () => {
    const { simulatedMatchups } = get()
    
    try {
      // Prepare data for saving - remove team objects as they're not part of the schema
      const matchupsToSave = simulatedMatchups.map(matchup => ({
        id: matchup.id,
        round: matchup.round,
        position: matchup.position,
        team1Id: matchup.team1Id,
        team2Id: matchup.team2Id,
        score1: matchup.score1,
        score2: matchup.score2,
        isCompleted: matchup.isCompleted,
        winnerId: matchup.winnerId
      }))
      
      // Send PUT request to update the bracket matchups
      const response = await fetch('/api/bracket-matchups', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(matchupsToSave)
      })
      
      if (!response.ok) {
        throw new Error('Failed to save bracket matchups')
      }
      
      // Update original matchups with the saved data
      set({ 
        originalMatchups: JSON.parse(JSON.stringify(matchupsToSave)),
        isSimulationMode: false // Exit simulation mode after saving
      })
      
      return true
    } catch (error) {
      console.error('Error saving bracket matchups:', error)
      return false
    }
  },
  
  calculateFamilyScores: () => {
    const { simulatedMatchups, familyMembers, confidenceRatings, isSimulationMode } = get();
    const matchups = isSimulationMode ? simulatedMatchups : get().originalMatchups;
    
    // Count wins for each team
    const teamWins: Record<number, number> = {};
    
    matchups.forEach(matchup => {
      if (matchup.team1Id) {
        teamWins[matchup.team1Id] = (teamWins[matchup.team1Id] || 0) + (matchup.score1 || 0);
      }
      if (matchup.team2Id) {
        teamWins[matchup.team2Id] = (teamWins[matchup.team2Id] || 0) + (matchup.score2 || 0);
      }
    });
    
    // Calculate scores for each family member
    const scores = familyMembers.map(member => {
      // Get this member's confidence ratings
      const memberRatings = confidenceRatings[member.id] || {};
      
      // Calculate score: sum of (confidence rating * team wins)
      let score = 0;
      Object.entries(memberRatings).forEach(([teamIdStr, rating]) => {
        const teamId = parseInt(teamIdStr);
        const wins = teamWins[teamId] || 0;
        score += rating * wins;
      });
      
      return {
        id: member.id,
        name: member.name,
        score
      };
    });
    
    // Sort by score in descending order
    scores.sort((a, b) => b.score - a.score);
    
    return scores;
  },
  
  calculateBracketOdds: () => {
    const { simulatedMatchups, familyMembers, confidenceRatings, isSimulationMode } = get();
    const matchups = isSimulationMode ? simulatedMatchups : get().originalMatchups;
    
    // Tally how many tournament wins each member accumulates
    const winCounts: Record<string, number> = {};
    familyMembers.forEach(m => (winCounts[m.id] = 0));
    
    for (let i = 0; i < SIMULATIONS; i++) {
      const teamWins = simulateTournament(matchups);
      const scores = calculateFamilyScores(confidenceRatings, teamWins);
      const maxScore = Math.max(...scores.map(s => s.score));
      const winners = scores.filter(s => s.score === maxScore);
      const share = 1 / winners.length;
      winners.forEach(w => (winCounts[w.familyMemberId] += share));
    }
    
    // Convert to percentage odds
    const odds = familyMembers.map(m => {
      const pct = (winCounts[m.id] / SIMULATIONS) * 100;
      const roundedOdds = pct < 10 ? Math.round(pct * 10) / 10 : Math.round(pct);
      return { 
        familyMemberId: m.id, 
        name: m.name,
        odds: roundedOdds 
      };
    });
    
    // Sort by odds in descending order
    odds.sort((a, b) => b.odds - a.odds);
    
    return odds;
  }
}))

// Helper function to update the next round matchup when a team advances
function updateNextRoundMatchup(matchups: BracketMatchup[], currentMatchup: BracketMatchup) {
  // Find the next round matchup
  const currentRound = currentMatchup.round
  const currentPosition = currentMatchup.position
  const nextRound = currentRound + 1
  
  // Calculate position in next round (integer division)
  const nextPosition = Math.ceil(currentPosition / 2)
  
  // Find the next matchup
  const nextMatchupIndex = matchups.findIndex(
    m => m.round === nextRound && m.position === nextPosition
  )
  
  if (nextMatchupIndex === -1) return
  
  const nextMatchup = matchups[nextMatchupIndex]
  const winnerId = currentMatchup.winnerId
  
  // Find the winning team object
  let winningTeam = currentMatchup.team1Id === winnerId ? currentMatchup.team1 : currentMatchup.team2
  
  // Determine if this team should be team1 or team2 in the next matchup
  // Even positions go to team2, odd positions go to team1
  if (currentPosition % 2 === 1) {
    nextMatchup.team1Id = winnerId
    nextMatchup.team1 = winningTeam
  } else {
    nextMatchup.team2Id = winnerId
    nextMatchup.team2 = winningTeam
  }
}

// Helper function to reset the next round matchup when a team no longer advances
function resetNextRoundMatchup(matchups: BracketMatchup[], currentMatchup: BracketMatchup) {
  // Similar logic to updateNextRoundMatchup, but we're removing the team
  const currentRound = currentMatchup.round
  const currentPosition = currentMatchup.position
  const nextRound = currentRound + 1
  const nextPosition = Math.ceil(currentPosition / 2)
  
  const nextMatchupIndex = matchups.findIndex(
    m => m.round === nextRound && m.position === nextPosition
  )
  
  if (nextMatchupIndex === -1) return
  
  const nextMatchup = matchups[nextMatchupIndex]
  
  // Reset the appropriate team
  if (currentPosition % 2 === 1) {
    nextMatchup.team1Id = null
    nextMatchup.team1 = undefined
  } else {
    nextMatchup.team2Id = null
    nextMatchup.team2 = undefined
  }
  
  // If this next matchup was completed, reset it and cascade the reset
  if (nextMatchup.isCompleted) {
    nextMatchup.isCompleted = false
    nextMatchup.winnerId = null
    nextMatchup.score1 = null
    nextMatchup.score2 = null
    
    // Recursively reset the next round
    resetNextRoundMatchup(matchups, nextMatchup)
  }
}
