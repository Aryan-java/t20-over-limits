import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MatchHistory } from "@/types/cricket";
import { saveAllTimeStats } from "@/lib/saveAllTimeStats";
import DetailedScorecard from "./DetailedScorecard";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface MatchScorecardDialogProps {
  match: MatchHistory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MatchScorecardDialog = ({ match, open, onOpenChange }: MatchScorecardDialogProps) => {
  const queryClient = useQueryClient();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  if (!match) return null;

  const handleResaveStats = async () => {
    setSaveStatus("saving");
    try {
      const success = await saveAllTimeStats(match);
      if (success) {
        await queryClient.invalidateQueries({ queryKey: ["player-all-time-stats"] });
        setSaveStatus("success");
        toast.success("Stats re-saved successfully!");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
        toast.error("Failed to re-save stats");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    } catch {
      setSaveStatus("error");
      toast.error("Failed to re-save stats");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4 pr-8">
            <DialogTitle>Match Scorecard - {match.team1.name} vs {match.team2.name}</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResaveStats}
              disabled={saveStatus === "saving"}
              className="shrink-0"
            >
              {saveStatus === "saving" && <RefreshCw className="h-4 w-4 animate-spin" />}
              {saveStatus === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
              {saveStatus === "error" && <AlertCircle className="h-4 w-4 text-destructive" />}
              {saveStatus === "idle" && <RefreshCw className="h-4 w-4" />}
              {saveStatus === "saving" ? "Saving..." : saveStatus === "success" ? "Saved!" : saveStatus === "error" ? "Retry" : "Re-save Stats"}
            </Button>
          </div>
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatchScorecardDialog;
