import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trophy, Award, Calendar, ChevronRight } from "lucide-react";
import { useCricketStore } from "@/hooks/useCricketStore";
import { MatchHistory, Player } from "@/types/cricket";
import DetailedScorecard from "./DetailedScorecard";

export default function TournamentTab() {
  const { matchHistory, teams } = useCricketStore();
  const [selectedMatch, setSelectedMatch] = useState<MatchHistory | null>(null);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getWinningTeam = (match: MatchHistory) => {
    if (!match.result) return null;
    if (match.result.includes(match.team1.name)) return match.team1;
    if (match.result.includes(match.team2.name)) return match.team2;
    return null;
  };

  const getOrangeCapHolder = () => {
    const allPlayers: Player[] = [];

    teams.forEach(team => {
      team.squad.forEach(player => {
        if (player.performanceHistory && player.performanceHistory.totalRuns > 0) {
          allPlayers.push(player);
        }
      });
    });

    if (allPlayers.length === 0) return null;

    allPlayers.sort((a, b) => {
      const runsA = a.performanceHistory?.totalRuns || 0;
      const runsB = b.performanceHistory?.totalRuns || 0;
      return runsB - runsA;
    });

    return allPlayers[0];
  };

  const getPurpleCapHolder = () => {
    const allPlayers: Player[] = [];

    teams.forEach(team => {
      team.squad.forEach(player => {
        if (player.performanceHistory && player.performanceHistory.totalWickets > 0) {
          allPlayers.push(player);
        }
      });
    });

    if (allPlayers.length === 0) return null;

    allPlayers.sort((a, b) => {
      const wicketsA = a.performanceHistory?.totalWickets || 0;
      const wicketsB = b.performanceHistory?.totalWickets || 0;
      return wicketsB - wicketsA;
    });

    return allPlayers[0];
  };

  const orangeCapHolder = getOrangeCapHolder();
  const purpleCapHolder = getPurpleCapHolder();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tournament Dashboard</h2>
          <p className="text-muted-foreground">Match results and tournament leaders</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Award className="h-5 w-5 text-white" />
              </div>
              Orange Cap - Most Runs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orangeCapHolder ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">{orangeCapHolder.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {teams.find(t => t.id === orangeCapHolder.currentTeamId)?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-orange-600">
                      {orangeCapHolder.performanceHistory?.totalRuns}
                    </div>
                    <div className="text-sm text-muted-foreground">runs</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {orangeCapHolder.performanceHistory?.totalMatches}
                    </div>
                    <div className="text-xs text-muted-foreground">Matches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {orangeCapHolder.performanceHistory?.averageRuns.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">Average</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {orangeCapHolder.performanceHistory?.formRating.toFixed(0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Form</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No runs scored yet</p>
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
              Purple Cap - Most Wickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {purpleCapHolder ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">{purpleCapHolder.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {teams.find(t => t.id === purpleCapHolder.currentTeamId)?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-purple-600">
                      {purpleCapHolder.performanceHistory?.totalWickets}
                    </div>
                    <div className="text-sm text-muted-foreground">wickets</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {purpleCapHolder.performanceHistory?.totalMatches}
                    </div>
                    <div className="text-xs text-muted-foreground">Matches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {purpleCapHolder.performanceHistory?.averageWickets.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg/Match</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {purpleCapHolder.performanceHistory?.formRating.toFixed(0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Form</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No wickets taken yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-cricket-green" />
              Matches Played
            </CardTitle>
            <Badge variant="secondary">
              {matchHistory.length} {matchHistory.length === 1 ? 'Match' : 'Matches'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {matchHistory.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Matches Played Yet</h3>
              <p className="text-muted-foreground">
                Complete matches to see them here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {matchHistory.map((match) => {
                const winner = getWinningTeam(match);
                const isTied = match.result?.includes('Tied');

                return (
                  <Card
                    key={match.id}
                    className="hover:shadow-md transition-all cursor-pointer hover:border-cricket-green"
                    onClick={() => setSelectedMatch(match)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Calendar className="h-3 w-3" />
                            {formatDate(match.matchDate)}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{match.team1.name}</span>
                                {winner?.id === match.team1.id && (
                                  <Trophy className="h-4 w-4 text-yellow-500" />
                                )}
                              </div>
                              <div className="text-2xl font-bold">
                                {match.firstInnings?.battingTeam === match.team1.name
                                  ? `${match.firstInnings?.totalRuns}/${match.firstInnings?.wickets}`
                                  : `${match.secondInnings?.totalRuns}/${match.secondInnings?.wickets}`}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{match.team2.name}</span>
                                {winner?.id === match.team2.id && (
                                  <Trophy className="h-4 w-4 text-yellow-500" />
                                )}
                              </div>
                              <div className="text-2xl font-bold">
                                {match.firstInnings?.battingTeam === match.team2.name
                                  ? `${match.firstInnings?.totalRuns}/${match.firstInnings?.wickets}`
                                  : `${match.secondInnings?.totalRuns}/${match.secondInnings?.wickets}`}
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{match.result}</p>
                              {match.manOfTheMatch && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Award className="h-3 w-3 text-yellow-500" />
                                  <span>{match.manOfTheMatch.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <ChevronRight className="h-5 w-5 text-muted-foreground ml-4" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
