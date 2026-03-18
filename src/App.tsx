import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useMultiplayerStore } from "@/hooks/useMultiplayerStore";
import Index from "./pages/Index";
import PlayerProfile from "./pages/PlayerProfile";
import NotFound from "./pages/NotFound";
import GameModeSelection from "./components/GameModeSelection";
import MultiplayerLobby from "./components/MultiplayerLobby";

const queryClient = new QueryClient();

const AppContent = () => {
  const { gameMode, lobbyStatus } = useMultiplayerStore();

  // Show game mode selection
  if (gameMode === 'selection') {
    return <GameModeSelection />;
  }

  // Show lobby for multiplayer
  if (gameMode === 'multiplayer' && lobbyStatus === 'in-lobby') {
    return <MultiplayerLobby />;
  }

  // Main app (single player or multiplayer in-game)
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/player/:playerId" element={<PlayerProfile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="cricket-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
