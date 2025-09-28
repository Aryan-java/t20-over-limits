import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useCricketStore } from "@/hooks/useCricketStore";
import { Team } from "@/types/cricket";
import PlayerRow from "./PlayerRow";
import AddPlayerForm from "./AddPlayerForm";

interface EditTeamDialogProps {
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditTeamDialog = ({ team, open, onOpenChange }: EditTeamDialogProps) => {
  const { updateTeam, removePlayerFromTeam } = useCricketStore();
  const [teamName, setTeamName] = useState("");
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  useEffect(() => {
    if (team) {
      setTeamName(team.name);
    }
  }, [team]);

  if (!team) return null;

  const handleSave = () => {
    updateTeam(team.id, { name: teamName });
    onOpenChange(false);
  };

  const handleRemovePlayer = (playerId: string) => {
    removePlayerFromTeam(team.id, playerId);
  };

  const overseasCount = team.squad.filter(p => p.isOverseas).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Team: {team.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="teamName">Team Name</Label>
            <Input
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Squad ({team.squad.length}/25)</h3>
                <p className="text-sm text-muted-foreground">
                  {overseasCount}/8 overseas players
                </p>
              </div>
              
              <Button 
                onClick={() => setShowAddPlayer(!showAddPlayer)}
                disabled={team.squad.length >= 25}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Player
              </Button>
            </div>

            {showAddPlayer && (
              <AddPlayerForm 
                teamId={team.id}
                onSuccess={() => setShowAddPlayer(false)}
                onCancel={() => setShowAddPlayer(false)}
                overseasCount={overseasCount}
                squadSize={team.squad.length}
              />
            )}

            <div className="space-y-2">
              {team.squad.map((player) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  showActions
                  onRemove={() => handleRemovePlayer(player.id)}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditTeamDialog;