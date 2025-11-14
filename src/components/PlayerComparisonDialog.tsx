import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCricketStore } from "@/hooks/useCricketStore";
import PlayerAvatar from "./PlayerAvatar";
import { Player, Team } from "@/types/cricket";
import { X } from "lucide-react";

interface PlayerComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PlayerComparisonDialog = ({ open, onOpenChange }: PlayerComparisonDialogProps) => {
  const { teams } = useCricketStore();
  const [selectedPlayers, setSelectedPlayers] = useState<(Player & { teamName: string })[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");

  // Get all players with their team names
  const allPlayers = teams.flatMap(team => 
    team.squad.map(player => ({ ...player, teamName: team.name, teamId: team.id }))
  );

  const availablePlayers = allPlayers.filter(
    p => !selectedPlayers.find(sp => sp.id === p.id)
  );

  const handleAddPlayer = () => {
    if (selectedPlayerId) {
      const player = allPlayers.find(p => p.id === selectedPlayerId);
      if (player) {
        setSelectedPlayers([...selectedPlayers, player]);
        setSelectedPlayerId("");
        setSelectedTeamId("");
      }
    }
  };

  const handleRemovePlayer = (playerId: string) => {
    setSelectedPlayers(selectedPlayers.filter(p => p.id !== playerId));
  };

  const filteredPlayers = selectedTeamId
    ? availablePlayers.filter(p => p.teamId === selectedTeamId)
    : availablePlayers;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare Players</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Player Selection */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Team (Optional)</label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Player</label>
              <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a player" />
                </SelectTrigger>
                <SelectContent>
                  {filteredPlayers.map(player => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name} ({player.teamName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddPlayer} disabled={!selectedPlayerId}>
              Add Player
            </Button>
          </div>

          {/* Selected Players for Comparison */}
          {selectedPlayers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedPlayers.map(player => {
                const totalRuns = player.performanceHistory?.totalRuns || 0;
                const totalWickets = player.performanceHistory?.totalWickets || 0;
                const totalMatches = player.performanceHistory?.totalMatches || 0;
                const avgRuns = player.performanceHistory?.averageRuns || 0;
                const avgWickets = player.performanceHistory?.averageWickets || 0;

                return (
                  <div key={player.id} className="border rounded-lg p-4 space-y-3 relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => handleRemovePlayer(player.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-3">
                      <PlayerAvatar name={player.name} imageUrl={player.imageUrl} />
                      <div>
                        <div className="font-semibold">{player.name}</div>
                        <div className="text-sm text-muted-foreground">{player.teamName}</div>
                      </div>
                    </div>

                    {player.isOverseas && (
                      <Badge variant="secondary">Overseas</Badge>
                    )}

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bat Skill:</span>
                        <Badge variant="outline">{player.batSkill}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bowl Skill:</span>
                        <Badge variant="outline">{player.bowlSkill}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Matches:</span>
                        <span className="font-semibold">{totalMatches}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Runs:</span>
                        <span className="font-bold text-cricket-green">{totalRuns}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg Runs:</span>
                        <span className="font-semibold">{avgRuns.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Wickets:</span>
                        <span className="font-bold text-cricket-ball">{totalWickets}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg Wickets:</span>
                        <span className="font-semibold">{avgWickets.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedPlayers.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              Select players to compare their statistics
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerComparisonDialog;
