import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Search } from "lucide-react";
import { useCricketStore } from "@/hooks/useCricketStore";
import { useToast } from "@/hooks/use-toast";
import { PLAYER_DATABASE } from "@/data/playerDatabase";

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateTeamDialog = ({ open, onOpenChange }: CreateTeamDialogProps) => {
  const { addTeam } = useCricketStore();
  const { toast } = useToast();
  
  const [teamName, setTeamName] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [overseasFilter, setOverseasFilter] = useState<string>("all");

  const filteredPlayers = PLAYER_DATABASE.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || player.role === roleFilter;
    const matchesOverseas = overseasFilter === "all" || 
      (overseasFilter === "overseas" && player.isOverseas) ||
      (overseasFilter === "indian" && !player.isOverseas);
    
    return matchesSearch && matchesRole && matchesOverseas;
  });

  const togglePlayer = (playerName: string) => {
    if (selectedPlayers.includes(playerName)) {
      setSelectedPlayers(selectedPlayers.filter(name => name !== playerName));
    } else {
      if (selectedPlayers.length >= 25) {
        toast({
          title: "Squad Full",
          description: "Maximum 25 players allowed in squad",
          variant: "destructive"
        });
        return;
      }

      const player = PLAYER_DATABASE.find(p => p.name === playerName);
      if (player?.isOverseas) {
        const overseasCount = selectedPlayers.filter(name => 
          PLAYER_DATABASE.find(p => p.name === name)?.isOverseas
        ).length;
        
        if (overseasCount >= 8) {
          toast({
            title: "Overseas Limit Exceeded",
            description: "Maximum 8 overseas players allowed in squad",
            variant: "destructive"
          });
          return;
        }
      }

      setSelectedPlayers([...selectedPlayers, playerName]);
    }
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

    if (selectedPlayers.length < 18) {
      toast({
        title: "Error",
        description: "Minimum 18 players required in squad",
        variant: "destructive"
      });
      return;
    }

    // Convert selected player names to full Player objects
    const squadWithIds = selectedPlayers.map(playerName => {
      const playerData = PLAYER_DATABASE.find(p => p.name === playerName)!;
      return {
        id: Math.random().toString(36).substring(2, 11),
        name: playerData.name,
        isOverseas: playerData.isOverseas,
        batSkill: playerData.batSkill,
        bowlSkill: playerData.bowlSkill,
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
      };
    });

    addTeam({
      name: teamName,
      squad: squadWithIds,
    });

    toast({
      title: "Success",
      description: `${teamName} created successfully with ${selectedPlayers.length} players`,
    });

    // Reset form
    setTeamName("");
    setSelectedPlayers([]);
    onOpenChange(false);
  };

  const overseasCount = selectedPlayers.filter(name => 
    PLAYER_DATABASE.find(p => p.name === name)?.isOverseas
  ).length;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Batsman': return 'bg-blue-500';
      case 'Bowler': return 'bg-red-500';
      case 'All-rounder': return 'bg-green-500';
      case 'Wicket-keeper': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Selected: {selectedPlayers.length}/25 players</span>
            <Badge variant="outline">
              <Globe className="h-3 w-3 mr-1" />
              {overseasCount}/8 overseas
            </Badge>
          </div>
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

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Batsman">Batsman</SelectItem>
                <SelectItem value="Bowler">Bowler</SelectItem>
                <SelectItem value="All-rounder">All-rounder</SelectItem>
                <SelectItem value="Wicket-keeper">Wicket-keeper</SelectItem>
              </SelectContent>
            </Select>

            <Select value={overseasFilter} onValueChange={setOverseasFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Origin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Players</SelectItem>
                <SelectItem value="indian">Indian</SelectItem>
                <SelectItem value="overseas">Overseas</SelectItem>
              </SelectContent>
            </Select>

            <Badge variant="outline" className="text-sm justify-center">
              {filteredPlayers.length} available
            </Badge>
          </div>

          {/* Player List */}
          <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4">
            {filteredPlayers.map((player) => (
              <div key={player.name} className="flex items-center space-x-3 p-2 border rounded hover:bg-muted/50">
                <Checkbox
                  checked={selectedPlayers.includes(player.name)}
                  onCheckedChange={() => togglePlayer(player.name)}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium truncate">{player.name}</span>
                    {player.isOverseas && (
                      <Badge variant="outline" className="text-xs">
                        <Globe className="h-3 w-3 mr-1" />
                        OS
                      </Badge>
                    )}
                    <Badge className={`text-white text-xs ${getRoleColor(player.role)}`}>
                      {player.role}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm">
                  <span className="font-medium">Bat: {player.batSkill}</span>
                  <span className="font-medium">Bowl: {player.bowlSkill}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={createTeam} disabled={!teamName.trim() || selectedPlayers.length < 18}>
              Create Team
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTeamDialog;