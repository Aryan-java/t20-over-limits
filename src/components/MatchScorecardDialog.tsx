import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MatchHistory } from "@/types/cricket";
import DetailedScorecard from "./DetailedScorecard";

interface MatchScorecardDialogProps {
  match: MatchHistory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MatchScorecardDialog = ({ match, open, onOpenChange }: MatchScorecardDialogProps) => {
  if (!match) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Match Scorecard - {match.team1.name} vs {match.team2.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* First Innings */}
          {match.firstInnings && (
            <DetailedScorecard
              innings={match.firstInnings}
              title={`${match.firstInnings.battingTeam} - First Innings`}
              bowlers={(match.firstInnings.bowlingTeam === match.team1.name ? match.team1.squad : match.team2.squad)}
            />
          )}
          
          {/* Second Innings */}
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
