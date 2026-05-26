import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import { Match } from "@/types/cricket";
import { useCricketStore } from "@/hooks/useCricketStore";
import CoinTossAnimation from "./CoinTossAnimation";

interface TossDialogProps {
  match: Match;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const TossDialog = ({ match, open, onOpenChange, onComplete }: TossDialogProps) => {
  const { updateMatch } = useCricketStore();
  const [winner, setWinner] = useState<"team1" | "team2" | null>(null);

  const handleChoice = (choice: "bat" | "bowl") => {
    if (!winner) return;
    const winnerTeam = winner === "team1" ? match.team1 : match.team2;
    updateMatch({ tossWinner: winnerTeam, tossChoice: choice });
    onComplete();
  };

  const reset = () => setWinner(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Coins className="h-5 w-5" />
            <span>Toss</span>
          </DialogTitle>
        </DialogHeader>

        {!winner ? (
          <div className="space-y-4">
            <p className="text-center text-lg font-semibold">
              {match.team1.name} vs {match.team2.name}
            </p>
            <CoinTossAnimation
              team1Name={match.team1.name}
              team2Name={match.team2.name}
              onResult={(w) => setWinner(w)}
            />
          </div>
        ) : (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Choose to</p>
              <p className="text-xl font-bold">
                {winner === "team1" ? match.team1.name : match.team2.name}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleChoice("bat")}
                className="py-6 bg-cricket-green hover:bg-cricket-green/90"
              >
                <div className="text-center">
                  <div className="text-lg font-semibold">Bat First</div>
                  <div className="text-sm opacity-80">Set a target</div>
                </div>
              </Button>
              <Button onClick={() => handleChoice("bowl")} variant="outline" className="py-6">
                <div className="text-center">
                  <div className="text-lg font-semibold">Bowl First</div>
                  <div className="text-sm opacity-80">Restrict runs</div>
                </div>
              </Button>
            </div>
            <Button variant="ghost" onClick={reset} className="text-sm">
              Toss again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TossDialog;