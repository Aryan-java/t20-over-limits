import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TacticalImpactEstimate, TacticalRecommendation } from "@/lib/simulation/tactics";
import { TrendingUp, TrendingDown, Minus, Lightbulb } from "lucide-react";

interface Props {
  estimate: TacticalImpactEstimate;
  recommendations?: TacticalRecommendation[];
  fieldNotes?: string[];
}

const Row = ({ label, value, invert }: { label: string; value: number; invert?: boolean }) => {
  const good = invert ? value < 0 : value > 0;
  const flat = Math.abs(value) < 2;
  const Icon = flat ? Minus : value > 0 ? TrendingUp : TrendingDown;
  const tone = flat
    ? "text-muted-foreground"
    : good
    ? "text-emerald-400"
    : "text-red-400";
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={`flex items-center gap-1 font-mono ${tone}`}>
        <Icon className="h-3 w-3" />
        {value > 0 ? "+" : ""}
        {value}%
      </span>
    </div>
  );
};

const TacticalImpact = ({ estimate, recommendations = [], fieldNotes = [] }: Props) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-base flex items-center justify-between">
        <span>Tactical Impact</span>
        <Badge variant="outline" className="text-[10px]">Estimate, not results</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="space-y-1.5">
        <Row label="Expected run rate" value={estimate.runRatePct} />
        <Row label="Dot-ball tendency" value={estimate.dotPct} invert />
        <Row label="Wicket risk" value={estimate.wicketRiskPct} invert />
        <Row label="Boundary opportunity" value={estimate.boundaryPct} />
      </div>

      {fieldNotes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {fieldNotes.map(n => (
            <Badge key={n} variant="outline" className="text-[10px]">{n}</Badge>
          ))}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-border/50">
          <p className="text-xs font-medium flex items-center gap-1.5 pt-2">
            <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
            Suggestions
          </p>
          {recommendations.map(r => (
            <div key={r.id} className="text-xs">
              <span className="font-medium">{r.title}</span>
              <span className="text-muted-foreground"> — {r.detail}</span>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground pt-1">
            Suggestions only. Your choices always apply.
          </p>
        </div>
      )}
    </CardContent>
  </Card>
);

export default TacticalImpact;
