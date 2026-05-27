import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

interface Props {
  open: boolean;
  reviewingTeam: 'batting' | 'bowling';
  reviewsLeft: number;
  dismissalType: string;
  batsmanName: string;
  bowlerName: string;
  onResolve: (overturned: boolean, reviewUsed: boolean) => void;
  onClose: () => void;
}

// Deterministic-ish hawk-eye result: ~35% of dismissals get overturned on review.
function rollOutcome(type: string) {
  const r = Math.random();
  if (type.toLowerCase().includes('lbw')) {
    // 3 zones: missing / umpire's call (stays) / hitting
    if (r < 0.32) return { result: 'NOT OUT', overturned: true, stripes: ['missing', 'pad-only', 'wickets'] as const, hit: 0 };
    if (r < 0.55) return { result: 'UMPIRE\'S CALL', overturned: false, stripes: ['edge', 'pad', 'wickets'] as const, hit: 1 };
    return { result: 'OUT', overturned: false, stripes: ['pad', 'wickets', 'wickets'] as const, hit: 2 };
  }
  // Caught / general: snicko / hot-spot
  if (r < 0.3) return { result: 'NOT OUT', overturned: true, stripes: ['no-edge', 'clean'] as const, hit: 0 };
  return { result: 'OUT', overturned: false, stripes: ['edge', 'carried'] as const, hit: 2 };
}

const DRSReviewDialog = ({
  open,
  reviewingTeam,
  reviewsLeft,
  dismissalType,
  batsmanName,
  bowlerName,
  onResolve,
  onClose,
}: Props) => {
  const [phase, setPhase] = useState<'prompt' | 'tracking' | 'result'>('prompt');
  const outcome = useMemo(() => rollOutcome(dismissalType), [open, dismissalType]);

  useEffect(() => {
    if (open) setPhase('prompt');
  }, [open]);

  useEffect(() => {
    if (phase === 'tracking') {
      const t = setTimeout(() => setPhase('result'), 2800);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const startReview = () => setPhase('tracking');
  const declineReview = () => {
    onResolve(false, false);
    onClose();
  };
  const finish = () => {
    onResolve(outcome.overturned, true);
    onClose();
  };

  const isLBW = dismissalType.toLowerCase().includes('lbw');

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>DRS Review</span>
            <Badge variant="outline">{reviewingTeam === 'batting' ? 'Batting' : 'Bowling'} · {reviewsLeft} left</Badge>
          </DialogTitle>
        </DialogHeader>

        {phase === 'prompt' && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-sm">
                <span className="font-semibold">{bowlerName}</span> to{' '}
                <span className="font-semibold">{batsmanName}</span> — appeal upheld for{' '}
                <span className="capitalize font-medium">{dismissalType}</span>.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {reviewingTeam === 'batting' ? 'Batter' : 'Captain'} wants to review?
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={startReview} disabled={reviewsLeft <= 0} className="flex-1">
                Take Review
              </Button>
              <Button variant="outline" onClick={declineReview} className="flex-1">
                Stay with Field
              </Button>
            </div>
          </div>
        )}

        {phase === 'tracking' && (
          <div className="space-y-4">
            <p className="text-sm text-center text-muted-foreground">
              {isLBW ? 'Ball-tracking in progress…' : 'Checking edge & catch…'}
            </p>
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-gradient-to-b from-primary/10 to-background border">
              {/* Pitch */}
              <div className="absolute inset-x-[35%] top-2 bottom-[18%] bg-accent/20 border border-accent/30 rounded-sm" />
              {/* Stumps */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-[14%] w-10 h-4 flex justify-between">
                <span className="w-0.5 h-full bg-foreground" />
                <span className="w-0.5 h-full bg-foreground" />
                <span className="w-0.5 h-full bg-foreground" />
              </div>
              {/* Tracked ball */}
              <div className="absolute h-2 w-2 rounded-full bg-red-500 shadow-[0_0_12px_2px_rgba(239,68,68,0.8)] drs-ball" />
              {/* Trail */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="none">
                <path
                  d="M 50 5 Q 50 35 50 52"
                  fill="none"
                  stroke="hsl(0 84% 60% / 0.6)"
                  strokeWidth="0.6"
                  strokeDasharray="1.5 1"
                  className="drs-trail"
                />
              </svg>
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div className="space-y-4 text-center">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-lg ${
                outcome.result === 'OUT'
                  ? 'bg-destructive/20 text-destructive'
                  : outcome.result === 'NOT OUT'
                  ? 'bg-green-500/20 text-green-500'
                  : 'bg-amber-500/20 text-amber-500'
              }`}
            >
              {outcome.result === 'OUT' ? <XCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
              {outcome.result}
            </div>
            {isLBW && (
              <div className="flex justify-center gap-2">
                {outcome.stripes.map((s, i) => (
                  <div
                    key={i}
                    className={`h-3 w-12 rounded ${
                      s === 'wickets' ? 'bg-red-500' : s === 'pad' ? 'bg-amber-500' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {outcome.overturned
                ? `Decision overturned — ${reviewingTeam} team retains review.`
                : `Decision stands — ${reviewingTeam} team loses a review.`}
            </p>
            <Button onClick={finish} className="w-full">Continue</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DRSReviewDialog;
