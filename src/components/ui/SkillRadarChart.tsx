import { useMemo } from "react";

interface SkillRadarChartProps {
  batting: number;
  bowling: number;
  fielding?: number;
  power?: number;
  technique?: number;
  consistency?: number;
  size?: number;
  className?: string;
  animated?: boolean;
}

export function SkillRadarChart({
  batting,
  bowling,
  fielding = Math.round((batting + bowling) / 2),
  power = Math.min(100, batting + 10),
  technique = Math.min(100, Math.round((batting * 0.6 + bowling * 0.4))),
  consistency = Math.round((batting + bowling) / 2),
  size = 120,
  className = "",
  animated = true,
}: SkillRadarChartProps) {
  const center = size / 2;
  const maxRadius = (size / 2) - 15;
  
  const skills = useMemo(() => [
    { name: "BAT", value: batting, angle: -90 },
    { name: "POW", value: power, angle: -30 },
    { name: "FLD", value: fielding, angle: 30 },
    { name: "BWL", value: bowling, angle: 90 },
    { name: "CON", value: consistency, angle: 150 },
    { name: "TEC", value: technique, angle: 210 },
  ], [batting, bowling, fielding, power, technique, consistency]);

  const getPoint = (angle: number, value: number) => {
    const rad = (angle * Math.PI) / 180;
    const radius = (value / 100) * maxRadius;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  };

  const polygonPoints = skills
    .map((skill) => {
      const point = getPoint(skill.angle, skill.value);
      return `${point.x},${point.y}`;
    })
    .join(" ");

  const gridLevels = [25, 50, 75, 100];

  return (
    <div className={`relative ${className}`}>
      <svg width={size} height={size} className="drop-shadow-lg">
        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(var(--cricket-purple))" stopOpacity="0.6" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background grid */}
        {gridLevels.map((level) => (
          <polygon
            key={level}
            points={skills
              .map((skill) => {
                const point = getPoint(skill.angle, level);
                return `${point.x},${point.y}`;
              })
              .join(" ")}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            opacity={0.3}
          />
        ))}

        {/* Axis lines */}
        {skills.map((skill) => {
          const point = getPoint(skill.angle, 100);
          return (
            <line
              key={skill.name}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke="hsl(var(--border))"
              strokeWidth="1"
              opacity={0.3}
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={polygonPoints}
          fill="url(#radarGradient)"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          filter="url(#glow)"
          className={animated ? "animate-scale-in" : ""}
          style={{ transformOrigin: "center" }}
        />

        {/* Data points */}
        {skills.map((skill) => {
          const point = getPoint(skill.angle, skill.value);
          return (
            <circle
              key={skill.name}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="hsl(var(--primary))"
              stroke="hsl(var(--background))"
              strokeWidth="2"
              className={animated ? "animate-scale-in" : ""}
            />
          );
        })}

        {/* Labels */}
        {skills.map((skill) => {
          const point = getPoint(skill.angle, 115);
          return (
            <text
              key={skill.name}
              x={point.x}
              y={point.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[8px] font-bold uppercase"
            >
              {skill.name}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
