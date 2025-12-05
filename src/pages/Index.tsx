import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import CricketHeader from "@/components/CricketHeader";
import TabNavigation from "@/components/TabNavigation";
import TeamsTab from "@/components/TeamsTab";
import LiveMatchTab from "@/components/LiveMatchTab";
import TournamentTab from "@/components/TournamentTab";
import StatsTab from "@/components/StatsTab";
import GameLobby from "@/components/GameLobby";
import GameModeSelector from "@/components/GameModeSelector";
import { TabsContent } from "@/components/ui/tabs";

type GameMode = 'selecting' | 'single' | 'multiplayer';

const Index = () => {
  const [activeTab, setActiveTab] = useState("teams");
  const [gameMode, setGameMode] = useState<GameMode>('selecting');
  const [multiplayerStarted, setMultiplayerStarted] = useState(false);

  // Check if there's an existing multiplayer session
  useEffect(() => {
    const sessionId = localStorage.getItem('game_session_id');
    if (sessionId) {
      setGameMode('multiplayer');
    }
  }, []);

  const handleSelectSingle = () => {
    setGameMode('single');
  };

  const handleSelectMultiplayer = () => {
    setGameMode('multiplayer');
  };

  const handleMultiplayerGameStart = () => {
    setMultiplayerStarted(true);
  };

  const handleExitMultiplayer = () => {
    localStorage.removeItem('game_player_id');
    localStorage.removeItem('game_session_id');
    setGameMode('selecting');
    setMultiplayerStarted(false);
  };

  const handleBackToModeSelect = () => {
    setGameMode('selecting');
  };

  // Show mode selection at start
  if (gameMode === 'selecting') {
    return (
      <>
        <GameModeSelector 
          onSelectSingle={handleSelectSingle}
          onSelectMultiplayer={handleSelectMultiplayer}
        />
        <Toaster />
      </>
    );
  }

  // Show multiplayer lobby if multiplayer mode and game hasn't started
  if (gameMode === 'multiplayer' && !multiplayerStarted) {
    return (
      <GameLobby 
        onGameStart={handleMultiplayerGameStart} 
        onBack={handleBackToModeSelect}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cricket-pitch via-background to-cricket-pitch/30">
      <CricketHeader 
        isMultiplayer={gameMode === 'multiplayer'} 
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
