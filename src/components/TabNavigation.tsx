import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, Play, BarChart3 } from "lucide-react";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  children: React.ReactNode;
}

const TabNavigation = ({ activeTab, onTabChange, children }: TabNavigationProps) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="teams" className="flex items-center space-x-2">
          <Users className="h-4 w-4" />
          <span>Teams</span>
        </TabsTrigger>
        <TabsTrigger value="fixtures" className="flex items-center space-x-2">
          <Calendar className="h-4 w-4" />
          <span>Fixtures</span>
        </TabsTrigger>
        <TabsTrigger value="live" className="flex items-center space-x-2">
          <Play className="h-4 w-4" />
          <span>Live Match</span>
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