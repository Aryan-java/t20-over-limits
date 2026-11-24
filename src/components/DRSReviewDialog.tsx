import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CircleDot, RotateCcw, XCircle } from "lucide-react";
import { DRSIncident, DRSResolution, resolveDRSIncident } from "@/lib/drsReview";

interface Props {
  open: boolean;
  incident: DRSIncident | null;
  reviewsLeft: number;
  batsmanName: string;
  bowlerName: string;
  onResolve: (resolution: DRSResolution | null) => void;
}

function ReplayScene({ incident, reviewed = false }: { incident: DRSIncident; reviewed?: boolean }) {
  const isLBW = incident.dismissalType === "lbw";
  const ballPath = isLBW
    ? "M 110 185 C 200 205 310 226 430 230"
    : "M 110 185 C 220 172 350 160 500 132";

  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-md border bg-muted/20" aria-label={isLBW ? "Animated LBW replay" : "Animated caught-behind replay"}>
      <svg className="h-full w-full text-foreground" viewBox="0 0 600 340" role="img" aria-label={isLBW ? "Ball tracking toward the batter's pads and stumps" : "Ball passing the bat toward the wicketkeeper"}>
        <rect x="0" y="0" width="600" height="340" className="fill-muted/30" />
        <ellipse cx="300" cy="185" rx="248" ry="138" className="fill-primary/5 stroke-border" strokeWidth="2" />
        <path d="M 300 50 L 300 320 M 64 185 L 536 185" className="stroke-border" strokeWidth="1.5" strokeDasharray="6 7" />
        <path d="M 230 84 L 374 84 L 374 280 L 230 280 Z" className="fill-accent/10 stroke-accent/50" strokeWidth="2" />

        {/* Bowler */}
        <g className="stroke-foreground" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="108" cy="144" r="10" className="fill-foreground/70" />
          <path d="M 108 157 L 112 196 L 94 226 M 112 196 L 132 222 M 108 166 L 87 183 M 109 166 L 130 151" />
        </g>
        {/* Batter, bat and stumps */}
        <g className="stroke-foreground" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="398" cy="159" r="11" className="fill-foreground/70" />
          <path d="M 398 173 L 396 218 L 380 252 M 396 218 L 417 251 M 396 184 L 376 199 M 396 184 L 416 197 M 416 197 L 427 157" />
          <path d="M 436 205 L 436 238 M 444 205 L 444 238 M 452 205 L 452 238 M 434 203 L 454 203" strokeWidth="3" />
        </g>
        {/* Keeper shown only on the caught-behind replay */}
        {!isLBW && (
          <g className="stroke-foreground" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="518" cy="149" r="10" className="fill-foreground/70" />
            <path d="M 518 162 L 516 207 L 500 235 M 516 207 L 535 234 M 516 176 L 498 190 M 516 176 L 535 189" />
          </g>
        )}
        <path d={ballPath} className="stroke-destructive/60" strokeWidth="3" strokeDasharray="7 7" fill="none" />
        <circle r="7" className="fill-destructive">
          <animateMotion dur="1.8s" repeatCount="indefinite" path={ballPath} />
        </circle>
      </svg>
      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-2">
        <Badge variant="secondary">{reviewed ? "REVIEW CAMERA" : "BALL REPLAY"}</Badge>
        <Badge variant="outline" className="bg-background/80">{isLBW ? "LBW" : "CAUGHT BEHIND"}</Badge>
      </div>
    </div>
  );
}

function BallTracker({ incident }: { incident: DRSIncident }) {
  const track = incident.evidence.ballTrack || "missing";
  const path = track === "missing"
    ? "M 24 78 C 108 72 180 54 322 48"
    : track === "umpires-call"
      ? "M 24 82 C 112 72 206 68 322 65"
      : "M 24 84 C 115 77 214 74 322 78";

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Ball tracker</p>
        <Badge variant={track === "hitting" ? "destructive" : "outline"}>
          {track === "hitting" ? "Hitting" : track === "umpires-call" ? "Umpire's call" : "Missing"}
        </Badge>
      </div>
      <svg viewBox="0 0 350 110" className="h-24 w-full text-foreground" role="img" aria-label={`Ball tracker: ${track}`}>
        <path d="M 18 91 L 332 91" className="stroke-border" strokeWidth="2" />
        <path d="M 294 52 L 294 91 M 302 52 L 302 91 M 310 52 L 310 91 M 291 49 L 313 49" className="stroke-foreground" strokeWidth="3" strokeLinecap="round" />
        <path d={path} className="stroke-primary" strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="294" cy={track === "missing" ? "48" : track === "umpires-call" ? "65" : "78"} r="6" className="fill-destructive" />
        <text x="20" y="106" className="fill-muted-foreground" fontSize="10">PITCHING</text>
        <text x="275" y="106" className="fill-muted-foreground" fontSize="10">WICKETS</text>
      </svg>
    </div>
  );
}

function SnickoGraph({ incident }: { incident: DRSIncident }) {
  const edge = incident.evidence.edgeDetected === true;
  const waveform = edge
    ? "M 6 48 L 42 47 L 70 48 L 96 44 L 112 17 L 126 51 L 156 48 L 194 47 L 232 48 L 292 47"
    : "M 6 48 L 42 47 L 70 49 L 96 48 L 112 46 L 126 49 L 156 48 L 194 47 L 232 48 L 292 47";

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">UltraEdge · Snicko</p>
        <Badge variant={edge ? "destructive" : "outline"}>{edge ? `Edge · ${incident.evidence.snickoPeak}%` : "No edge"}</Badge>
      </div>
      <svg viewBox="0 0 300 70" className="h-20 w-full text-foreground" role="img" aria-label={edge ? "Snicko shows an edge at ball impact" : "Snicko shows no edge at ball impact"}>
        <path d="M 6 54 L 294 54" className="stroke-border" strokeWidth="1" />
        <path d={waveform} className="stroke-primary" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 112 7 L 112 58" className="stroke-destructive/60" strokeWidth="1.5" strokeDasharray="3 4" />
        <text x="100" y="68" className="fill-muted-foreground" fontSize="9">IMPACT</text>
      </svg>
    </div>
  );
}

const DRSReviewDialog = ({ open, incident, reviewsLeft, batsmanName, bowlerName, onResolve }: Props) => {
  const [phase, setPhase] = useState<"replay" | "tracking" | "result">("replay");

  useEffect(() => {
    if (open) setPhase("replay");
  }, [open, incident]);

  useEffect(() => {
    if (phase !== "tracking") return;
    const timer = setTimeout(() => setPhase("result"), 2400);
    return () => clearTimeout(timer);
  }, [phase]);

  if (!incident) return null;

  const isLBW = incident.dismissalType === "lbw";
  const sideLabel = incident.reviewingSide === "batting" ? "Batting team" : "Bowling team";
  const onFieldText = incident.onFieldDecision === "out" ? "OUT" : "NOT OUT";
  const resolution = resolveDRSIncident(incident);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
        onInteractOutside={event => event.preventDefault()}
        onEscapeKeyDown={event => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2"><CircleDot className="h-5 w-5 text-primary" /> Decision Review System</span>
            <Badge variant="outline">{sideLabel} · {reviewsLeft} left</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/30 px-3 py-2 text-sm">
            <span><strong>{bowlerName}</strong> to <strong>{batsmanName}</strong></span>
            <Badge variant={incident.onFieldDecision === "out" ? "destructive" : "secondary"}>On-field: {onFieldText}</Badge>
          </div>

          {phase === "replay" && (
            <>
              <ReplayScene incident={incident} />
              <p className="text-center text-sm text-muted-foreground">
                First replay · {isLBW ? "impact and line are not yet displayed" : "edge audio is not yet displayed"}
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => onResolve(null)}>Stay with field decision</Button>
                <Button onClick={() => setPhase("tracking")} disabled={reviewsLeft <= 0}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Take review
                </Button>
              </div>
            </>
          )}

          {(phase === "tracking" || phase === "result") && (
            <>
              <ReplayScene incident={incident} reviewed />
              <div className="grid gap-3 sm:grid-cols-2">
                {isLBW ? <BallTracker incident={incident} /> : <SnickoGraph incident={incident} />}
                <div className="flex flex-col justify-center gap-2 rounded-md border p-4">
                  <p className="text-xs font-medium uppercase text-muted-foreground">DRS evidence</p>
                  <p className="text-sm">
                    {isLBW
                      ? "Impact, pitching line, and projected wicket path are assessed together."
                      : "The audio trace is aligned to the ball passing the bat."}
                  </p>
                  {phase === "tracking" && <p className="text-xs text-muted-foreground">Review analysis in progress…</p>}
                </div>
              </div>
            </>
          )}

          {phase === "result" && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {resolution.finalDecision === "out"
                  ? <XCircle className="h-5 w-5 text-destructive" />
                  : <CheckCircle2 className="h-5 w-5 text-cricket-green" />}
                <p className="text-xl font-bold">{resolution.displayResult}</p>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {resolution.overturned
                  ? `Decision overturned — ${sideLabel.toLowerCase()} retains the review.`
                  : resolution.reviewRetained
                    ? "Umpire's call — the original decision stands and the review is retained."
                    : `Decision stands — ${sideLabel.toLowerCase()} loses the review.`}
              </p>
              <Button className="w-full" onClick={() => onResolve(resolution)}>Continue</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DRSReviewDialog;