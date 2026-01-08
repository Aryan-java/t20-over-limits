import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Zap, Trophy, User, Target, Flame } from "lucide-react";
import { Match, Player } from "@/types/cricket";

interface SuperOverDialogProps {
  match: Match;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuperOverComplete: (winner: string, result: string) => void;
}

interface SuperOverInnings {
  runs: number;
  wickets: number;
  balls: number;
  battingTeam: string;
  events: Array<{ ball: number; runs: number; isWicket: boolean; description: string }>;
}

const SuperOverDialog = ({ match, open, onOpenChange, onSuperOverComplete }: SuperOverDialogProps) => {
  const [phase, setPhase] = useState<'setup1' | 'batting1' | 'setup2' | 'batting2' | 'result'>('setup1');
  const [team1Batsmen, setTeam1Batsmen] = useState<[string, string]>(['', '']);
  const [team1Bowler, setTeam1Bowler] = useState('');
  const [team2Batsmen, setTeam2Batsmen] = useState<[string, string]>(['', '']);
  const [team2Bowler, setTeam2Bowler] = useState('');
  const [innings1, setInnings1] = useState<SuperOverInnings | null>(null);
  const [innings2, setInnings2] = useState<SuperOverInnings | null>(null);
  const [currentBall, setCurrentBall] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastBallResult, setLastBallResult] = useState<string | null>(null);

  const team1Players = match.team1Setup?.playingXI || [];
  const team2Players = match.team2Setup?.playingXI || [];

  const simulateSuperOverBall = (batsmen: Player[], bowler: Player): { runs: number; isWicket: boolean; description: string } => {
    const random = Math.random() * 100;
    
    // Super over has higher stakes - more boundaries but also more wickets
    if (random < 5) {
      const dismissedBatsman = batsmen[0];
      return { 
        runs: 0, 
        isWicket: true, 
        description: `WICKET! ${dismissedBatsman.name} is out! ${bowler.name} strikes!` 
      };
    } else if (random < 12) {
      return { runs: 6, isWicket: false, description: `SIX! Massive hit into the stands! 🚀` };
    } else if (random < 25) {
      return { runs: 4, isWicket: false, description: `FOUR! Crashing through the covers! 🔥` };
    } else if (random < 35) {
      return { runs: 2, isWicket: false, description: `Good running! Two runs taken quickly.` };
    } else if (random < 60) {
      return { runs: 1, isWicket: false, description: `Single taken. Rotate the strike.` };
    } else {
      return { runs: 0, isWicket: false, description: `Dot ball! Excellent delivery from ${bowler.name}.` };
    }
  };

  const handleStartFirstInnings = () => {
    if (!team1Batsmen[0] || !team1Batsmen[1] || !team2Bowler) return;
    
    setInnings1({
      runs: 0,
      wickets: 0,
      balls: 0,
      battingTeam: match.team1.name,
      events: []
    });
    setPhase('batting1');
    setCurrentBall(0);
  };

  const handleStartSecondInnings = () => {
    if (!team2Batsmen[0] || !team2Batsmen[1] || !team1Bowler) return;
    
    setInnings2({
      runs: 0,
      wickets: 0,
      balls: 0,
      battingTeam: match.team2.name,
      events: []
    });
    setPhase('batting2');
    setCurrentBall(0);
  };

  const handleBowlBall = (isSecondInnings: boolean) => {
    const innings = isSecondInnings ? innings2 : innings1;
    const batsmen = isSecondInnings 
      ? team2Players.filter(p => team2Batsmen.includes(p.id))
      : team1Players.filter(p => team1Batsmen.includes(p.id));
    const bowler = isSecondInnings
      ? team1Players.find(p => p.id === team1Bowler)
      : team2Players.find(p => p.id === team2Bowler);

    if (!innings || !bowler || batsmen.length < 2) return;

    setIsAnimating(true);
    
    setTimeout(() => {
      const result = simulateSuperOverBall(batsmen, bowler);
      const newEvent = { ball: innings.balls + 1, ...result };
      
      setLastBallResult(result.description);
      
      const updatedInnings = {
        ...innings,
        runs: innings.runs + result.runs,
        wickets: innings.wickets + (result.isWicket ? 1 : 0),
        balls: innings.balls + 1,
        events: [...innings.events, newEvent]
      };

      if (isSecondInnings) {
        setInnings2(updatedInnings);
      } else {
        setInnings1(updatedInnings);
      }

      // Check if innings is complete (6 balls or 2 wickets)
      if (updatedInnings.balls >= 6 || updatedInnings.wickets >= 2) {
        if (!isSecondInnings) {
          setTimeout(() => setPhase('setup2'), 1500);
        } else {
          setTimeout(() => setPhase('result'), 1500);
        }
      }

      // Check if chasing team has won
      if (isSecondInnings && innings1 && updatedInnings.runs > innings1.runs) {
        setTimeout(() => setPhase('result'), 1500);
      }

      setCurrentBall(updatedInnings.balls);
      setIsAnimating(false);
    }, 800);
  };

  const getWinner = () => {
    if (!innings1 || !innings2) return null;
    
    if (innings2.runs > innings1.runs) {
      return { team: match.team2.name, margin: `${2 - innings2.wickets} wickets` };
    } else if (innings1.runs > innings2.runs) {
      return { team: match.team1.name, margin: `${innings1.runs - innings2.runs} runs` };
    }
    return null; // Still tied (extremely rare)
  };

  useEffect(() => {
    if (phase === 'result') {
      const winner = getWinner();
      if (winner) {
        const result = `${winner.team} won Super Over by ${winner.margin}`;
        setTimeout(() => {
          onSuperOverComplete(winner.team, result);
        }, 3000);
      }
    }
  }, [phase]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-3 text-2xl">
            <Zap className="h-6 w-6 text-yellow-500 animate-pulse" />
            <span className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent font-bold">
              SUPER OVER
            </span>
            <Zap className="h-6 w-6 text-yellow-500 animate-pulse" />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dramatic Header */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-yellow-900/50 via-orange-900/50 to-red-900/50 p-4 border border-yellow-500/30">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-50" />
            <div className="relative text-center">
              <div className="flex items-center justify-center gap-4 text-lg font-bold">
                <span>{match.team1.name}</span>
                <Badge className="bg-yellow-500 text-black text-lg px-3 py-1">
                  VS
                </Badge>
                <span>{match.team2.name}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Match Tied! 6 balls to decide the winner!
              </p>
            </div>
          </div>

          {/* Score Display */}
          {(innings1 || innings2) && (
            <div className="grid grid-cols-2 gap-4">
              <Card className={`${phase === 'batting1' ? 'ring-2 ring-yellow-500' : ''}`}>
                <CardContent className="p-4 text-center">
                  <div className="text-sm text-muted-foreground">{match.team1.name}</div>
                  <div className="text-3xl font-bold mt-1">
                    {innings1?.runs || 0}/{innings1?.wickets || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ({innings1?.balls || 0}/6 balls)
                  </div>
                </CardContent>
              </Card>
              <Card className={`${phase === 'batting2' ? 'ring-2 ring-yellow-500' : ''}`}>
                <CardContent className="p-4 text-center">
                  <div className="text-sm text-muted-foreground">{match.team2.name}</div>
                  <div className="text-3xl font-bold mt-1">
                    {innings2?.runs || 0}/{innings2?.wickets || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ({innings2?.balls || 0}/6 balls)
                  </div>
                  {innings1 && (
                    <Badge variant="outline" className="mt-2">
                      Need {innings1.runs + 1 - (innings2?.runs || 0)} to win
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Last Ball Result */}
          {lastBallResult && (phase === 'batting1' || phase === 'batting2') && (
            <div className={`p-4 rounded-lg text-center animate-fade-in ${
              lastBallResult.includes('SIX') ? 'bg-green-500/20 border border-green-500' :
              lastBallResult.includes('FOUR') ? 'bg-blue-500/20 border border-blue-500' :
              lastBallResult.includes('WICKET') ? 'bg-red-500/20 border border-red-500' :
              'bg-muted/30'
            }`}>
              <p className="font-medium">{lastBallResult}</p>
            </div>
          )}

          {/* Setup Phase 1 */}
          {phase === 'setup1' && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                {match.team1.name} - Select 2 Batsmen
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Select value={team1Batsmen[0]} onValueChange={(v) => setTeam1Batsmen([v, team1Batsmen[1]])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Batsman 1" />
                  </SelectTrigger>
                  <SelectContent>
                    {team1Players.filter(p => p.id !== team1Batsmen[1]).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={team1Batsmen[1]} onValueChange={(v) => setTeam1Batsmen([team1Batsmen[0], v])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Batsman 2" />
                  </SelectTrigger>
                  <SelectContent>
                    {team1Players.filter(p => p.id !== team1Batsmen[0]).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <h3 className="font-semibold flex items-center gap-2 mt-4">
                <Target className="h-5 w-5 text-purple-500" />
                {match.team2.name} - Select Bowler
              </h3>
              <Select value={team2Bowler} onValueChange={setTeam2Bowler}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bowler" />
                </SelectTrigger>
                <SelectContent>
                  {team2Players.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                onClick={handleStartFirstInnings} 
                disabled={!team1Batsmen[0] || !team1Batsmen[1] || !team2Bowler}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold"
              >
                <Zap className="h-4 w-4 mr-2" />
                Start Super Over
              </Button>
            </div>
          )}

          {/* Batting Phase 1 */}
          {phase === 'batting1' && innings1 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold">{match.team1.name} Batting</span>
                <Badge className="bg-yellow-500 text-black">
                  Ball {innings1.balls + 1} of 6
                </Badge>
              </div>
              
              {/* Ball Display */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5, 6].map((ball) => {
                  const event = innings1.events.find(e => e.ball === ball);
                  return (
                    <div
                      key={ball}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        event
                          ? event.isWicket
                            ? 'bg-red-500 text-white'
                            : event.runs === 6
                            ? 'bg-green-500 text-white'
                            : event.runs === 4
                            ? 'bg-blue-500 text-white'
                            : 'bg-muted text-foreground'
                          : ball === innings1.balls + 1
                          ? 'bg-yellow-500/30 border-2 border-yellow-500 animate-pulse'
                          : 'bg-muted/30 border border-muted'
                      }`}
                    >
                      {event ? (event.isWicket ? 'W' : event.runs) : ball}
                    </div>
                  );
                })}
              </div>

              <Button
                onClick={() => handleBowlBall(false)}
                disabled={isAnimating || innings1.balls >= 6 || innings1.wickets >= 2}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                {isAnimating ? (
                  <span className="animate-pulse">Bowling...</span>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Bowl Next Ball
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Setup Phase 2 */}
          {phase === 'setup2' && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg text-center">
                <p className="font-semibold">{match.team1.name}: {innings1?.runs}/{innings1?.wickets}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {match.team2.name} needs {(innings1?.runs || 0) + 1} runs to win
                </p>
              </div>

              <h3 className="font-semibold flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                {match.team2.name} - Select 2 Batsmen
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Select value={team2Batsmen[0]} onValueChange={(v) => setTeam2Batsmen([v, team2Batsmen[1]])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Batsman 1" />
                  </SelectTrigger>
                  <SelectContent>
                    {team2Players.filter(p => p.id !== team2Batsmen[1]).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={team2Batsmen[1]} onValueChange={(v) => setTeam2Batsmen([team2Batsmen[0], v])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Batsman 2" />
                  </SelectTrigger>
                  <SelectContent>
                    {team2Players.filter(p => p.id !== team2Batsmen[0]).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <h3 className="font-semibold flex items-center gap-2 mt-4">
                <Target className="h-5 w-5 text-purple-500" />
                {match.team1.name} - Select Bowler
              </h3>
              <Select value={team1Bowler} onValueChange={setTeam1Bowler}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bowler" />
                </SelectTrigger>
                <SelectContent>
                  {team1Players.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                onClick={handleStartSecondInnings} 
                disabled={!team2Batsmen[0] || !team2Batsmen[1] || !team1Bowler}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold"
              >
                <Zap className="h-4 w-4 mr-2" />
                Start Chase
              </Button>
            </div>
          )}

          {/* Batting Phase 2 */}
          {phase === 'batting2' && innings2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold">{match.team2.name} Batting</span>
                <Badge className="bg-yellow-500 text-black">
                  Ball {innings2.balls + 1} of 6
                </Badge>
              </div>
              
              {/* Ball Display */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5, 6].map((ball) => {
                  const event = innings2.events.find(e => e.ball === ball);
                  return (
                    <div
                      key={ball}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        event
                          ? event.isWicket
                            ? 'bg-red-500 text-white'
                            : event.runs === 6
                            ? 'bg-green-500 text-white'
                            : event.runs === 4
                            ? 'bg-blue-500 text-white'
                            : 'bg-muted text-foreground'
                          : ball === innings2.balls + 1
                          ? 'bg-yellow-500/30 border-2 border-yellow-500 animate-pulse'
                          : 'bg-muted/30 border border-muted'
                      }`}
                    >
                      {event ? (event.isWicket ? 'W' : event.runs) : ball}
                    </div>
                  );
                })}
              </div>

              <Button
                onClick={() => handleBowlBall(true)}
                disabled={isAnimating || innings2.balls >= 6 || innings2.wickets >= 2 || innings2.runs > (innings1?.runs || 0)}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                {isAnimating ? (
                  <span className="animate-pulse">Bowling...</span>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Bowl Next Ball
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Result Phase */}
          {phase === 'result' && (
            <div className="text-center space-y-6 animate-scale-in">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 blur-xl" />
                <div className="relative p-8 rounded-xl bg-gradient-to-r from-yellow-900/50 via-orange-900/50 to-red-900/50 border border-yellow-500/50">
                  <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                    {getWinner()?.team} WINS!
                  </h2>
                  <p className="text-lg text-muted-foreground mt-2">
                    Super Over Victory by {getWinner()?.margin}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="p-3 bg-background/50 rounded-lg">
                      <div className="text-sm text-muted-foreground">{match.team1.name}</div>
                      <div className="text-2xl font-bold">{innings1?.runs}/{innings1?.wickets}</div>
                    </div>
                    <div className="p-3 bg-background/50 rounded-lg">
                      <div className="text-sm text-muted-foreground">{match.team2.name}</div>
                      <div className="text-2xl font-bold">{innings2?.runs}/{innings2?.wickets}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuperOverDialog;
