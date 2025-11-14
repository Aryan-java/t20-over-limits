import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCricketStore } from "@/hooks/useCricketStore";
import PlayerAvatar from "./PlayerAvatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const StatsTab = () => {
  const { teams } = useCricketStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tournament Statistics</h2>
          <p className="text-muted-foreground">All team squads and player performance</p>
        </div>
      </div>

      {/* Team Squads */}
      {teams.map(team => (
        <Card key={team.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{team.name}</span>
              <Badge variant="outline">{team.squad.length} Players</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Bat Skill</TableHead>
                  <TableHead className="text-center">Bowl Skill</TableHead>
                  <TableHead className="text-center">Runs Scored</TableHead>
                  <TableHead className="text-center">Wickets Taken</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.squad.map(player => {
                  const totalRuns = player.performanceHistory?.totalRuns || 0;
                  const totalWickets = player.performanceHistory?.totalWickets || 0;
                  
                  return (
                    <TableRow key={player.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PlayerAvatar 
                            name={player.name} 
                            imageUrl={player.imageUrl}
                          />
                          <span className="font-medium">{player.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {player.isOverseas ? (
                          <Badge variant="secondary">Overseas</Badge>
                        ) : (
                          <Badge variant="outline">Domestic</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">
                          {player.batSkill}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">
                          {player.bowlSkill}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-bold text-cricket-green">
                          {totalRuns}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-bold text-cricket-ball">
                          {totalWickets}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsTab;