import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Play, ChartBar as BarChart3, Trophy, Award, Activity } from "lucide-react";
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
      <div className="relative mb-8">
        {/* Subtle glow behind tabs */}
        <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent blur-xl rounded-2xl opacity-60" />
        
        <TabsList className="relative grid w-full grid-cols-5 h-14 p-1.5 bg-card/95 backdrop-blur-xl border border-border/50 shadow-lg rounded-xl dark:bg-card/80 dark:border-primary/15 overflow-hidden">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "relative z-10 flex items-center justify-center gap-2 h-full rounded-lg transition-all duration-300",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <div className="relative">
                  <Icon className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isActive && "scale-110"
                  )} />
                  
                  {/* Live dot */}
                  {tab.live && (
                    <span className="absolute -top-1 -right-1.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cricket-ball opacity-50" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cricket-ball" />
                    </span>
                  )}
                </div>
                
                <span className={cn(
                  "text-sm hidden sm:inline transition-all duration-200",
                  isActive ? "font-bold" : "font-medium"
                )}>
                  {tab.label}
                </span>
                
                {/* Notification badge */}
                {tab.notification && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1.5 -right-0.5 h-4.5 min-w-[18px] flex items-center justify-center text-[10px] font-bold p-0 shadow-sm"
                  >
                    {tab.notification}
                  </Badge>
                )}
                
                {/* Live badge for non-active tab */}
                {tab.live && !isActive && (
                  <Badge 
                    className="absolute -top-1.5 right-0 h-4 px-1.5 text-[9px] font-bold bg-cricket-ball text-white border-0 shadow-sm"
                  >
                    <Activity className="h-2.5 w-2.5 mr-0.5" />
                    LIVE
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>
      
      <div className="animate-fade-slide-up">
        {children}
      </div>
    </Tabs>
  );
};

export default TabNavigation;
