import { Trophy, Target, Flame, Star, Zap, Award, Crown, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

type MilestoneType = 
  | "century" 
  | "half-century" 
  | "five-wickets" 
  | "hat-trick" 
  | "top-scorer" 
  | "top-wicket" 
  | "match-winner"
  | "consistent"
  | "power-hitter"
  | "economical";

interface MilestoneBadgeProps {
  type: MilestoneType;
  count?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  animated?: boolean;
}

const milestoneConfig: Record<MilestoneType, { 
  icon: typeof Trophy; 
  label: string; 
  color: string;
  bgColor: string;
  glowColor: string;
}> = {
  "century": { 
    icon: Crown, 
    label: "Century", 
    color: "text-cricket-gold",
    bgColor: "bg-cricket-gold/20",
    glowColor: "shadow-cricket-gold/30"
  },
  "half-century": { 
    icon: Star, 
    label: "Fifty", 
    color: "text-score-four",
    bgColor: "bg-score-four/20",
    glowColor: "shadow-score-four/30"
  },
  "five-wickets": { 
    icon: Flame, 
    label: "5-Wicket Haul", 
    color: "text-cricket-purple",
    bgColor: "bg-cricket-purple/20",
    glowColor: "shadow-cricket-purple/30"
  },
  "hat-trick": { 
    icon: Zap, 
    label: "Hat-Trick", 
    color: "text-destructive",
    bgColor: "bg-destructive/20",
    glowColor: "shadow-destructive/30"
  },
  "top-scorer": { 
    icon: Trophy, 
    label: "Top Scorer", 
    color: "text-cricket-gold",
    bgColor: "bg-cricket-gold/20",
    glowColor: "shadow-cricket-gold/30"
  },
  "top-wicket": { 
    icon: Target, 
    label: "Top Wicket-Taker", 
    color: "text-cricket-purple",
    bgColor: "bg-cricket-purple/20",
    glowColor: "shadow-cricket-purple/30"
  },
  "match-winner": { 
    icon: Award, 
    label: "Match Winner", 
    color: "text-primary",
    bgColor: "bg-primary/20",
    glowColor: "shadow-primary/30"
  },
  "consistent": { 
    icon: Medal, 
    label: "Consistent", 
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    glowColor: "shadow-muted/30"
  },
  "power-hitter": { 
    icon: Flame, 
    label: "Power Hitter", 
    color: "text-score-six",
    bgColor: "bg-score-six/20",
    glowColor: "shadow-score-six/30"
  },
  "economical": { 
    icon: Target, 
    label: "Economical", 
    color: "text-cricket-green",
    bgColor: "bg-cricket-green/20",
    glowColor: "shadow-cricket-green/30"
  },
};

export function MilestoneBadge({
  type,
  count,
  size = "md",
  showLabel = true,
  className,
  animated = true,
}: MilestoneBadgeProps) {
  const config = milestoneConfig[type];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "h-6 w-6 p-1",
    md: "h-9 w-9 p-1.5",
    lg: "h-12 w-12 p-2",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-6 w-6",
  };

  const textSizes = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  };

  return (
    <div 
      className={cn(
        "flex items-center gap-1.5 group",
        animated && "animate-scale-in",
        className
      )}
    >
      <div 
        className={cn(
          "relative rounded-full flex items-center justify-center transition-all duration-300",
          sizeClasses[size],
          config.bgColor,
          "group-hover:scale-110 group-hover:shadow-lg",
          `group-hover:${config.glowColor}`
        )}
      >
        <Icon className={cn(iconSizes[size], config.color)} />
        {count && count > 1 && (
          <span 
            className={cn(
              "absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold",
              size === "sm" ? "text-[8px]" : "text-[10px]"
            )}
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </div>
      {showLabel && (
        <span className={cn(textSizes[size], "font-medium", config.color)}>
          {config.label}
        </span>
      )}
    </div>
  );
}

export function MilestoneBadgeGroup({ 
  milestones 
}: { 
  milestones: Array<{ type: MilestoneType; count?: number }> 
}) {
  if (milestones.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {milestones.map((milestone, index) => (
        <MilestoneBadge
          key={`${milestone.type}-${index}`}
          type={milestone.type}
          count={milestone.count}
          size="sm"
          showLabel={false}
        />
      ))}
    </div>
  );
}
