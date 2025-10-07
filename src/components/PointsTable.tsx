import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Match, Team } from "@/types/cricket";

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
  nrr: number; // Net Run Rate
}

const PointsTable = ({ teams, matches }: PointsTableProps) => {
  const calculateTeamStats = (): TeamStats[] => {
    const stats: Map<string, TeamStats> = new Map();
    
    // Initialize stats for all teams
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
    
    // Calculate stats from completed matches
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
      
      // Calculate NRR (proper formula: (Total runs scored/Total overs faced) - (Total runs conceded/Total overs bowled))
      if (match.firstInnings && match.secondInnings) {
        const team1BattedFirst = match.firstInnings.battingTeam === match.team1.name;
        
        if (team1BattedFirst) {
          // Team1 batted first, Team2 batted second
          const team1Overs = match.firstInnings.ballsBowled / 6;
          const team2Overs = match.secondInnings.ballsBowled / 6;
          
          // For team1: runs scored in 1st innings, runs conceded in 2nd innings
          const team1RunsFor = match.firstInnings.totalRuns / team1Overs;
          const team1RunsAgainst = match.secondInnings.totalRuns / team2Overs;
          
          // For team2: runs scored in 2nd innings, runs conceded in 1st innings
          const team2RunsFor = match.secondInnings.totalRuns / team2Overs;
          const team2RunsAgainst = match.firstInnings.totalRuns / team1Overs;
          
          team1Stats.nrr += (team1RunsFor - team1RunsAgainst);
          team2Stats.nrr += (team2RunsFor - team2RunsAgainst);
        } else {
          // Team2 batted first, Team1 batted second
          const team2Overs = match.firstInnings.ballsBowled / 6;
          const team1Overs = match.secondInnings.ballsBowled / 6;
          
          // For team2: runs scored in 1st innings, runs conceded in 2nd innings
          const team2RunsFor = match.firstInnings.totalRuns / team2Overs;
          const team2RunsAgainst = match.secondInnings.totalRuns / team1Overs;
          
          // For team1: runs scored in 2nd innings, runs conceded in 1st innings
          const team1RunsFor = match.secondInnings.totalRuns / team1Overs;
          const team1RunsAgainst = match.firstInnings.totalRuns / team2Overs;
          
          team1Stats.nrr += (team1RunsFor - team1RunsAgainst);
          team2Stats.nrr += (team2RunsFor - team2RunsAgainst);
        }
      }
    });
    
    // Convert to array and sort by points, then NRR
    const statsArray = Array.from(stats.values());
    statsArray.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.nrr - a.nrr;
    });
    
    return statsArray;
  };
  
  const teamStats = calculateTeamStats();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Points Table</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Pos</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-center">P</TableHead>
              <TableHead className="text-center">W</TableHead>
              <TableHead className="text-center">L</TableHead>
              <TableHead className="text-center">T</TableHead>
              <TableHead className="text-center">Pts</TableHead>
              <TableHead className="text-center">NRR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamStats.map((stat, index) => (
              <TableRow key={stat.team.id}>
                <TableCell className="font-medium">
                  <Badge variant={index < 4 ? "default" : "secondary"} className={index < 4 ? "bg-cricket-green" : ""}>
                    {index + 1}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{stat.team.name}</TableCell>
                <TableCell className="text-center">{stat.played}</TableCell>
                <TableCell className="text-center">{stat.won}</TableCell>
                <TableCell className="text-center">{stat.lost}</TableCell>
                <TableCell className="text-center">{stat.tied}</TableCell>
                <TableCell className="text-center font-bold">{stat.points}</TableCell>
                <TableCell className={`text-center font-medium ${stat.nrr >= 0 ? 'text-cricket-green' : 'text-destructive'}`}>
                  {stat.nrr >= 0 ? '+' : ''}{stat.nrr.toFixed(3)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {teamStats.every(s => s.played === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No matches completed yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PointsTable;
