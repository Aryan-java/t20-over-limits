import { Trophy, Target, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CricketHeaderProps {
  isMultiplayer?: boolean;
  onMultiplayerClick?: () => void;
  onExitMultiplayer?: () => void;
}

const CricketHeader = ({ isMultiplayer, onMultiplayerClick, onExitMultiplayer }: CricketHeaderProps) => {
  return (
    <header className="bg-gradient-to-r from-cricket-green to-cricket-green/80 text-primary-foreground py-6 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-full">
              <Trophy className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Cricket Simulator</h1>
              <p className="text-primary-foreground/80">T20 Tournament Management</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full">
              <Target className="h-4 w-4" />
              <span className="text-sm">T20 Format</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full">
              <Users className="h-4 w-4" />
              <span className="text-sm">8 Teams Max</span>
            </div>
            {!isMultiplayer ? (
              <Button 
                onClick={onMultiplayerClick}
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <Users className="h-4 w-4 mr-2" />
                Multiplayer
              </Button>
            ) : (
              <Button 
                onClick={onExitMultiplayer}
                variant="secondary"
                size="sm"
                className="bg-red-500/80 hover:bg-red-500 text-white border-0"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Exit MP
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default CricketHeader;