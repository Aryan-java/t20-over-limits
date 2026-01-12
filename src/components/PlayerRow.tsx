import { Player } from "@/types/cricket";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Globe, TrendingUp, Target, Edit2, Trash2, User, Zap } from "lucide-react";

interface PlayerRowProps {
  player: Player;
  showActions?: boolean;
  showStats?: boolean;
  showTournamentStats?: boolean;
  onEdit?: () => void;
  onRemove?: () => void;
  className?: string;
}

const PlayerRow = ({ 
  player, 
  showActions = false, 
  showStats = false, 
  showTournamentStats = false,
  onEdit, 
  onRemove, 
  className = "" 
}: PlayerRowProps) => {
  const getSkillColor = (skill: number) => {
    if (skill >= 85) return "text-score-six";
    if (skill >= 70) return "text-cricket-green";
    if (skill >= 55) return "text-score-four";
    if (skill >= 40) return "text-muted-foreground";
    return "text-destructive";
  };

  const getSkillBg = (skill: number) => {
    if (skill >= 85) return "bg-score-six/10 border-score-six/30";
    if (skill >= 70) return "bg-cricket-green/10 border-cricket-green/30";
    if (skill >= 55) return "bg-score-four/10 border-score-four/30";
    return "bg-muted/30 border-muted";
  };

  const getPlayerRole = () => {
    const diff = player.batSkill - player.bowlSkill;
    if (diff > 20) return { role: "Batsman", color: "text-score-four", icon: TrendingUp };
    if (diff < -20) return { role: "Bowler", color: "text-cricket-ball", icon: Target };
    return { role: "All-Rounder", color: "text-cricket-purple", icon: Zap };
  };

  const role = getPlayerRole();
  const RoleIcon = role.icon;

  return (
    <div className={`group flex items-center justify-between p-3 rounded-xl border bg-card/50 hover:bg-gradient-to-r hover:from-muted/50 hover:to-transparent transition-all duration-300 hover:shadow-md hover:border-cricket-green/30 ${className}`}>
      <div className="flex items-center space-x-4 flex-1">
        {/* Avatar with skill ring */}
        <div className="relative">
          <Avatar className="h-11 w-11 ring-2 ring-offset-2 ring-offset-background ring-cricket-green/30 group-hover:ring-cricket-green/60 transition-all">
            <AvatarImage src={player.imageUrl} alt={player.name} />
            <AvatarFallback className="bg-gradient-to-br from-cricket-green/20 to-cricket-pitch/20 font-semibold">
              {player.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {player.isPlaying && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-cricket-green rounded-full border-2 border-background animate-pulse" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold truncate group-hover:text-cricket-green transition-colors">{player.name}</span>
            {player.isOverseas && (
              <Badge variant="outline" className="border-cricket-purple/30 text-cricket-purple bg-cricket-purple/5 text-xs">
                <Globe className="h-3 w-3 mr-1" />
                OS
              </Badge>
            )}
            {player.isPlaying && (
              <Badge className="bg-cricket-green/90 text-white text-xs shadow-sm">
                Playing
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <RoleIcon className={`h-3 w-3 ${role.color}`} />
            <span className={`text-xs ${role.color}`}>{role.role}</span>
          </div>
        </div>

        {/* Skill Badges */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${getSkillBg(player.batSkill)}`}>
            <TrendingUp className="h-3.5 w-3.5 text-score-four" />
            <span className={`text-sm font-bold ${getSkillColor(player.batSkill)}`}>
              {player.batSkill}
            </span>
          </div>
          
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${getSkillBg(player.bowlSkill)}`}>
            <Target className="h-3.5 w-3.5 text-cricket-ball" />
            <span className={`text-sm font-bold ${getSkillColor(player.bowlSkill)}`}>
              {player.bowlSkill}
            </span>
          </div>
        </div>

        {showStats && player.isPlaying && (
          <div className="flex items-center gap-4 text-sm px-3 py-1.5 bg-muted/30 rounded-lg">
            <div className="text-center">
              <span className="font-bold text-cricket-green">{player.runs}</span>
              <span className="text-muted-foreground text-xs ml-1">({player.balls})</span>
            </div>
            {player.wickets > 0 && (
              <div className="text-center">
                <span className="font-bold text-cricket-purple">{player.wickets}</span>
                <span className="text-muted-foreground text-xs">/{player.runsConceded}</span>
              </div>
            )}
          </div>
        )}

        {showTournamentStats && player.performanceHistory && (
          <div className="flex items-center gap-4 text-sm glass px-3 py-1.5 rounded-lg border">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">R:</span>
              <span className="font-bold text-cricket-green">{player.performanceHistory.totalRuns}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">W:</span>
              <span className="font-bold text-cricket-purple">{player.performanceHistory.totalWickets}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">M:</span>
              <span className="font-bold">{player.performanceHistory.totalMatches}</span>
            </div>
          </div>
        )}
      </div>

      {showActions && (
        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit} className="hover:bg-cricket-green/10 hover:text-cricket-green">
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          {onRemove && (
            <Button variant="ghost" size="sm" onClick={onRemove} className="text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerRow;