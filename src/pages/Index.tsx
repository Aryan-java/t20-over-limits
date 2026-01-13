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
      {/* Stadium atmosphere background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Main gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-cricket-pitch via-background to-background dark:from-cricket-sky/20 dark:via-background dark:to-background" />
        
        {/* Cricket pitch pattern overlay */}
        <div className="absolute inset-0 bg-pitch-pattern opacity-[0.03] dark:opacity-[0.02]" />
        
        {/* Stadium floodlights glow effect */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl dark:bg-primary/10" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cricket-gold/5 rounded-full blur-3xl dark:bg-cricket-gold/10" />
        
        {/* Field boundary line effect at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
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