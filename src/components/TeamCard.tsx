import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Team } from "@/types/cricket";
import { Users, Globe, Pencil, Plus, ChevronRight, Swords, Shield } from "lucide-react";
import SkillBar from "@/components/ui/SkillBar";

interface TeamCardProps {
  team: Team;
  onEdit: () => void;
  onViewDetails: () => void;
  onAddPlayers: () => void;
}

const TeamCard = ({ team, onEdit, onViewDetails, onAddPlayers }: TeamCardProps) => {
  const overseasCount = team.squad.filter(p => p.isOverseas).length;
  const avgBatSkill = team.squad.length > 0 
    ? Math.round(team.squad.reduce((sum, p) => sum + p.batSkill, 0) / team.squad.length)
    : 0;
  const avgBowlSkill = team.squad.length > 0 
    ? Math.round(team.squad.reduce((sum, p) => sum + p.bowlSkill, 0) / team.squad.length)
    : 0;

  return (
    <Card className="group relative overflow-hidden border-border hover:border-primary/30 transition-all duration-300 card-hover">
      {/* Team color accent stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary via-cricket-green to-primary/50" />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="pl-2">
            <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
              {team.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge 
                variant={team.squad.length >= 11 ? "default" : "secondary"} 
                className="text-xs gap-1"
              >
                <Users className="h-3 w-3" />
                {team.squad.length}/15
              </Badge>
              <Badge variant="outline" className="text-xs gap-1">
                <Globe className="h-3 w-3" />
                {overseasCount} overseas
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            {team.subUsed && (
              <Badge variant="destructive" className="text-[10px] px-1.5">
                Sub Used
              </Badge>
            )}
            {team.squad.length >= 11 && (
              <Badge variant="outline" className="text-[10px] px-1.5 bg-cricket-green/10 text-cricket-green border-cricket-green/30">
                Ready
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Squad progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Squad Strength</span>
            <span>{team.squad.length}/15 players</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-cricket-green rounded-full transition-all duration-500"
              style={{ width: `${(team.squad.length / 15) * 100}%` }}
            />
          </div>
        </div>

        {/* Skill preview */}
        {team.squad.length > 0 && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Swords className="h-3 w-3 text-cricket-gold" />
                <span>Batting</span>
              </div>
              <SkillBar value={avgBatSkill} variant="batting" size="sm" showValue={false} />
              <span className="text-xs font-semibold text-cricket-gold">{avgBatSkill}</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="h-3 w-3 text-cricket-purple" />
                <span>Bowling</span>
              </div>
              <SkillBar value={avgBowlSkill} variant="bowling" size="sm" showValue={false} />
              <span className="text-xs font-semibold text-cricket-purple">{avgBowlSkill}</span>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={onAddPlayers} 
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Players
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEdit}
              className="px-3"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onViewDetails} 
            className="w-full group/btn hover:bg-muted"
          >
            <span>View Details</span>
            <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamCard;