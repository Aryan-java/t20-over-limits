import { Button } from "@/components/ui/button";
import { Calendar, Shuffle, RotateCcw } from "lucide-react";
import MatchCard from "./MatchCard";
import MatchSetupDialog from "./MatchSetupDialog";
import { useCricketStore } from "@/hooks/useCricketStore";
import { useState } from "react";
import { Team } from "@/types/cricket";
import { Venue } from "@/data/venues";
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

const FixturesTab = () => {
  const { teams, fixtures, generateFixtures, resetFixtures, createMatch, setCurrentMatch } = useCricketStore();
  const [setupMatch, setSetupMatch] = useState<{team1: Team, team2: Team, venue: Venue} | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const { toast } = useToast();

  const handleStartMatch = (team1Id: string, team2Id: string, venue: Venue) => {
    const team1 = teams.find(t => t.id === team1Id)!;
    const team2 = teams.find(t => t.id === team2Id)!;
    setSetupMatch({ team1, team2, venue });
  };

  const handleMatchReady = (team1Setup: any, team2Setup: any) => {
    // Create match with team setups
    const match = createMatch(
      team1Setup.team.id, 
      team2Setup.team.id,
      {
        playingXI: team1Setup.playingXI,
        impactPlayers: team1Setup.impactPlayers,
        battingOrder: team1Setup.battingOrder,
        openingPair: team1Setup.openingPair
      },
      {
        playingXI: team2Setup.playingXI,
        impactPlayers: team2Setup.impactPlayers,
        battingOrder: team2Setup.battingOrder,
        openingPair: team2Setup.openingPair
      }
    );
    setCurrentMatch(match);
    setSetupMatch(null);
  };

  const handleResetFixtures = () => {
    resetFixtures();
    setShowResetDialog(false);
    toast({
      title: "Fixtures Reset",
      description: "All fixtures and match history have been cleared. Teams are preserved.",
    });
  };

  const completedMatches = fixtures.filter(f => f.played);
  const upcomingMatches = fixtures.filter(f => !f.played);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Fixtures</h2>
          <p className="text-muted-foreground">Tournament schedule and match results</p>
        </div>
        
        <div className="flex space-x-2">
          {fixtures.length > 0 && (
            <Button variant="outline" onClick={() => setShowResetDialog(true)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              <span>Reset Fixtures</span>
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => generateFixtures('single')}
            disabled={teams.length < 2}
            className="flex items-center space-x-2"
          >
            <Shuffle className="h-4 w-4" />
            <span>Generate Fixtures</span>
          </Button>
        </div>
      </div>

      {fixtures.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-lg border-2 border-dashed">
          <div className="space-y-3">
            <div className="text-4xl">📅</div>
            <h3 className="text-lg font-medium">No fixtures yet</h3>
            <p className="text-muted-foreground">
              {teams.length < 2 
                ? "Create at least 2 teams to generate fixtures"
                : "Generate round-robin fixtures to get started"
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {upcomingMatches.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-xl font-semibold">Upcoming Matches</h3>
                <span className="text-sm text-muted-foreground">({upcomingMatches.length})</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {upcomingMatches.map((fixture) => (
                  <MatchCard
                    key={fixture.id}
                    match={createMatch(fixture.team1.id, fixture.team2.id)}
                    venue={fixture.venue}
                    onStartMatch={() => handleStartMatch(fixture.team1.id, fixture.team2.id, fixture.venue)}
                    isFixture
                  />
                ))}
              </div>
            </div>
          )}

          {completedMatches.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-xl font-semibold">Recently Completed</h3>
                  <span className="text-sm text-muted-foreground">({completedMatches.length})</span>
                </div>
                <p className="text-sm text-muted-foreground">View all matches in the History tab</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {completedMatches.slice(0, 4).map((fixture) => (
                  <MatchCard
                    key={fixture.id}
                    match={fixture.match!}
                    onViewMatch={() => {}}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <MatchSetupDialog
        team1={setupMatch?.team1 || null}
        team2={setupMatch?.team2 || null}
        venue={setupMatch?.venue || null}
        open={!!setupMatch}
        onOpenChange={(open) => !open && setSetupMatch(null)}
        onMatchReady={handleMatchReady}
      />

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Fixtures?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all fixtures and match history. 
              Teams will be preserved. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetFixtures} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reset Fixtures
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FixturesTab;