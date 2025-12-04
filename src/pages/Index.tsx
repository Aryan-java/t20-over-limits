import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import CricketHeader from "@/components/CricketHeader";
import TabNavigation from "@/components/TabNavigation";
import TeamsTab from "@/components/TeamsTab";
import LiveMatchTab from "@/components/LiveMatchTab";
import TournamentTab from "@/components/TournamentTab";
import StatsTab from "@/components/StatsTab";
import GameLobby from "@/components/GameLobby";
import { TabsContent } from "@/components/ui/tabs";

const Index = () => {
  const [activeTab, setActiveTab] = useState("teams");
  const [gameStarted, setGameStarted] = useState(false);
  const [isMultiplayer, setIsMultiplayer] = useState(false);

  // Check if there's an existing session
  useEffect(() => {
    const sessionId = localStorage.getItem('game_session_id');
    if (sessionId) {
      setIsMultiplayer(true);
    }
  }, []);

  const handleGameStart = () => {
    setGameStarted(true);
  };

  const handleExitMultiplayer = () => {
    localStorage.removeItem('game_player_id');
    localStorage.removeItem('game_session_id');
    setIsMultiplayer(false);
    setGameStarted(false);
  };

  // Show lobby if multiplayer mode and game hasn't started
  if (isMultiplayer && !gameStarted) {
    return <GameLobby onGameStart={handleGameStart} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cricket-pitch via-background to-cricket-pitch/30">
      <CricketHeader 
        isMultiplayer={isMultiplayer} 
        onMultiplayerClick={() => setIsMultiplayer(true)}
        onExitMultiplayer={handleExitMultiplayer}
      />
      
      <main className="container mx-auto px-4 py-8">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab}>
          <TabsContent value="teams">
            <TeamsTab />
          </TabsContent>

          <TabsContent value="live">
            <LiveMatchTab />
          </TabsContent>

          <TabsContent value="tournament">
            <TournamentTab />
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
