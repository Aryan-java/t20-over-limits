import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, SkipForward, RotateCcw } from "lucide-react";
import { Match, BallEvent } from "@/types/cricket";

interface BallByBallEngineProps {
  match: Match;
}

const BallByBallEngine = ({ match }: BallByBallEngineProps) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [commentary, setCommentary] = useState<BallEvent[]>([]);
  const [currentBall, setCurrentBall] = useState(0);

  const simulateBall = () => {
    // Simple ball simulation logic
    const outcomes = [
      { runs: 0, isWicket: false, commentary: "Dot ball! Good bowling." },
      { runs: 1, isWicket: false, commentary: "Single taken." },
      { runs: 2, isWicket: false, commentary: "Two runs scored." },
      { runs: 4, isWicket: false, commentary: "FOUR! Beautiful shot!" },
      { runs: 6, isWicket: false, commentary: "SIX! What a shot!" },
      { runs: 0, isWicket: true, commentary: "WICKET! Clean bowled!" },
    ];

    const weights = [40, 30, 15, 8, 4, 3]; // Probability weights
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const random = Math.random() * totalWeight;
    
    let weightSum = 0;
    let selectedOutcome = outcomes[0];
    
    for (let i = 0; i < outcomes.length; i++) {
      weightSum += weights[i];
      if (random <= weightSum) {
        selectedOutcome = outcomes[i];
        break;
      }
    }

    const ballEvent: BallEvent = {
      ballNumber: currentBall + 1,
      bowler: "Bowler",
      batsman: "Striker",
      runs: selectedOutcome.runs,
      isWicket: selectedOutcome.isWicket,
      commentary: selectedOutcome.commentary,
    };

    setCommentary(prev => [ballEvent, ...prev.slice(0, 19)]); // Keep last 20 balls
    setCurrentBall(prev => prev + 1);
  };

  const handleAutoPlay = () => {
    setIsSimulating(!isSimulating);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulating) {
      interval = setInterval(() => {
        simulateBall();
      }, 2000); // Simulate a ball every 2 seconds
    }
    return () => clearInterval(interval);
  }, [isSimulating, currentBall]);

  const formatBallNumber = (ballNum: number) => {
    const over = Math.floor((ballNum - 1) / 6) + 1;
    const ball = ((ballNum - 1) % 6) + 1;
    return `${over}.${ball}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Ball-by-Ball Commentary</span>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={simulateBall}
              disabled={isSimulating}
            >
              <SkipForward className="h-4 w-4 mr-1" />
              Next Ball
            </Button>
            <Button
              variant={isSimulating ? "destructive" : "default"}
              size="sm"
              onClick={handleAutoPlay}
            >
              {isSimulating ? (
                <><Pause className="h-4 w-4 mr-1" />Pause</>
              ) : (
                <><Play className="h-4 w-4 mr-1" />Auto Play</>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCommentary([]);
                setCurrentBall(0);
                setIsSimulating(false);
              }}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {commentary.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-2">🏏</div>
              <p>Click "Next Ball" or "Auto Play" to start simulation</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-3">
              {commentary.map((ball, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border ${
                    ball.isWicket 
                      ? 'bg-destructive/10 border-destructive/20' 
                      : ball.runs >= 4 
                      ? 'bg-cricket-green/10 border-cricket-green/20'
                      : 'bg-muted/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {formatBallNumber(ball.ballNumber)}
                        </Badge>
                        <span className="text-sm font-medium">
                          {ball.bowler} to {ball.batsman}
                        </span>
                      </div>
                      <p className="text-sm">{ball.commentary}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {ball.isWicket ? (
                        <Badge className="bg-destructive text-white">W</Badge>
                      ) : (
                        <Badge 
                          className={
                            ball.runs >= 4 
                              ? "bg-cricket-green text-white"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {ball.runs}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BallByBallEngine;