import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Play, ChartBar as BarChart3, Trophy, Award, Activity, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCricketStore } from "@/hooks/useCricketStore";
import { Badge } from "@/components/ui/badge";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  children: React.ReactNode;
}

const TabNavigation = ({ activeTab, onTabChange, children }: TabNavigationProps) => {
  const { tradeProposals, currentMatch } = useCricketStore();
  const pendingProposals = tradeProposals.filter(p => p.status === 'pending').length;
  const hasLiveMatch = currentMatch?.isLive;

  const tabs = [
    { value: "teams", label: "Teams", icon: Users, notification: pendingProposals > 0 ? pendingProposals : undefined },
    { value: "live", label: "Live Match", icon: Play, live: hasLiveMatch },
    { value: "tournament", label: "Tournament", icon: Trophy },
    { value: "records", label: "Records", icon: Award },
    { value: "stats", label: "Statistics", icon: BarChart3 },
  ];

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      {/* Enhanced Tab List with Premium Stadium Feel */}
      <div className="relative mb-10">
        {/* Multi-layer glow effects behind tabs */}
        <div className="absolute -inset-2 bg-gradient-to-r from-transparent via-primary/15 to-transparent blur-2xl rounded-3xl opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-cricket-gold/5 via-primary/10 to-cricket-gold/5 blur-xl rounded-2xl" />
        
        <TabsList className="relative grid w-full grid-cols-5 h-[72px] p-2 bg-card/95 backdrop-blur-xl border border-border/60 shadow-2xl rounded-2xl dark:bg-card/80 dark:border-primary/20 overflow-hidden">
          {/* Subtle inner gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-2xl" />
          
          {/* Animated sliding background indicator with glow */}
          <div 
            className="absolute inset-y-2 transition-all duration-500 ease-out rounded-xl shadow-xl pointer-events-none"
            style={{
              width: 'calc(20% - 8px)',
              left: `calc(${tabs.findIndex(t => t.value === activeTab) * 20}% + 4px)`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-primary/90 rounded-xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl" />
            <div className="absolute -inset-1 bg-primary/30 blur-lg rounded-xl" />
          </div>
          
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "relative z-10 flex items-center justify-center gap-2.5 h-full rounded-xl transition-all duration-300",
                  "data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
                  isActive 
                    ? "text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                <div className="relative">
                  <Icon className={cn(
                    "h-5 w-5 transition-all duration-300",
                    isActive && "scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                  )} />
                  
                  {/* Enhanced live dot indicator */}
                  {tab.live && (
                    <span className="absolute -top-1.5 -right-2 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cricket-ball opacity-60" />
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-gradient-to-br from-cricket-ball to-red-600 shadow-lg shadow-red-500/50" />
                    </span>
                  )}
                </div>
                
                <span className={cn(
                  "font-semibold text-sm hidden sm:inline transition-all duration-300",
                  isActive && "font-bold tracking-wide"
                )}>
                  {tab.label}
                </span>
                
                {/* Enhanced notification badge */}
                {tab.notification && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2.5 -right-0.5 h-5 min-w-5 flex items-center justify-center text-[10px] font-bold p-0 animate-bounce-subtle shadow-lg shadow-destructive/40"
                  >
                    {tab.notification}
                  </Badge>
                )}
                
                {/* Enhanced live badge for non-active tab */}
                {tab.live && !isActive && (
                  <Badge 
                    className="absolute -top-2.5 right-0 h-5 px-2 text-[9px] font-bold bg-gradient-to-r from-cricket-ball to-red-600 text-white border-0 shadow-lg shadow-red-500/40 animate-pulse"
                  >
                    <Activity className="h-2.5 w-2.5 mr-0.5" />
                    LIVE
                  </Badge>
                )}
                
                {/* Enhanced active sparkle effect */}
                {isActive && (
                  <>
                    <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-primary-foreground/80 animate-pulse" />
                    <div className="absolute -top-0.5 right-1 h-1.5 w-1.5 bg-white/60 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                  </>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
        
        {/* Bottom accent line */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-full" />
      </div>
      
      {/* Tab content with fade animation */}
      <div className="animate-fade-slide-up">
        {children}
      </div>
    </Tabs>
  );
};

export default TabNavigation;
