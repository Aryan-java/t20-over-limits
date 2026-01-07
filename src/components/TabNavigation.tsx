import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Play, ChartBar as BarChart3, Trophy, Award } from "lucide-react";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  children: React.ReactNode;
}

const TabNavigation = ({ activeTab, onTabChange, children }: TabNavigationProps) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-5 mb-6">
        <TabsTrigger value="teams" className="flex items-center space-x-2">
          <Users className="h-4 w-4" />
          <span>Teams</span>
        </TabsTrigger>
        <TabsTrigger value="live" className="flex items-center space-x-2">
          <Play className="h-4 w-4" />
          <span>Live Match</span>
        </TabsTrigger>
        <TabsTrigger value="tournament" className="flex items-center space-x-2">
          <Trophy className="h-4 w-4" />
          <span>Tournament</span>
        </TabsTrigger>
        <TabsTrigger value="records" className="flex items-center space-x-2">
          <Award className="h-4 w-4" />
          <span>Records</span>
        </TabsTrigger>
        <TabsTrigger value="stats" className="flex items-center space-x-2">
          <BarChart3 className="h-4 w-4" />
          <span>Statistics</span>
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
};

export default TabNavigation;