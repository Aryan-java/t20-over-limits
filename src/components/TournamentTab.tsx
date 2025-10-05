import { useCricketStore } from "@/hooks/useCricketStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Target, ChevronRight, RotateCcw } from "lucide-react";
import MatchCard from "./MatchCard";
import { useState } from "react";
import MatchSetupDialog from "./MatchSetupDialog";
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

const TournamentTab = () => {
  const { tournament, fixtures, teams, startPlayoffs, resetTournament, createMatch, setCurrentMatch } = useCricketStore();
  const [setupMatch, setSetupMatch] = useState<{team1: Team, team2: Team} | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const { toast } = useToast();

  const handleStartMatch = (team1Id: string, team2Id: string) => {
    const team1 = teams.find(t => t.id === team1Id)!;
    const team2 = teams.find(t => t.id === team2Id)!;
    setSetupMatch({ team1, team2 });
  };

  const handleResetTournament = () => {
    resetTournament();
    setShowResetDialog(false);
    toast({
      title: "Tournament Reset",
      description: "All fixtures and match history have been cleared. You can now start a new tournament.",
    });
  };

  const handleMatchReady = (team1Setup: any, team2Setup: any) => {
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

  if (!tournament) {
    return (
      <div className="text-center py-12 bg-muted/20 rounded-lg border-2 border-dashed">
        <div className="space-y-3">
          <div className="text-4xl">🏆</div>
          <h3 className="text-lg font-medium">No Tournament Active</h3>
          <p className="text-muted-foreground">Generate fixtures to start the tournament</p>
        </div>
      </div>
    );
  }

  const leagueMatches = fixtures.filter(f => f.stage === 'league');
  const completedLeague = leagueMatches.filter(f => f.played);

  return (
    <div className="space-y-8">
      {tournament && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setShowResetDialog(true)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Tournament
          </Button>
        </div>
      )}

      {/* Orange and Purple Cap */}
      {/* Orange and Purple Cap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-orange-500" />
                <h3 className="text-lg font-semibold">Orange Cap</h3>
              </div>
              {tournament.orangeCapHolder ? (
                <div>
                  <p className="text-2xl font-bold text-orange-500">
                    {tournament.orangeCapHolder.runs} runs
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tournament.orangeCapHolder.player.name}
                  </p>
                  {tournament.orangeCapHolder.player.isOverseas && (
                    <Badge variant="secondary" className="mt-2">Overseas</Badge>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No matches played yet</p>
              )}
            </div>
            <div className="text-5xl">🧢</div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-semibold">Purple Cap</h3>
              </div>
              {tournament.purpleCapHolder ? (
                <div>
                  <p className="text-2xl font-bold text-purple-500">
                    {tournament.purpleCapHolder.wickets} wickets
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tournament.purpleCapHolder.player.name}
                  </p>
                  {tournament.purpleCapHolder.player.isOverseas && (
                    <Badge variant="secondary" className="mt-2">Overseas</Badge>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No matches played yet</p>
              )}
            </div>
            <div className="text-5xl">🎯</div>
          </div>
        </Card>
      </div>

      {/* League Stage */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">League Stage</h2>
          </div>
          <Badge variant={tournament.isLeagueComplete ? "default" : "secondary"}>
            {completedLeague.length}/{leagueMatches.length} matches
          </Badge>
        </div>
        
        {tournament.isLeagueComplete && !tournament.isPlayoffStarted && (
          <div className="mb-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">League Stage Complete!</p>
                <p className="text-sm text-muted-foreground">Ready to start playoffs with top 4 teams</p>
              </div>
              <Button onClick={startPlayoffs}>
                Start Playoffs <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Playoffs */}
      {tournament.isPlayoffStarted && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <h2 className="text-2xl font-bold">Playoffs</h2>
          </div>

          <div className="space-y-6">
            {/* Qualifier 1 */}
            {tournament.playoffMatches.qualifier1 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-500">Qualifier 1</Badge>
                  <p className="text-sm text-muted-foreground">Winner → Final</p>
                </div>
                <MatchCard
                  match={tournament.playoffMatches.qualifier1.match || createMatch(
                    tournament.playoffMatches.qualifier1.team1.id,
                    tournament.playoffMatches.qualifier1.team2.id
                  )}
                  onStartMatch={() => handleStartMatch(
                    tournament.playoffMatches.qualifier1!.team1.id,
                    tournament.playoffMatches.qualifier1!.team2.id
                  )}
                  onViewMatch={() => {}}
                  isFixture={!tournament.playoffMatches.qualifier1.played}
                />
              </div>
            )}

            {/* Eliminator */}
            {tournament.playoffMatches.eliminator && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-red-500">Eliminator</Badge>
                  <p className="text-sm text-muted-foreground">Loser eliminated</p>
                </div>
                <MatchCard
                  match={tournament.playoffMatches.eliminator.match || createMatch(
                    tournament.playoffMatches.eliminator.team1.id,
                    tournament.playoffMatches.eliminator.team2.id
                  )}
                  onStartMatch={() => handleStartMatch(
                    tournament.playoffMatches.eliminator!.team1.id,
                    tournament.playoffMatches.eliminator!.team2.id
                  )}
                  onViewMatch={() => {}}
                  isFixture={!tournament.playoffMatches.eliminator.played}
                />
              </div>
            )}

            {/* Qualifier 2 */}
            {tournament.playoffMatches.qualifier2 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-500">Qualifier 2</Badge>
                  <p className="text-sm text-muted-foreground">Winner → Final</p>
                </div>
                <MatchCard
                  match={tournament.playoffMatches.qualifier2.match || createMatch(
                    tournament.playoffMatches.qualifier2.team1.id,
                    tournament.playoffMatches.qualifier2.team2.id
                  )}
                  onStartMatch={() => handleStartMatch(
                    tournament.playoffMatches.qualifier2!.team1.id,
                    tournament.playoffMatches.qualifier2!.team2.id
                  )}
                  onViewMatch={() => {}}
                  isFixture={!tournament.playoffMatches.qualifier2.played}
                />
              </div>
            )}

            {/* Final */}
            {tournament.playoffMatches.final && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-yellow-500 text-black">🏆 Final</Badge>
                  <p className="text-sm text-muted-foreground">Tournament decider</p>
                </div>
                <MatchCard
                  match={tournament.playoffMatches.final.match || createMatch(
                    tournament.playoffMatches.final.team1.id,
                    tournament.playoffMatches.final.team2.id
                  )}
                  onStartMatch={() => handleStartMatch(
                    tournament.playoffMatches.final!.team1.id,
                    tournament.playoffMatches.final!.team2.id
                  )}
                  onViewMatch={() => {}}
                  isFixture={!tournament.playoffMatches.final.played}
                />
              </div>
            )}
          </div>
        </Card>
      )}

      <MatchSetupDialog
        team1={setupMatch?.team1 || null}
        team2={setupMatch?.team2 || null}
        open={!!setupMatch}
        onOpenChange={(open) => !open && setSetupMatch(null)}
        onMatchReady={handleMatchReady}
      />

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all fixtures, match history, and tournament progress. 
              Team rosters will be preserved. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetTournament} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reset Tournament
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TournamentTab;
