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
      {/* Enhanced Tab List with Stadium Feel */}
      <div className="relative mb-8">
        {/* Decorative glow effect behind tabs */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 blur-xl rounded-2xl" />
        
        <TabsList className="relative grid w-full grid-cols-5 h-16 p-2 bg-card/90 backdrop-blur-md border-2 border-border/50 shadow-xl rounded-2xl dark:bg-card/70 dark:border-primary/20">
          {/* Animated background indicator */}
          <div 
            className="absolute inset-y-2 transition-all duration-300 ease-out bg-gradient-to-r from-primary to-primary/80 rounded-xl shadow-lg"
            style={{
              width: 'calc(20% - 8px)',
              left: `calc(${tabs.findIndex(t => t.value === activeTab) * 20}% + 4px)`,
            }}
          />
          
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "relative z-10 flex items-center justify-center gap-2.5 h-full rounded-xl transition-all duration-300",
                  "data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  isActive 
                    ? "text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <div className="relative">
                  <Icon className={cn(
                    "h-5 w-5 transition-all duration-300",
                    isActive && "scale-110 drop-shadow-lg"
                  )} />
                  
                  {/* Live dot indicator */}
                  {tab.live && (
                    <span className="absolute -top-1 -right-1.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cricket-ball opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-cricket-ball" />
                    </span>
                  )}
                </div>
                
                <span className={cn(
                  "font-semibold text-sm hidden sm:inline transition-all duration-300",
                  isActive && "font-bold"
                )}>
                  {tab.label}
                </span>
                
                {/* Notification badge */}
                {tab.notification && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-1 h-5 min-w-5 flex items-center justify-center text-[10px] p-0 animate-pulse shadow-lg"
                  >
                    {tab.notification}
                  </Badge>
                )}
                
                {/* Live badge for non-active tab */}
                {tab.live && !isActive && (
                  <Badge 
                    className="absolute -top-2 right-0 h-5 px-1.5 text-[9px] bg-cricket-ball text-white border-0 shadow-lg animate-pulse"
                  >
                    <Activity className="h-2.5 w-2.5 mr-0.5" />
                    LIVE
                  </Badge>
                )}
                
                {/* Active sparkle effect */}
                {isActive && (
                  <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-primary-foreground/70 animate-pulse" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>
      
      {/* Tab content with fade animation */}
      <div className="animate-fade-slide-up">
        {children}
      </div>
    </Tabs>
  );
};

export default TabNavigation;
