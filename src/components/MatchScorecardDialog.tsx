import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MatchHistory } from "@/types/cricket";
import { Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import DetailedScorecard from "./DetailedScorecard";
import { saveAllTimeStats } from "@/lib/saveAllTimeStats";
import { toast } from "@/hooks/use-toast";

interface MatchScorecardDialogProps {
  match: MatchHistory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MatchScorecardDialog = ({ match, open, onOpenChange }: MatchScorecardDialogProps) => {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  if (!match) return null;

  const handleResaveStats = async () => {
    setSaveStatus('saving');
    const success = await saveAllTimeStats(match);
    setSaveStatus(success ? 'success' : 'error');
    toast({
      title: success ? "Stats Saved Successfully" : "Stats Save Failed",
      description: success ? "All player records have been updated." : "Some records failed. You can retry.",
      variant: success ? undefined : "destructive",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Match Scorecard - {match.team1.name} vs {match.team2.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {match.firstInnings && (
            <DetailedScorecard
              innings={match.firstInnings}
              title={`${match.firstInnings.battingTeam} - First Innings`}
              bowlers={(match.firstInnings.bowlingTeam === match.team1.name ? match.team1.squad : match.team2.squad)}
            />
          )}
          
          {match.secondInnings && (
            <DetailedScorecard
              innings={match.secondInnings}
              title={`${match.secondInnings.battingTeam} - Second Innings`}
              target={match.firstInnings ? match.firstInnings.totalRuns + 1 : undefined}
              bowlers={(match.secondInnings.bowlingTeam === match.team1.name ? match.team1.squad : match.team2.squad)}
            />
          )}

          {/* Re-save Stats Button */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              {saveStatus === 'saving' && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Saving player stats...</span>
                </>
              )}
              {saveStatus === 'success' && (
                <>
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-sm text-primary">All-time records updated!</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive">Some stats failed to save</span>
                </>
              )}
              {saveStatus === 'idle' && (
                <span className="text-sm text-muted-foreground">Re-save player stats to database</span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResaveStats}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  {saveStatus === 'error' ? 'Retry' : 'Re-save Stats'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatchScorecardDialog;
