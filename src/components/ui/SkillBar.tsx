import { cn } from "@/lib/utils";

interface SkillBarProps {
  value: number;
  maxValue?: number;
  label?: string;
  showValue?: boolean;
  variant?: "default" | "batting" | "bowling" | "accent";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SkillBar = ({
  value,
  maxValue = 100,
  label,
  showValue = true,
  variant = "default",
  size = "md",
  className,
}: SkillBarProps) => {
  const percentage = Math.min(100, (value / maxValue) * 100);

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  const variantClasses = {
    default: "bg-primary",
    batting: "bg-gradient-to-r from-cricket-gold to-accent",
    bowling: "bg-gradient-to-r from-cricket-purple to-cricket-boundary",
    accent: "bg-gradient-to-r from-cricket-green to-primary",
  };

  const getValueColor = () => {
    if (percentage >= 80) return "text-cricket-green";
    if (percentage >= 60) return "text-primary";
    if (percentage >= 40) return "text-accent";
    return "text-muted-foreground";
  };

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
          {showValue && (
            <span className={cn("text-xs font-semibold", getValueColor())}>{value}</span>
          )}
        </div>
      )}
      <div className={cn("w-full bg-muted rounded-full overflow-hidden", sizeClasses[size])}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            variantClasses[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default SkillBar;
