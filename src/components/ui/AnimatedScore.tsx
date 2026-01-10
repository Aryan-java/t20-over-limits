import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface AnimatedScoreProps {
  value: number;
  className?: string;
  duration?: number;
  showPlus?: boolean;
}

const AnimatedScore = ({ value, className, duration = 500, showPlus = false }: AnimatedScoreProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousValue = useRef(value);

  useEffect(() => {
    if (value !== previousValue.current) {
      setIsAnimating(true);
      const diff = value - previousValue.current;
      const steps = 20;
      const increment = diff / steps;
      let current = previousValue.current;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        current += increment;
        setDisplayValue(Math.round(current));

        if (step >= steps) {
          clearInterval(timer);
          setDisplayValue(value);
          setIsAnimating(false);
        }
      }, duration / steps);

      previousValue.current = value;

      return () => clearInterval(timer);
    }
  }, [value, duration]);

  return (
    <span className={cn("tabular-nums", isAnimating && "animate-score-pop", className)}>
      {showPlus && value > 0 && "+"}
      {displayValue}
    </span>
  );
};

export default AnimatedScore;
