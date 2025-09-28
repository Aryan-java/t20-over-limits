import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Plus, Trash2, Globe } from "lucide-react";
import { useCricketStore } from "@/hooks/useCricketStore";
import { Player } from "@/types/cricket";
import { useToast } from "@/hooks/use-toast";

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateTeamDialog = ({ open, onOpenChange }: CreateTeamDialogProps) => {
  const { addTeam } = useCricketStore();
  const { toast } = useToast();
  
  const [teamName, setTeamName] = useState("");
  const [players, setPlayers] = useState<Omit<Player, 'id'>[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState({
    name: "",
    isOverseas: false,
    batSkill: 50,
    bowlSkill: 30,
  });

  const addPlayer = () => {
    if (!currentPlayer.name.trim()) {
      toast({
        title: "Error",
        description: "Player name is required",
        variant: "destructive"
      });
      return;
    }

    if (players.length >= 25) {
      toast({
        title: "Error",
        description: "Maximum 25 players allowed in squad",
        variant: "destructive"
      });
      return;
    }

    const overseasCount = players.filter(p => p.isOverseas).length;
    if (currentPlayer.isOverseas && overseasCount >= 8) {
      toast({
        title: "Error", 
        description: "Maximum 8 overseas players allowed in squad",
        variant: "destructive"
      });
      return;
    }

    const newPlayer: Omit<Player, 'id'> = {
      ...currentPlayer,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      dismissed: false,
      dismissalInfo: '',
      oversBowled: 0,
      maidens: 0,
      wickets: 0,
      runsConceded: 0,
      isPlaying: false,
    };

    setPlayers([...players, newPlayer]);
    setCurrentPlayer({
      name: "",
      isOverseas: false,
      batSkill: 50,
      bowlSkill: 30,
    });
  };

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const createTeam = () => {
    if (!teamName.trim()) {
      toast({
        title: "Error",
        description: "Team name is required",
        variant: "destructive"
      });
      return;
    }

    if (players.length < 18) {
      toast({
        title: "Error",
        description: "Minimum 18 players required in squad",
        variant: "destructive"
      });
      return;
    }

    // Convert players to full Player objects with IDs
    const squadWithIds = players.map(p => ({
      id: Math.random().toString(36).substring(2, 11),
      ...p
    }));

    addTeam({
      name: teamName,
      squad: squadWithIds,
    });

    toast({
      title: "Success",
      description: `${teamName} created successfully with ${players.length} players`,
    });

    // Reset form
    setTeamName("");
    setPlayers([]);
    setCurrentPlayer({
      name: "",
      isOverseas: false,
      batSkill: 50,
      bowlSkill: 30,
    });
    
    onOpenChange(false);
  };

  const overseasCount = players.filter(p => p.isOverseas).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
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
              <Label>Add Players ({players.length}/25)</Label>
              <Badge variant="outline">
                <Globe className="h-3 w-3 mr-1" />
                {overseasCount}/8 overseas
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="playerName">Player Name</Label>
                <Input
                  id="playerName"
                  value={currentPlayer.name}
                  onChange={(e) => setCurrentPlayer({...currentPlayer, name: e.target.value})}
                  placeholder="Enter player name"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={currentPlayer.isOverseas}
                  onCheckedChange={(checked) => setCurrentPlayer({...currentPlayer, isOverseas: checked})}
                />
                <Label>Overseas Player</Label>
              </div>

              <div className="space-y-2">
                <Label>Batting Skill: {currentPlayer.batSkill}</Label>
                <Slider
                  value={[currentPlayer.batSkill]}
                  onValueChange={([value]) => setCurrentPlayer({...currentPlayer, batSkill: value})}
                  max={100}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Bowling Skill: {currentPlayer.bowlSkill}</Label>
                <Slider
                  value={[currentPlayer.bowlSkill]}
                  onValueChange={([value]) => setCurrentPlayer({...currentPlayer, bowlSkill: value})}
                  max={100}
                  step={1}
                />
              </div>

              <div className="col-span-2">
                <Button onClick={addPlayer} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Player
                </Button>
              </div>
            </div>
          </div>

          {players.length > 0 && (
            <div className="space-y-2">
              <Label>Squad Players</Label>
              <div className="max-h-48 overflow-y-auto border rounded-lg">
                {players.map((player, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border-b last:border-b-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{player.name}</span>
                      {player.isOverseas && (
                        <Badge variant="outline">
                          <Globe className="h-3 w-3 mr-1" />
                          Overseas
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        Bat: {player.batSkill} | Bowl: {player.bowlSkill}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePlayer(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={createTeam} disabled={!teamName.trim() || players.length < 18}>
              Create Team
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTeamDialog;