import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Fixture, Match, Team } from "@/types/cricket";
import { Trophy, TrendingUp, TrendingDown, Medal, Crown, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface PointsTableProps {
  teams: Team[];
  matches: Match[];
  fixtures?: Fixture[];
}

interface TeamStats {
  team: Team;
  played: number;
  won: number;
  lost: number;
  tied: number;
  points: number;
  nrr: number;
}

const PointsTable = ({ teams, matches, fixtures }: PointsTableProps) => {
  const calculateTeamStats = (): TeamStats[] => {
    const stats: Map<string, TeamStats> = new Map();
    
    teams.forEach(team => {
      stats.set(team.id, {
        team,
        played: 0,
        won: 0,
        lost: 0,
        tied: 0,
        points: 0,
        nrr: 0
      });
    });

    // Get IDs of league fixtures that have been played, so we only count league matches
    const leagueMatchIds = fixtures
      ? new Set(
          fixtures
            .filter(f => f.stage === 'league' && f.played && f.match)
            .map(f => f.match!.id)
        )
      : null;
    
    const completedMatches = matches.filter(m => {
      if (!m.isCompleted || !m.result) return false;
      // If fixtures provided, only count league matches
      if (leagueMatchIds) return leagueMatchIds.has(m.id);
      return true;
    });
    
    completedMatches.forEach(match => {
      // Try to find team stats by ID first, then by name as fallback
      let team1Stats = stats.get(match.team1.id);
      let team2Stats = stats.get(match.team2.id);

      // Fallback: match by team name if ID lookup fails
      if (!team1Stats) {
        for (const [, s] of stats) {
          if (s.team.name === match.team1.name) { team1Stats = s; break; }
        }
      }
      if (!team2Stats) {
        for (const [, s] of stats) {
          if (s.team.name === match.team2.name) { team2Stats = s; break; }
        }
      }
      
      if (!team1Stats || !team2Stats || !match.result) return;
      
      team1Stats.played++;
      team2Stats.played++;
      
      if (match.result.includes('Tied')) {
        team1Stats.tied++;
        team2Stats.tied++;
        team1Stats.points += 1;
        team2Stats.points += 1;
      } else if (match.result.includes(match.team1.name)) {
        team1Stats.won++;
        team2Stats.lost++;
        team1Stats.points += 2;
      } else {
        team2Stats.won++;
        team1Stats.lost++;
        team2Stats.points += 2;
      }
      
      if (match.firstInnings && match.secondInnings) {
        const team1BattedFirst = match.firstInnings.battingTeam === match.team1.name;
        
        const fi = match.firstInnings;
        const si = match.secondInnings;
        const fiOvers = fi.ballsBowled > 0 ? fi.ballsBowled / 6 : 1;
        const siOvers = si.ballsBowled > 0 ? si.ballsBowled / 6 : 1;

        if (team1BattedFirst) {
          team1Stats.nrr += (fi.totalRuns / fiOvers) - (si.totalRuns / siOvers);
          team2Stats.nrr += (si.totalRuns / siOvers) - (fi.totalRuns / fiOvers);
        } else {
          team2Stats.nrr += (fi.totalRuns / fiOvers) - (si.totalRuns / siOvers);
          team1Stats.nrr += (si.totalRuns / siOvers) - (fi.totalRuns / fiOvers);
        }
      }
    });
    
    const statsArray = Array.from(stats.values());
    statsArray.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.nrr - a.nrr;
    });
    
    return statsArray;
  };
  
  const teamStats = calculateTeamStats();
  const qualifyingTeams = 4;

  const getPositionBadge = (index: number) => {
    if (index === 0) return { icon: Crown, color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30' };
    if (index === 1) return { icon: Medal, color: 'text-gray-400 bg-gray-400/10 border-gray-400/30' };
    if (index === 2) return { icon: Medal, color: 'text-orange-500 bg-orange-500/10 border-orange-500/30' };
    return { icon: Star, color: 'text-muted-foreground bg-muted border-border' };
  };
  
  return (
    <Card className="overflow-hidden border-2 shadow-xl relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <CardHeader className="bg-gradient-to-r from-primary/15 via-primary/10 to-transparent border-b relative">
        <CardTitle className="flex items-center gap-4">
          <div className="relative">
            <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg">
              <Trophy className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="absolute inset-0 bg-primary/30 rounded-xl blur-md" />
          </div>
          <div>
            <span className="text-xl font-bold">Points Table</span>
            <div className="text-sm text-muted-foreground font-normal">League Standings</div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 border-b-2">
              <TableHead className="w-16 font-bold text-center">Pos</TableHead>
              <TableHead className="font-bold">Team</TableHead>
              <TableHead className="text-center font-bold w-12">P</TableHead>
              <TableHead className="text-center font-bold text-cricket-green w-12">W</TableHead>
              <TableHead className="text-center font-bold text-destructive w-12">L</TableHead>
              <TableHead className="text-center font-bold w-12">T</TableHead>
              <TableHead className="text-center font-bold w-16">Pts</TableHead>
              <TableHead className="text-center font-bold w-24">NRR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamStats.map((stat, index) => {
              const isQualifying = index < qualifyingTeams;
              const position = getPositionBadge(index);
              const PositionIcon = position.icon;
              
              return (
                <TableRow 
                  key={stat.team.id}
                  className={cn(
                    "transition-all duration-300 group",
                    isQualifying && "bg-cricket-green/5 hover:bg-cricket-green/10",
                    !isQualifying && "hover:bg-muted/50"
                  )}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center justify-center gap-2">
                      {isQualifying && (
                        <div className="w-1 h-10 bg-gradient-to-b from-cricket-green to-cricket-green/50 rounded-full absolute left-0" />
                      )}
                      <Badge 
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center p-0 font-bold text-sm transition-all",
                          position.color,
                          "border-2 shadow-sm",
                          index < 3 && "shadow-lg"
                        )}
                      >
                        {index < 3 ? (
                          <PositionIcon className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-base group-hover:text-primary transition-colors">
                    {stat.team.name}
                  </TableCell>
                  <TableCell className="text-center font-semibold">{stat.played}</TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-cricket-green text-lg">{stat.won}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-destructive text-lg">{stat.lost}</span>
                  </TableCell>
                  <TableCell className="text-center font-semibold">{stat.tied}</TableCell>
                  <TableCell className="text-center">
                    <div className="relative inline-flex items-center justify-center">
                      <span className="font-black text-xl text-primary">{stat.points}</span>
                      {stat.points > 0 && (
                        <div className="absolute inset-0 bg-primary/10 rounded-full blur-sm" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={cn(
                      "flex items-center justify-center gap-1.5 font-bold px-2 py-1 rounded-lg transition-all",
                      stat.nrr >= 0 ? "text-cricket-green bg-cricket-green/10" : "text-destructive bg-destructive/10"
                    )}>
                      {stat.nrr >= 0 ? (
                        <TrendingUp className="h-3.5 w-3.5" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5" />
                      )}
                      {stat.nrr >= 0 ? '+' : ''}{stat.nrr.toFixed(3)}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {teamStats.every(s => s.played === 0) && (
          <div className="text-center py-8 text-muted-foreground border-t">
            <Trophy className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="font-semibold">No matches completed yet</p>
            <p className="text-sm mt-1">Play matches to see standings update</p>
          </div>
        )}
        
        <div className="px-4 py-3 bg-gradient-to-r from-cricket-green/10 via-transparent to-transparent border-t flex items-center gap-3">
          <div className="w-4 h-4 bg-gradient-to-br from-cricket-green to-cricket-green/70 rounded shadow-sm flex-shrink-0" />
          <span className="text-sm font-semibold text-muted-foreground">
            Top {qualifyingTeams} qualify for playoffs
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PointsTable;
