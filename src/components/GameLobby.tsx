import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useGameSession, GamePlayer } from '@/hooks/useGameSession';
import { useCricketStore } from '@/hooks/useCricketStore';
import { Copy, Users, Crown, UserCheck, Play, LogOut, AlertCircle } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import LobbyTeamCreator from './LobbyTeamCreator';
import LobbyChat from './LobbyChat';
import { Team } from '@/types/cricket';

interface GameLobbyProps {
  onGameStart: () => void;
  onBack: () => void;
}

const GameLobby = ({ onGameStart, onBack }: GameLobbyProps) => {
  const [mode, setMode] = useState<'menu' | 'create' | 'join' | 'lobby'>('menu');
  const [nickname, setNickname] = useState('');
  const [gameCode, setGameCode] = useState('');
  const { toast } = useToast();
  
  const {
    session,
    players,
    currentPlayer,
    loading,
    error,
    isConfigured,
    createSession,
    joinSession,
    selectTeam,
    updateTeams,
    startGame,
    leaveSession,
    rejoinSession,
    setError
  } = useGameSession();

  const { teams: localTeams, setTeams: setLocalTeams } = useCricketStore();
  
  // Use teams from session game_state (synced)
  const teams: Team[] = session?.game_state?.teams || [];

  const handleTeamsChange = async (newTeams: Team[]) => {
    await updateTeams(newTeams);
    // Also update local store so it's available after game starts
    setLocalTeams(newTeams);
  };

  // Try to rejoin existing session on mount
  useEffect(() => {
    rejoinSession().then((rejoined) => {
      if (rejoined) setMode('lobby');
    });
  }, [rejoinSession]);

  useEffect(() => {
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
      setError(null);
    }
  }, [error, toast, setError]);

  useEffect(() => {
    if (session?.status === 'playing') {
      onGameStart();
    }
  }, [session?.status, onGameStart]);

  const handleCreate = async () => {
    if (!nickname.trim()) {
      toast({ title: 'Enter your nickname', variant: 'destructive' });
      return;
    }
    // Pass local teams if available, otherwise empty array
    const result = await createSession(nickname.trim(), localTeams.length > 0 ? localTeams : []);
    if (result) setMode('lobby');
  };

  const handleJoin = async () => {
    if (!nickname.trim() || !gameCode.trim()) {
      toast({ title: 'Enter nickname and game code', variant: 'destructive' });
      return;
    }
    const result = await joinSession(gameCode.trim(), nickname.trim());
    if (result) setMode('lobby');
  };

  const copyCode = () => {
    if (session?.code) {
      navigator.clipboard.writeText(session.code);
      toast({ title: 'Code copied!' });
    }
  };

  const handleSelectTeam = async (teamId: string) => {
    const success = await selectTeam(teamId);
    if (success) {
      toast({ title: 'Team selected!' });
    }
  };

  const handleStart = async () => {
    // Check if all teams have managers
    const teamsWithManagers = players.filter(p => p.team_id).map(p => p.team_id);
    if (teamsWithManagers.length < 2) {
      toast({ title: 'Need at least 2 teams with managers', variant: 'destructive' });
      return;
    }
    await startGame();
  };

  const handleLeave = async () => {
    await leaveSession();
    setMode('menu');
  };

  const getTeamManager = (teamId: string): GamePlayer | undefined => {
    return players.find(p => p.team_id === teamId);
  };

  // Show error if multiplayer not configured
  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cricket-pitch via-background to-cricket-pitch/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle className="text-xl">Multiplayer Unavailable</CardTitle>
            <CardDescription>
              Database connection not configured. Please try again later or play in single-player mode.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="w-full"
            >
              Retry Connection
            </Button>
            <Button 
              onClick={onBack} 
              variant="ghost"
              className="w-full"
            >
              Back to Mode Selection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'menu') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cricket-pitch via-background to-cricket-pitch/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary">🏏 Multiplayer</CardTitle>
            <CardDescription>Play against your friends</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => setMode('create')} 
              className="w-full h-14 text-lg"
              size="lg"
            >
              <Crown className="mr-2 h-5 w-5" />
              Create Game
            </Button>
            <Button 
              onClick={() => setMode('join')} 
              variant="outline" 
              className="w-full h-14 text-lg"
              size="lg"
            >
              <Users className="mr-2 h-5 w-5" />
              Join Game
            </Button>
            <Button 
              onClick={onBack} 
              variant="ghost" 
              className="w-full"
            >
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'create' || mode === 'join') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cricket-pitch via-background to-cricket-pitch/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{mode === 'create' ? 'Create Game' : 'Join Game'}</CardTitle>
            <CardDescription>
              {mode === 'create' 
                ? 'Create a new game and share the code with friends'
                : 'Enter the game code to join'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Your Nickname</label>
              <Input
                placeholder="Enter your nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
              />
            </div>
            
            {mode === 'join' && (
              <div>
                <label className="text-sm font-medium">Game Code</label>
                <Input
                  placeholder="Enter 6-digit code"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="text-center text-xl tracking-widest font-mono"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setMode('menu')} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={mode === 'create' ? handleCreate : handleJoin}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Loading...' : mode === 'create' ? 'Create' : 'Join'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Lobby view
  return (
    <div className="min-h-screen bg-gradient-to-br from-cricket-pitch via-background to-cricket-pitch/30 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with code */}
        <Card>
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Game Code</p>
                <div className="flex items-center gap-2">
                  <span className="text-4xl font-mono font-bold tracking-widest text-primary">
                    {session?.code}
                  </span>
                  <Button variant="ghost" size="icon" onClick={copyCode}>
                    <Copy className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  <Users className="mr-2 h-4 w-4" />
                  {players.length} Players
                </Badge>
                <Button variant="destructive" size="icon" onClick={handleLeave}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Players list */}
        <Card>
          <CardHeader>
            <CardTitle>Players in Lobby</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {players.map((player) => (
                <div 
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    player.id === currentPlayer?.id ? 'bg-primary/10 border-primary' : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {player.is_admin && <Crown className="h-5 w-5 text-yellow-500" />}
                    <span className="font-medium">{player.nickname}</span>
                    {player.id === currentPlayer?.id && (
                      <Badge variant="outline" className="text-xs">You</Badge>
                    )}
                  </div>
                  {player.team_id && (
                    <Badge className="bg-cricket-pitch">
                      {teams.find(t => t.id === player.team_id)?.name || 'Team Selected'}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Management for Admin */}
        <LobbyTeamCreator 
          teams={teams}
          onTeamsChange={handleTeamsChange}
          isAdmin={currentPlayer?.is_admin || false}
        />

        {/* Team selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Your Team</CardTitle>
            <CardDescription>
              First come, first served - choose your team to manage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {teams.map((team) => {
                const manager = getTeamManager(team.id);
                const isMyTeam = currentPlayer?.team_id === team.id;
                const isTaken = !!manager && !isMyTeam;

                return (
                  <Card 
                    key={team.id}
                    className={`cursor-pointer transition-all ${
                      isMyTeam 
                        ? 'ring-2 ring-primary bg-primary/10' 
                        : isTaken 
                          ? 'opacity-60' 
                          : 'hover:shadow-lg hover:scale-[1.02]'
                    }`}
                    onClick={() => !isTaken && handleSelectTeam(team.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-lg">{team.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {team.squad.length} players
                          </p>
                        </div>
                        {manager ? (
                          <div className="text-right">
                            <UserCheck className="h-5 w-5 text-green-500 mb-1 ml-auto" />
                            <p className="text-xs text-muted-foreground">
                              {manager.nickname}
                            </p>
                          </div>
                        ) : (
                          <Badge variant="outline">Available</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {teams.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Admin needs to create teams first.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Lobby Chat */}
        {session && currentPlayer && (
          <LobbyChat 
            sessionId={session.id} 
            playerNickname={currentPlayer.nickname} 
          />
        )}

        {/* Admin controls */}
        {currentPlayer?.is_admin && (
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Admin Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleStart}
                size="lg"
                className="w-full"
                disabled={players.filter(p => p.team_id).length < 2 || teams.length < 2}
              >
                <Play className="mr-2 h-5 w-5" />
                Start Game
              </Button>
              {(teams.length < 2 || players.filter(p => p.team_id).length < 2) && (
                <p className="text-sm text-muted-foreground text-center mt-2">
                  {teams.length < 2 
                    ? 'Create at least 2 teams first' 
                    : 'Need at least 2 players with teams selected'}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GameLobby;
