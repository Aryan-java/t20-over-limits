import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useCricketStore } from "@/hooks/useCricketStore";
import { Team, Player } from "@/types/cricket";
import { useToast } from "@/hooks/use-toast";
import PlayerRow from "./PlayerRow";

interface SelectPlayingXIDialogProps {
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SelectPlayingXIDialog = ({ team, open, onOpenChange }: SelectPlayingXIDialogProps) => {
  const { setPlayingXI, setImpactPlayers } = useCricketStore();
  const { toast } = useToast();
  
  const [selectedXI, setSelectedXI] = useState<string[]>([]);
  const [selectedImpact, setSelectedImpact] = useState<string[]>([]);
  const [step, setStep] = useState<'xi' | 'impact'>('xi');

  useEffect(() => {
    if (team) {
      setSelectedXI(team.playingXI.map(p => p.id));
      setSelectedImpact(team.impactOptions.map(p => p.id));
      setStep('xi');
    }
  }, [team]);

  if (!team) return null;

  const togglePlayerXI = (playerId: string) => {
    if (selectedXI.includes(playerId)) {
      setSelectedXI(selectedXI.filter(id => id !== playerId));
    } else if (selectedXI.length < 11) {
      setSelectedXI([...selectedXI, playerId]);
    }
  };

  const togglePlayerImpact = (playerId: string) => {
    if (selectedImpact.includes(playerId)) {
      setSelectedImpact(selectedImpact.filter(id => id !== playerId));
    } else if (selectedImpact.length < 4) {
      setSelectedImpact([...selectedImpact, playerId]);
    }
  };

  const validateXI = () => {
    const selectedPlayers = team.squad.filter(p => selectedXI.includes(p.id));
    const overseasCount = selectedPlayers.filter(p => p.isOverseas).length;
    
    if (selectedXI.length !== 11) {
      toast({
        title: "Error",
        description: "Please select exactly 11 players",
        variant: "destructive"
      });
      return false;
    }

    if (overseasCount > 4) {
      toast({
        title: "Error",
        description: "Maximum 4 overseas players allowed in playing XI",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSaveXI = () => {
    if (!validateXI()) return;
    setStep('impact');
  };

  const handleSaveAll = () => {
    if (!validateXI()) return;
    
    setPlayingXI(team.id, selectedXI);
    setImpactPlayers(team.id, selectedImpact);
    
    toast({
      title: "Success",
      description: `Playing XI and Impact Players set for ${team.name}`,
    });
    
    onOpenChange(false);
  };

  const availableForImpact = team.squad.filter(p => !selectedXI.includes(p.id));
  const selectedXIPlayers = team.squad.filter(p => selectedXI.includes(p.id));
  const overseasInXI = selectedXIPlayers.filter(p => p.isOverseas).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'xi' ? 'Select Playing XI' : 'Select Impact Players'}: {team.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {step === 'xi' ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Playing XI ({selectedXI.length}/11)</h3>
                  <p className="text-sm text-muted-foreground">
                    {overseasInXI}/4 overseas players selected
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Badge variant={selectedXI.length === 11 ? "default" : "secondary"}>
                    {selectedXI.length}/11 Players
                  </Badge>
                  <Badge variant={overseasInXI <= 4 ? "default" : "destructive"}>
                    {overseasInXI}/4 Overseas
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                {team.squad.map((player) => (
                  <div key={player.id} className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedXI.includes(player.id)}
                      onCheckedChange={() => togglePlayerXI(player.id)}
                      disabled={!selectedXI.includes(player.id) && selectedXI.length >= 11}
                    />
                    <div className="flex-1">
                      <PlayerRow player={player} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Impact Players ({selectedImpact.length}/4)</h3>
                  <p className="text-sm text-muted-foreground">
                    Select up to 4 players from remaining squad
                  </p>
                </div>
                <Badge variant={selectedImpact.length <= 4 ? "default" : "destructive"}>
                  {selectedImpact.length}/4 Players
                </Badge>
              </div>

              <div className="mb-4 p-3 bg-muted/20 rounded-lg">
                <h4 className="font-medium mb-2">Selected Playing XI:</h4>
                <div className="text-sm text-muted-foreground">
                  {selectedXIPlayers.map(p => p.name).join(', ')}
                </div>
              </div>

              <div className="space-y-2">
                {availableForImpact.map((player) => (
                  <div key={player.id} className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedImpact.includes(player.id)}
                      onCheckedChange={() => togglePlayerImpact(player.id)}
                      disabled={!selectedImpact.includes(player.id) && selectedImpact.length >= 4}
                    />
                    <div className="flex-1">
                      <PlayerRow player={player} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {step === 'xi' ? (
              <Button onClick={handleSaveXI} disabled={selectedXI.length !== 11}>
                Next: Impact Players
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setStep('xi')}>
                  Back to XI
                </Button>
                <Button onClick={handleSaveAll}>
                  Save All
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SelectPlayingXIDialog;