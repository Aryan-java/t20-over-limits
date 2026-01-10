import { Trophy, Zap, Users, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCricketStore } from "@/hooks/useCricketStore";

const CricketHeader = () => {
  const { currentMatch } = useCricketStore();

  return (
    <header className="relative overflow-hidden">
      {/* Background with gradient and pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-cricket-green via-cricket-green/90 to-cricket-grass" />
      <div className="absolute inset-0 bg-pitch-pattern opacity-30" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cricket-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-cricket-gold/30 rounded-full blur-lg group-hover:blur-xl transition-all duration-300" />
              <div className="relative p-3 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 shadow-lg group-hover:scale-105 transition-transform duration-300">
                <Trophy className="h-8 w-8 text-white drop-shadow-md" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">
                Cricket Simulator
              </h1>
              <p className="text-white/70 text-sm font-medium tracking-wide">
                T20 Tournament Management
              </p>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-3">
            {currentMatch?.isLive && (
              <Badge 
                variant="destructive" 
                className="bg-cricket-ball text-white px-4 py-1.5 text-sm font-semibold shadow-lg animate-pulse-slow"
              >
                <Activity className="h-4 w-4 mr-2 animate-live-dot" />
                LIVE MATCH
              </Badge>
            )}
            
            <Badge 
              variant="secondary" 
              className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-1.5 hover:bg-white/30 transition-colors"
            >
              <Zap className="h-4 w-4 mr-2" />
              T20 Format
            </Badge>
            
            <Badge 
              variant="secondary" 
              className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-1.5 hover:bg-white/30 transition-colors"
            >
              <Users className="h-4 w-4 mr-2" />
              8 Teams Max
            </Badge>
          </div>
        </div>
      </div>

      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cricket-gold to-transparent opacity-50" />
    </header>
  );
};

export default CricketHeader;