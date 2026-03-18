import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Monitor, Wifi, ArrowRight, Copy, Check, ArrowLeft, Loader2 } from "lucide-react";
import { useMultiplayerStore, GameMode } from "@/hooks/useMultiplayerStore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const GameModeSelection = () => {
  const { setGameMode, createGame, joinGame, lobbyStatus, error } = useMultiplayerStore();
  const [view, setView] = useState<'choose' | 'create' | 'join'>('choose');
  const [nickname, setNickname] = useState('');
  const [gameCode, setGameCode] = useState('');
  const { toast } = useToast();

  const handleSinglePlayer = () => setGameMode('single');

  const handleCreate = async () => {
    if (!nickname.trim()) {
      toast({ title: "Enter a nickname", variant: "destructive" });
      return;
    }
    await createGame(nickname.trim());
  };

  const handleJoin = async () => {
    if (!nickname.trim() || !gameCode.trim()) {
      toast({ title: "Fill in all fields", variant: "destructive" });
      return;
    }
    await joinGame(gameCode.trim(), nickname.trim());
  };

  const isLoading = lobbyStatus === 'creating' || lobbyStatus === 'joining';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg space-y-8">
        {/* Logo / Title */}
        <div className="text-center space-y-3">
          <div className="text-6xl">🏏</div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
            T20 Cricket
          </h1>
          <p className="text-muted-foreground text-sm">
            Simulate thrilling T20 matches with full ball-by-ball action
          </p>
        </div>

        {view === 'choose' && (
          <div className="grid gap-4">
            <Card
              className="group cursor-pointer border-border/50 hover:border-primary/40 hover:shadow-glow-green transition-all duration-300"
              onClick={handleSinglePlayer}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Monitor className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground">Single Player</h3>
                  <p className="text-sm text-muted-foreground">Play locally — manage teams, simulate matches, run tournaments</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>

            <Card
              className="group cursor-pointer border-border/50 hover:border-accent/40 hover:shadow-glow-gold transition-all duration-300"
              onClick={() => setView('create')}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Wifi className="h-6 w-6 text-accent" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-foreground">Create Game</h3>
                    <Badge variant="secondary" className="text-[10px] font-bold">MULTIPLAYER</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Host a game and share the code with friends</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
              </CardContent>
            </Card>

            <Card
              className="group cursor-pointer border-border/50 hover:border-cricket-purple/40 hover:shadow-glow-purple transition-all duration-300"
              onClick={() => setView('join')}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="h-12 w-12 rounded-xl bg-cricket-purple/10 flex items-center justify-center group-hover:bg-cricket-purple/20 transition-colors">
                  <Users className="h-6 w-6 text-cricket-purple" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-foreground">Join Game</h3>
                    <Badge variant="secondary" className="text-[10px] font-bold">MULTIPLAYER</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Enter a game code to join an existing session</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-cricket-purple transition-colors" />
              </CardContent>
            </Card>
          </div>
        )}

        {(view === 'create' || view === 'join') && (
          <Card className="border-border/50">
            <CardContent className="p-6 space-y-5">
              <button
                onClick={() => setView('choose')}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <h2 className="text-xl font-bold text-foreground">
                {view === 'create' ? '🎮 Create a Game' : '🔗 Join a Game'}
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Nickname</label>
                  <Input
                    placeholder="Enter your nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    maxLength={20}
                    className="bg-background"
                  />
                </div>

                {view === 'join' && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Game Code</label>
                    <Input
                      placeholder="e.g. ABC123"
                      value={gameCode}
                      onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="bg-background uppercase tracking-widest font-mono text-lg"
                    />
                  </div>
                )}

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button
                  className="w-full shadow-sm"
                  onClick={view === 'create' ? handleCreate : handleJoin}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {view === 'create' ? 'Create Game' : 'Join Game'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GameModeSelection;
