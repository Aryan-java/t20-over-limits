import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Crown, Award, X, ClipboardList } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Match, Player } from "@/types/cricket";
import DetailedScorecard from "./DetailedScorecard";

interface MatchResultPanelProps {
  match: Match;
  manOfTheMatch: Player | null;
  topRunScorer: Player | null;
  topWicketTaker: Player | null;
  onClose: () => void;
}

const MatchResultPanel = ({ match, manOfTheMatch, topRunScorer, topWicketTaker, onClose }: MatchResultPanelProps) => {
  const [showScorecard, setShowScorecard] = useState(false);

  const winnerTeam = (() => {
    if (!match.firstInnings || !match.secondInnings) return null;
    const team1Score = match.firstInnings.battingTeam === match.team1.name
      ? match.firstInnings.totalRuns
      : match.secondInnings.totalRuns;
    const team2Score = match.firstInnings.battingTeam === match.team2.name
      ? match.firstInnings.totalRuns
      : match.secondInnings.totalRuns;
    if (team1Score > team2Score) return match.team1;
    if (team2Score > team1Score) return match.team2;
    return null;
  })();

  return (
    <Card className="relative overflow-hidden border-2 border-cricket-gold/30 bg-gradient-to-br from-cricket-gold/5 via-background to-cricket-green/5">
      {/* Close button at top right */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-muted/80 hover:bg-muted"
      >
        <X className="h-4 w-4" />
      </Button>

      <CardContent className="pt-6 space-y-5">
        {/* Header */}
        <div className="text-center">
          <Badge className="bg-cricket-gold/20 text-cricket-gold border-cricket-gold/30 text-lg px-4 py-1 mb-3">
            🏆 Match Complete
          </Badge>
        </div>

        {/* Winner Celebration */}
        {winnerTeam ? (
          <div className="relative overflow-hidden p-6 bg-gradient-to-br from-cricket-gold/20 via-cricket-green/10 to-cricket-gold/20 rounded-xl border-2 border-cricket-gold/30 text-center">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0icmdiYSgyMzMsMjAzLDEwNywwLjEpIi8+PC9zdmc+')] opacity-50" />
            <div className="relative">
              <Trophy className="h-12 w-12 mx-auto text-cricket-gold mb-3 animate-bounce" />
              <p className="text-sm font-semibold text-cricket-gold mb-1">🎉 WINNER 🎉</p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cricket-gold/30 to-cricket-green/30 flex items-center justify-center text-2xl font-bold shadow-lg border-2 border-cricket-gold/50">
                  {winnerTeam.name.substring(0, 2).toUpperCase()}
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-cricket-gold to-cricket-green bg-clip-text text-transparent">
                  {winnerTeam.name}
                </h2>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-muted/50 rounded-xl text-center">
            <p className="text-xl font-bold">Match Tied!</p>
          </div>
        )}

        {/* Result Summary */}
        <div className="p-3 bg-cricket-green/10 rounded-lg text-center">
          <p className="text-lg font-semibold text-cricket-green">{match.result}</p>
        </div>

        {/* Innings Summary */}
        <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
          <div className="flex justify-between">
            <span className="font-medium">{match.firstInnings?.battingTeam}</span>
            <span className="font-bold">
              {match.firstInnings?.totalRuns}/{match.firstInnings?.wickets}
              {` (${Math.floor((match.firstInnings?.ballsBowled || 0) / 6)}.${(match.firstInnings?.ballsBowled || 0) % 6})`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">{match.secondInnings?.battingTeam}</span>
            <span className="font-bold">
              {match.secondInnings?.totalRuns}/{match.secondInnings?.wickets}
              {` (${Math.floor((match.secondInnings?.ballsBowled || 0) / 6)}.${(match.secondInnings?.ballsBowled || 0) % 6})`}
            </span>
          </div>
        </div>

        {/* Man of the Match */}
        {manOfTheMatch && (
          <div className="relative overflow-hidden p-4 bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-yellow-500/10 border-2 border-yellow-500/30 rounded-xl">
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full blur-xl" />
            <div className="relative flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16 border-2 border-yellow-500/50">
                  <AvatarImage src={manOfTheMatch.imageUrl} alt={manOfTheMatch.name} />
                  <AvatarFallback className="text-lg font-bold bg-yellow-500/20">{manOfTheMatch.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <Crown className="absolute -top-2 -right-2 h-6 w-6 text-yellow-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="h-4 w-4 text-yellow-600" />
                  <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide">Man of the Match</p>
                </div>
                <p className="text-xl font-bold">{manOfTheMatch.name}</p>
                <div className="flex gap-4 mt-1 text-sm">
                  {manOfTheMatch.runs > 0 && (
                    <span className="text-muted-foreground">
                      🏏 {manOfTheMatch.runs} ({manOfTheMatch.balls}b)
                    </span>
                  )}
                  {manOfTheMatch.wickets > 0 && (
                    <span className="text-muted-foreground">
                      🎯 {manOfTheMatch.wickets}/{manOfTheMatch.runsConceded}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tournament Leaders */}
        <div className="grid grid-cols-2 gap-3">
          {topRunScorer && (
            <div className="p-3 bg-orange-500/10 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-1.5 mb-2">
                <Award className="h-4 w-4 text-orange-600" />
                <p className="text-xs font-semibold text-orange-700">Orange Cap</p>
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={topRunScorer.imageUrl} alt={topRunScorer.name} />
                  <AvatarFallback className="text-xs">{topRunScorer.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{topRunScorer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {topRunScorer.performanceHistory?.totalRuns} runs
                  </p>
                </div>
              </div>
            </div>
          )}

          {topWicketTaker && (
            <div className="p-3 bg-purple-500/10 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-1.5 mb-2">
                <Trophy className="h-4 w-4 text-purple-600" />
                <p className="text-xs font-semibold text-purple-700">Purple Cap</p>
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={topWicketTaker.imageUrl} alt={topWicketTaker.name} />
                  <AvatarFallback className="text-xs">{topWicketTaker.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{topWicketTaker.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {topWicketTaker.performanceHistory?.totalWickets} wickets
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* View Scorecard Button */}
        <Button
          onClick={() => setShowScorecard(!showScorecard)}
          className="w-full bg-gradient-to-r from-cricket-green to-cricket-pitch hover:from-cricket-green/90 hover:to-cricket-pitch/90 text-white"
          size="lg"
        >
          <ClipboardList className="h-5 w-5 mr-2" />
          {showScorecard ? "Hide Scorecard" : "View Full Scorecard"}
        </Button>

        {/* Inline Detailed Scorecard */}
        {showScorecard && (
          <div className="space-y-6 pt-2">
            {match.firstInnings && (
              <DetailedScorecard
                innings={match.firstInnings}
                title={`${match.firstInnings.battingTeam} - First Innings`}
                bowlers={(match.firstInnings.bowlingTeam === match.team1.name ? match.team1.squad : match.team2.squad)}
              />
            )}
            {match.secondInnings && (
              <DetailedScorecard
                innings={match.secondInnings}
                title={`${match.secondInnings.battingTeam} - Second Innings`}
                target={match.firstInnings ? match.firstInnings.totalRuns + 1 : undefined}
                bowlers={(match.secondInnings.bowlingTeam === match.team1.name ? match.team1.squad : match.team2.squad)}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MatchResultPanel;
