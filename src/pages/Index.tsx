import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import CricketHeader from "@/components/CricketHeader";
import TabNavigation from "@/components/TabNavigation";
import TeamsTab from "@/components/TeamsTab";
import LiveMatchTab from "@/components/LiveMatchTab";
import TournamentTab from "@/components/TournamentTab";
import StatsTab from "@/components/StatsTab";
import AllTimeStats from "@/components/AllTimeStats";
import { TabsContent } from "@/components/ui/tabs";

const Index = () => {
  const [activeTab, setActiveTab] = useState("teams");

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Subtle stadium atmosphere background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-cricket-pitch/50 via-background to-background dark:from-cricket-sky/10 dark:via-background dark:to-background" />
        <div className="absolute inset-0 bg-pitch-pattern opacity-[0.02] dark:opacity-[0.01]" />
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-primary/3 rounded-full blur-3xl dark:bg-primary/5" />
        <div className="absolute top-0 right-1/3 w-60 h-60 bg-cricket-gold/3 rounded-full blur-3xl dark:bg-cricket-gold/5" />
      </div>
      
      <div className="relative z-10">
        <CricketHeader />
        
        <main className="container mx-auto px-4 py-8">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab}>
            <TabsContent value="teams" className="animate-fade-slide-up">
              <TeamsTab />
            </TabsContent>

            <TabsContent value="live" className="animate-fade-slide-up">
              <LiveMatchTab />
            </TabsContent>

            <TabsContent value="tournament" className="animate-fade-slide-up">
              <TournamentTab />
            </TabsContent>

            <TabsContent value="records" className="animate-fade-slide-up">
              <AllTimeStats />
            </TabsContent>

            <TabsContent value="stats" className="animate-fade-slide-up">
              <StatsTab />
            </TabsContent>
          </TabNavigation>
        </main>
      </div>
      
      <Toaster />
    </div>
  );
};

export default Index;