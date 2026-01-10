import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Match, Team } from "@/types/cricket";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PointsTableProps {
  teams: Team[];
  matches: Match[];
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

const PointsTable = ({ teams, matches }: PointsTableProps) => {
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
    
    const completedMatches = matches.filter(m => m.result && m.secondInnings?.isCompleted);
    
    completedMatches.forEach(match => {
      const team1Stats = stats.get(match.team1.id);
      const team2Stats = stats.get(match.team2.id);
      
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
        
        if (team1BattedFirst) {
          const team1Overs = match.firstInnings.ballsBowled / 6;
          const team2Overs = match.secondInnings.ballsBowled / 6;
          const team1RunsFor = match.firstInnings.totalRuns / team1Overs;
          const team1RunsAgainst = match.secondInnings.totalRuns / team2Overs;
          const team2RunsFor = match.secondInnings.totalRuns / team2Overs;
          const team2RunsAgainst = match.firstInnings.totalRuns / team1Overs;
          team1Stats.nrr += (team1RunsFor - team1RunsAgainst);
          team2Stats.nrr += (team2RunsFor - team2RunsAgainst);
        } else {
          const team2Overs = match.firstInnings.ballsBowled / 6;
          const team1Overs = match.secondInnings.ballsBowled / 6;
          const team2RunsFor = match.firstInnings.totalRuns / team2Overs;
          const team2RunsAgainst = match.secondInnings.totalRuns / team1Overs;
          const team1RunsFor = match.secondInnings.totalRuns / team1Overs;
          const team1RunsAgainst = match.firstInnings.totalRuns / team2Overs;
          team1Stats.nrr += (team1RunsFor - team1RunsAgainst);
          team2Stats.nrr += (team2RunsFor - team2RunsAgainst);
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
  
  return (
    <Card className="overflow-hidden border-2 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-transparent to-primary/5 border-b">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          Points Table
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-14 font-bold">Pos</TableHead>
              <TableHead className="font-bold">Team</TableHead>
              <TableHead className="text-center font-bold">P</TableHead>
              <TableHead className="text-center font-bold text-cricket-green">W</TableHead>
              <TableHead className="text-center font-bold text-destructive">L</TableHead>
              <TableHead className="text-center font-bold">T</TableHead>
              <TableHead className="text-center font-bold">Pts</TableHead>
              <TableHead className="text-center font-bold">NRR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamStats.map((stat, index) => {
              const isQualifying = index < qualifyingTeams;
              return (
                <TableRow 
                  key={stat.team.id}
                  className={cn(
                    "transition-colors",
                    isQualifying && "bg-cricket-green/5 hover:bg-cricket-green/10"
                  )}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {isQualifying && (
                        <div className="w-1 h-8 bg-cricket-green rounded-full" />
                      )}
                      <Badge 
                        variant={isQualifying ? "default" : "secondary"} 
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center p-0 font-bold",
                          isQualifying ? "bg-cricket-green hover:bg-cricket-green" : ""
                        )}
                      >
                        {index + 1}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{stat.team.name}</TableCell>
                  <TableCell className="text-center">{stat.played}</TableCell>
                  <TableCell className="text-center font-semibold text-cricket-green">{stat.won}</TableCell>
                  <TableCell className="text-center font-semibold text-destructive">{stat.lost}</TableCell>
                  <TableCell className="text-center">{stat.tied}</TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-lg">{stat.points}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={cn(
                      "flex items-center justify-center gap-1 font-medium",
                      stat.nrr >= 0 ? "text-cricket-green" : "text-destructive"
                    )}>
                      {stat.nrr >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
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
          <div className="text-center py-12 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No matches completed yet</p>
            <p className="text-sm">Play matches to populate the table</p>
          </div>
        )}
        
        {teamStats.some(s => s.played > 0) && (
          <div className="px-4 py-3 bg-muted/20 border-t flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-3 h-3 bg-cricket-green rounded" />
            <span>Qualification Zone (Top {qualifyingTeams})</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PointsTable;