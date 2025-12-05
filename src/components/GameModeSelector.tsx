import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Users } from 'lucide-react';

interface GameModeSelectorProps {
  onSelectSingle: () => void;
  onSelectMultiplayer: () => void;
}

const GameModeSelector = ({ onSelectSingle, onSelectMultiplayer }: GameModeSelectorProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cricket-pitch via-background to-cricket-pitch/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">🏏 Cricket Manager</CardTitle>
          <CardDescription>Choose your game mode</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={onSelectSingle} 
            className="w-full h-16 text-lg"
            size="lg"
          >
            <User className="mr-3 h-6 w-6" />
            Single Player
          </Button>
          <Button 
            onClick={onSelectMultiplayer} 
            variant="outline" 
            className="w-full h-16 text-lg"
            size="lg"
          >
            <Users className="mr-3 h-6 w-6" />
            Multiplayer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameModeSelector;
