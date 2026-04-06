import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import CricketHeader from "@/components/CricketHeader";
import TabNavigation from "@/components/TabNavigation";
import TeamsTab from "@/components/TeamsTab";
import LiveMatchTab from "@/components/LiveMatchTab";
import TournamentTab from "@/components/TournamentTab";
import StatsTab from "@/components/StatsTab";
import AllTimeStats from "@/components/AllTimeStats";
import BestXITab from "@/components/BestXISection";
import { TabsContent } from "@/components/ui/tabs";

const Index = () => {
  const [activeTab, setActiveTab] = useState("teams");

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* CWC23-inspired deep purple atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(260,55%,18%)] via-background to-background" />
        <div className="absolute inset-0 bg-pitch-pattern opacity-[0.015]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/3 w-72 h-72 bg-accent/4 rounded-full blur-3xl" />
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

            <TabsContent value="bestxi" className="animate-fade-slide-up">
              <BestXITab />
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