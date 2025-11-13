import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Shuffle, RotateCcw, ArrowLeftRight, Bell } from "lucide-react";
import TeamCard from "./TeamCard";
import CreateTeamDialog from "./CreateTeamDialog";
import EditTeamDialog from "./EditTeamDialog";
import TeamDetailsDialog from "./TeamDetailsDialog";
import PlayerSelectionDialog from "./PlayerSelectionDialog";
import TradeDialog from "./TradeDialog";
import TradeProposalsDialog from "./TradeProposalsDialog";
import { useCricketStore } from "@/hooks/useCricketStore";
import { Team } from "@/types/cricket";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const TeamsTab = () => {
  const { teams, generateSampleTeams, resetTeams, tradeProposals } = useCricketStore();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [viewingTeam, setViewingTeam] = useState<Team | null>(null);
  const [playerSelectionTeam, setPlayerSelectionTeam] = useState<Team | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [proposalsDialogOpen, setProposalsDialogOpen] = useState(false);
  const { toast } = useToast();

  const pendingProposalsCount = tradeProposals.filter(p => p.status === 'pending').length;

  const handleResetTeams = () => {
    resetTeams();
    setShowResetDialog(false);
    toast({
      title: "Teams Reset",
      description: "All teams, fixtures, and match history have been cleared.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Teams</h2>
          <p className="text-muted-foreground">Manage your tournament teams and squads</p>
        </div>
        
        <div className="flex space-x-2">
          {teams.length > 0 && (
            <>
              <Button 
                variant="outline" 
                onClick={() => setProposalsDialogOpen(true)}
                className="relative"
              >
                <Bell className="h-4 w-4 mr-2" />
                <span>Proposals</span>
                {pendingProposalsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {pendingProposalsCount}
                  </span>
                )}
              </Button>
              <Button variant="outline" onClick={() => setTradeDialogOpen(true)}>
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                <span>Trade Players</span>
              </Button>
              <Button variant="outline" onClick={() => setShowResetDialog(true)}>
                <RotateCcw className="h-4 w-4 mr-2" />
                <span>Reset Teams</span>
              </Button>
            </>
          )}
          <Button
            variant="outline" 
            onClick={() => generateSampleTeams(4)}
            disabled={teams.length > 0}
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

      <TradeDialog
        open={tradeDialogOpen}
        onOpenChange={setTradeDialogOpen}
      />

      <TradeProposalsDialog
        open={proposalsDialogOpen}
        onOpenChange={setProposalsDialogOpen}
      />

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Teams?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all teams, fixtures, and match history. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetTeams} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reset All Teams
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeamsTab;