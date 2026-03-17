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
      <div className="absolute inset-0 bg-pitch-pattern opacity-10 dark:opacity-5" />
      
      {/* Stadium lights - subtler */}
      <div className="absolute top-0 left-1/4 w-40 h-40 bg-cricket-gold/15 rounded-full blur-3xl" />
      <div className="absolute top-0 right-1/4 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      
      {/* Cricket ball - refined */}
      <div className="absolute right-12 top-1/2 -translate-y-1/2 opacity-[0.07] dark:opacity-[0.04]">
        <div className="relative w-20 h-20 rounded-full bg-cricket-ball">
          <div className="absolute inset-2 border-2 border-white/30 rounded-full" />
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/40 -rotate-12" />
        </div>
      </div>
      
      <div className="relative container mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3.5">
            <div className="relative group">
              <div className="absolute inset-0 bg-cricket-gold/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-3 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg group-hover:scale-105 transition-transform duration-300">
                <Trophy className="h-7 w-7 text-white drop-shadow-md" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight drop-shadow-md flex items-center gap-2">
                Cricket Simulator
                <Circle className="h-1.5 w-1.5 fill-cricket-gold text-cricket-gold" />
              </h1>
              <p className="text-white/60 text-xs font-medium tracking-[0.25em] uppercase mt-0.5">
                T20 Tournament Experience
              </p>
            </div>
          </div>

          {/* Status Badges & Theme Toggle */}
          <div className="flex items-center gap-2.5">
            {currentMatch?.isLive && (
              <Badge 
                variant="destructive" 
                className="bg-gradient-to-r from-cricket-ball to-red-600 text-white px-3.5 py-1 text-xs font-bold shadow-lg shadow-red-500/25 border-0"
              >
                <Activity className="h-3.5 w-3.5 mr-1.5 animate-live-dot" />
                LIVE
              </Badge>
            )}
            
            <Badge 
              variant="secondary" 
              className="hidden sm:flex bg-white/10 text-white/90 border-white/15 backdrop-blur-sm px-3 py-1 text-xs hover:bg-white/20 transition-colors"
            >
              <Zap className="h-3.5 w-3.5 mr-1.5 text-cricket-gold" />
              T20
            </Badge>
            
            <Badge 
              variant="secondary" 
              className="hidden md:flex bg-white/10 text-white/90 border-white/15 backdrop-blur-sm px-3 py-1 text-xs hover:bg-white/20 transition-colors"
            >
              <Users className="h-3.5 w-3.5 mr-1.5" />
              8 Teams
            </Badge>

            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Bottom accent - single clean line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cricket-gold/60 to-transparent" />
    </header>
  );
};

export default CricketHeader;
