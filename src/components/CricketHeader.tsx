import { Trophy, Zap, Users, Activity, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCricketStore } from "@/hooks/useCricketStore";
import { ThemeToggle } from "./ThemeToggle";

const CricketHeader = () => {
  const { currentMatch } = useCricketStore();

  return (
    <header className="relative overflow-hidden border-b border-primary/20">
      {/* CWC23 deep purple gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(260,65%,22%)] via-[hsl(270,55%,18%)] to-[hsl(260,60%,14%)]" />
      
      {/* Decorative pattern band */}
      <div className="absolute bottom-8 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-60" />
      
      {/* Stadium floodlights */}
      <div className="absolute top-0 left-1/4 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute top-0 right-1/4 w-48 h-48 bg-accent/8 rounded-full blur-3xl" />
      
      {/* Cricket ball accent */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.06]">
        <div className="relative w-24 h-24 rounded-full bg-cricket-ball">
          <div className="absolute inset-3 border-2 border-white/30 rounded-full" />
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/40 -rotate-12" />
        </div>
      </div>
      
      <div className="relative container mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3.5">
            <div className="relative group">
              <div className="absolute inset-0 bg-accent/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 shadow-lg group-hover:scale-105 transition-transform duration-300">
                <Trophy className="h-7 w-7 text-accent drop-shadow-md" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight drop-shadow-md flex items-center gap-2">
                Cricket Simulator
                <Circle className="h-1.5 w-1.5 fill-primary text-primary" />
              </h1>
              <p className="text-primary/80 text-xs font-bold tracking-[0.25em] uppercase mt-0.5">
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
              className="hidden sm:flex bg-white/8 text-white/90 border-white/10 backdrop-blur-sm px-3 py-1 text-xs hover:bg-white/15 transition-colors"
            >
              <Zap className="h-3.5 w-3.5 mr-1.5 text-accent" />
              T20
            </Badge>
            
            <Badge 
              variant="secondary" 
              className="hidden md:flex bg-white/8 text-white/90 border-white/10 backdrop-blur-sm px-3 py-1 text-xs hover:bg-white/15 transition-colors"
            >
              <Users className="h-3.5 w-3.5 mr-1.5" />
              8 Teams
            </Badge>

            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Bottom accent band - CWC23 style decorative stripe */}
      <div className="relative h-1.5">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary" />
      </div>
    </header>
  );
};

export default CricketHeader;
