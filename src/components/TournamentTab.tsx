import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Award, Calendar, ChevronRight, Plus, RotateCcw, Play, Crown, User } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useCricketStore } from "@/hooks/useCricketStore";
import { MatchHistory, Player, Fixture, TournamentFormat } from "@/types/cricket";
import DetailedScorecard from "./DetailedScorecard";
import MatchSetupDialog from "./MatchSetupDialog";
import { useToast } from "@/hooks/use-toast";
import PointsTable from "./PointsTable";

export default function TournamentTab() {
  const { matchHistory, teams, fixtures, tournament, generateFixtures, resetTournament, startPlayoffs, createMatch, setCurrentMatch } = useCricketStore();
  const [selectedMatch, setSelectedMatch] = useState<MatchHistory | null>(null);
  const [matchSetupDialogOpen, setMatchSetupDialogOpen] = useState(false);
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  const [showFormatDialog, setShowFormatDialog] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<TournamentFormat>('single');
  const { toast } = useToast();

  const handleStartMatch = (fixture: Fixture) => {
    setSelectedFixture(fixture);
    setMatchSetupDialogOpen(true);
  };

  const getTopRunScorers = () => {
    const allPlayers: Player[] = [];

    teams.forEach(team => {
      team.squad.forEach(player => {
        if (player.performanceHistory && player.performanceHistory.totalRuns > 0) {
          allPlayers.push(player);
        }
      });
    });

    if (allPlayers.length === 0) return [];

    allPlayers.sort((a, b) => {
      const runsA = a.performanceHistory?.totalRuns || 0;
      const runsB = b.performanceHistory?.totalRuns || 0;
      return runsB - runsA;
    });

    return allPlayers.slice(0, 5);
  };

  const getTopWicketTakers = () => {
    const allPlayers: Player[] = [];

    teams.forEach(team => {
      team.squad.forEach(player => {
        if (player.performanceHistory && player.performanceHistory.totalWickets > 0) {
          allPlayers.push(player);
        }
      });
    });

    if (allPlayers.length === 0) return [];

    allPlayers.sort((a, b) => {
      const wicketsA = a.performanceHistory?.totalWickets || 0;
      const wicketsB = b.performanceHistory?.totalWickets || 0;
      return wicketsB - wicketsA;
    });

    return allPlayers.slice(0, 5);
  };

  const topRunScorers = getTopRunScorers();
  const topWicketTakers = getTopWicketTakers();

  const handleOpenFormatDialog = () => {
    if (teams.length < 2) {
      toast({
        title: "Not enough teams",
        description: "You need at least 2 teams to generate fixtures.",
        variant: "destructive",
      });
      return;
    }
    setShowFormatDialog(true);
  };

  const handleGenerateFixtures = () => {
    generateFixtures(selectedFormat);
    const matchCount = selectedFormat === 'double' 
      ? teams.length * (teams.length - 1)
      : (teams.length * (teams.length - 1)) / 2;
    toast({
      title: "Fixtures Generated",
      description: `${matchCount} ${selectedFormat === 'double' ? 'double' : 'single'} round-robin league matches created!`,
    });
    setShowFormatDialog(false);
  };

  const handleResetTournament = () => {
    resetTournament();
    toast({
      title: "Tournament Reset",
      description: "All fixtures and match history have been cleared.",
    });
  };

  const handleStartPlayoffs = () => {
    startPlayoffs();
    toast({
      title: "Playoffs Started!",
      description: "Qualifier 1 and Eliminator fixtures have been generated.",
    });
  };

  const leagueMatches = fixtures.filter(f => f.stage === 'league');
  const playoffMatches = fixtures.filter(f => f.stage !== 'league');
  const leagueComplete = tournament?.isLeagueComplete || false;
  const playoffStarted = tournament?.isPlayoffStarted || false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tournament Dashboard</h2>
          <p className="text-muted-foreground">League stage, playoffs, and tournament leaders</p>
        </div>
        <div className="flex gap-2">
          {fixtures.length === 0 ? (
            <Button onClick={handleOpenFormatDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Generate League Fixtures
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Reset Tournament
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Tournament?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete all fixtures and match history. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetTournament}>
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Award className="h-5 w-5 text-white" />
              </div>
              Orange Cap - Top 5 Run Scorers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topRunScorers.length > 0 ? (
              <div className="space-y-3">
                {topRunScorers.map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${index === 0 ? 'bg-orange-500 text-white' : 'bg-muted'}`}>
                        {index === 0 ? <Crown className="h-4 w-4" /> : index + 1}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={player.imageUrl} alt={player.name} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{player.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {teams.find(t => t.id === player.currentTeamId)?.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600">
                        {player.performanceHistory?.totalRuns}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Avg: {player.performanceHistory?.averageRuns.toFixed(1)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No runs scored yet</p>
                <p className="text-sm mt-1">Complete matches to see leaders</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              Purple Cap - Top 5 Wicket Takers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topWicketTakers.length > 0 ? (
              <div className="space-y-3">
                {topWicketTakers.map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${index === 0 ? 'bg-purple-500 text-white' : 'bg-muted'}`}>
                        {index === 0 ? <Crown className="h-4 w-4" /> : index + 1}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={player.imageUrl} alt={player.name} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{player.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {teams.find(t => t.id === player.currentTeamId)?.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-600">
                        {player.performanceHistory?.totalWickets}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Avg: {player.performanceHistory?.averageWickets.toFixed(1)}/match
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No wickets taken yet</p>
                <p className="text-sm mt-1">Complete matches to see leaders</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {fixtures.length > 0 && (
        <>
          <PointsTable teams={teams} matches={matchHistory} />

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-cricket-green" />
                  League Stage {tournament?.format === 'double' && '(Double Round-Robin)'}
                </CardTitle>
                <Badge variant={leagueComplete ? "default" : "secondary"}>
                  {leagueMatches.filter(f => f.played).length} / {leagueMatches.length} Matches
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leagueMatches.map((fixture) => (
                  <Card
                    key={fixture.id}
                    className={`hover:shadow-md transition-all ${fixture.played ? 'opacity-75' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{fixture.team1.name}</span>
                            <span className="text-sm text-muted-foreground px-4">vs</span>
                            <span className="font-semibold">{fixture.team2.name}</span>
                          </div>
                          {fixture.played && fixture.match && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="text-sm font-medium text-cricket-green">
                                {fixture.match.result}
                              </p>
                            </div>
                          )}
                        </div>
                        {!fixture.played ? (
                          <Button
                            size="sm"
                            onClick={() => handleStartMatch(fixture)}
                            className="ml-4 gap-2"
                          >
                            <Play className="h-4 w-4" />
                            Start Match
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fixture.match && setSelectedMatch(fixture.match as MatchHistory)}
                            className="ml-4 gap-2"
                          >
                            View Scorecard
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {leagueComplete && !playoffStarted && (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardContent className="p-6 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-3 text-yellow-500" />
                <h3 className="text-xl font-bold mb-2">League Stage Complete!</h3>
                <p className="text-muted-foreground mb-4">
                  Ready to start the playoffs with top 4 teams
                </p>
                <Button onClick={handleStartPlayoffs} size="lg" className="gap-2">
                  <Play className="h-5 w-5" />
                  Start Playoffs
                </Button>
              </CardContent>
            </Card>
          )}

          {playoffStarted && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  Playoffs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {playoffMatches.map((fixture) => (
                    <Card
                      key={fixture.id}
                      className={`hover:shadow-md transition-all border-yellow-500/30 ${fixture.played ? 'opacity-75' : ''}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Badge className="mb-2" variant="secondary">
                              {fixture.stage === 'qualifier1' && 'Qualifier 1'}
                              {fixture.stage === 'eliminator' && 'Eliminator'}
                              {fixture.stage === 'qualifier2' && 'Qualifier 2'}
                              {fixture.stage === 'final' && 'Final'}
                            </Badge>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{fixture.team1.name}</span>
                              <span className="text-sm text-muted-foreground px-4">vs</span>
                              <span className="font-semibold">{fixture.team2.name}</span>
                            </div>
                            {fixture.played && fixture.match && (
                              <div className="mt-2 pt-2 border-t">
                                <p className="text-sm font-medium text-cricket-green">
                                  {fixture.match.result}
                                </p>
                              </div>
                            )}
                          </div>
                          {!fixture.played ? (
                            <Button
                              size="sm"
                              onClick={() => handleStartMatch(fixture)}
                              className="ml-4 gap-2"
                            >
                              <Play className="h-4 w-4" />
                              Start Match
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fixture.match && setSelectedMatch(fixture.match as MatchHistory)}
                              className="ml-4 gap-2"
                            >
                              View Scorecard
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}


      <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Match Scorecard - {selectedMatch?.team1.name} vs {selectedMatch?.team2.name}
            </DialogTitle>
          </DialogHeader>

          {selectedMatch && (
            <div className="space-y-6">
              {selectedMatch.firstInnings && (
                <DetailedScorecard
                  innings={selectedMatch.firstInnings}
                  title={`${selectedMatch.firstInnings.battingTeam} - First Innings`}
                  bowlers={
                    selectedMatch.firstInnings.bowlingTeam === selectedMatch.team1.name
                      ? selectedMatch.team1.squad
                      : selectedMatch.team2.squad
                  }
                />
              )}

              {selectedMatch.secondInnings && (
                <DetailedScorecard
                  innings={selectedMatch.secondInnings}
                  title={`${selectedMatch.secondInnings.battingTeam} - Second Innings`}
                  target={selectedMatch.firstInnings ? selectedMatch.firstInnings.totalRuns + 1 : undefined}
                  bowlers={
                    selectedMatch.secondInnings.bowlingTeam === selectedMatch.team1.name
                      ? selectedMatch.team1.squad
                      : selectedMatch.team2.squad
                  }
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedFixture && (
        <MatchSetupDialog
          team1={selectedFixture.team1}
          team2={selectedFixture.team2}
          open={matchSetupDialogOpen}
          onOpenChange={setMatchSetupDialogOpen}
          onMatchReady={(team1Setup, team2Setup) => {
            const match = createMatch(
              selectedFixture.team1.id,
              selectedFixture.team2.id,
              team1Setup,
              team2Setup
            );
            setCurrentMatch(match);
            setMatchSetupDialogOpen(false);
          }}
        />
      )}

      <Dialog open={showFormatDialog} onOpenChange={setShowFormatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Tournament Format</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <RadioGroup value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as TournamentFormat)}>
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single" className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-semibold">Single Round-Robin</p>
                    <p className="text-sm text-muted-foreground">
                      Each team plays every other team once ({teams.length > 0 ? (teams.length * (teams.length - 1)) / 2 : 0} matches)
                    </p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="double" id="double" />
                <Label htmlFor="double" className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-semibold">Double Round-Robin (Home & Away)</p>
                    <p className="text-sm text-muted-foreground">
                      Each team plays every other team twice ({teams.length > 0 ? teams.length * (teams.length - 1) : 0} matches)
                    </p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowFormatDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerateFixtures}>
                Generate Fixtures
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
