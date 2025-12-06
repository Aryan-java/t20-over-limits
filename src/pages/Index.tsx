import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import CricketHeader from "@/components/CricketHeader";
import TabNavigation from "@/components/TabNavigation";
import TeamsTab from "@/components/TeamsTab";
import LiveMatchTab from "@/components/LiveMatchTab";
import TournamentTab from "@/components/TournamentTab";
import StatsTab from "@/components/StatsTab";
import FixturesTab from "@/components/FixturesTab";
import MultiplayerFixturesTab from "@/components/MultiplayerFixturesTab";
import GameLobby from "@/components/GameLobby";
import GameModeSelector from "@/components/GameModeSelector";
import { TabsContent } from "@/components/ui/tabs";
import { useGameSession } from "@/hooks/useGameSession";
import { useCricketStore } from "@/hooks/useCricketStore";

type GameMode = 'selecting' | 'single' | 'multiplayer';

const Index = () => {
  const [activeTab, setActiveTab] = useState("teams");
  const [gameMode, setGameMode] = useState<GameMode>('selecting');
  const [multiplayerStarted, setMultiplayerStarted] = useState(false);
  
  const { session, currentPlayer, players } = useGameSession();
  const { setTeams, setCurrentMatch, currentMatch } = useCricketStore();

  // Check if there's an existing multiplayer session
  useEffect(() => {
    const sessionId = localStorage.getItem('game_session_id');
    if (sessionId) {
      setGameMode('multiplayer');
    }
  }, []);

  // Sync game state from session for multiplayer
  useEffect(() => {
    if (gameMode === 'multiplayer' && session?.game_state) {
      // Sync teams
      if (session.game_state.teams && session.game_state.teams.length > 0) {
        setTeams(session.game_state.teams);
      }
      // Sync current match
      if (session.game_state.currentMatch) {
        setCurrentMatch(session.game_state.currentMatch);
      }
    }
  }, [session?.game_state, gameMode]);

  // Auto-switch to Live tab when match starts in multiplayer
  useEffect(() => {
    if (gameMode === 'multiplayer' && currentMatch?.isLive) {
      setActiveTab('live');
    }
  }, [currentMatch?.isLive, gameMode]);

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

  const isMultiplayer = gameMode === 'multiplayer';
  const controlledTeamId = currentPlayer?.team_id || null;
  const isAdmin = currentPlayer?.is_admin || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cricket-pitch via-background to-cricket-pitch/30">
      <CricketHeader 
        isMultiplayer={isMultiplayer} 
        onExitMultiplayer={handleExitMultiplayer}
      />
      
      <main className="container mx-auto px-4 py-8">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab}>
          <TabsContent value="teams">
            <TeamsTab />
          </TabsContent>

          <TabsContent value="fixtures">
            {isMultiplayer ? (
              <MultiplayerFixturesTab 
                controlledTeamId={controlledTeamId}
                isAdmin={isAdmin}
              />
            ) : (
              <FixturesTab />
            )}
          </TabsContent>

          <TabsContent value="live">
            <LiveMatchTab 
              isMultiplayer={isMultiplayer}
              controlledTeamId={controlledTeamId}
            />
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
