import { cn } from "@/lib/utils";
import { BallEvent } from "@/types/cricket";
import { Circle, Zap, Target, AlertTriangle } from "lucide-react";

interface CommentaryCardProps {
  event: BallEvent;
  overNumber?: number;
  className?: string;
  showDetails?: boolean;
}

const CommentaryCard = ({ event, overNumber, className, showDetails = true }: CommentaryCardProps) => {
  const getEventStyles = () => {
    if (event.isWicket) {
      return {
        bg: "bg-destructive/10 border-destructive/30",
        icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
        badge: "bg-destructive text-destructive-foreground",
        animation: "animate-wicket-shake",
      };
    }
    if (event.runs === 6) {
      return {
        bg: "bg-cricket-purple/10 border-cricket-purple/30",
        icon: <Zap className="h-4 w-4 text-cricket-purple" />,
        badge: "bg-cricket-purple text-white",
        animation: "animate-six-glow",
      };
    }
    if (event.runs === 4) {
      return {
        bg: "bg-cricket-green/10 border-cricket-green/30",
        icon: <Target className="h-4 w-4 text-cricket-green" />,
        badge: "bg-cricket-green text-white",
        animation: "animate-boundary-glow",
      };
    }
    if (event.runs === 0) {
      return {
        bg: "bg-muted/50 border-muted",
        icon: <Circle className="h-4 w-4 text-muted-foreground" />,
        badge: "bg-muted text-muted-foreground",
        animation: "",
      };
    }
    return {
      bg: "bg-primary/5 border-primary/20",
      icon: <Circle className="h-4 w-4 text-primary fill-primary" />,
      badge: "bg-primary/20 text-primary",
      animation: "",
    };
  };

  const styles = getEventStyles();
  const ballInOver = event.ballNumber % 6 || 6;
  const displayOver = overNumber !== undefined ? overNumber : Math.floor((event.ballNumber - 1) / 6);

  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-all duration-300 animate-fade-slide-up",
        styles.bg,
        styles.animation,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-full", styles.badge)}>
          {styles.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs text-muted-foreground">
              Over {displayOver}.{ballInOver}
            </span>
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold", styles.badge)}>
              {event.isWicket ? "W" : event.runs}
            </span>
          </div>
          {showDetails && (
            <p className="text-sm leading-relaxed">{event.commentary}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentaryCard;
