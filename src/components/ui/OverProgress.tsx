import { cn } from "@/lib/utils";

interface OverProgressProps {
  balls: number[];
  totalBalls?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const OverProgress = ({ balls, totalBalls = 6, className, size = "md" }: OverProgressProps) => {
  const sizeClasses = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm",
  };

  const getBallClass = (value: number | string) => {
    if (value === "W" || value === -1) return "bg-destructive text-destructive-foreground";
    if (value === 6) return "bg-cricket-purple text-white shadow-glow-purple";
    if (value === 4) return "bg-cricket-green text-white shadow-glow-green";
    if (value === 0) return "bg-muted text-muted-foreground";
    if (typeof value === "number" && value > 0) return "bg-primary/20 text-primary border border-primary/30";
    return "bg-muted/30 border-2 border-dashed border-muted-foreground/20";
  };

  const formatValue = (value: number | string) => {
    if (value === -1) return "W";
    return String(value);
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {Array.from({ length: totalBalls }).map((_, index) => {
        const ballValue = balls[index];
        const isEmpty = ballValue === undefined;
        
        return (
          <div
            key={index}
            className={cn(
              "rounded-full flex items-center justify-center font-bold transition-all duration-300",
              sizeClasses[size],
              isEmpty ? "bg-muted/30 border-2 border-dashed border-muted-foreground/20" : getBallClass(ballValue),
              !isEmpty && "animate-scale-in"
            )}
          >
            {!isEmpty && formatValue(ballValue)}
          </div>
        );
      })}
    </div>
  );
};

export default OverProgress;
