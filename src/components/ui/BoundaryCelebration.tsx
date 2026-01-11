import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface BoundaryCelebrationProps {
  type: "four" | "six" | "wicket" | null;
  onComplete?: () => void;
}

const BoundaryCelebration = ({ type, onComplete }: BoundaryCelebrationProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; size: number }>>([]);

  useEffect(() => {
    if (type) {
      setIsVisible(true);
      
      // Generate random particles
      const newParticles = Array.from({ length: type === "six" ? 30 : type === "four" ? 20 : 15 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.3,
        size: Math.random() * 8 + 4,
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, type === "six" ? 2500 : type === "wicket" ? 2000 : 1800);

      return () => clearTimeout(timer);
    }
  }, [type, onComplete]);

  if (!type || !isVisible) return null;

  const getConfig = () => {
    switch (type) {
      case "six":
        return {
          mainText: "MAXIMUM!",
          subText: "SIX",
          bgClass: "bg-gradient-to-br from-cricket-purple/90 via-score-six/80 to-cricket-purple/90",
          textClass: "text-white",
          particleColor: "bg-score-six",
          glowClass: "shadow-glow-purple",
          icon: "🔥",
          secondaryIcon: "💥",
        };
      case "four":
        return {
          mainText: "BOUNDARY!",
          subText: "FOUR",
          bgClass: "bg-gradient-to-br from-cricket-green/90 via-score-four/80 to-cricket-green/90",
          textClass: "text-white",
          particleColor: "bg-score-four",
          glowClass: "shadow-glow-green",
          icon: "🏏",
          secondaryIcon: "✨",
        };
      case "wicket":
        return {
          mainText: "OUT!",
          subText: "WICKET",
          bgClass: "bg-gradient-to-br from-destructive/90 via-score-wicket/80 to-destructive/90",
          textClass: "text-white",
          particleColor: "bg-destructive",
          glowClass: "shadow-wicket",
          icon: "💔",
          secondaryIcon: "🎯",
        };
      default:
        return null;
    }
  };

  const config = getConfig();
  if (!config) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {/* Backdrop flash */}
      <div 
        className={cn(
          "absolute inset-0 animate-flash-in",
          config.bgClass
        )} 
      />

      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={cn(
            "absolute rounded-full animate-particle-burst",
            config.particleColor
          )}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            animationDelay: `${particle.delay}s`,
            opacity: 0.8,
          }}
        />
      ))}

      {/* Radial lines */}
      <div className="absolute inset-0 flex items-center justify-center">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "absolute h-[200%] w-1 origin-center animate-radial-burst",
              type === "six" ? "bg-gradient-to-t from-transparent via-cricket-gold/30 to-transparent" :
              type === "four" ? "bg-gradient-to-t from-transparent via-cricket-green/30 to-transparent" :
              "bg-gradient-to-t from-transparent via-destructive/30 to-transparent"
            )}
            style={{
              transform: `rotate(${i * 30}deg)`,
              animationDelay: `${i * 0.02}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center animate-celebration-pop">
          {/* Icons */}
          <div className="flex items-center justify-center gap-4 mb-2 animate-bounce-in">
            <span className="text-5xl animate-wiggle">{config.icon}</span>
            <span className="text-4xl animate-wiggle" style={{ animationDelay: "0.1s" }}>{config.secondaryIcon}</span>
            <span className="text-5xl animate-wiggle" style={{ animationDelay: "0.2s" }}>{config.icon}</span>
          </div>
          
          {/* Main text */}
          <h1 
            className={cn(
              "text-7xl md:text-9xl font-black tracking-tighter animate-text-glow",
              config.textClass,
              config.glowClass
            )}
            style={{
              textShadow: type === "six" 
                ? "0 0 40px hsl(var(--score-six)), 0 0 80px hsl(var(--cricket-purple))"
                : type === "four"
                  ? "0 0 40px hsl(var(--score-four)), 0 0 80px hsl(var(--cricket-green))"
                  : "0 0 40px hsl(var(--destructive)), 0 0 80px hsl(var(--score-wicket))"
            }}
          >
            {config.mainText}
          </h1>
          
          {/* Sub text */}
          <div 
            className={cn(
              "text-3xl md:text-5xl font-bold mt-2 animate-slide-up opacity-80",
              config.textClass
            )}
          >
            {config.subText}
          </div>

          {/* Decorative ring */}
          <div 
            className={cn(
              "absolute inset-0 -z-10 rounded-full animate-ring-expand",
              type === "six" ? "border-4 border-cricket-gold/50" :
              type === "four" ? "border-4 border-cricket-green/50" :
              "border-4 border-destructive/50"
            )}
            style={{
              width: "150%",
              height: "150%",
              left: "-25%",
              top: "-25%",
            }}
          />
        </div>
      </div>

      {/* Corner flourishes */}
      <div className="absolute top-4 left-4 animate-fade-slide-up">
        <span className="text-6xl">{type === "six" ? "6️⃣" : type === "four" ? "4️⃣" : "❌"}</span>
      </div>
      <div className="absolute top-4 right-4 animate-fade-slide-up" style={{ animationDelay: "0.1s" }}>
        <span className="text-6xl">{type === "six" ? "6️⃣" : type === "four" ? "4️⃣" : "❌"}</span>
      </div>
      <div className="absolute bottom-4 left-4 animate-fade-slide-up" style={{ animationDelay: "0.2s" }}>
        <span className="text-6xl">{type === "six" ? "6️⃣" : type === "four" ? "4️⃣" : "❌"}</span>
      </div>
      <div className="absolute bottom-4 right-4 animate-fade-slide-up" style={{ animationDelay: "0.3s" }}>
        <span className="text-6xl">{type === "six" ? "6️⃣" : type === "four" ? "4️⃣" : "❌"}</span>
      </div>
    </div>
  );
};

export default BoundaryCelebration;
