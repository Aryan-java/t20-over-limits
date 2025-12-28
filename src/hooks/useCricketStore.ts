import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Team, Player, Match, Fixture, MatchHistory, Tournament, TradeProposal } from '@/types/cricket';
import { PLAYER_DATABASE } from '@/data/playerDatabase';


interface CricketStore {
  teams: Team[];
  fixtures: Fixture[];
  currentMatch: Match | null;
  matchHistory: MatchHistory[];
  tournament: Tournament | null;
  tradeProposals: TradeProposal[];

  // Team actions
  addTeam: (team: Omit<Team, 'id' | 'playingXI' | 'impactOptions' | 'subUsed'>) => void;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  removeTeam: (id: string) => void;
  resetTeams: () => void;

  // Player actions
  addPlayerToTeam: (teamId: string, player: Omit<Player, 'id' | 'position'>) => void;
  updatePlayer: (teamId: string, playerId: string, updates: Partial<Player>) => void;
  removePlayerFromTeam: (teamId: string, playerId: string) => void;
  tradePlayers: (team1Id: string, team1PlayerIds: string[], team2Id: string, team2PlayerIds: string[]) => void;

  // Trade Proposal actions
  createTradeProposal: (fromTeamId: string, fromTeamPlayerIds: string[], toTeamId: string, toTeamPlayerIds: string[]) => void;
  acceptTradeProposal: (proposalId: string) => void;
  rejectTradeProposal: (proposalId: string) => void;
  getTeamProposals: (teamId: string) => { sent: TradeProposal[]; received: TradeProposal[] };

  // Fixture actions
  generateFixtures: (format?: 'single' | 'double') => void;
  resetFixtures: () => void;
  
  // Tournament actions
  initializeTournament: (format: 'single' | 'double') => void;
  startPlayoffs: () => void;
  updateTournamentStats: () => void;
  resetTournament: () => void;

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
  widesConceded: 0,
  noBallsConceded: 0,
  dotBalls: 0,
});

export const useCricketStore = create<CricketStore>()(persist((set, get) => ({
  teams: [],
  fixtures: [],
  currentMatch: null,
  matchHistory: [],
  tournament: null,
  tradeProposals: [],
  
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

  resetTeams: () => {
    set({
      teams: [],
      fixtures: [],
      tournament: null,
      matchHistory: [],
      currentMatch: null,
    });
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

  tradePlayers: (team1Id, team1PlayerIds, team2Id, team2PlayerIds) => {
    set(state => {
      const team1 = state.teams.find(t => t.id === team1Id);
      const team2 = state.teams.find(t => t.id === team2Id);

      if (!team1 || !team2) return state;

      // Get players to trade
      const team1PlayersToTrade = team1.squad.filter(p => team1PlayerIds.includes(p.id));
      const team2PlayersToTrade = team2.squad.filter(p => team2PlayerIds.includes(p.id));

      // Update team IDs for traded players
      const team1PlayersWithNewTeam = team2PlayersToTrade.map(p => ({ ...p, currentTeamId: team1Id }));
      const team2PlayersWithNewTeam = team1PlayersToTrade.map(p => ({ ...p, currentTeamId: team2Id }));

      return {
        teams: state.teams.map(team => {
          if (team.id === team1Id) {
            return {
              ...team,
              squad: [
                ...team.squad.filter(p => !team1PlayerIds.includes(p.id)),
                ...team1PlayersWithNewTeam,
              ],
            };
          }
          if (team.id === team2Id) {
            return {
              ...team,
              squad: [
                ...team.squad.filter(p => !team2PlayerIds.includes(p.id)),
                ...team2PlayersWithNewTeam,
              ],
            };
          }
          return team;
        }),
      };
    });
  },

  createTradeProposal: (fromTeamId, fromTeamPlayerIds, toTeamId, toTeamPlayerIds) => {
    const proposal: TradeProposal = {
      id: generateId(),
      fromTeamId,
      toTeamId,
      fromTeamPlayerIds,
      toTeamPlayerIds,
      status: 'pending',
      createdAt: new Date(),
    };

    set(state => ({
      tradeProposals: [...state.tradeProposals, proposal],
    }));
  },

  acceptTradeProposal: (proposalId) => {
    const state = get();
    const proposal = state.tradeProposals.find(p => p.id === proposalId);

    if (!proposal || proposal.status !== 'pending') return;

    // Execute the trade
    get().tradePlayers(
      proposal.fromTeamId,
      proposal.fromTeamPlayerIds,
      proposal.toTeamId,
      proposal.toTeamPlayerIds
    );

    // Update proposal status
    set(state => ({
      tradeProposals: state.tradeProposals.map(p =>
        p.id === proposalId
          ? { ...p, status: 'accepted' as const, respondedAt: new Date() }
          : p
      ),
    }));
  },

  rejectTradeProposal: (proposalId) => {
    set(state => ({
      tradeProposals: state.tradeProposals.map(p =>
        p.id === proposalId
          ? { ...p, status: 'rejected' as const, respondedAt: new Date() }
          : p
      ),
    }));
  },

  getTeamProposals: (teamId) => {
    const state = get();
    return {
      sent: state.tradeProposals.filter(p => p.fromTeamId === teamId),
      received: state.tradeProposals.filter(p => p.toTeamId === teamId && p.status === 'pending'),
    };
  },
  
  generateFixtures: (format: 'single' | 'double' = 'single') => {
    const { teams } = get();
    const fixtures: Fixture[] = [];
    
    // Generate first round of fixtures
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        fixtures.push({
          id: generateId(),
          team1: teams[i],
          team2: teams[j],
          played: false,
          stage: 'league',
        });
      }
    }
    
    // For double round-robin, add reverse fixtures
    if (format === 'double') {
      const reverseFixtures = fixtures.map(f => ({
        id: generateId(),
        team1: f.team2,
        team2: f.team1,
        played: false,
        stage: 'league' as const,
      }));
      fixtures.push(...reverseFixtures);
    }
    
    // Shuffle fixtures
    for (let i = fixtures.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fixtures[i], fixtures[j]] = [fixtures[j], fixtures[i]];
    }
    
    set({ fixtures });
    get().initializeTournament(format);
  },

  resetFixtures: () => {
    set({
      fixtures: [],
      tournament: null,
      matchHistory: [],
      currentMatch: null,
    });
  },

  initializeTournament: (format: 'single' | 'double') => {
    const { fixtures } = get();
    const tournament: Tournament = {
      format,
      leagueMatches: fixtures.filter(f => f.stage === 'league'),
      playoffMatches: {
        qualifier1: null,
        eliminator: null,
        qualifier2: null,
        final: null,
      },
      isLeagueComplete: false,
      isPlayoffStarted: false,
      orangeCapHolder: null,
      purpleCapHolder: null,
    };
    set({ tournament });
  },

  startPlayoffs: () => {
    const { teams, matchHistory } = get();
    
    // Calculate points table to get top 4 teams
    const teamStats = teams.map(team => {
      const matches = matchHistory.filter(
        m => m.team1.id === team.id || m.team2.id === team.id
      );
      
      let wins = 0, points = 0, totalRunsScored = 0, totalRunsConceded = 0, totalBallsFaced = 0, totalBallsBowled = 0;
      
      matches.forEach(match => {
        const isTeam1 = match.team1.id === team.id;
        const teamInnings = isTeam1 ? match.firstInnings : match.secondInnings;
        const opposingInnings = isTeam1 ? match.secondInnings : match.firstInnings;
        
        if (teamInnings) {
          totalRunsScored += teamInnings.totalRuns;
          totalBallsFaced += teamInnings.ballsBowled;
        }
        if (opposingInnings) {
          totalRunsConceded += opposingInnings.totalRuns;
          totalBallsBowled += opposingInnings.ballsBowled;
        }
        
        if (match.result?.includes(team.name)) {
          wins++;
          points += 2;
        }
      });
      
      const nrr = totalBallsFaced > 0 && totalBallsBowled > 0
        ? (totalRunsScored / (totalBallsFaced / 6)) - (totalRunsConceded / (totalBallsBowled / 6))
        : 0;
      
      return { team, points, nrr, wins };
    });
    
    // Sort by points, then NRR
    teamStats.sort((a, b) => b.points - a.points || b.nrr - a.nrr);
    
    const top4 = teamStats.slice(0, 4);
    
    // Create playoff fixtures
    const qualifier1: Fixture = {
      id: generateId(),
      team1: top4[0].team,
      team2: top4[1].team,
      played: false,
      stage: 'qualifier1',
    };
    
    const eliminator: Fixture = {
      id: generateId(),
      team1: top4[2].team,
      team2: top4[3].team,
      played: false,
      stage: 'eliminator',
    };
    
    set(state => ({
      tournament: state.tournament ? {
        ...state.tournament,
        playoffMatches: {
          ...state.tournament.playoffMatches,
          qualifier1,
          eliminator,
        },
        isLeagueComplete: true,
        isPlayoffStarted: true,
      } : null,
      fixtures: [...state.fixtures, qualifier1, eliminator],
    }));
  },

  updateTournamentStats: () => {
    const { teams, matchHistory } = get();
    
    let maxRuns = 0;
    let maxWickets = 0;
    let orangeCapPlayer: Player | null = null;
    let purpleCapPlayer: Player | null = null;
    
    teams.forEach(team => {
      team.squad.forEach(player => {
        const totalRuns = player.performanceHistory?.totalRuns || 0;
        const totalWickets = player.performanceHistory?.totalWickets || 0;
        
        if (totalRuns > maxRuns) {
          maxRuns = totalRuns;
          orangeCapPlayer = player;
        }
        
        if (totalWickets > maxWickets) {
          maxWickets = totalWickets;
          purpleCapPlayer = player;
        }
      });
    });
    
    set(state => ({
      tournament: state.tournament ? {
        ...state.tournament,
        orangeCapHolder: orangeCapPlayer ? { player: orangeCapPlayer, runs: maxRuns } : null,
        purpleCapHolder: purpleCapPlayer ? { player: purpleCapPlayer, wickets: maxWickets } : null,
      } : null,
    }));
  },

  resetTournament: () => {
    set({
      fixtures: [],
      tournament: null,
      matchHistory: [],
      currentMatch: null,
    });
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

    // Get all players who played in the match from both team setups
    const team1Players = match.team1Setup?.playingXI || [];
    const team2Players = match.team2Setup?.playingXI || [];
    const allPlayers = [...team1Players, ...team2Players];

    console.log('Completing match - players who played:', allPlayers.length);

    // Create a map of player stats from the completed match
    const matchPlayerStats = new Map<string, { runs: number; wickets: number; name: string }>();
    allPlayers.forEach(player => {
      matchPlayerStats.set(player.id, {
        runs: player.runs,
        wickets: player.wickets,
        name: player.name
      });
      console.log(`Player ${player.name}: ${player.runs} runs, ${player.wickets} wickets`);
    });

    // Apply all updates in a single state change
    set(state => ({
      teams: state.teams.map(team => {
        // Check if this team was in the match
        const isTeam1 = team.id === match.team1.id;
        const isTeam2 = team.id === match.team2.id;

        if (!isTeam1 && !isTeam2) return team;

        return {
          ...team,
          squad: team.squad.map(statePlayer => {
            // Check if this player played in the match
            const matchStats = matchPlayerStats.get(statePlayer.id);

            if (!matchStats) return statePlayer;

            console.log(`Updating stats for ${matchStats.name}: +${matchStats.runs} runs, +${matchStats.wickets} wickets`);

            // Update performance history with match stats
            const currentHistory = statePlayer.performanceHistory || {
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
              last5MatchesRuns: currentHistory.last5MatchesRuns + matchStats.runs,
              last5MatchesWickets: currentHistory.last5MatchesWickets + matchStats.wickets,
              totalMatches: currentHistory.totalMatches + 1,
              totalRuns: currentHistory.totalRuns + matchStats.runs,
              totalWickets: currentHistory.totalWickets + matchStats.wickets,
              averageRuns: (currentHistory.totalRuns + matchStats.runs) / (currentHistory.totalMatches + 1),
              averageWickets: (currentHistory.totalWickets + matchStats.wickets) / (currentHistory.totalMatches + 1),
              formRating: Math.min(100, Math.max(0, 50 + matchStats.runs * 0.1 + matchStats.wickets * 2)),
            };

            console.log(`New totals for ${matchStats.name}: ${updatedHistory.totalRuns} runs, ${updatedHistory.totalWickets} wickets`);

            // Reset match-specific stats for the next game
            return {
              ...statePlayer,
              performanceHistory: updatedHistory,
              runs: 0,
              balls: 0,
              fours: 0,
              sixes: 0,
              wickets: 0,
              runsConceded: 0,
              oversBowled: 0,
              maidens: 0,
              dismissed: false,
              dismissalInfo: '',
              isPlaying: false,
            };
          }),
        };
      }),
      matchHistory: [...state.matchHistory, completedMatch],
      fixtures: state.fixtures.map(fixture =>
        (fixture.team1.id === match.team1.id && fixture.team2.id === match.team2.id) ||
        (fixture.team1.id === match.team2.id && fixture.team2.id === match.team1.id)
          ? { ...fixture, played: true, match: completedMatch }
          : fixture
      ),
      currentMatch: null,
    }));
    
    // Update tournament stats after match completion
    get().updateTournamentStats();
    
    // Check if league is complete
    const { fixtures, tournament } = get();
    if (tournament && !tournament.isLeagueComplete) {
      const leagueMatches = fixtures.filter(f => f.stage === 'league');
      const allLeagueComplete = leagueMatches.every(f => f.played);
      
      if (allLeagueComplete) {
        set(state => ({
          tournament: state.tournament ? {
            ...state.tournament,
            isLeagueComplete: true,
          } : null,
        }));
      }
    }

    // Handle playoff progression
    if (tournament?.isPlayoffStarted) {
      const state = get();
      const currentFixtures = state.fixtures;
      const currentTournament = state.tournament;
      
      // Get playoff fixtures
      const qualifier1Fixture = currentFixtures.find(f => f.stage === 'qualifier1');
      const eliminatorFixture = currentFixtures.find(f => f.stage === 'eliminator');
      const qualifier2Fixture = currentFixtures.find(f => f.stage === 'qualifier2');
      
      // Check if both Qualifier 1 and Eliminator are complete, and Qualifier 2 doesn't exist yet
      if (qualifier1Fixture?.played && eliminatorFixture?.played && !qualifier2Fixture) {
        // Get winner of Eliminator and loser of Qualifier 1
        const eliminatorWinner = eliminatorFixture.match?.result?.includes(eliminatorFixture.team1.name) 
          ? eliminatorFixture.team1 
          : eliminatorFixture.team2;
        
        const qualifier1Loser = qualifier1Fixture.match?.result?.includes(qualifier1Fixture.team1.name)
          ? qualifier1Fixture.team2
          : qualifier1Fixture.team1;
        
        // Create Qualifier 2: Loser of Q1 vs Winner of Eliminator
        const qualifier2: Fixture = {
          id: generateId(),
          team1: qualifier1Loser,
          team2: eliminatorWinner,
          played: false,
          stage: 'qualifier2',
        };
        
        set(state => ({
          tournament: state.tournament ? {
            ...state.tournament,
            playoffMatches: {
              ...state.tournament.playoffMatches,
              qualifier2,
            },
          } : null,
          fixtures: [...state.fixtures, qualifier2],
        }));
      }
      
      // Check if both Qualifier 1 and Qualifier 2 are complete, create Final
      const updatedState = get();
      const updatedQ2 = updatedState.fixtures.find(f => f.stage === 'qualifier2');
      const finalFixture = updatedState.fixtures.find(f => f.stage === 'final');
      
      if (qualifier1Fixture?.played && updatedQ2?.played && !finalFixture) {
        // Get winners
        const qualifier1Winner = qualifier1Fixture.match?.result?.includes(qualifier1Fixture.team1.name)
          ? qualifier1Fixture.team1
          : qualifier1Fixture.team2;
        
        const qualifier2Winner = updatedQ2.match?.result?.includes(updatedQ2.team1.name)
          ? updatedQ2.team1
          : updatedQ2.team2;
        
        // Create Final: Winner of Q1 vs Winner of Q2
        const final: Fixture = {
          id: generateId(),
          team1: qualifier1Winner,
          team2: qualifier2Winner,
          played: false,
          stage: 'final',
        };
        
        set(state => ({
          tournament: state.tournament ? {
            ...state.tournament,
            playoffMatches: {
              ...state.tournament.playoffMatches,
              final,
            },
          } : null,
          fixtures: [...state.fixtures, final],
        }));
      }
    }
  },

  getMatchHistory: () => {
    return get().matchHistory.sort((a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  },
  
  setPlayingXI: (teamId: string, playerIds: string[]) => {
    set(state => {
      // Update teams with lastMatchSetup
      const updatedTeams = state.teams.map(team => {
        if (team.id === teamId) {
          return {
            ...team,
            lastMatchSetup: {
              ...team.lastMatchSetup,
              playingXI: playerIds,
              impactPlayers: team.lastMatchSetup?.impactPlayers || [],
              openingPair: team.lastMatchSetup?.openingPair || ["", ""]
            }
          };
        }
        return team;
      });

      return {
        teams: updatedTeams,
        currentMatch: state.currentMatch ? {
          ...state.currentMatch,
          team1: updatedTeams.find(t => t.id === state.currentMatch!.team1.id) || state.currentMatch.team1,
          team2: updatedTeams.find(t => t.id === state.currentMatch!.team2.id) || state.currentMatch.team2,
          team1Setup: state.currentMatch.team1.id === teamId && state.currentMatch.team1Setup ? {
            ...state.currentMatch.team1Setup,
            playingXI: updatedTeams.find(t => t.id === teamId)!.squad.filter(p => playerIds.includes(p.id))
          } : state.currentMatch.team1Setup,
          team2Setup: state.currentMatch.team2.id === teamId && state.currentMatch.team2Setup ? {
            ...state.currentMatch.team2Setup,
            playingXI: updatedTeams.find(t => t.id === teamId)!.squad.filter(p => playerIds.includes(p.id))
          } : state.currentMatch.team2Setup,
        } : null
      };
    });
  },
  
  setImpactPlayers: (teamId: string, playerIds: string[]) => {
    set(state => {
      // Update teams with lastMatchSetup
      const updatedTeams = state.teams.map(team => {
        if (team.id === teamId) {
          return {
            ...team,
            lastMatchSetup: {
              ...team.lastMatchSetup!,
              impactPlayers: playerIds,
            }
          };
        }
        return team;
      });

      return {
        teams: updatedTeams,
        currentMatch: state.currentMatch ? {
          ...state.currentMatch,
          team1: updatedTeams.find(t => t.id === state.currentMatch!.team1.id) || state.currentMatch.team1,
          team2: updatedTeams.find(t => t.id === state.currentMatch!.team2.id) || state.currentMatch.team2,
          team1Setup: state.currentMatch.team1.id === teamId && state.currentMatch.team1Setup ? {
            ...state.currentMatch.team1Setup,
            impactPlayers: updatedTeams.find(t => t.id === teamId)!.squad.filter(p => playerIds.includes(p.id))
          } : state.currentMatch.team1Setup,
          team2Setup: state.currentMatch.team2.id === teamId && state.currentMatch.team2Setup ? {
            ...state.currentMatch.team2Setup,
            impactPlayers: updatedTeams.find(t => t.id === teamId)!.squad.filter(p => playerIds.includes(p.id))
          } : state.currentMatch.team2Setup,
        } : null
      };
    });
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
          imageUrl: playerData.imageUrl,
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
          widesConceded: 0,
          noBallsConceded: 0,
          dotBalls: 0,
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