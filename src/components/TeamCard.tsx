import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Team } from "@/types/cricket";
import { Users, Globe, Edit, Play } from "lucide-react";

interface TeamCardProps {
  team: Team;
  onEdit: () => void;
  onSelectXI: () => void;
  onViewDetails: () => void;
}

const TeamCard = ({ team, onEdit, onSelectXI, onViewDetails }: TeamCardProps) => {
  const overseasCount = team.squad.filter(p => p.isOverseas).length;
  const playingXIOverseas = team.playingXI.filter(p => p.isOverseas).length;
  const hasPlayingXI = team.playingXI.length === 11;

  return (
    <Card className="hover:shadow-lg transition-shadow border-border">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{team.name}</CardTitle>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {team.squad.length} players
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Globe className="h-3 w-3 mr-1" />
                {overseasCount} overseas
              </Badge>
            </div>
          </div>
          <div className="flex flex-col space-y-1">
            {hasPlayingXI && (
              <Badge className="bg-cricket-green text-white text-xs">
                XI Ready
              </Badge>
            )}
            {team.subUsed && (
              <Badge variant="destructive" className="text-xs">
                Sub Used
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {hasPlayingXI ? (
              <p>Playing XI: {playingXIOverseas}/4 overseas • {team.impactOptions.length} impact players</p>
            ) : (
              <p>No playing XI selected</p>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
              <Edit className="h-4 w-4 mr-1" />
              Edit Squad
            </Button>
            <Button 
              variant={hasPlayingXI ? "secondary" : "default"} 
              size="sm" 
              onClick={onSelectXI}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-1" />
              {hasPlayingXI ? "Update XI" : "Select XI"}
            </Button>
          </div>
          
          <Button variant="ghost" size="sm" onClick={onViewDetails} className="w-full">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamCard;