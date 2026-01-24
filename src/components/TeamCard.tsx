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
    <Card className="group relative overflow-hidden border-border/60 hover:border-primary/40 transition-all duration-500 ease-out hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 bg-card/95 backdrop-blur-sm">
      {/* Animated gradient accent stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary via-cricket-green to-cricket-gold group-hover:w-2 transition-all duration-300" />
      
      {/* Subtle hover glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-cricket-gold/0 group-hover:from-primary/5 group-hover:to-cricket-gold/5 transition-all duration-500 pointer-events-none" />
      
      <CardHeader className="pb-3 relative">
        <div className="flex items-start justify-between">
          <div className="pl-3">
            <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors duration-300">
              {team.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2.5">
              <Badge 
                variant={team.squad.length >= 11 ? "default" : "secondary"} 
                className={cn(
                  "text-xs gap-1.5 transition-all duration-300",
                  team.squad.length >= 11 && "bg-primary/90 hover:bg-primary shadow-sm"
                )}
              >
                <Users className="h-3 w-3" />
                {team.squad.length}/15
              </Badge>
              <Badge variant="outline" className="text-xs gap-1.5 bg-background/50 backdrop-blur-sm">
                <Globe className="h-3 w-3" />
                {overseasCount} overseas
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1.5">
            {team.subUsed && (
              <Badge variant="destructive" className="text-[10px] px-2 py-0.5 shadow-sm">
                Sub Used
              </Badge>
            )}
            {team.squad.length >= 11 && (
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-cricket-green/15 text-cricket-green border-cricket-green/40 shadow-sm shadow-cricket-green/20">
                ✓ Ready
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 relative">
        {/* Enhanced Squad progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span>Squad Strength</span>
            <span className="font-semibold text-foreground">{team.squad.length}/15 players</span>
          </div>
          <div className="h-2.5 bg-muted/60 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-primary via-cricket-green to-cricket-gold rounded-full transition-all duration-700 ease-out shadow-sm"
              style={{ width: `${(team.squad.length / 15) * 100}%` }}
            />
          </div>
        </div>

        {/* Enhanced Skill preview with glassmorphism */}
        {team.squad.length > 0 && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl border border-border/50 backdrop-blur-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium">
                <div className="p-1.5 bg-cricket-gold/15 rounded-md">
                  <Swords className="h-3 w-3 text-cricket-gold" />
                </div>
                <span className="text-muted-foreground">Batting</span>
              </div>
              <SkillBar value={avgBatSkill} variant="batting" size="sm" showValue={false} />
              <span className="text-sm font-bold text-cricket-gold">{avgBatSkill}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium">
                <div className="p-1.5 bg-cricket-purple/15 rounded-md">
                  <Shield className="h-3 w-3 text-cricket-purple" />
                </div>
                <span className="text-muted-foreground">Bowling</span>
              </div>
              <SkillBar value={avgBowlSkill} variant="bowling" size="sm" showValue={false} />
              <span className="text-sm font-bold text-cricket-purple">{avgBowlSkill}</span>
            </div>
          </div>
        )}
        
        {/* Enhanced Actions */}
        <div className="space-y-3 pt-2">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={onAddPlayers} 
              className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-sm hover:shadow-md hover:shadow-primary/20 transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Players
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEdit}
              className="px-3 hover:bg-muted/80 hover:border-primary/30 transition-all duration-300"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onViewDetails} 
            className="w-full group/btn hover:bg-gradient-to-r hover:from-muted/60 hover:to-muted/30 transition-all duration-300"
          >
            <span className="font-medium">View Details</span>
            <ChevronRight className="h-4 w-4 ml-1.5 transition-transform duration-300 group-hover/btn:translate-x-1.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamCard;