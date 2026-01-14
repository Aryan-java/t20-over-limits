import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCricketStore } from "@/hooks/useCricketStore";
import PlayerAvatar from "./PlayerAvatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PlayerComparisonDialog from "./PlayerComparisonDialog";
import { ArrowLeftRight, Users, TrendingUp, Target, Zap, BarChart3, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const StatsTab = () => {
  const { teams } = useCricketStore();
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  const getPlayerRole = (batSkill: number, bowlSkill: number) => {
    const diff = batSkill - bowlSkill;
    if (diff > 20) return { role: "Batsman", color: "bg-orange-500/10 text-orange-600 border-orange-500/30", icon: TrendingUp };
    if (diff < -20) return { role: "Bowler", color: "bg-purple-500/10 text-purple-600 border-purple-500/30", icon: Target };
    return { role: "All-Rounder", color: "bg-primary/10 text-primary border-primary/30", icon: Zap };
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg">
                <BarChart3 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="absolute inset-0 bg-primary/30 rounded-xl blur-md" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Tournament Statistics</h2>
              <p className="text-muted-foreground">All team squads and player performance</p>
            </div>
          </div>
        </div>
        <Button 
          onClick={() => setIsComparisonOpen(true)} 
          size="lg"
          className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
        >
          <ArrowLeftRight className="h-5 w-5" />
          Compare Players
          <Sparkles className="h-4 w-4 ml-1 opacity-70" />
        </Button>
      </div>

      {/* Team Squads */}
      {teams.map((team, teamIndex) => (
        <Card key={team.id} className="stadium-card overflow-hidden group animate-fade-slide-up" style={{ animationDelay: `${teamIndex * 0.1}s` }}>
          <CardHeader className="relative overflow-hidden">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <CardTitle className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xl font-bold">{team.name}</span>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-sm px-3 py-1">
                {team.squad.length} Players
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-bold">Player</TableHead>
                    <TableHead className="font-bold">Role</TableHead>
                    <TableHead className="text-center font-bold">
                      <span className="flex items-center justify-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
                        Bat
                      </span>
                    </TableHead>
                    <TableHead className="text-center font-bold">
                      <span className="flex items-center justify-center gap-1">
                        <Target className="h-3.5 w-3.5 text-purple-500" />
                        Bowl
                      </span>
                    </TableHead>
                    <TableHead className="text-center font-bold text-cricket-green">Runs</TableHead>
                    <TableHead className="text-center font-bold text-cricket-ball">Wickets</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {team.squad.map((player, playerIndex) => {
                    const totalRuns = player.performanceHistory?.totalRuns || 0;
                    const totalWickets = player.performanceHistory?.totalWickets || 0;
                    const role = getPlayerRole(player.batSkill, player.bowlSkill);
                    const RoleIcon = role.icon;
                    
                    return (
                      <TableRow 
                        key={player.id} 
                        className="group/row hover:bg-primary/5 transition-colors animate-fade-slide-up"
                        style={{ animationDelay: `${playerIndex * 0.03}s` }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <PlayerAvatar 
                                name={player.name} 
                                imageUrl={player.imageUrl}
                                size="sm"
                              />
                              {player.isOverseas && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-background" />
                              )}
                            </div>
                            <div>
                              <span className="font-semibold group-hover/row:text-primary transition-colors">{player.name}</span>
                              {player.isOverseas && (
                                <span className="block text-xs text-blue-500">Overseas</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("gap-1 border", role.color)}>
                            <RoleIcon className="h-3 w-3" />
                            {role.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="relative inline-flex">
                            <Badge variant="outline" className="font-mono text-sm bg-orange-500/5 border-orange-500/20">
                              {player.batSkill}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-mono text-sm bg-purple-500/5 border-purple-500/20">
                            {player.bowlSkill}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            "font-bold text-lg",
                            totalRuns > 0 ? "text-cricket-green" : "text-muted-foreground"
                          )}>
                            {totalRuns}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            "font-bold text-lg",
                            totalWickets > 0 ? "text-cricket-ball" : "text-muted-foreground"
                          )}>
                            {totalWickets}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}

      {teams.length === 0 && (
        <Card className="stadium-card">
          <CardContent className="py-16 text-center">
            <div className="relative inline-block mb-4">
              <Users className="h-16 w-16 text-muted-foreground/30" />
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Teams Yet</h3>
            <p className="text-muted-foreground">Create teams to see their statistics here</p>
          </CardContent>
        </Card>
      )}

      <PlayerComparisonDialog 
        open={isComparisonOpen} 
        onOpenChange={setIsComparisonOpen} 
      />
    </div>
  );
};

export default StatsTab;
