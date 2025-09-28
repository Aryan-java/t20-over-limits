import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Team } from "@/types/cricket";
import PlayerRow from "./PlayerRow";

interface TeamDetailsDialogProps {
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TeamDetailsDialog = ({ team, open, onOpenChange }: TeamDetailsDialogProps) => {
  if (!team) return null;

  const overseasCount = team.squad.filter(p => p.isOverseas).length;
  const overseasInXI = team.playingXI.filter(p => p.isOverseas).length;
  
  const avgBatSkill = Math.round(team.squad.reduce((sum, p) => sum + p.batSkill, 0) / team.squad.length);
  const avgBowlSkill = Math.round(team.squad.reduce((sum, p) => sum + p.bowlSkill, 0) / team.squad.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{team.name} - Team Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <div className="text-2xl font-bold">{team.squad.length}</div>
              <div className="text-sm text-muted-foreground">Squad Size</div>
            </div>
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <div className="text-2xl font-bold">{overseasCount}</div>
              <div className="text-sm text-muted-foreground">Overseas</div>
            </div>
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <div className="text-2xl font-bold">{avgBatSkill}</div>
              <div className="text-sm text-muted-foreground">Avg Bat Skill</div>
            </div>
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <div className="text-2xl font-bold">{avgBowlSkill}</div>
              <div className="text-sm text-muted-foreground">Avg Bowl Skill</div>
            </div>
          </div>

          <Tabs defaultValue="squad" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="squad">Full Squad</TabsTrigger>
              <TabsTrigger value="xi">Playing XI</TabsTrigger>
              <TabsTrigger value="impact">Impact Players</TabsTrigger>
            </TabsList>
            
            <TabsContent value="squad" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Squad ({team.squad.length}/25)</h3>
                <div className="flex space-x-2">
                  <Badge variant="outline">{overseasCount}/8 overseas</Badge>
                </div>
              </div>
              <div className="space-y-2">
                {team.squad.map((player) => (
                  <PlayerRow key={player.id} player={player} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="xi" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Playing XI ({team.playingXI.length}/11)</h3>
                <div className="flex space-x-2">
                  <Badge variant="outline">{overseasInXI}/4 overseas</Badge>
                  {team.playingXI.length === 11 && (
                    <Badge className="bg-cricket-green text-white">Ready</Badge>
                  )}
                </div>
              </div>
              {team.playingXI.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No playing XI selected yet
                </div>
              ) : (
                <div className="space-y-2">
                  {team.playingXI
                    .sort((a, b) => (a.position || 0) - (b.position || 0))
                    .map((player) => (
                      <PlayerRow key={player.id} player={player} />
                    ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="impact" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Impact Players ({team.impactOptions.length}/4)</h3>
                <Badge variant="outline">Available for substitution</Badge>
              </div>
              {team.impactOptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No impact players selected yet
                </div>
              ) : (
                <div className="space-y-2">
                  {team.impactOptions.map((player) => (
                    <PlayerRow key={player.id} player={player} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamDetailsDialog;