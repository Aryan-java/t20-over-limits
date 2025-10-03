import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import CricketHeader from "@/components/CricketHeader";
import TabNavigation from "@/components/TabNavigation";
import TeamsTab from "@/components/TeamsTab";
import FixturesTab from "@/components/FixturesTab";
import LiveMatchTab from "@/components/LiveMatchTab";
import HistoryTab from "@/components/HistoryTab";
import StatsTab from "@/components/StatsTab";
import { TabsContent } from "@/components/ui/tabs";

const Index = () => {
  const [activeTab, setActiveTab] = useState("teams");

  return (
    <div className="min-h-screen bg-gradient-to-br from-cricket-pitch via-background to-cricket-pitch/30">
      <CricketHeader />
      
      <main className="container mx-auto px-4 py-8">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab}>
          <TabsContent value="teams">
            <TeamsTab />
          </TabsContent>

          <TabsContent value="fixtures">
            <FixturesTab />
          </TabsContent>

          <TabsContent value="live">
            <LiveMatchTab />
          </TabsContent>

          <TabsContent value="history">
            <HistoryTab />
          </TabsContent>

          <TabsContent value="stats">
            <StatsTab />
          </TabsContent>
        </TabNavigation>
      </main>
      
      <Toaster />
    </div>
  );
};

export default Index;