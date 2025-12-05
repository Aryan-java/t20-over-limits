import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PLAYER_DATABASE } from "@/data/playerDatabase";
import { Team, Player } from "@/types/cricket";
import { Plus, Search, Globe, Trash2, Users } from "lucide-react";

interface LobbyTeamCreatorProps {
  teams: Team[];
  onTeamsChange: (teams: Team[]) => void;
  isAdmin: boolean;
}

const LobbyTeamCreator = ({ teams, onTeamsChange, isAdmin }: LobbyTeamCreatorProps) => {
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Get already selected players across all teams
  const usedPlayerNames = teams.flatMap(t => t.squad.map(p => p.name));

  const filteredPlayers = PLAYER_DATABASE.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || player.role === roleFilter;
    const notUsed = !usedPlayerNames.includes(player.name);
    return matchesSearch && matchesRole && notUsed;
  });

  const togglePlayer = (playerName: string) => {
    if (selectedPlayers.includes(playerName)) {
      setSelectedPlayers(selectedPlayers.filter(n => n !== playerName));
    } else {
      if (selectedPlayers.length >= 25) {
        toast({ title: "Max 25 players", variant: "destructive" });
        return;
      }
      const player = PLAYER_DATABASE.find(p => p.name === playerName);
      if (player?.isOverseas) {
        const overseasCount = selectedPlayers.filter(n => 
          PLAYER_DATABASE.find(p => p.name === n)?.isOverseas
        ).length;
        if (overseasCount >= 8) {
          toast({ title: "Max 8 overseas players", variant: "destructive" });
          return;
        }
      }
      setSelectedPlayers([...selectedPlayers, playerName]);
    }
  };

  const createTeam = () => {
    if (!teamName.trim()) {
      toast({ title: "Enter team name", variant: "destructive" });
      return;
    }
    if (selectedPlayers.length < 15) {
      toast({ title: "Select at least 15 players", variant: "destructive" });
      return;
    }

    const squad: Player[] = selectedPlayers.map(playerName => {
      const data = PLAYER_DATABASE.find(p => p.name === playerName)!;
      return {
        id: crypto.randomUUID(),
        name: data.name,
        imageUrl: data.imageUrl,
        isOverseas: data.isOverseas,
        batSkill: data.batSkill,
        bowlSkill: data.bowlSkill,
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
        isPlaying: false
      };
    });

    const newTeam: Team = {
      id: crypto.randomUUID(),
      name: teamName,
      squad,
      subUsed: false
    };

    onTeamsChange([...teams, newTeam]);
    toast({ title: `${teamName} created!` });
    setTeamName("");
    setSelectedPlayers([]);
    setShowCreate(false);
  };

  const deleteTeam = (teamId: string) => {
    onTeamsChange(teams.filter(t => t.id !== teamId));
  };

  const overseasCount = selectedPlayers.filter(n => 
    PLAYER_DATABASE.find(p => p.name === n)?.isOverseas
  ).length;

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Teams ({teams.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teams.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Waiting for admin to create teams...
            </p>
          ) : (
            <div className="space-y-2">
              {teams.map(team => (
                <div key={team.id} className="p-3 border rounded-lg">
                  <span className="font-medium">{team.name}</span>
                  <span className="text-muted-foreground ml-2">({team.squad.length} players)</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Teams ({teams.length})
          </span>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Team</DialogTitle>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{selectedPlayers.length}/25 players</span>
                  <Badge variant="outline">
                    <Globe className="h-3 w-3 mr-1" />
                    {overseasCount}/8 overseas
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <Input
                  placeholder="Team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search players..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="Batsman">Batsman</SelectItem>
                      <SelectItem value="Bowler">Bowler</SelectItem>
                      <SelectItem value="All-rounder">All-rounder</SelectItem>
                      <SelectItem value="Wicket-keeper">WK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="max-h-64 overflow-y-auto border rounded-lg p-2 space-y-1">
                  {filteredPlayers.map(player => (
                    <div 
                      key={player.name} 
                      className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded cursor-pointer"
                      onClick={() => togglePlayer(player.name)}
                    >
                      <Checkbox checked={selectedPlayers.includes(player.name)} />
                      <span className="flex-1">{player.name}</span>
                      {player.isOverseas && (
                        <Badge variant="outline" className="text-xs">OS</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {player.role} | B:{player.batSkill} W:{player.bowlSkill}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={createTeam} disabled={selectedPlayers.length < 15} className="flex-1">
                    Create ({selectedPlayers.length} players)
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {teams.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Create at least 2 teams to start the game
          </p>
        ) : (
          <div className="space-y-2">
            {teams.map(team => (
              <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">{team.name}</span>
                  <span className="text-muted-foreground ml-2">({team.squad.length} players)</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => deleteTeam(team.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LobbyTeamCreator;
