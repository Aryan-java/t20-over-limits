import { Player } from "@/types/cricket";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, TrendingUp, Target, Edit2, Trash2 } from "lucide-react";

interface PlayerRowProps {
  player: Player;
  showActions?: boolean;
  showStats?: boolean;
  onEdit?: () => void;
  onRemove?: () => void;
  className?: string;
}

const PlayerRow = ({ 
  player, 
  showActions = false, 
  showStats = false, 
  onEdit, 
  onRemove, 
  className = "" 
}: PlayerRowProps) => {
  const getSkillColor = (skill: number) => {
    if (skill >= 80) return "text-cricket-green";
    if (skill >= 60) return "text-accent";
    if (skill >= 40) return "text-muted-foreground";
    return "text-destructive";
  };

  const getSkillLevel = (skill: number) => {
    if (skill >= 90) return "Elite";
    if (skill >= 80) return "Excellent";
    if (skill >= 70) return "Very Good";
    if (skill >= 60) return "Good";
    if (skill >= 40) return "Average";
    return "Poor";
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors ${className}`}>
      <div className="flex items-center space-x-4 flex-1">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{player.name}</span>
            {player.isOverseas && (
              <Badge variant="outline">
                <Globe className="h-3 w-3 mr-1" />
                Overseas
              </Badge>
            )}
            {player.isPlaying && (
              <Badge className="bg-cricket-green text-white">
                Playing
              </Badge>
            )}
          </div>
          {player.position && (
            <p className="text-sm text-muted-foreground">Position: {player.position}</p>
          )}
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className={`text-sm font-medium ${getSkillColor(player.batSkill)}`}>
              {player.batSkill}
            </span>
            <span className="text-xs text-muted-foreground">bat</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className={`text-sm font-medium ${getSkillColor(player.bowlSkill)}`}>
              {player.bowlSkill}
            </span>
            <span className="text-xs text-muted-foreground">bowl</span>
          </div>
        </div>

        {showStats && player.isPlaying && (
          <div className="flex items-center space-x-4 text-sm">
            <div>
              <span className="font-medium">{player.runs}</span>
              <span className="text-muted-foreground">({player.balls})</span>
            </div>
            {player.wickets > 0 && (
              <div>
                <span className="font-medium">{player.wickets}</span>
                <span className="text-muted-foreground">/{player.runsConceded}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {showActions && (
        <div className="flex space-x-1">
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          {onRemove && (
            <Button variant="ghost" size="sm" onClick={onRemove} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerRow;