import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCricketStore } from "@/hooks/useCricketStore";
import PlayerAvatar from "./PlayerAvatar";
import { Player } from "@/types/cricket";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BestXIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BestXIDialog = ({ open, onOpenChange }: BestXIDialogProps) => {
  const { teams } = useCricketStore();
  const { toast } = useToast();
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<{
    selectedPlayers: string[];
    reasoning: string;
    teamComposition: {
      batsmen: string[];
      allRounders: string[];
      bowlers: string[];
    };
  } | null>(null);

  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  const handleGenerateRecommendation = async () => {
    if (!selectedTeam) return;

    setIsLoading(true);
    setRecommendation(null);

    try {
      const { data, error } = await supabase.functions.invoke('recommend-best-xi', {
        body: {
          teamId: selectedTeam.id,
          players: selectedTeam.squad,
        },
      });

      if (error) {
        console.error('Error invoking function:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to generate recommendation",
          variant: "destructive",
        });
        return;
      }

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setRecommendation(data);
      toast({
        title: "Success",
        description: "Best XI recommendation generated!",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to generate recommendation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPlayerById = (playerId: string): Player | undefined => {
    return selectedTeam?.squad.find(p => p.id === playerId);
  };

  const getPlayersByCategory = (category: 'batsmen' | 'allRounders' | 'bowlers'): Player[] => {
    if (!recommendation) return [];
    const playerIds = recommendation.teamComposition[category] || [];
    return playerIds.map(id => getPlayerById(id)).filter(p => p !== undefined) as Player[];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Best XI Recommendation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Team Selection */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Team</label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name} ({team.squad.length} players)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleGenerateRecommendation} 
              disabled={!selectedTeamId || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Best XI
                </>
              )}
            </Button>
          </div>

          {/* Recommendation Results */}
          {recommendation && selectedTeam && (
            <div className="space-y-4">
              {/* Reasoning */}
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Selection Strategy</h3>
                <p className="text-sm text-muted-foreground">{recommendation.reasoning}</p>
              </div>

              {/* Selected Players by Category */}
              <div className="space-y-4">
                {/* Batsmen */}
                {getPlayersByCategory('batsmen').length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Badge variant="outline">Batsmen</Badge>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {getPlayersByCategory('batsmen').map(player => (
                        <div key={player.id} className="flex items-center gap-2 p-2 border rounded">
                          <PlayerAvatar name={player.name} imageUrl={player.imageUrl} />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{player.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Bat: {player.batSkill} | {player.performanceHistory?.totalRuns || 0} runs
                            </div>
                          </div>
                          {player.isOverseas && <Badge variant="secondary" className="text-xs">OS</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All-Rounders */}
                {getPlayersByCategory('allRounders').length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Badge variant="outline">All-Rounders</Badge>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {getPlayersByCategory('allRounders').map(player => (
                        <div key={player.id} className="flex items-center gap-2 p-2 border rounded">
                          <PlayerAvatar name={player.name} imageUrl={player.imageUrl} />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{player.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Bat: {player.batSkill} | Bowl: {player.bowlSkill}
                            </div>
                          </div>
                          {player.isOverseas && <Badge variant="secondary" className="text-xs">OS</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bowlers */}
                {getPlayersByCategory('bowlers').length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Badge variant="outline">Bowlers</Badge>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {getPlayersByCategory('bowlers').map(player => (
                        <div key={player.id} className="flex items-center gap-2 p-2 border rounded">
                          <PlayerAvatar name={player.name} imageUrl={player.imageUrl} />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{player.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Bowl: {player.bowlSkill} | {player.performanceHistory?.totalWickets || 0} wickets
                            </div>
                          </div>
                          {player.isOverseas && <Badge variant="secondary" className="text-xs">OS</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Stats Summary */}
              <div className="p-4 bg-muted rounded-lg flex justify-around text-center">
                <div>
                  <div className="text-2xl font-bold">{recommendation.selectedPlayers.length}</div>
                  <div className="text-xs text-muted-foreground">Players</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {recommendation.selectedPlayers.filter(id => getPlayerById(id)?.isOverseas).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Overseas</div>
                </div>
              </div>
            </div>
          )}

          {!recommendation && !isLoading && selectedTeamId && (
            <div className="text-center text-muted-foreground py-8">
              Click "Generate Best XI" to get AI-powered team selection recommendations
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BestXIDialog;
