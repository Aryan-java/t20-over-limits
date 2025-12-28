import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCricketStore } from "@/hooks/useCricketStore";
import { Team } from "@/types/cricket";
import { useToast } from "@/hooks/use-toast";
import { PLAYER_DATABASE, PlayerData } from "@/data/playerDatabase";
import { Globe, Search, TrendingUp, Target } from "lucide-react";

interface PlayerSelectionDialogProps {
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PlayerSelectionDialog = ({ team, open, onOpenChange }: PlayerSelectionDialogProps) => {
  const { addPlayerToTeam } = useCricketStore();
  const { toast } = useToast();
  
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [overseasFilter, setOverseasFilter] = useState<string>("all");
  const [budget, setBudget] = useState(100); // 100 Cr budget

  useEffect(() => {
    if (team) {
      setSelectedPlayers([]);
      setBudget(100);
    }
  }, [team]);

  if (!team) return null;

  const filteredPlayers = PLAYER_DATABASE.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = priceFilter === "all" || player.price.toString() === priceFilter;
    const matchesRole = roleFilter === "all" || player.role === roleFilter;
    const matchesOverseas = overseasFilter === "all" || 
      (overseasFilter === "overseas" && player.isOverseas) ||
      (overseasFilter === "indian" && !player.isOverseas);
    
    // Check if player is already in team squad
    const notInTeam = !team.squad.some(p => p.name === player.name);
    
    return matchesSearch && matchesPrice && matchesRole && matchesOverseas && notInTeam;
  });

  const togglePlayer = (playerName: string) => {
    const player = PLAYER_DATABASE.find(p => p.name === playerName);
    if (!player) return;

    if (selectedPlayers.includes(playerName)) {
      setSelectedPlayers(selectedPlayers.filter(name => name !== playerName));
      setBudget(prev => prev + player.price);
    } else {
      if (budget >= player.price) {
        setSelectedPlayers([...selectedPlayers, playerName]);
        setBudget(prev => prev - player.price);
      } else {
        toast({
          title: "Insufficient Budget",
          description: `You need ${player.price} Cr but only have ${budget} Cr remaining.`,
          variant: "destructive"
        });
      }
    }
  };

  const addSelectedPlayersToTeam = () => {
    const playersToAdd = PLAYER_DATABASE.filter(p => selectedPlayers.includes(p.name));
    
    let overseasCount = team.squad.filter(p => p.isOverseas).length;
    
    for (const playerData of playersToAdd) {
      if (playerData.isOverseas) {
        if (overseasCount >= 8) {
          toast({
            title: "Overseas Limit Exceeded",
            description: `Cannot add ${playerData.name}. Maximum 8 overseas players allowed in squad.`,
            variant: "destructive"
          });
          continue;
        }
        overseasCount++;
      }

      if (team.squad.length >= 25) {
        toast({
          title: "Squad Full",
          description: "Maximum 25 players allowed in squad.",
          variant: "destructive"
        });
        break;
      }

      addPlayerToTeam(team.id, {
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
      });
    }

    toast({
      title: "Players Added",
      description: `Added ${playersToAdd.length} players to ${team.name}`,
    });

    setSelectedPlayers([]);
    onOpenChange(false);
  };

  const getTotalCost = () => {
    return selectedPlayers.reduce((total, playerName) => {
      const player = PLAYER_DATABASE.find(p => p.name === playerName);
      return total + (player?.price || 0);
    }, 0);
  };

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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Players for {team.name}</DialogTitle>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Squad: {team.squad.length}/25 | Selected: {selectedPlayers.length}</span>
            <span>Budget Remaining: ₹{budget} Cr | Cost: ₹{getTotalCost()} Cr</span>
          </div>
        </DialogHeader>

        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="2">₹2 Cr</SelectItem>
              <SelectItem value="1.5">₹1.5 Cr</SelectItem>
              <SelectItem value="1">₹1 Cr</SelectItem>
            </SelectContent>
          </Select>

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

          <div className="text-center">
            <Badge variant="outline" className="text-sm">
              {filteredPlayers.length} available
            </Badge>
          </div>
        </div>

        {/* Player List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredPlayers.map((player) => (
            <div key={player.name} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
              <Checkbox
                checked={selectedPlayers.includes(player.name)}
                onCheckedChange={() => togglePlayer(player.name)}
                disabled={!selectedPlayers.includes(player.name) && budget < player.price}
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
                  <Badge variant="secondary" className="text-xs">
                    ₹{player.price} Cr
                  </Badge>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{player.batSkill}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{player.bowlSkill}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={addSelectedPlayersToTeam}
            disabled={selectedPlayers.length === 0}
          >
            Add {selectedPlayers.length} Players
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerSelectionDialog;