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
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Teams</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your tournament teams and squads</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {teams.length > 0 && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setProposalsDialogOpen(true)}
                className="relative"
              >
                <Bell className="h-3.5 w-3.5 mr-1.5" />
                Proposals
                {pendingProposalsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] rounded-full h-4.5 w-4.5 flex items-center justify-center font-bold">
                    {pendingProposalsCount}
                  </span>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setTradeDialogOpen(true)}>
                <ArrowLeftRight className="h-3.5 w-3.5 mr-1.5" />
                Trade
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowResetDialog(true)}>
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Reset
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateSampleTeams(4)}
            disabled={teams.length > 0}
          >
            <Shuffle className="h-3.5 w-3.5 mr-1.5" />
            Generate Teams
          </Button>
          
          <Button size="sm" onClick={() => setCreateDialogOpen(true)} className="shadow-sm shadow-primary/20">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Create Team
          </Button>
        </div>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-16 bg-muted/15 rounded-xl border-2 border-dashed border-border/60">
          <div className="space-y-4">
            <div className="text-5xl">🏏</div>
            <div>
              <h3 className="text-lg font-semibold">No teams yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Create your first team or generate sample teams to get started</p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" onClick={() => generateSampleTeams(4)} disabled={teams.length > 0}>
                <Shuffle className="h-4 w-4 mr-2" />
                Generate Sample Teams
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((team, index) => (
            <div key={team.id} className={`animate-card-enter stagger-${Math.min(index + 1, 8)}`}>
            <TeamCard
              team={team}
              onEdit={() => setEditingTeam(team)}
              onViewDetails={() => setViewingTeam(team)}
              onAddPlayers={() => setPlayerSelectionTeam(team)}
            />
            </div>
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
