import { useState } from "react";
import { Button } from "@/components/ui/button";

interface CoinTossAnimationProps {
  team1Name: string;
  team2Name: string;
  onResult: (winner: "team1" | "team2") => void;
}

const CoinTossAnimation = ({ team1Name, team2Name, onResult }: CoinTossAnimationProps) => {
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<"team1" | "team2" | null>(null);
  const [callChoice, setCallChoice] = useState<"team1" | "team2" | null>(null);

  const flip = (call: "team1" | "team2") => {
    setCallChoice(call);
    setFlipping(true);
    setResult(null);
    const winner: "team1" | "team2" = Math.random() < 0.5 ? "team1" : "team2";
    setTimeout(() => {
      setFlipping(false);
      setResult(winner);
      setTimeout(() => onResult(winner), 1200);
    }, 2200);
  };

  return (
    <div className="space-y-6 text-center">
      {!callChoice ? (
        <>
          <p className="text-sm text-muted-foreground">Call the toss</p>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => flip("team1")} className="py-6 text-base">
              Heads · {team1Name}
            </Button>
            <Button onClick={() => flip("team2")} variant="outline" className="py-6 text-base">
              Tails · {team2Name}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="py-6 flex flex-col items-center gap-4">
            <div
              className={`coin-3d ${flipping ? "coin-flipping" : ""} ${
                !flipping && result ? (result === "team1" ? "coin-rest-heads" : "coin-rest-tails") : ""
              }`}
              aria-hidden
            >
              <div className="coin-face coin-heads">H</div>
              <div className="coin-face coin-tails">T</div>
            </div>
            {flipping && <p className="text-sm text-muted-foreground animate-pulse">Tossing the coin...</p>}
            {!flipping && result && (
              <div className="animate-fade-in space-y-1">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  It's {result === "team1" ? "Heads" : "Tails"}!
                </p>
                <p className="text-xl font-bold">
                  {(result === "team1" ? team1Name : team2Name)} won the toss
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CoinTossAnimation;
