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
      <TabsList className="grid w-full grid-cols-5 mb-6 h-14 p-1.5 bg-card/80 backdrop-blur-sm border shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;
          
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "relative flex items-center justify-center gap-2 h-full rounded-md transition-all duration-300 data-[state=active]:shadow-md",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted/50"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-4 w-4 transition-transform duration-300", isActive && "scale-110")} />
                {tab.live && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-cricket-ball rounded-full animate-live-dot" />
                )}
              </div>
              <span className="font-medium">{tab.label}</span>
              
              {/* Notification badge */}
              {tab.notification && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1.5 -right-1.5 h-5 min-w-5 flex items-center justify-center text-[10px] p-0 animate-bounce-subtle"
                >
                  {tab.notification}
                </Badge>
              )}
              
              {/* Live indicator for live match */}
              {tab.live && !isActive && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1.5 right-0 h-4 px-1 text-[9px] bg-cricket-ball"
                >
                  <Activity className="h-2 w-2 mr-0.5" />
                  LIVE
                </Badge>
              )}
              
              {/* Active indicator underline */}
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-foreground/50 rounded-full" />
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
      {children}
    </Tabs>
  );
};

export default TabNavigation;