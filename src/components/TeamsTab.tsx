import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Shuffle } from "lucide-react";
import TeamCard from "./TeamCard";
import CreateTeamDialog from "./CreateTeamDialog";
import EditTeamDialog from "./EditTeamDialog";
import TeamDetailsDialog from "./TeamDetailsDialog";
import PlayerSelectionDialog from "./PlayerSelectionDialog";
import { useCricketStore } from "@/hooks/useCricketStore";
import { Team } from "@/types/cricket";

const TeamsTab = () => {
  const { teams, generateSampleTeams } = useCricketStore();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [viewingTeam, setViewingTeam] = useState<Team | null>(null);
  const [playerSelectionTeam, setPlayerSelectionTeam] = useState<Team | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Teams</h2>
          <p className="text-muted-foreground">Manage your tournament teams and squads</p>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => generateSampleTeams(4)}
            className="flex items-center space-x-2"
          >
            <Shuffle className="h-4 w-4" />
            <span>Generate Sample Teams</span>
          </Button>
          
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </div>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-lg border-2 border-dashed">
          <div className="space-y-3">
            <div className="text-4xl">🏏</div>
            <h3 className="text-lg font-medium">No teams yet</h3>
            <p className="text-muted-foreground">Create your first team or generate sample teams to get started</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onEdit={() => setEditingTeam(team)}
              onViewDetails={() => setViewingTeam(team)}
              onAddPlayers={() => setPlayerSelectionTeam(team)}
            />
          ))}
        </div>
      )}

      <CreateTeamDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
      
      <EditTeamDialog 
        team={editingTeam} 
        open={!!editingTeam} 
        onOpenChange={(open) => !open && setEditingTeam(null)} 
      />
      
      <TeamDetailsDialog 
        team={viewingTeam} 
        open={!!viewingTeam} 
        onOpenChange={(open) => !open && setViewingTeam(null)} 
      />
      
      <PlayerSelectionDialog 
        team={playerSelectionTeam} 
        open={!!playerSelectionTeam} 
        onOpenChange={(open) => !open && setPlayerSelectionTeam(null)} 
      />
    </div>
  );
};

export default TeamsTab;