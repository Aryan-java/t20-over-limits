import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Match, Player } from "@/types/cricket";
import { RotateCcw, Users, Target, AlertTriangle } from "lucide-react";

interface LiveMatchControlsProps {
  match: Match;
  onBowlerChange: (bowlerId: string) => void;
  onNextBatsman: (batsmanId: string) => void;
  onSimulateBall: () => void;
  onUseImpactPlayer: (playerId: string, replacePlayerId: string) => void;
}

const LiveMatchControls = ({ 
  match, 
  onBowlerChange, 
  onNextBatsman, 
  onSimulateBall,
  onUseImpactPlayer 
}: LiveMatchControlsProps) => {
  const [showBowlerSelection, setShowBowlerSelection] = useState(false);
  const [showBatsmanSelection, setShowBatsmanSelection] = useState(false);
  const [showImpactSelection, setShowImpactSelection] = useState(false);
  const [selectedBowler, setSelectedBowler] = useState("");
  const [selectedBatsman, setSelectedBatsman] = useState("");
  const [impactPlayer, setImpactPlayer] = useState("");
  const [replacePlayer, setReplacePlayer] = useState("");

  const getCurrentInnings = () => {
    return match.currentInnings === 1 ? match.firstInnings : match.secondInnings;
  };

  const getBowlingTeam = () => {
    const innings = getCurrentInnings();
    if (!innings) return null;
    
    return innings.bowlingTeam === match.team1.name 
      ? (match.team1Setup?.playingXI || [])
      : (match.team2Setup?.playingXI || []);
  };

  const getBattingTeam = () => {
    const innings = getCurrentInnings();
    if (!innings) return null;
    
    return innings.battingTeam === match.team1.name 
      ? (match.team1Setup?.playingXI || [])
      : (match.team2Setup?.playingXI || []);
  };

  const getAvailableBowlers = () => {
    const bowlingTeam = getBowlingTeam();
    if (!bowlingTeam) return [];
    
    // Filter out current bowler and players who have bowled maximum overs
    const maxOvers = Math.floor(match.overs / 5); // Max overs per bowler in T20
    return bowlingTeam.filter(player => 
      player.oversBowled < maxOvers && 
      player.id !== getCurrentInnings()?.currentBowler?.id
    );
  };

  const getAvailableBatsmen = () => {
    const battingTeam = getBattingTeam();
    if (!battingTeam) return [];
    
    const innings = getCurrentInnings();
    if (!innings) return [];
    
    // Filter out current batsmen and dismissed players
    return battingTeam.filter(player => 
      !player.dismissed &&
      player.id !== innings.currentBatsmen.striker?.id &&
      player.id !== innings.currentBatsmen.nonStriker?.id
    );
  };

  const getCurrentTeamSetup = () => {
    const innings = getCurrentInnings();
    if (!innings) return null;
    
    return innings.battingTeam === match.team1.name 
      ? match.team1Setup 
      : match.team2Setup;
  };

  const getImpactPlayers = () => {
    const teamSetup = getCurrentTeamSetup();
    return teamSetup?.impactPlayers || [];
  };

  const isImpactPlayerUsed = () => {
    const teamSetup = getCurrentTeamSetup();
    return teamSetup?.impactPlayerUsed || false;
  };

  const getSubstitutedPlayerId = () => {
    const teamSetup = getCurrentTeamSetup();
    return teamSetup?.substitutedPlayerId;
  };

  // Calculate overseas count in current playing XI
  const getCurrentOverseasCount = () => {
    const battingTeam = getBattingTeam();
    if (!battingTeam) return 0;
    return battingTeam.filter(p => p.isOverseas).length;
  };

  // Validate if substitution would exceed overseas limit
  const validateOverseasLimit = (impactPlayerId: string, replacePlayerId: string): { valid: boolean; message: string } => {
    const battingTeam = getBattingTeam();
    const impactPlayers = getImpactPlayers();
    
    if (!battingTeam) return { valid: false, message: "No batting team found" };
    
    const impactPlayerData = impactPlayers.find(p => p.id === impactPlayerId);
    const replacePlayerData = battingTeam.find(p => p.id === replacePlayerId);
    
    if (!impactPlayerData || !replacePlayerData) {
      return { valid: false, message: "Player not found" };
    }
    
    const currentOverseas = getCurrentOverseasCount();
    const isImpactOverseas = impactPlayerData.isOverseas;
    const isReplaceOverseas = replacePlayerData.isOverseas;
    
    // Calculate new overseas count after substitution
    let newOverseasCount = currentOverseas;
    if (isReplaceOverseas) newOverseasCount -= 1;
    if (isImpactOverseas) newOverseasCount += 1;
    
    if (newOverseasCount > 4) {
      return { 
        valid: false, 
        message: `Cannot substitute: Would exceed maximum 4 overseas players (current: ${currentOverseas}, after: ${newOverseasCount})`
      };
    }
    
    return { valid: true, message: "" };
  };

  // Memoized validation result
  const substitutionValidation = useMemo(() => {
    if (!impactPlayer || !replacePlayer) {
      return { valid: true, message: "" };
    }
    return validateOverseasLimit(impactPlayer, replacePlayer);
  }, [impactPlayer, replacePlayer]);

  const handleBowlerChange = () => {
    if (selectedBowler) {
      onBowlerChange(selectedBowler);
      setShowBowlerSelection(false);
      setSelectedBowler("");
    }
  };

  const handleNextBatsman = () => {
    if (selectedBatsman) {
      onNextBatsman(selectedBatsman);
      setShowBatsmanSelection(false);
      setSelectedBatsman("");
    }
  };

  const handleImpactPlayer = () => {
    if (impactPlayer && replacePlayer) {
      const validation = validateOverseasLimit(impactPlayer, replacePlayer);
      if (!validation.valid) {
        return; // Don't proceed if validation fails
      }
      onUseImpactPlayer(impactPlayer, replacePlayer);
      // The impactPlayerUsed flag is now updated in the match state via onUseImpactPlayer
      setShowImpactSelection(false);
      setImpactPlayer("");
      setReplacePlayer("");
    }
  };

  const innings = getCurrentInnings();
  if (!innings) return null;

  const isOverComplete = innings.ballsBowled % 6 === 0 && innings.ballsBowled > 0;
  const isWicketFallen = innings.currentBatsmen.striker?.dismissed || innings.currentBatsmen.nonStriker?.dismissed;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Match Controls</span>
            <Badge variant="outline">
              Over {Math.floor(innings.ballsBowled / 6) + 1}.{(innings.ballsBowled % 6) + 1}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ball Simulation */}
          <div className="flex space-x-2">
            <Button 
              onClick={onSimulateBall}
              className="flex-1 bg-cricket-green hover:bg-cricket-green/90"
              disabled={innings.isCompleted}
            >
              Simulate Next Ball
            </Button>
          </div>

          {/* Tactical Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {isOverComplete && (
              <Button 
                variant="outline" 
                onClick={() => setShowBowlerSelection(true)}
                className="flex items-center space-x-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Change Bowler</span>
              </Button>
            )}
            
            {isWicketFallen && (
              <Button 
                variant="outline" 
                onClick={() => setShowBatsmanSelection(true)}
                className="flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>Next Batsman</span>
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => setShowImpactSelection(true)}
              disabled={isImpactPlayerUsed() || getImpactPlayers().length === 0}
              className="flex items-center space-x-2"
            >
              <Target className="h-4 w-4" />
              <span>{isImpactPlayerUsed() ? "Impact Used" : "Impact Player"}</span>
            </Button>
          </div>

          {/* Current Match State */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">Current Bowler</div>
              <div className="text-muted-foreground">
                {innings.currentBowler?.name || "Not set"}
              </div>
            </div>
            <div>
              <div className="font-medium">On Strike</div>
              <div className="text-muted-foreground">
                {innings.currentBatsmen.striker?.name || "Not set"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bowler Selection Dialog - Cannot be dismissed by clicking outside */}
      <Dialog open={showBowlerSelection} onOpenChange={() => {}}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Select Bowler for Next Over</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedBowler} onValueChange={setSelectedBowler}>
              <SelectTrigger>
                <SelectValue placeholder="Choose bowler" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableBowlers().map(player => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name} ({player.oversBowled} overs bowled)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex space-x-2">
              <Button onClick={handleBowlerChange} disabled={!selectedBowler}>
                Set Bowler
              </Button>
              <Button variant="outline" onClick={() => setShowBowlerSelection(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batsman Selection Dialog - Cannot be dismissed by clicking outside */}
      <Dialog open={showBatsmanSelection} onOpenChange={() => {}}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Select Next Batsman</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedBatsman} onValueChange={setSelectedBatsman}>
              <SelectTrigger>
                <SelectValue placeholder="Choose next batsman" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableBatsmen().map(player => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name} (Bat: {player.batSkill})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex space-x-2">
              <Button onClick={handleNextBatsman} disabled={!selectedBatsman}>
                Send In
              </Button>
              <Button variant="outline" onClick={() => setShowBatsmanSelection(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Impact Player Dialog */}
      <Dialog open={showImpactSelection} onOpenChange={setShowImpactSelection}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Use Impact Player (One Per Match)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                You can only use ONE impact player substitution per match. This cannot be undone.
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Current overseas in XI: {getCurrentOverseasCount()}/4
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium">Impact Player</label>
              <Select value={impactPlayer} onValueChange={setImpactPlayer}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose impact player" />
                </SelectTrigger>
                <SelectContent>
                  {getImpactPlayers().map(player => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name} {player.isOverseas && "(OS)"} (Bat: {player.batSkill}, Bowl: {player.bowlSkill})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Replace Player from Playing XI</label>
              <Select value={replacePlayer} onValueChange={setReplacePlayer}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose player to replace" />
                </SelectTrigger>
                <SelectContent>
                  {getBattingTeam()?.filter(player => !player.dismissed).map(player => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name} {player.isOverseas && "(OS)"} 
                      {player.runs > 0 && ` - ${player.runs}(${player.balls})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                The replaced player cannot participate further in this match
              </p>
            </div>
            
            {/* Validation Warning */}
            {!substitutionValidation.valid && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">
                  {substitutionValidation.message}
                </p>
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button 
                onClick={handleImpactPlayer} 
                disabled={!impactPlayer || !replacePlayer || !substitutionValidation.valid}
              >
                Make Substitution
              </Button>
              <Button variant="outline" onClick={() => setShowImpactSelection(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LiveMatchControls;