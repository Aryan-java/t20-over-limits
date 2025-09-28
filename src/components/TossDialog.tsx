import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins } from "lucide-react";
import { Match } from "@/types/cricket";
import { useCricketStore } from "@/hooks/useCricketStore";

interface TossDialogProps {
  match: Match;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const TossDialog = ({ match, open, onOpenChange, onComplete }: TossDialogProps) => {
  const { updateMatch } = useCricketStore();
  const [tossResult, setTossResult] = useState<{
    winner: 'team1' | 'team2';
    choice: 'bat' | 'bowl';
  } | null>(null);
  const [step, setStep] = useState<'toss' | 'choice'>('toss');

  const handleToss = () => {
    const winner = Math.random() < 0.5 ? 'team1' : 'team2';
    setTossResult({ winner, choice: 'bat' });
    setStep('choice');
  };

  const handleChoice = (choice: 'bat' | 'bowl') => {
    if (!tossResult) return;
    
    const winnerTeam = tossResult.winner === 'team1' ? match.team1 : match.team2;
    
    updateMatch({
      tossWinner: winnerTeam,
      tossChoice: choice,
    });
    
    onComplete();
  };

  const resetToss = () => {
    setTossResult(null);
    setStep('toss');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Coins className="h-5 w-5" />
            <span>Toss</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 text-center">
          {step === 'toss' ? (
            <>
              <div className="space-y-4">
                <div className="text-lg">
                  {match.team1.name} vs {match.team2.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  Click the coin to toss!
                </div>
              </div>
              
              <div className="py-8">
                <Button
                  onClick={handleToss}
                  variant="outline"
                  size="lg"
                  className="w-24 h-24 rounded-full text-4xl hover:scale-110 transition-transform"
                >
                  🪙
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="text-lg font-semibold">
                  {tossResult?.winner === 'team1' ? match.team1.name : match.team2.name} won the toss!
                </div>
                <div className="text-sm text-muted-foreground">
                  Choose to bat or bowl first
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={() => handleChoice('bat')}
                  className="py-6 bg-cricket-green hover:bg-cricket-green/90"
                >
                  <div className="text-center">
                    <div className="text-lg font-semibold">Bat First</div>
                    <div className="text-sm opacity-80">Set a target</div>
                  </div>
                </Button>
                
                <Button 
                  onClick={() => handleChoice('bowl')}
                  variant="outline"
                  className="py-6"
                >
                  <div className="text-center">
                    <div className="text-lg font-semibold">Bowl First</div>
                    <div className="text-sm opacity-80">Restrict runs</div>
                  </div>
                </Button>
              </div>
              
              <Button variant="ghost" onClick={resetToss} className="text-sm">
                Toss again
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TossDialog;