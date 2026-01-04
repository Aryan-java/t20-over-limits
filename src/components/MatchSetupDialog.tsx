import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCricketStore } from "@/hooks/useCricketStore";
import { Team, Player } from "@/types/cricket";
import { useToast } from "@/hooks/use-toast";
import { Globe, ArrowUp, ArrowDown, MapPin, Zap } from "lucide-react";
import { Venue, calculatePlayerSuitability, getBowlingRecommendation } from "@/data/venues";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MatchSetupDialogProps {
  team1: Team | null;
  team2: Team | null;
  venue?: Venue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMatchReady: (team1Setup: TeamSetup, team2Setup: TeamSetup) => void;
}

interface TeamSetup {
  team: Team;
  playingXI: Player[];
  impactPlayers: Player[];
  battingOrder: Player[];
  openingPair: [Player, Player];
}

const MatchSetupDialog = ({ team1, team2, venue, open, onOpenChange, onMatchReady }: MatchSetupDialogProps) => {
  const { toast } = useToast();
  const [currentTeam, setCurrentTeam] = useState<1 | 2>(1);
  const [team1Setup, setTeam1Setup] = useState<Partial<TeamSetup>>({});
  const [team2Setup, setTeam2Setup] = useState<Partial<TeamSetup>>({});

  const getCurrentTeam = () => currentTeam === 1 ? team1 : team2;
  const getCurrentSetup = () => currentTeam === 1 ? team1Setup : team2Setup;
  const setCurrentSetup = (setup: Partial<TeamSetup>) => {
    if (currentTeam === 1) {
      setTeam1Setup(setup);
    } else {
      setTeam2Setup(setup);
    }
  };

  const [selectedXI, setSelectedXI] = useState<string[]>([]);
  const [selectedImpact, setSelectedImpact] = useState<string[]>([]);
  const [battingOrder, setBattingOrder] = useState<Player[]>([]);
  const [openingPair, setOpeningPair] = useState<[string, string]>(["", ""]);

  useEffect(() => {
    if (open && getCurrentTeam()) {
      const team = getCurrentTeam()!;
      const setup = getCurrentSetup();
      
      // Pre-populate from lastMatchSetup if no current setup
      if (!setup.playingXI && team.lastMatchSetup) {
        setSelectedXI(team.lastMatchSetup.playingXI);
        setSelectedImpact(team.lastMatchSetup.impactPlayers);
        setOpeningPair([
          team.lastMatchSetup.openingPair[0],
          team.lastMatchSetup.openingPair[1]
        ]);
      } else {
        setSelectedXI(setup.playingXI?.map(p => p.id) || []);
        setSelectedImpact(setup.impactPlayers?.map(p => p.id) || []);
        setBattingOrder(setup.battingOrder || []);
        setOpeningPair([
          setup.openingPair?.[0]?.id || "",
          setup.openingPair?.[1]?.id || ""
        ]);
      }
    }
  }, [currentTeam, open]);

  const togglePlayerXI = (playerId: string) => {
    if (selectedXI.includes(playerId)) {
      setSelectedXI(selectedXI.filter(id => id !== playerId));
    } else if (selectedXI.length < 11) {
      setSelectedXI([...selectedXI, playerId]);
    }
  };

  const togglePlayerImpact = (playerId: string) => {
    if (selectedImpact.includes(playerId)) {
      setSelectedImpact([]);
    } else {
      // Only allow exactly 1 impact player
      setSelectedImpact([playerId]);
    }
  };

  const moveBattingOrder = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...battingOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
      setBattingOrder(newOrder);
    }
  };

  const validateAndSaveTeamSetup = () => {
    const team = getCurrentTeam();
    if (!team) return false;

    if (selectedXI.length !== 11) {
      toast({
        title: "Error",
        description: "Please select exactly 11 players for playing XI",
        variant: "destructive"
      });
      return false;
    }

    const selectedPlayers = team.squad.filter(p => selectedXI.includes(p.id));
    const overseasCount = selectedPlayers.filter(p => p.isOverseas).length;
    
    if (overseasCount > 4) {
      toast({
        title: "Error",
        description: "Maximum 4 overseas players allowed in playing XI",
        variant: "destructive"
      });
      return false;
    }

    if (!openingPair[0] || !openingPair[1] || openingPair[0] === openingPair[1]) {
      toast({
        title: "Error",
        description: "Please select two different opening batsmen",
        variant: "destructive"
      });
      return false;
    }

    // Auto-generate batting order if not set
    let finalBattingOrder = battingOrder;
    if (finalBattingOrder.length === 0) {
      const opener1 = selectedPlayers.find(p => p.id === openingPair[0])!;
      const opener2 = selectedPlayers.find(p => p.id === openingPair[1])!;
      const others = selectedPlayers.filter(p => p.id !== openingPair[0] && p.id !== openingPair[1]);
      finalBattingOrder = [opener1, opener2, ...others];
    }

    const impactPlayers = team.squad.filter(p => selectedImpact.includes(p.id));
    const openingPairPlayers: [Player, Player] = [
      selectedPlayers.find(p => p.id === openingPair[0])!,
      selectedPlayers.find(p => p.id === openingPair[1])!
    ];

    const setup: TeamSetup = {
      team,
      playingXI: selectedPlayers,
      impactPlayers,
      battingOrder: finalBattingOrder,
      openingPair: openingPairPlayers
    };

    // Save to team's lastMatchSetup
    team.lastMatchSetup = {
      playingXI: selectedXI,
      impactPlayers: selectedImpact,
      openingPair: [openingPair[0], openingPair[1]]
    };

    setCurrentSetup(setup);
    return true;
  };

  const handleNext = () => {
    if (validateAndSaveTeamSetup()) {
      if (currentTeam === 1) {
        setCurrentTeam(2);
        // Pre-populate team 2 from lastMatchSetup if available
        if (team2 && team2.lastMatchSetup) {
          setSelectedXI(team2.lastMatchSetup.playingXI);
          setSelectedImpact(team2.lastMatchSetup.impactPlayers);
          setOpeningPair([
            team2.lastMatchSetup.openingPair[0],
            team2.lastMatchSetup.openingPair[1]
          ]);
        } else {
          setSelectedXI([]);
          setSelectedImpact([]);
          setBattingOrder([]);
          setOpeningPair(["", ""]);
        }
      } else {
        // Both teams setup complete
        if (team1Setup.playingXI && team2Setup.playingXI) {
          onMatchReady(team1Setup as TeamSetup, team2Setup as TeamSetup);
          onOpenChange(false);
        }
      }
    }
  };

  const handleBack = () => {
    if (currentTeam === 2) {
      setCurrentTeam(1);
      // Restore team 1 setup
      const setup = team1Setup;
      setSelectedXI(setup.playingXI?.map(p => p.id) || []);
      setSelectedImpact(setup.impactPlayers?.map(p => p.id) || []);
      setBattingOrder(setup.battingOrder || []);
      setOpeningPair([
        setup.openingPair?.[0]?.id || "",
        setup.openingPair?.[1]?.id || ""
      ]);
    }
  };

  const team = getCurrentTeam();
  if (!team) return null;

  const selectedXIPlayers = team.squad.filter(p => selectedXI.includes(p.id));
  const overseasInXI = selectedXIPlayers.filter(p => p.isOverseas).length;
  
  // Impact players can only include overseas if XI has 3 or fewer overseas
  const canSelectOverseasImpact = overseasInXI <= 3;
  const availableForImpact = team.squad.filter(p => {
    if (selectedXI.includes(p.id)) return false;
    if (p.isOverseas && !canSelectOverseasImpact) return false;
    return true;
  });

  const bowlingRec = venue ? getBowlingRecommendation(venue) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Match Setup - {team.name} ({currentTeam === 1 ? "Team 1" : "Team 2"})
          </DialogTitle>
        </DialogHeader>

        {/* Venue Info Banner */}
        {venue && (
          <div className="p-3 bg-muted/30 rounded-lg border mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-semibold">{venue.name}</span>
                <span className="text-muted-foreground text-sm">• {venue.city}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <Badge variant={venue.pitchType === 'spin' ? 'secondary' : venue.pitchType === 'pace' ? 'outline' : 'default'}>
                  {venue.pitchType.charAt(0).toUpperCase() + venue.pitchType.slice(1)} Pitch
                </Badge>
                {bowlingRec && (
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span className={bowlingRec.type === 'spin' ? 'text-purple-500' : bowlingRec.type === 'pace' ? 'text-blue-500' : 'text-green-500'}>
                      {bowlingRec.priority}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span>Avg Score: {venue.avgFirstInningsScore}</span>
              <span>Spin: {venue.spinFriendliness}%</span>
              <span>Pace: {venue.paceFriendliness}%</span>
              <span>Dew: {venue.dewFactor}%</span>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Playing XI Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Playing XI ({selectedXI.length}/11)</h3>
              <Badge variant={overseasInXI <= 4 ? "default" : "destructive"}>
                {overseasInXI}/4 Overseas
              </Badge>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              <TooltipProvider>
                {team.squad.map((player) => {
                  const suitability = venue ? calculatePlayerSuitability(player, venue) : null;
                  return (
                    <div key={player.id} className="flex items-center space-x-3 p-2 border rounded">
                      <Checkbox
                        checked={selectedXI.includes(player.id)}
                        onCheckedChange={() => togglePlayerXI(player.id)}
                        disabled={!selectedXI.includes(player.id) && selectedXI.length >= 11}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{player.name}</span>
                          {player.isOverseas && (
                            <Badge variant="outline" className="text-xs">
                              <Globe className="h-3 w-3 mr-1" />
                              OS
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Bat: {player.batSkill} | Bowl: {player.bowlSkill}
                        </div>
                        {player.performanceHistory && player.performanceHistory.totalMatches > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {player.performanceHistory.totalRuns} runs, {player.performanceHistory.totalWickets} wkts
                          </div>
                        )}
                      </div>
                      {suitability && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={`text-right min-w-[60px] ${suitability.color}`}>
                              <div className="text-sm font-bold">{suitability.score}</div>
                              <div className="text-[10px]">{suitability.label}</div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-[200px]">
                            <p className="font-semibold mb-1">Venue Suitability</p>
                            {suitability.reasons.length > 0 ? (
                              <ul className="text-xs list-disc pl-3">
                                {suitability.reasons.map((r, i) => (
                                  <li key={i}>{r}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs">Standard conditions match</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  );
                })}
              </TooltipProvider>
            </div>
          </div>

          {/* Batting Order & Opening Pair */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Batting Setup</h3>
            
            {/* Opening Pair */}
            <div className="space-y-2">
              <Label>Opening Pair</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select value={openingPair[0]} onValueChange={(value) => setOpeningPair([value, openingPair[1]])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Opener 1" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedXIPlayers.map(player => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={openingPair[1]} onValueChange={(value) => setOpeningPair([openingPair[0], value])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Opener 2" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedXIPlayers.filter(p => p.id !== openingPair[0]).map(player => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Batting Order */}
            {battingOrder.length > 0 && (
              <div className="space-y-2">
                <Label>Batting Order</Label>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {battingOrder.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 text-center font-bold">{index + 1}</span>
                        <span>{player.name}</span>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveBattingOrder(index, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveBattingOrder(index, 'down')}
                          disabled={index === battingOrder.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Impact Player */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Impact Player ({selectedImpact.length}/1)</h3>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950/30 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Impact Player Rule:</strong>
              </p>
              <ul className="text-xs text-amber-700 dark:text-amber-400 mt-1 space-y-1 list-disc pl-4">
                <li>Select exactly <strong>1 Impact Player</strong> (12th player)</li>
                <li>Can substitute <strong>ONE</strong> player from Playing XI during match</li>
                <li>Substituted player <strong>cannot</strong> participate further</li>
                <li>Substitution is <strong>permanent</strong> and cannot be reversed</li>
              </ul>
              {overseasInXI >= 4 && (
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-2 font-medium">
                  ⚠️ Playing XI has 4 overseas players. Only Indian players can be selected as impact.
                </p>
              )}
              {overseasInXI === 3 && (
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                  ℹ️ You can select 1 overseas impact player (XI has 3 overseas).
                </p>
              )}
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <TooltipProvider>
                {availableForImpact.map((player) => {
                  const suitability = venue ? calculatePlayerSuitability(player, venue) : null;
                  return (
                    <div key={player.id} className={`flex items-center space-x-3 p-2 border rounded ${selectedImpact.includes(player.id) ? 'border-primary bg-primary/5' : ''}`}>
                      <Checkbox
                        checked={selectedImpact.includes(player.id)}
                        onCheckedChange={() => togglePlayerImpact(player.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{player.name}</span>
                          {player.isOverseas && (
                            <Badge variant="outline" className="text-xs">
                              <Globe className="h-3 w-3 mr-1" />
                              OS
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Bat: {player.batSkill} | Bowl: {player.bowlSkill}
                        </div>
                        {player.performanceHistory && player.performanceHistory.totalMatches > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {player.performanceHistory.totalRuns} runs, {player.performanceHistory.totalWickets} wkts
                          </div>
                        )}
                      </div>
                      {suitability && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={`text-right min-w-[60px] ${suitability.color}`}>
                              <div className="text-sm font-bold">{suitability.score}</div>
                              <div className="text-[10px]">{suitability.label}</div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-[200px]">
                            <p className="font-semibold mb-1">Venue Suitability</p>
                            {suitability.reasons.length > 0 ? (
                              <ul className="text-xs list-disc pl-3">
                                {suitability.reasons.map((r, i) => (
                                  <li key={i}>{r}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs">Standard conditions match</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  );
                })}
              </TooltipProvider>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <div className="flex space-x-2">
            {currentTeam === 2 && (
              <Button variant="outline" onClick={handleBack}>
                Back to {team1?.name}
              </Button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleNext}>
              {currentTeam === 1 ? `Next: ${team2?.name}` : "Start Match"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatchSetupDialog;