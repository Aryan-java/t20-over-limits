import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Team } from "@/types/cricket";
import { PlayerCard } from "./PlayerCard";
import { SkillRadarChart } from "@/components/ui/SkillRadarChart";
import { Users, Globe, TrendingUp, Target, Trophy, Zap, LayoutGrid, List } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TeamDetailsDialogProps {
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TeamDetailsDialog = ({ team, open, onOpenChange }: TeamDetailsDialogProps) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  if (!team) return null;

  const overseasCount = team.squad.filter(p => p.isOverseas).length;
  const avgBatSkill = Math.round(team.squad.reduce((sum, p) => sum + p.batSkill, 0) / team.squad.length);
  const avgBowlSkill = Math.round(team.squad.reduce((sum, p) => sum + p.bowlSkill, 0) / team.squad.length);
  
  // Get top players
  const topBatsman = [...team.squad].sort((a, b) => b.batSkill - a.batSkill)[0];
  const topBowler = [...team.squad].sort((a, b) => b.bowlSkill - a.bowlSkill)[0];
  
  // Role breakdown
  const batsmen = team.squad.filter(p => p.batSkill > p.bowlSkill + 15);
  const bowlers = team.squad.filter(p => p.bowlSkill > p.batSkill + 15);
  const allRounders = team.squad.filter(p => Math.abs(p.batSkill - p.bowlSkill) <= 15);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
        {/* Header with gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-cricket-purple/10 p-6 border-b">
          <div className="absolute inset-0 bg-pitch-pattern opacity-10" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <DialogHeader className="relative">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-cricket-purple flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                  {team.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cricket-gold flex items-center justify-center text-xs font-bold text-white">
                  {team.squad.length}
                </div>
              </div>
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold">{team.name}</DialogTitle>
                <p className="text-muted-foreground mt-1">Team Overview & Squad Management</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    <Users className="h-3 w-3 mr-1" />
                    {team.squad.length} Players
                  </Badge>
                  <Badge variant="outline" className="border-cricket-purple/30 text-cricket-purple">
                    <Globe className="h-3 w-3 mr-1" />
                    {overseasCount} Overseas
                  </Badge>
                </div>
              </div>
              
              {/* Team Radar Chart */}
              <div className="hidden md:block">
                <SkillRadarChart
                  batting={avgBatSkill}
                  bowling={avgBowlSkill}
                  size={120}
                />
              </div>
            </div>
          </DialogHeader>
        </div>
        
        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="p-6 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="stadium-card rounded-xl p-4 text-center group hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary">{team.squad.length}</div>
                <div className="text-xs text-muted-foreground">Squad Size</div>
              </div>
              <div className="stadium-card rounded-xl p-4 text-center group hover:border-cricket-purple/30 transition-colors">
                <div className="w-10 h-10 mx-auto rounded-lg bg-cricket-purple/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Globe className="h-5 w-5 text-cricket-purple" />
                </div>
                <div className="text-2xl font-bold text-cricket-purple">{overseasCount}</div>
                <div className="text-xs text-muted-foreground">Overseas</div>
              </div>
              <div className="stadium-card rounded-xl p-4 text-center group hover:border-cricket-gold/30 transition-colors">
                <div className="w-10 h-10 mx-auto rounded-lg bg-cricket-gold/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-5 w-5 text-cricket-gold" />
                </div>
                <div className="text-2xl font-bold text-cricket-gold">{avgBatSkill}</div>
                <div className="text-xs text-muted-foreground">Avg Batting</div>
              </div>
              <div className="stadium-card rounded-xl p-4 text-center group hover:border-cricket-ball/30 transition-colors">
                <div className="w-10 h-10 mx-auto rounded-lg bg-cricket-ball/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Target className="h-5 w-5 text-cricket-ball" />
                </div>
                <div className="text-2xl font-bold text-cricket-ball">{avgBowlSkill}</div>
                <div className="text-xs text-muted-foreground">Avg Bowling</div>
              </div>
            </div>

            {/* Star Players */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="stadium-card rounded-xl p-4 border-cricket-gold/20 hover:border-cricket-gold/40 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="h-4 w-4 text-cricket-gold" />
                  <span className="text-sm font-semibold text-cricket-gold">Top Batsman</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cricket-gold/30 to-cricket-gold/10 flex items-center justify-center font-bold text-lg">
                    {topBatsman.name.substring(0, 2)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{topBatsman.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={topBatsman.batSkill} className="h-2 flex-1" />
                      <span className="text-sm font-bold text-cricket-gold">{topBatsman.batSkill}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="stadium-card rounded-xl p-4 border-cricket-purple/20 hover:border-cricket-purple/40 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-cricket-purple" />
                  <span className="text-sm font-semibold text-cricket-purple">Top Bowler</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cricket-purple/30 to-cricket-purple/10 flex items-center justify-center font-bold text-lg">
                    {topBowler.name.substring(0, 2)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{topBowler.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={topBowler.bowlSkill} className="h-2 flex-1" />
                      <span className="text-sm font-bold text-cricket-purple">{topBowler.bowlSkill}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Role Breakdown */}
            <div className="flex items-center justify-center gap-8 py-4 stadium-card rounded-xl">
              <div className="text-center">
                <div className="text-2xl font-bold text-cricket-gold">{batsmen.length}</div>
                <div className="text-xs text-muted-foreground">Batsmen</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{allRounders.length}</div>
                <div className="text-xs text-muted-foreground">All-Rounders</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <div className="text-2xl font-bold text-cricket-purple">{bowlers.length}</div>
                <div className="text-xs text-muted-foreground">Bowlers</div>
              </div>
            </div>

            <Tabs defaultValue="squad" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="squad" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    <Users className="h-4 w-4 mr-2" />
                    Full Squad
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", viewMode === "grid" && "bg-muted")}
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", viewMode === "list" && "bg-muted")}
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <TabsContent value="squad" className="mt-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Squad ({team.squad.length}/25)</h3>
                  <Badge variant="outline" className="border-cricket-purple/30 text-cricket-purple">
                    <Globe className="h-3 w-3 mr-1" />
                    {overseasCount}/8 overseas
                  </Badge>
                </div>
                
                <div className={cn(
                  viewMode === "grid" 
                    ? "grid grid-cols-1 md:grid-cols-2 gap-4" 
                    : "space-y-3"
                )}>
                  {team.squad.map((player, index) => (
                    <div
                      key={player.id}
                      onClick={() => {
                        navigate(`/player/${player.id}`);
                        onOpenChange(false);
                      }}
                      className="animate-fade-slide-up"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <PlayerCard
                        player={player}
                        variant="compact"
                        index={index}
                        showMilestones={false}
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TeamDetailsDialog;