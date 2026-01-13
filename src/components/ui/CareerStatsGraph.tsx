import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface CareerStatsGraphProps {
  data: number[];
  label?: string;
  color?: "primary" | "gold" | "purple" | "destructive";
  height?: number;
  showValues?: boolean;
  className?: string;
}

export function CareerStatsGraph({
  data,
  label,
  color = "primary",
  height = 60,
  showValues = false,
  className,
}: CareerStatsGraphProps) {
  const colorClasses = {
    primary: {
      bar: "bg-primary",
      gradient: "from-primary/60 to-primary",
      text: "text-primary",
    },
    gold: {
      bar: "bg-cricket-gold",
      gradient: "from-cricket-gold/60 to-cricket-gold",
      text: "text-cricket-gold",
    },
    purple: {
      bar: "bg-cricket-purple",
      gradient: "from-cricket-purple/60 to-cricket-purple",
      text: "text-cricket-purple",
    },
    destructive: {
      bar: "bg-destructive",
      gradient: "from-destructive/60 to-destructive",
      text: "text-destructive",
    },
  };

  const maxValue = useMemo(() => Math.max(...data, 1), [data]);
  
  const bars = useMemo(() => 
    data.map((value, index) => ({
      value,
      height: (value / maxValue) * 100,
      delay: index * 50,
    })),
    [data, maxValue]
  );

  if (data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-16 text-muted-foreground text-sm", className)}>
        No data available
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span className={cn("text-xs font-bold", colorClasses[color].text)}>
            Total: {data.reduce((a, b) => a + b, 0)}
          </span>
        </div>
      )}
      <div 
        className="flex items-end gap-1 w-full"
        style={{ height: `${height}px` }}
      >
        {bars.map((bar, index) => (
          <div
            key={index}
            className="flex-1 flex flex-col items-center gap-1 group"
          >
            <div
              className={cn(
                "w-full rounded-t-sm transition-all duration-300 group-hover:opacity-80",
                `bg-gradient-to-t ${colorClasses[color].gradient}`
              )}
              style={{
                height: `${bar.height}%`,
                minHeight: bar.value > 0 ? "4px" : "0",
                animation: `progress-fill 0.5s ease-out ${bar.delay}ms both`,
              }}
            />
            {showValues && (
              <span className="text-[8px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                {bar.value}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-muted-foreground">Match 1</span>
        <span className="text-[10px] text-muted-foreground">Match {data.length}</span>
      </div>
    </div>
  );
}

interface StatProgressBarProps {
  label: string;
  value: number;
  maxValue: number;
  color?: "primary" | "gold" | "purple" | "destructive";
  showPercentage?: boolean;
  className?: string;
}

export function StatProgressBar({
  label,
  value,
  maxValue,
  color = "primary",
  showPercentage = true,
  className,
}: StatProgressBarProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  
  const colorClasses = {
    primary: "bg-primary",
    gold: "bg-cricket-gold",
    purple: "bg-cricket-purple",
    destructive: "bg-destructive",
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium">{label}</span>
        <span className="text-xs font-bold">
          {value}
          {showPercentage && <span className="text-muted-foreground">/{maxValue}</span>}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
