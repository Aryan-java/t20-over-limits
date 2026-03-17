import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Team } from "@/types/cricket";
import { Users, Globe, Pencil, Plus, ChevronRight, Swords, Shield } from "lucide-react";
import SkillBar from "@/components/ui/SkillBar";
import { cn } from "@/lib/utils";

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
    <Card className="group relative overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 bg-card">
      {/* Accent stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-cricket-green to-cricket-gold opacity-80 group-hover:opacity-100 transition-opacity" />
      
      <CardHeader className="pb-3 pl-5">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors duration-200">
              {team.name}
            </CardTitle>
            <div className="flex items-center gap-1.5 mt-2">
              <Badge 
                variant={team.squad.length >= 11 ? "default" : "secondary"} 
                className={cn(
                  "text-xs gap-1 px-2 py-0.5",
                  team.squad.length >= 11 && "bg-primary/90 shadow-sm"
                )}
              >
                <Users className="h-3 w-3" />
                {team.squad.length}/15
              </Badge>
              <Badge variant="outline" className="text-xs gap-1 px-2 py-0.5">
                <Globe className="h-3 w-3" />
                {overseasCount} overseas
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            {team.subUsed && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                Sub Used
              </Badge>
            )}
            {team.squad.length >= 11 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-cricket-green/10 text-cricket-green border-cricket-green/30">
                ✓ Ready
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3.5 pl-5">
        {/* Squad progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Squad Strength</span>
            <span className="font-medium text-foreground">{team.squad.length}/15</span>
          </div>
          <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-cricket-gold rounded-full transition-all duration-500"
              style={{ width: `${(team.squad.length / 15) * 100}%` }}
            />
          </div>
        </div>

        {/* Skill preview */}
        {team.squad.length > 0 && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg border border-border/40">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Swords className="h-3 w-3 text-cricket-gold" />
                <span>Batting</span>
              </div>
              <SkillBar value={avgBatSkill} variant="batting" size="sm" showValue={false} />
              <span className="text-sm font-bold text-cricket-gold">{avgBatSkill}</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="h-3 w-3 text-cricket-purple" />
                <span>Bowling</span>
              </div>
              <SkillBar value={avgBowlSkill} variant="bowling" size="sm" showValue={false} />
              <span className="text-sm font-bold text-cricket-purple">{avgBowlSkill}</span>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="space-y-2 pt-1">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={onAddPlayers} 
              className="flex-1 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Players
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEdit}
              className="px-2.5"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onViewDetails} 
            className="w-full group/btn text-muted-foreground hover:text-foreground"
          >
            <span className="text-sm">View Details</span>
            <ChevronRight className="h-3.5 w-3.5 ml-1 transition-transform duration-200 group-hover/btn:translate-x-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamCard;
