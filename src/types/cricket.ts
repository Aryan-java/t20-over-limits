export interface Player {
  id: string;
  name: string;
  isOverseas: boolean;
  batSkill: number; // 0-100
  bowlSkill: number; // 0-100
  // Match stats
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  dismissed: boolean;
  dismissalInfo: string;
  oversBowled: number;
  maidens: number;
  wickets: number;
  runsConceded: number;
  isPlaying: boolean;
  position?: number;
}

export interface Team {
  id: string;
  name: string;
  squad: Player[];
  subUsed: boolean;
}

export interface BallEvent {
  ballNumber: number;
  bowler: string;
  batsman: string;
  runs: number;
  isWicket: boolean;
  dismissalType?: string;
  extras?: {
    type: 'wide' | 'no-ball' | 'bye' | 'leg-bye';
    runs: number;
  };
  commentary: string;
}

export interface Over {
  overNumber: number;
  bowler: string;
  balls: BallEvent[];
  maidenOver: boolean;
  runs: number;
  wickets: number;
}

export interface Innings {
  battingTeam: string;
  bowlingTeam: string;
  totalRuns: number;
  wickets: number;
  ballsBowled: number;
  overs: Over[];
  currentBatsmen: {
    striker: Player | null;
    nonStriker: Player | null;
  };
  battingOrder: Player[];
  isCompleted: boolean;
}

export interface Match {
  id: string;
  team1: Team;
  team2: Team;
  overs: number;
  tossWinner: Team | null;
  tossChoice: 'bat' | 'bowl' | null;
  firstInnings: Innings | null;
  secondInnings: Innings | null;
  result: string | null;
  isLive: boolean;
  currentInnings: 1 | 2;
  team1Setup?: {
    playingXI: Player[];
    impactPlayers: Player[];
    battingOrder: Player[];
    openingPair: [Player, Player];
  };
  team2Setup?: {
    playingXI: Player[];
    impactPlayers: Player[];
    battingOrder: Player[];
    openingPair: [Player, Player];
  };
  superOver?: {
    team1Innings: Innings;
    team2Innings: Innings;
  };
}

export interface Fixture {
  id: string;
  team1: Team;
  team2: Team;
  played: boolean;
  match?: Match;
}