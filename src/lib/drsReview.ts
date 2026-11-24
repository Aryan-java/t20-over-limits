export type DRSReviewSide = "batting" | "bowling";
export type DRSDismissalType = "lbw" | "caught-behind";
export type DRSOnFieldDecision = "out" | "not-out";
export type DRSBallTrack = "missing" | "umpires-call" | "hitting";

export interface DRSIncident {
  reviewingSide: DRSReviewSide;
  dismissalType: DRSDismissalType;
  onFieldDecision: DRSOnFieldDecision;
  evidence: {
    ballTrack: DRSBallTrack | null;
    edgeDetected: boolean | null;
    snickoPeak: number;
  };
}

export interface DRSResolution {
  finalDecision: DRSOnFieldDecision;
  displayResult: "OUT" | "NOT OUT" | "UMPIRE'S CALL";
  overturned: boolean;
  reviewRetained: boolean;
}

export function createDRSIncident(
  reviewingSide: DRSReviewSide,
  dismissalType: DRSDismissalType,
  random: () => number = Math.random,
): DRSIncident {
  const onFieldDecision: DRSOnFieldDecision = reviewingSide === "batting" ? "out" : "not-out";

  if (dismissalType === "lbw") {
    const roll = random();
    const ballTrack: DRSBallTrack = reviewingSide === "batting"
      ? roll < 0.25 ? "missing" : roll < 0.43 ? "umpires-call" : "hitting"
      : roll < 0.4 ? "hitting" : roll < 0.55 ? "umpires-call" : "missing";
    return {
      reviewingSide,
      dismissalType,
      onFieldDecision,
      evidence: { ballTrack, edgeDetected: null, snickoPeak: 0 },
    };
  }

  const edgeDetected = reviewingSide === "batting" ? random() >= 0.25 : random() < 0.4;
  const snickoPeak = edgeDetected ? 78 + Math.floor(random() * 20) : Math.floor(random() * 14);
  return {
    reviewingSide,
    dismissalType,
    onFieldDecision,
    evidence: { ballTrack: null, edgeDetected, snickoPeak },
  };
}

export function resolveDRSIncident(incident: DRSIncident): DRSResolution {
  const umpireCall = incident.evidence.ballTrack === "umpires-call";
  const evidenceSupportsOut = incident.dismissalType === "lbw"
    ? incident.evidence.ballTrack === "hitting"
    : incident.evidence.edgeDetected === true;
  const finalDecision: DRSOnFieldDecision = umpireCall
    ? incident.onFieldDecision
    : evidenceSupportsOut ? "out" : "not-out";
  const overturned = finalDecision !== incident.onFieldDecision;

  return {
    finalDecision,
    displayResult: umpireCall ? "UMPIRE'S CALL" : finalDecision === "out" ? "OUT" : "NOT OUT",
    overturned,
    reviewRetained: overturned || umpireCall,
  };
}