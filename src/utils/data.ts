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
