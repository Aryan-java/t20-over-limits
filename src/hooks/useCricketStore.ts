import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Team, Player, Match, Fixture, MatchHistory } from '@/types/cricket';
import { PLAYER_DATABASE } from '@/data/playerDatabase';


interface CricketStore {
  teams: Team[];
  fixtures: Fixture[];
  currentMatch: Match | null;
  matchHistory: MatchHistory[];

  // Team actions
  addTeam: (team: Omit<Team, 'id' | 'playingXI' | 'impactOptions' | 'subUsed'>) => void;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  removeTeam: (id: string) => void;

  // Player actions
  addPlayerToTeam: (teamId: string, player: Omit<Player, 'id' | 'position'>) => void;
  updatePlayer: (teamId: string, playerId: string, updates: Partial<Player>) => void;
  removePlayerFromTeam: (teamId: string, playerId: string) => void;

  // Fixture actions
  generateFixtures: () => void;

  // Match actions
  createMatch: (team1Id: string, team2Id: string, team1Setup?: Match['team1Setup'], team2Setup?: Match['team2Setup']) => Match;
  setCurrentMatch: (match: Match | null) => void;
  updateMatch: (updates: Partial<Match>) => void;
  completeMatch: (match: Match) => void;

  // History actions
  getMatchHistory: () => MatchHistory[];

  // Auto-generate sample data
  generateSampleTeams: (count: number) => void;

  // Playing XI and Impact Players
  setPlayingXI: (teamId: string, playerIds: string[]) => void;
  setImpactPlayers: (teamId: string, playerIds: string[]) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

const createSamplePlayer = (name: string, isOverseas: boolean = false): Omit<Player, 'id'> => ({
  name,
  isOverseas,
  batSkill: Math.floor(Math.random() * 40) + (isOverseas ? 50 : 30),
  bowlSkill: Math.floor(Math.random() * 40) + (isOverseas ? 30 : 20),
  runs: 0,
  balls: 0,
  fours: 0,
  sixes: 0,
  dismissed: false,
  dismissalInfo: '',
  oversBowled: 0,
  maidens: 0,
  wickets: 0,
  runsConceded: 0,
  isPlaying: false,
});

export const useCricketStore = create<CricketStore>()(persist((set, get) => ({
  teams: [],
  fixtures: [],
  currentMatch: null,
  matchHistory: [],
  
  addTeam: (teamData) => {
    const team: Team = {
      ...teamData,
      id: generateId(),
      subUsed: false,
    };
    set(state => ({
      teams: [...state.teams, team]
    }));
  },
  
  updateTeam: (id, updates) => {
    set(state => ({
      teams: state.teams.map(team => 
        team.id === id ? { ...team, ...updates } : team
      )
    }));
  },
  
  removeTeam: (id) => {
    set(state => ({
      teams: state.teams.filter(team => team.id !== id)
    }));
  },
  
  addPlayerToTeam: (teamId, playerData) => {
    const state = get();

    // Check if player already exists in another team
    const existingPlayer = state.teams
      .flatMap(team => team.squad)
      .find(p => p.name === playerData.name);

    if (existingPlayer && existingPlayer.currentTeamId && existingPlayer.currentTeamId !== teamId) {
      console.error(`Player ${playerData.name} is already in another team`);
      return;
    }

    const player: Player = {
      ...playerData,
      id: generateId(),
      currentTeamId: teamId,
      performanceHistory: {
        last5MatchesRuns: 0,
        last5MatchesWickets: 0,
        totalMatches: 0,
        totalRuns: 0,
        totalWickets: 0,
        averageRuns: 0,
        averageWickets: 0,
        formRating: 50,
      },
    };

    set(state => ({
      teams: state.teams.map(team =>
        team.id === teamId
          ? { ...team, squad: [...team.squad, player] }
          : team
      )
    }));
  },
  
  updatePlayer: (teamId, playerId, updates) => {
    set(state => ({
      teams: state.teams.map(team => 
        team.id === teamId 
          ? {
              ...team,
              squad: team.squad.map(player => 
                player.id === playerId ? { ...player, ...updates } : player
              )
            }
          : team
      )
    }));
  },
  
  removePlayerFromTeam: (teamId, playerId) => {
    set(state => ({
      teams: state.teams.map(team =>
        team.id === teamId
          ? {
              ...team,
              squad: team.squad.filter(player => player.id !== playerId).map(p => ({
                ...p,
                currentTeamId: undefined,
              })),
            }
          : team
      )
    }));
  },
  
  generateFixtures: () => {
    const { teams } = get();
    const fixtures: Fixture[] = [];
    
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        fixtures.push({
          id: generateId(),
          team1: teams[i],
          team2: teams[j],
          played: false,
        });
      }
    }
    
    // Shuffle fixtures
    for (let i = fixtures.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fixtures[i], fixtures[j]] = [fixtures[j], fixtures[i]];
    }
    
    set({ fixtures });
  },
  
  createMatch: (team1Id, team2Id, team1Setup, team2Setup) => {
    const { teams } = get();
    const team1 = teams.find(t => t.id === team1Id)!;
    const team2 = teams.find(t => t.id === team2Id)!;

    const match: Match = {
      id: generateId(),
      team1,
      team2,
      team1Setup: team1Setup || null,
      team2Setup: team2Setup || null,
      overs: 20,
      tossWinner: null,
      tossChoice: null,
      firstInnings: null,
      secondInnings: null,
      result: null,
      isLive: false,
      isCompleted: false,
      matchDate: new Date(),
      manOfTheMatch: null,
      currentInnings: 1,
    };

    return match;
  },
  
  setCurrentMatch: (match) => {
    set({ currentMatch: match });
  },
  
  updateMatch: (updates) => {
    set(state => ({
      currentMatch: state.currentMatch
        ? { ...state.currentMatch, ...updates }
        : null
    }));
  },

  completeMatch: (match) => {
    const completedMatch: MatchHistory = {
      ...match,
      isCompleted: true,
      completedAt: new Date(),
    };

    // Update player performance history
    const allPlayers = [
      ...match.team1.squad.filter(p => p.isPlaying),
      ...match.team2.squad.filter(p => p.isPlaying),
    ];

    allPlayers.forEach(player => {
      const currentHistory = player.performanceHistory || {
        last5MatchesRuns: 0,
        last5MatchesWickets: 0,
        totalMatches: 0,
        totalRuns: 0,
        totalWickets: 0,
        averageRuns: 0,
        averageWickets: 0,
        formRating: 50,
      };

      const updatedHistory = {
        last5MatchesRuns: currentHistory.last5MatchesRuns + player.runs,
        last5MatchesWickets: currentHistory.last5MatchesWickets + player.wickets,
        totalMatches: currentHistory.totalMatches + 1,
        totalRuns: currentHistory.totalRuns + player.runs,
        totalWickets: currentHistory.totalWickets + player.wickets,
        averageRuns: (currentHistory.totalRuns + player.runs) / (currentHistory.totalMatches + 1),
        averageWickets: (currentHistory.totalWickets + player.wickets) / (currentHistory.totalMatches + 1),
        formRating: Math.min(100, Math.max(0, 50 + player.runs * 0.1 + player.wickets * 2)),
      };

      // Update player in teams
      set(state => ({
        teams: state.teams.map(team => ({
          ...team,
          squad: team.squad.map(p =>
            p.id === player.id
              ? { ...p, performanceHistory: updatedHistory }
              : p
          ),
        })),
      }));
    });

    set(state => ({
      matchHistory: [...state.matchHistory, completedMatch],
      fixtures: state.fixtures.map(fixture =>
        (fixture.team1.id === match.team1.id && fixture.team2.id === match.team2.id) ||
        (fixture.team1.id === match.team2.id && fixture.team2.id === match.team1.id)
          ? { ...fixture, played: true, match: completedMatch }
          : fixture
      ),
      currentMatch: null,
    }));
  },

  getMatchHistory: () => {
    return get().matchHistory.sort((a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  },
  
  setPlayingXI: (teamId: string, playerIds: string[]) => {
    set(state => ({
      currentMatch: state.currentMatch ? {
        ...state.currentMatch,
        team1Setup: state.currentMatch.team1.id === teamId && state.currentMatch.team1Setup ? {
          ...state.currentMatch.team1Setup,
          playingXI: state.currentMatch.team1.squad.filter(p => playerIds.includes(p.id))
        } : state.currentMatch.team1Setup,
        team2Setup: state.currentMatch.team2.id === teamId && state.currentMatch.team2Setup ? {
          ...state.currentMatch.team2Setup,
          playingXI: state.currentMatch.team2.squad.filter(p => playerIds.includes(p.id))
        } : state.currentMatch.team2Setup,
      } : null
    }));
  },
  
  setImpactPlayers: (teamId: string, playerIds: string[]) => {
    set(state => ({
      currentMatch: state.currentMatch ? {
        ...state.currentMatch,
        team1Setup: state.currentMatch.team1.id === teamId && state.currentMatch.team1Setup ? {
          ...state.currentMatch.team1Setup,
          impactPlayers: state.currentMatch.team1.squad.filter(p => playerIds.includes(p.id))
        } : state.currentMatch.team1Setup,
        team2Setup: state.currentMatch.team2.id === teamId && state.currentMatch.team2Setup ? {
          ...state.currentMatch.team2Setup,
          impactPlayers: state.currentMatch.team2.squad.filter(p => playerIds.includes(p.id))
        } : state.currentMatch.team2Setup,
      } : null
    }));
  },
  
  generateSampleTeams: (count) => {
    const teamNames = [
      'Mumbai Indians', 'Chennai Super Kings', 'Royal Challengers Bangalore',
      'Kolkata Knight Riders', 'Delhi Capitals', 'Punjab Kings',
      'Rajasthan Royals', 'Sunrisers Hyderabad'
    ];
    
    for (let i = 0; i < Math.min(count, teamNames.length); i++) {
      const team: Team = {
        id: generateId(),
        name: teamNames[i],
        squad: [],
        subUsed: false,
      };
      
      // Get random players from database for each team
      const availablePlayers = [...PLAYER_DATABASE];
      const selectedPlayers: string[] = [];
      
      // Ensure we have a good mix of players
      let overseasCount = 0;
      const maxOverseas = 8;
      
      while (team.squad.length < 20 && availablePlayers.length > 0) {
        const randomIndex = Math.floor(Math.random() * availablePlayers.length);
        const playerData = availablePlayers[randomIndex];
        
        // Check overseas limit
        if (playerData.isOverseas && overseasCount >= maxOverseas) {
          availablePlayers.splice(randomIndex, 1);
          continue;
        }
        
        // Check if player already selected by another team
        if (selectedPlayers.includes(playerData.name)) {
          availablePlayers.splice(randomIndex, 1);
          continue;
        }
        
        const player: Player = {
          id: generateId(),
          name: playerData.name,
          isOverseas: playerData.isOverseas,
          batSkill: playerData.batSkill,
          bowlSkill: playerData.bowlSkill,
          currentTeamId: team.id,
          performanceHistory: {
            last5MatchesRuns: 0,
            last5MatchesWickets: 0,
            totalMatches: 0,
            totalRuns: 0,
            totalWickets: 0,
            averageRuns: 0,
            averageWickets: 0,
            formRating: 50,
          },
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          dismissed: false,
          dismissalInfo: '',
          oversBowled: 0,
          maidens: 0,
          wickets: 0,
          runsConceded: 0,
          isPlaying: false,
        };
        
        team.squad.push(player);
        selectedPlayers.push(playerData.name);
        
        if (playerData.isOverseas) {
          overseasCount++;
        }
        
        availablePlayers.splice(randomIndex, 1);
      }
      
      set(state => ({
        teams: [...state.teams, team]
      }));
    }
  },
}), {
  name: 'cricket-tournament-storage',
}));