import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Team, Player } from "@/types/cricket";
import { useCricketStore } from "@/hooks/useCricketStore";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeftRight, Globe } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import PlayerAvatar from "./PlayerAvatar";

interface TradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TradeDialog = ({ open, onOpenChange }: TradeDialogProps) => {
  const { teams, createTradeProposal } = useCricketStore();
  const { toast } = useToast();
  
  const [team1Id, setTeam1Id] = useState<string>("");
  const [team2Id, setTeam2Id] = useState<string>("");
  const [team1SelectedPlayers, setTeam1SelectedPlayers] = useState<string[]>([]);
  const [team2SelectedPlayers, setTeam2SelectedPlayers] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setTeam1Id("");
      setTeam2Id("");
      setTeam1SelectedPlayers([]);
      setTeam2SelectedPlayers([]);
    }
  }, [open]);

  const team1 = teams.find(t => t.id === team1Id);
  const team2 = teams.find(t => t.id === team2Id);

  const toggleTeam1Player = (playerId: string) => {
    setTeam1SelectedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const toggleTeam2Player = (playerId: string) => {
    setTeam2SelectedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleTrade = () => {
    if (!team1 || !team2) {
      toast({
        title: "Error",
        description: "Please select both teams",
        variant: "destructive",
      });
      return;
    }

    if (team1SelectedPlayers.length === 0 && team2SelectedPlayers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one player from either team",
        variant: "destructive",
      });
      return;
    }

    // Calculate overseas count after trade
    const team1PlayersToRemove = team1.squad.filter(p => team1SelectedPlayers.includes(p.id));
    const team2PlayersToAdd = team2.squad.filter(p => team2SelectedPlayers.includes(p.id));
    const team1FinalSquad = [
      ...team1.squad.filter(p => !team1SelectedPlayers.includes(p.id)),
      ...team2PlayersToAdd
    ];

    const team2PlayersToRemove = team2.squad.filter(p => team2SelectedPlayers.includes(p.id));
    const team1PlayersToAdd = team1.squad.filter(p => team1SelectedPlayers.includes(p.id));
    const team2FinalSquad = [
      ...team2.squad.filter(p => !team2SelectedPlayers.includes(p.id)),
      ...team1PlayersToAdd
    ];

    // Check overseas limits (max 8)
    const team1OverseasCount = team1FinalSquad.filter(p => p.isOverseas).length;
    const team2OverseasCount = team2FinalSquad.filter(p => p.isOverseas).length;

    if (team1OverseasCount > 8) {
      toast({
        title: "Trade Failed",
        description: `${team1.name} would have ${team1OverseasCount} overseas players (max 8)`,
        variant: "destructive",
      });
      return;
    }

    if (team2OverseasCount > 8) {
      toast({
        title: "Trade Failed",
        description: `${team2.name} would have ${team2OverseasCount} overseas players (max 8)`,
        variant: "destructive",
      });
      return;
    }

    // Check squad size limits (max 25)
    if (team1FinalSquad.length > 25) {
      toast({
        title: "Trade Failed",
        description: `${team1.name} would have ${team1FinalSquad.length} players (max 25)`,
        variant: "destructive",
      });
      return;
    }

    if (team2FinalSquad.length > 25) {
      toast({
        title: "Trade Failed",
        description: `${team2.name} would have ${team2FinalSquad.length} players (max 25)`,
        variant: "destructive",
      });
      return;
    }

    createTradeProposal(team1Id, team1SelectedPlayers, team2Id, team2SelectedPlayers);
    
    toast({
      title: "Trade Proposal Sent",
      description: `Trade proposal sent to ${team2.name}`,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Trade Players Between Teams
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Team Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Team 1</label>
              <Select value={team1Id} onValueChange={setTeam1Id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select first team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id} disabled={team.id === team2Id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Team 2</label>
              <Select value={team2Id} onValueChange={setTeam2Id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select second team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id} disabled={team.id === team1Id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Player Selection */}
          {team1 && team2 && (
            <div className="grid grid-cols-2 gap-4">
              {/* Team 1 Players */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{team1.name}</h3>
                  <span className="text-sm text-muted-foreground">
                    {team1SelectedPlayers.length} selected
                  </span>
                </div>
                <ScrollArea className="h-[400px] border rounded-lg p-4">
                  <div className="space-y-2">
                    {team1.squad.map(player => (
                      <div
                        key={player.id}
                        className="flex items-center space-x-3 p-2 hover:bg-accent rounded-lg transition-colors"
                      >
                        <Checkbox
                          checked={team1SelectedPlayers.includes(player.id)}
                          onCheckedChange={() => toggleTeam1Player(player.id)}
                        />
                        <PlayerAvatar name={player.name} imageUrl={player.imageUrl} size="sm" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{player.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {player.isOverseas && (
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                Overseas
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Team 2 Players */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{team2.name}</h3>
                  <span className="text-sm text-muted-foreground">
                    {team2SelectedPlayers.length} selected
                  </span>
                </div>
                <ScrollArea className="h-[400px] border rounded-lg p-4">
                  <div className="space-y-2">
                    {team2.squad.map(player => (
                      <div
                        key={player.id}
                        className="flex items-center space-x-3 p-2 hover:bg-accent rounded-lg transition-colors"
                      >
                        <Checkbox
                          checked={team2SelectedPlayers.includes(player.id)}
                          onCheckedChange={() => toggleTeam2Player(player.id)}
                        />
                        <PlayerAvatar name={player.name} imageUrl={player.imageUrl} size="sm" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{player.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {player.isOverseas && (
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                Overseas
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleTrade} disabled={!team1 || !team2}>
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Send Proposal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TradeDialog;
