import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Team } from "@/types/cricket";
import PlayerRow from "./PlayerRow";
import { Users, Globe, TrendingUp, Target, Trophy, Zap } from "lucide-react";

interface TeamDetailsDialogProps {
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TeamDetailsDialog = ({ team, open, onOpenChange }: TeamDetailsDialogProps) => {
  const navigate = useNavigate();
  
  if (!team) return null;

  const overseasCount = team.squad.filter(p => p.isOverseas).length;
  const avgBatSkill = Math.round(team.squad.reduce((sum, p) => sum + p.batSkill, 0) / team.squad.length);
  const avgBowlSkill = Math.round(team.squad.reduce((sum, p) => sum + p.bowlSkill, 0) / team.squad.length);
  
  // Get top players
  const topBatsman = [...team.squad].sort((a, b) => b.batSkill - a.batSkill)[0];
  const topBowler = [...team.squad].sort((a, b) => b.bowlSkill - a.bowlSkill)[0];
  
  // Role breakdown
  const batsmen = team.squad.filter(p => p.batSkill > p.bowlSkill + 15).length;
  const bowlers = team.squad.filter(p => p.bowlSkill > p.batSkill + 15).length;
  const allRounders = team.squad.length - batsmen - bowlers;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-0">
        {/* Header with gradient */}
        <div className="relative overflow-hidden bg-gradient-to-r from-cricket-green/20 via-cricket-pitch/10 to-cricket-green/20 p-6 border-b">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgzNCwxOTcsMTAwLDAuMSkiLz48L3N2Zz4=')] opacity-50" />
          <DialogHeader className="relative">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cricket-green to-cricket-pitch flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                {team.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">{team.name}</DialogTitle>
                <p className="text-muted-foreground mt-1">Team Overview & Squad Details</p>
              </div>
            </div>
          </DialogHeader>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass rounded-xl p-4 text-center border border-cricket-green/20 hover:border-cricket-green/40 transition-colors">
              <div className="w-10 h-10 mx-auto rounded-lg bg-cricket-green/10 flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-cricket-green" />
              </div>
              <div className="text-2xl font-bold text-cricket-green">{team.squad.length}</div>
              <div className="text-xs text-muted-foreground">Squad Size</div>
            </div>
            <div className="glass rounded-xl p-4 text-center border border-cricket-purple/20 hover:border-cricket-purple/40 transition-colors">
              <div className="w-10 h-10 mx-auto rounded-lg bg-cricket-purple/10 flex items-center justify-center mb-2">
                <Globe className="h-5 w-5 text-cricket-purple" />
              </div>
              <div className="text-2xl font-bold text-cricket-purple">{overseasCount}</div>
              <div className="text-xs text-muted-foreground">Overseas</div>
            </div>
            <div className="glass rounded-xl p-4 text-center border border-score-four/20 hover:border-score-four/40 transition-colors">
              <div className="w-10 h-10 mx-auto rounded-lg bg-score-four/10 flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-score-four" />
              </div>
              <div className="text-2xl font-bold text-score-four">{avgBatSkill}</div>
              <div className="text-xs text-muted-foreground">Avg Batting</div>
            </div>
            <div className="glass rounded-xl p-4 text-center border border-cricket-ball/20 hover:border-cricket-ball/40 transition-colors">
              <div className="w-10 h-10 mx-auto rounded-lg bg-cricket-ball/10 flex items-center justify-center mb-2">
                <Target className="h-5 w-5 text-cricket-ball" />
              </div>
              <div className="text-2xl font-bold text-cricket-ball">{avgBowlSkill}</div>
              <div className="text-xs text-muted-foreground">Avg Bowling</div>
            </div>
          </div>

          {/* Star Players */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass rounded-xl p-4 border border-score-four/20">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-4 w-4 text-score-four" />
                <span className="text-sm font-semibold text-score-four">Top Batsman</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-score-four/30 to-score-four/10 flex items-center justify-center font-bold">
                  {topBatsman.name.substring(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{topBatsman.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={topBatsman.batSkill} className="h-2 flex-1" />
                    <span className="text-sm font-bold text-score-four">{topBatsman.batSkill}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="glass rounded-xl p-4 border border-cricket-ball/20">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-cricket-ball" />
                <span className="text-sm font-semibold text-cricket-ball">Top Bowler</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cricket-ball/30 to-cricket-ball/10 flex items-center justify-center font-bold">
                  {topBowler.name.substring(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{topBowler.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={topBowler.bowlSkill} className="h-2 flex-1" />
                    <span className="text-sm font-bold text-cricket-ball">{topBowler.bowlSkill}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Role Breakdown */}
          <div className="flex items-center justify-center gap-6 py-3 glass rounded-xl border">
            <div className="text-center">
              <div className="text-lg font-bold text-cricket-green">{batsmen}</div>
              <div className="text-xs text-muted-foreground">Batsmen</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="text-lg font-bold text-cricket-purple">{allRounders}</div>
              <div className="text-xs text-muted-foreground">All-Rounders</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="text-lg font-bold text-cricket-ball">{bowlers}</div>
              <div className="text-xs text-muted-foreground">Bowlers</div>
            </div>
          </div>

          <Tabs defaultValue="squad" className="w-full">
            <TabsList className="grid w-full grid-cols-1 bg-muted/50">
              <TabsTrigger value="squad" className="data-[state=active]:bg-cricket-green/10 data-[state=active]:text-cricket-green">
                <Users className="h-4 w-4 mr-2" />
                Full Squad
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="squad" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Squad ({team.squad.length}/25)</h3>
                <div className="flex space-x-2">
                  <Badge variant="outline" className="border-cricket-purple/30 text-cricket-purple">
                    <Globe className="h-3 w-3 mr-1" />
                    {overseasCount}/8 overseas
                  </Badge>
                </div>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {team.squad.map((player, index) => (
                  <div 
                    key={player.id} 
                    onClick={() => {
                      navigate(`/player/${player.id}`);
                      onOpenChange(false);
                    }}
                    className="cursor-pointer animate-fade-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <PlayerRow player={player} />
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamDetailsDialog;