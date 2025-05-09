export type Team = {
  id: number;
  name: string;
  conference: string;
  division: string;
  seed: number;
  isEliminated: boolean;
  confidenceRating?: number;
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
  team1?: Team;
  team2?: Team;
};

export type FamilyMember = {
  id: string;
  name: string;
};
