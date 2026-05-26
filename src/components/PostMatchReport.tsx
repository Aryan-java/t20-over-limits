import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCcw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Match } from "@/types/cricket";
import { toast } from "sonner";

interface PostMatchReportProps {
  match: Match;
}

const buildSummary = (match: Match): string => {
  const fi = match.firstInnings;
  const si = match.secondInnings;
  if (!fi || !si) return "";
  const topBat = (innings: typeof fi) =>
    [...innings.battingOrder]
      .sort((a, b) => b.runs - a.runs)
      .slice(0, 2)
      .map((p) => `${p.name} ${p.runs}(${p.balls})`)
      .join(", ");
  const topBowl = (battingTeamName: string) => {
    const bowlerTeam = battingTeamName === match.team1.name ? match.team2 : match.team1;
    return [...bowlerTeam.squad]
      .filter((p) => p.wickets > 0 || p.oversBowled > 0)
      .sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded)
      .slice(0, 2)
      .map((p) => `${p.name} ${p.wickets}/${p.runsConceded}`)
      .join(", ");
  };
  return [
    `Match: ${match.team1.name} vs ${match.team2.name} (${match.overs} overs).`,
    `${fi.battingTeam} ${fi.totalRuns}/${fi.wickets} in ${Math.floor(fi.ballsBowled / 6)}.${fi.ballsBowled % 6}. Top batters: ${topBat(fi)}. Bowlers: ${topBowl(fi.battingTeam)}.`,
    `${si.battingTeam} ${si.totalRuns}/${si.wickets} in ${Math.floor(si.ballsBowled / 6)}.${si.ballsBowled % 6}. Top batters: ${topBat(si)}. Bowlers: ${topBowl(si.battingTeam)}.`,
    `Result: ${match.result || "decided"}.`,
    match.manOfTheMatch ? `Player of the Match: ${match.manOfTheMatch.name}.` : "",
  ].filter(Boolean).join(" ");
};

const PostMatchReport = ({ match }: PostMatchReportProps) => {
  const [report, setReport] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const summary = buildSummary(match);
      if (!summary) {
        setReport("Match data unavailable.");
        return;
      }
      const { data, error } = await supabase.functions.invoke("match-report", {
        body: { summary },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setReport((data as any)?.report || "No report generated.");
    } catch (e: any) {
      const msg = e?.message || "Failed to generate report";
      toast.error(msg);
      setReport(`Couldn't reach the AI commentator. ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.id]);

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
              AI Match Report
            </h3>
          </div>
          <Button size="sm" variant="ghost" onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          </Button>
        </div>
        {loading && !report ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating commentary...
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{report}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PostMatchReport;
