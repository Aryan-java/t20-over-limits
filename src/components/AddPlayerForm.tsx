import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useCricketStore } from "@/hooks/useCricketStore";
import { useToast } from "@/hooks/use-toast";

interface AddPlayerFormProps {
  teamId: string;
  onSuccess: () => void;
  onCancel: () => void;
  overseasCount: number;
  squadSize: number;
}

const AddPlayerForm = ({ teamId, onSuccess, onCancel, overseasCount, squadSize }: AddPlayerFormProps) => {
  const { addPlayerToTeam } = useCricketStore();
  const { toast } = useToast();
  
  const [player, setPlayer] = useState({
    name: "",
    isOverseas: false,
    batSkill: 50,
    bowlSkill: 30,
  });

  const handleSubmit = () => {
    if (!player.name.trim()) {
      toast({
        title: "Error",
        description: "Player name is required",
        variant: "destructive"
      });
      return;
    }

    if (squadSize >= 25) {
      toast({
        title: "Error",
        description: "Maximum 25 players allowed in squad",
        variant: "destructive"
      });
      return;
    }

    if (player.isOverseas && overseasCount >= 8) {
      toast({
        title: "Error",
        description: "Maximum 8 overseas players allowed in squad",
        variant: "destructive"
      });
      return;
    }

    addPlayerToTeam(teamId, {
      ...player,
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
      widesConceded: 0,
      noBallsConceded: 0,
      dotBalls: 0,
    });

    toast({
      title: "Success",
      description: `${player.name} added to squad`,
    });

    onSuccess();
  };

  return (
    <div className="p-4 border rounded-lg space-y-4 bg-muted/20">
      <h4 className="font-medium">Add New Player</h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="playerName">Player Name</Label>
          <Input
            id="playerName"
            value={player.name}
            onChange={(e) => setPlayer({...player, name: e.target.value})}
            placeholder="Enter player name"
          />
        </div>

        <div className="flex items-center space-x-2 pt-6">
          <Switch
            checked={player.isOverseas}
            onCheckedChange={(checked) => setPlayer({...player, isOverseas: checked})}
            disabled={!player.isOverseas && overseasCount >= 8}
          />
          <Label>Overseas Player</Label>
        </div>

        <div className="space-y-2">
          <Label>Batting Skill: {player.batSkill}</Label>
          <Slider
            value={[player.batSkill]}
            onValueChange={([value]) => setPlayer({...player, batSkill: value})}
            max={100}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <Label>Bowling Skill: {player.bowlSkill}</Label>
          <Slider
            value={[player.bowlSkill]}
            onValueChange={([value]) => setPlayer({...player, bowlSkill: value})}
            max={100}
            step={1}
          />
        </div>
      </div>

      <div className="flex space-x-2">
        <Button onClick={handleSubmit} className="flex-1">
          Add Player
        </Button>
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default AddPlayerForm;