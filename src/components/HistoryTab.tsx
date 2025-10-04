import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Calendar, TrendingUp, Award } from "lucide-react";
import { useCricketStore } from "@/hooks/useCricketStore";
import { MatchHistory } from "@/types/cricket";
import { useState } from "react";
import MatchScorecardDialog from "./MatchScorecardDialog";

export default function HistoryTab() {
  const { matchHistory } = useCricketStore();
  const [selectedMatch, setSelectedMatch] = useState<MatchHistory | null>(null);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Match History
            </CardTitle>
            <Badge variant="secondary">
              {matchHistory.length} {matchHistory.length === 1 ? 'Match' : 'Matches'} Played
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {matchHistory.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Matches Played Yet</h3>
              <p className="text-muted-foreground">
                Complete matches will appear here in the history
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {matchHistory.map((match) => {
                const winner = getWinningTeam(match);
                const isTied = match.result?.includes('Tied');

                return (
                  <Card
                    key={match.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedMatch(match)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(match.matchDate)}
                        </div>
                        {isTied ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Match Tied
                          </Badge>
                        ) : winner ? (
                          <Badge className="bg-cricket-green text-white">
                            <Trophy className="h-3 w-3 mr-1" />
                            {winner.name} Won
                          </Badge>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg">{match.team1.name}</h3>
                            {winner?.id === match.team1.id && (
                              <Trophy className="h-5 w-5 text-yellow-500" />
                            )}
                          </div>
                          <div className="text-3xl font-bold">
                            {match.firstInnings?.battingTeam === match.team1.name
                              ? `${match.firstInnings?.totalRuns}/${match.firstInnings?.wickets}`
                              : `${match.secondInnings?.totalRuns}/${match.secondInnings?.wickets}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {match.firstInnings?.battingTeam === match.team1.name
                              ? `${Math.floor((match.firstInnings?.ballsBowled || 0) / 6)}.${(match.firstInnings?.ballsBowled || 0) % 6} overs`
                              : `${Math.floor((match.secondInnings?.ballsBowled || 0) / 6)}.${(match.secondInnings?.ballsBowled || 0) % 6} overs`}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg">{match.team2.name}</h3>
                            {winner?.id === match.team2.id && (
                              <Trophy className="h-5 w-5 text-yellow-500" />
                            )}
                          </div>
                          <div className="text-3xl font-bold">
                            {match.firstInnings?.battingTeam === match.team2.name
                              ? `${match.firstInnings?.totalRuns}/${match.firstInnings?.wickets}`
                              : `${match.secondInnings?.totalRuns}/${match.secondInnings?.wickets}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {match.firstInnings?.battingTeam === match.team2.name
                              ? `${Math.floor((match.firstInnings?.ballsBowled || 0) / 6)}.${(match.firstInnings?.ballsBowled || 0) % 6} overs`
                              : `${Math.floor((match.secondInnings?.ballsBowled || 0) / 6)}.${(match.secondInnings?.ballsBowled || 0) % 6} overs`}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-center">{match.result}</p>
                      </div>

                      {match.manOfTheMatch && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center gap-2 text-sm">
                            <Award className="h-4 w-4 text-yellow-500" />
                            <span className="text-muted-foreground">Man of the Match:</span>
                            <span className="font-semibold">{match.manOfTheMatch.name}</span>
                          </div>
                          <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                            {match.manOfTheMatch.runs > 0 && (
                              <span>
                                <TrendingUp className="h-3 w-3 inline mr-1" />
                                {match.manOfTheMatch.runs} runs ({match.manOfTheMatch.balls} balls)
                              </span>
                            )}
                            {match.manOfTheMatch.wickets > 0 && (
                              <span>
                                {match.manOfTheMatch.wickets}-{match.manOfTheMatch.runsConceded} ({match.manOfTheMatch.oversBowled} ov)
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMatch(match);
                        }}
                      >
                        View Full Scorecard
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <MatchScorecardDialog
        match={selectedMatch}
        open={!!selectedMatch}
        onOpenChange={() => setSelectedMatch(null)}
      />
    </div>
  );
}
