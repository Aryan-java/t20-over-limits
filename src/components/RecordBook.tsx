import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Target, Award, Shield } from "lucide-react";
import { useCricketStore } from "@/hooks/useCricketStore";
import { playerRecords, historyRecords, RecordResult, StatRow } from "@/lib/recordBook";
import { cn } from "@/lib/utils";

function RecordCard({ r }: { r: RecordResult }) {
  const [top, ...rest] = r.entries;
  return (
    <div className="rounded-xl border border-border/50 bg-card/70 p-4 flex flex-col gap-2 animate-fade-in">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{r.title}</p>
        {r.note && <span className="text-[10px] text-muted-foreground/80 text-right">{r.note}</span>}
      </div>
      {r.unavailable || !top ? (
        <p className="text-sm text-muted-foreground py-3">{r.unavailable || "No qualifying record yet"}</p>
      ) : (
        <>
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold truncate">{top.name}{r.entries.filter(x => x.value === top.value).length > 1 && <span className="ml-1 text-[10px] text-accent">(tied)</span>}</p>
              {top.detail && <p className="text-[11px] text-muted-foreground">{top.detail}</p>}
            </div>
            <p className="text-2xl font-black text-primary whitespace-nowrap">{top.display}<span className="ml-1 text-[10px] font-semibold text-muted-foreground">{r.unit}</span></p>
          </div>
          {rest.length > 0 && (
            <ol className="space-y-0.5 border-t border-border/30 pt-2">
              {rest.map((x, i) => (
                <li key={x.name + i} className="flex justify-between text-xs">
                  <span className="truncate text-muted-foreground">{i + 2}. {x.name}{x.detail ? ` · ${x.detail}` : ""}</span>
                  <span className="font-semibold">{x.display}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}

function Group({ title, icon: Icon, color, items, sub }: { title: string; icon: any; color: string; items: RecordResult[]; sub?: string }) {
  return (
    <Card className="stadium-card">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-5 w-5", color)} />
          <h3 className="text-lg font-bold">{title}</h3>
          {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {items.map((r) => <RecordCard key={r.id} r={r} />)}
        </div>
      </CardContent>
    </Card>
  );
}

export default function RecordBook({ rows }: { rows: StatRow[] }) {
  const matchHistory = useCricketStore((s) => s.matchHistory);
  const p = useMemo(() => playerRecords(rows), [rows]);
  const h = useMemo(() => historyRecords((matchHistory || []) as any), [matchHistory]);
  return (
    <div className="space-y-4">
      <Group title="Batting Records" icon={TrendingUp} color="text-primary" items={p.batting} />
      <Group title="Bowling Records" icon={Target} color="text-cricket-purple" items={p.bowling} />
      <Group title="Appearance & Awards" icon={Award} color="text-accent" items={h.appearance} />
      <Group title="Team Records" icon={Shield} color="text-primary" items={h.team} />
    </div>
  );
}
