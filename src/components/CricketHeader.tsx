import { Trophy, Zap, Users, Activity, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCricketStore } from "@/hooks/useCricketStore";
import { ThemeToggle } from "./ThemeToggle";

const CricketHeader = () => {
  const { currentMatch } = useCricketStore();

  return (
    <header className="relative overflow-hidden border-b border-primary/10">
      {/* Stadium atmosphere background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cricket-green via-cricket-green/95 to-cricket-grass dark:from-background dark:via-background dark:to-cricket-green/20" />
      <div className="absolute inset-0 bg-pitch-pattern opacity-20 dark:opacity-10" />
      
      {/* Stadium lights effect */}
      <div className="absolute top-0 left-1/4 w-32 h-32 bg-cricket-gold/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute top-0 right-1/4 w-32 h-32 bg-cricket-gold/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cricket-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      
      {/* Cricket ball decorative element */}
      <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-10 dark:opacity-5">
        <div className="relative w-24 h-24 rounded-full bg-cricket-ball shadow-lg">
          <div className="absolute inset-2 border-2 border-white/30 rounded-full" />
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/40 -rotate-12" />
        </div>
      </div>
      
      <div className="relative container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-cricket-gold/40 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300" />
              <div className="relative p-3.5 bg-gradient-to-br from-white/25 to-white/10 backdrop-blur-sm rounded-full border border-white/30 shadow-xl group-hover:scale-105 transition-transform duration-300">
                <Trophy className="h-9 w-9 text-white drop-shadow-lg" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight drop-shadow-lg flex items-center gap-2">
                Cricket Simulator
                <Circle className="h-2 w-2 fill-cricket-gold text-cricket-gold animate-pulse" />
              </h1>
              <p className="text-white/70 text-sm font-medium tracking-widest uppercase">
                T20 Tournament Experience
              </p>
            </div>
          </div>

          {/* Status Badges & Theme Toggle */}
          <div className="flex items-center gap-3">
            {currentMatch?.isLive && (
              <Badge 
                variant="destructive" 
                className="bg-gradient-to-r from-cricket-ball to-red-600 text-white px-4 py-1.5 text-sm font-semibold shadow-lg shadow-red-500/30 border-0"
              >
                <Activity className="h-4 w-4 mr-2 animate-live-dot" />
                LIVE MATCH
              </Badge>
            )}
            
            <Badge 
              variant="secondary" 
              className="hidden sm:flex bg-white/15 text-white border-white/20 backdrop-blur-sm px-4 py-1.5 hover:bg-white/25 transition-colors"
            >
              <Zap className="h-4 w-4 mr-2 text-cricket-gold" />
              T20 Format
            </Badge>
            
            <Badge 
              variant="secondary" 
              className="hidden md:flex bg-white/15 text-white border-white/20 backdrop-blur-sm px-4 py-1.5 hover:bg-white/25 transition-colors"
            >
              <Users className="h-4 w-4 mr-2" />
              8 Teams Max
            </Badge>

            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Bottom gradient accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cricket-green via-cricket-gold to-cricket-green dark:from-transparent dark:via-primary dark:to-transparent" />
      
      {/* Scoreboard-style bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </header>
  );
};

export default CricketHeader;