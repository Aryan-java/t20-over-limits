import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Match, Player } from "@/types/cricket";
import { RotateCcw, Users, Target, AlertTriangle } from "lucide-react";

type SubSide = 'batting' | 'bowling';

interface LiveMatchControlsProps {
  match: Match;
  onBowlerChange: (bowlerId: string) => void;
  onNextBatsman: (batsmanId: string) => void;
  onSimulateBall: () => void;
  onUseImpactPlayer: (playerId: string, replacePlayerId: string, side: SubSide) => void;
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
  const [impactSide, setImpactSide] = useState<SubSide>('batting');
  const [impactPlayer, setImpactPlayer] = useState("");
  const [replacePlayer, setReplacePlayer] = useState("");

  const getCurrentInnings = () => {
    return match.currentInnings === 1 ? match.firstInnings : match.secondInnings;
  };

  const innings = getCurrentInnings();

  const battingIsTeam1 = innings?.battingTeam === match.team1.name;
  const battingSetup = battingIsTeam1 ? match.team1Setup : match.team2Setup;
  const bowlingSetup = battingIsTeam1 ? match.team2Setup : match.team1Setup;
  const battingTeamName = battingIsTeam1 ? match.team1.name : match.team2.name;
  const bowlingTeamName = battingIsTeam1 ? match.team2.name : match.team1.name;

  const sideSetup = impactSide === 'batting' ? battingSetup : bowlingSetup;
  const sideTeamName = impactSide === 'batting' ? battingTeamName : bowlingTeamName;

  // Reset selections when switching side
  useEffect(() => {
    setImpactPlayer("");
    setReplacePlayer("");
  }, [impactSide]);

  const getAvailableBowlers = () => {
    const xi = bowlingSetup?.playingXI || [];
    const maxOvers = Math.floor(match.overs / 5);
    return xi.filter(p => p.oversBowled < maxOvers && p.id !== innings?.currentBowler?.id);
  };

  const getAvailableBatsmen = () => {
    const xi = battingSetup?.playingXI || [];
    return xi.filter(p =>
      !p.dismissed &&
      p.id !== innings?.currentBatsmen.striker?.id &&
      p.id !== innings?.currentBatsmen.nonStriker?.id
    );
  };

  const impactBenchForSide = sideSetup?.impactPlayers || [];
  const sideImpactUsed = sideSetup?.impactPlayerUsed || false;
  const bothSidesUsed = (battingSetup?.impactPlayerUsed || false) && (bowlingSetup?.impactPlayerUsed || false);

  const sideOverseasCount = (sideSetup?.playingXI || []).filter(p => p.isOverseas).length;

  // Players eligible to be replaced for the chosen side
  const replaceableForSide = () => {
    const xi = sideSetup?.playingXI || [];
    if (impactSide === 'batting') {
      // Anyone in XI except the two batsmen currently at the crease
      return xi.filter(p =>
        p.id !== innings?.currentBatsmen.striker?.id &&
        p.id !== innings?.currentBatsmen.nonStriker?.id
      );
    }
    // bowling side: anyone except the current bowler
    return xi.filter(p => p.id !== innings?.currentBowler?.id);
  };


  const validateSubstitution = (impactId: string, replaceId: string): { valid: boolean; message: string } => {
    const xi = sideSetup?.playingXI || [];
    const impactPlayerData = impactBenchForSide.find(p => p.id === impactId);
    const replacePlayerData = xi.find(p => p.id === replaceId);

    if (!impactPlayerData || !replacePlayerData) return { valid: false, message: "Player not found" };

    let newOverseas = sideOverseasCount;
    if (replacePlayerData.isOverseas) newOverseas -= 1;
    if (impactPlayerData.isOverseas) newOverseas += 1;

    if (newOverseas > 4) {
      return { valid: false, message: `Would exceed 4 overseas players (after: ${newOverseas})` };
    }
    return { valid: true, message: "" };
  };

  const substitutionValidation = useMemo(() => {
    if (!impactPlayer || !replacePlayer) return { valid: true, message: "" };
    return validateSubstitution(impactPlayer, replacePlayer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [impactPlayer, replacePlayer, impactSide]);

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
      const v = validateSubstitution(impactPlayer, replacePlayer);
      if (!v.valid) return;
      onUseImpactPlayer(impactPlayer, replacePlayer, impactSide);
      setShowImpactSelection(false);
      setImpactPlayer("");
      setReplacePlayer("");
    }
  };

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
          <div className="flex space-x-2">
            <Button
              onClick={onSimulateBall}
              className="flex-1 bg-cricket-green hover:bg-cricket-green/90"
              disabled={innings.isCompleted}
            >
              Simulate Next Ball
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {isOverComplete && (
              <Button variant="outline" onClick={() => setShowBowlerSelection(true)} className="flex items-center space-x-2">
                <RotateCcw className="h-4 w-4" />
                <span>Change Bowler</span>
              </Button>
            )}

            {isWicketFallen && (
              <Button variant="outline" onClick={() => setShowBatsmanSelection(true)} className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Next Batsman</span>
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => {
                // default to a side that still has impact remaining
                const startSide: SubSide = !battingSetup?.impactPlayerUsed ? 'batting' : 'bowling';
                setImpactSide(startSide);
                setShowImpactSelection(true);
              }}
              disabled={bothSidesUsed}
              className="flex items-center space-x-2"
            >
              <Target className="h-4 w-4" />
              <span>{bothSidesUsed ? "Impact Used (Both)" : "Impact Player"}</span>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">Current Bowler</div>
              <div className="text-muted-foreground">{innings.currentBowler?.name || "Not set"}</div>
            </div>
            <div>
              <div className="font-medium">On Strike</div>
              <div className="text-muted-foreground">{innings.currentBatsmen.striker?.name || "Not set"}</div>
            </div>
          </div>

          <div className="flex gap-2 text-xs">
            <Badge variant={battingSetup?.impactPlayerUsed ? "secondary" : "outline"}>
              {battingTeamName}: {battingSetup?.impactPlayerUsed ? "Impact Used" : "Impact Available"}
            </Badge>
            <Badge variant={bowlingSetup?.impactPlayerUsed ? "secondary" : "outline"}>
              {bowlingTeamName}: {bowlingSetup?.impactPlayerUsed ? "Impact Used" : "Impact Available"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Bowler Selection Dialog */}
      <Dialog open={showBowlerSelection} onOpenChange={() => {}}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader><DialogTitle>Select Bowler for Next Over</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={selectedBowler} onValueChange={setSelectedBowler}>
              <SelectTrigger><SelectValue placeholder="Choose bowler" /></SelectTrigger>
              <SelectContent>
                {getAvailableBowlers().map(player => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name} ({player.oversBowled} overs bowled)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex space-x-2">
              <Button onClick={handleBowlerChange} disabled={!selectedBowler}>Set Bowler</Button>
              <Button variant="outline" onClick={() => setShowBowlerSelection(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batsman Selection Dialog */}
      <Dialog open={showBatsmanSelection} onOpenChange={() => {}}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader><DialogTitle>Select Next Batsman</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={selectedBatsman} onValueChange={setSelectedBatsman}>
              <SelectTrigger><SelectValue placeholder="Choose next batsman" /></SelectTrigger>
              <SelectContent>
                {getAvailableBatsmen().map(player => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name} (Bat: {player.batSkill})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex space-x-2">
              <Button onClick={handleNextBatsman} disabled={!selectedBatsman}>Send In</Button>
              <Button variant="outline" onClick={() => setShowBatsmanSelection(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Impact Player Dialog */}
      <Dialog open={showImpactSelection} onOpenChange={setShowImpactSelection}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Use Impact Player</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                Each team gets ONE impact substitution per match — usable at any point. The replaced player is out of the match (still counts as played).
              </p>
            </div>

            {/* Side selector */}
            <div>
              <label className="text-sm font-medium">Team Making Substitution</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Button
                  type="button"
                  variant={impactSide === 'batting' ? 'default' : 'outline'}
                  size="sm"
                  disabled={battingSetup?.impactPlayerUsed}
                  onClick={() => setImpactSide('batting')}
                >
                  🏏 {battingTeamName} {battingSetup?.impactPlayerUsed && '(Used)'}
                </Button>
                <Button
                  type="button"
                  variant={impactSide === 'bowling' ? 'default' : 'outline'}
                  size="sm"
                  disabled={bowlingSetup?.impactPlayerUsed}
                  onClick={() => setImpactSide('bowling')}
                >
                  🎯 {bowlingTeamName} {bowlingSetup?.impactPlayerUsed && '(Used)'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {sideTeamName} overseas in XI: {sideOverseasCount}/4
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Impact Player (from bench)</label>
              <Select value={impactPlayer} onValueChange={setImpactPlayer} disabled={sideImpactUsed}>
                <SelectTrigger><SelectValue placeholder="Choose impact player" /></SelectTrigger>
                <SelectContent>
                  {impactBenchForSide.map(player => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name} {player.isOverseas && "(OS)"} (Bat: {player.batSkill}, Bowl: {player.bowlSkill})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Replace Player from Playing XI</label>
              <Select value={replacePlayer} onValueChange={setReplacePlayer} disabled={sideImpactUsed}>
                <SelectTrigger><SelectValue placeholder="Choose player to replace" /></SelectTrigger>
                <SelectContent>
                  {replaceableForSide().map(player => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name} {player.isOverseas && "(OS)"}
                      {impactSide === 'batting' && player.dismissed ? ' - OUT' : ''}
                      {impactSide === 'batting' && !player.dismissed && player.balls > 0 ? ` - ${player.runs}(${player.balls})` : ''}
                      {impactSide === 'bowling' && player.oversBowled > 0 ? ` - ${player.oversBowled}ov` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {impactSide === 'batting'
                  ? "Any batter (including dismissed) can be replaced, except the two at the crease."
                  : "Any bowler can be replaced, except the current bowler."}
              </p>
            </div>


            {!substitutionValidation.valid && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{substitutionValidation.message}</p>
              </div>
            )}

            <div className="flex space-x-2">
              <Button
                onClick={handleImpactPlayer}
                disabled={!impactPlayer || !replacePlayer || !substitutionValidation.valid || sideImpactUsed}
              >
                Make Substitution
              </Button>
              <Button variant="outline" onClick={() => setShowImpactSelection(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LiveMatchControls;
