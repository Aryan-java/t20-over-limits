import { Button } from "@/components/ui/button";
import { Calendar, Shuffle } from "lucide-react";
import MatchCard from "./MatchCard";
import MatchSetupDialog from "./MatchSetupDialog";
import { useCricketStore } from "@/hooks/useCricketStore";
import { useState } from "react";
import { Team } from "@/types/cricket";

const FixturesTab = () => {
  const { teams, fixtures, generateFixtures, createMatch, setCurrentMatch } = useCricketStore();
  const [setupMatch, setSetupMatch] = useState<{team1: Team, team2: Team} | null>(null);

  const handleStartMatch = (team1Id: string, team2Id: string) => {
    const team1 = teams.find(t => t.id === team1Id)!;
    const team2 = teams.find(t => t.id === team2Id)!;
    setSetupMatch({ team1, team2 });
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
          <Button 
            variant="outline" 
            onClick={generateFixtures}
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
                    onStartMatch={() => handleStartMatch(fixture.team1.id, fixture.team2.id)}
                    isFixture
                  />
                ))}
              </div>
            </div>
          )}

          {completedMatches.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-xl font-semibold">Completed Matches</h3>
                <span className="text-sm text-muted-foreground">({completedMatches.length})</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {completedMatches.map((fixture) => (
                  <MatchCard
                    key={fixture.id}
                    match={fixture.match!}
                    onViewMatch={() => {
                      // Handle view completed match
                    }}
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
        open={!!setupMatch}
        onOpenChange={(open) => !open && setSetupMatch(null)}
        onMatchReady={handleMatchReady}
      />
    </div>
  );
};

export default FixturesTab;