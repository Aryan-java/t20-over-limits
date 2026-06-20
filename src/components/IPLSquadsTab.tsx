import { useMemo, useState } from "react";
import { IPL_TEAMS_2025 } from "@/data/iplSquads";
import { PLAYER_DATABASE, PlayerData } from "@/data/playerDatabase";
import { getPlayerCountry } from "@/data/playerCountries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_COLOR: Record<string, string> = {
  Batsman: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Bowler: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  "All-rounder": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  "Wicket-keeper": "bg-sky-500/15 text-sky-300 border-sky-500/30",
};

const TEAM_ABBR: Record<string, string> = {
  "Chennai Super Kings": "CSK",
  "Delhi Capitals": "DC",
  "Gujarat Titans": "GT",
  "Kolkata Knight Riders": "KKR",
  "Lucknow Super Giants": "LSG",
  "Mumbai Indians": "MI",
  "Punjab Kings": "PBKS",
  "Rajasthan Royals": "RR",
  "Royal Challengers Bengaluru": "RCB",
  "Sunrisers Hyderabad": "SRH",
};

const TEAM_COLOR: Record<string, string> = {
  CSK: "from-yellow-500/30 to-yellow-700/10 border-yellow-500/30",
  DC: "from-blue-600/30 to-red-600/10 border-blue-500/30",
  GT: "from-slate-700/30 to-amber-600/10 border-amber-600/30",
  KKR: "from-purple-700/30 to-yellow-600/10 border-purple-500/30",
  LSG: "from-sky-500/30 to-orange-500/10 border-sky-500/30",
  MI: "from-blue-700/30 to-yellow-500/10 border-blue-500/30",
  PBKS: "from-red-700/30 to-rose-500/10 border-red-500/30",
  RR: "from-pink-600/30 to-blue-700/10 border-pink-500/30",
  RCB: "from-red-700/30 to-black/30 border-red-500/30",
  SRH: "from-orange-500/30 to-amber-700/10 border-orange-500/30",
};

interface EnrichedPlayer extends PlayerData {
  country: { flag: string; code: string };
  overall: number;
}

const enrich = (name: string): EnrichedPlayer => {
  const data = PLAYER_DATABASE.find((p) => p.name === name);
  const base: PlayerData = data || {
    name,
    price: 0,
    isOverseas: false,
    batSkill: 50,
    bowlSkill: 50,
    role: "All-rounder",
  };
  return {
    ...base,
    country: getPlayerCountry(base.name, base.isOverseas),
    overall: Math.round(Math.max(base.batSkill, base.bowlSkill) * 0.7 + Math.min(base.batSkill, base.bowlSkill) * 0.3),
  };
};

const PlayerRow = ({ p }: { p: EnrichedPlayer }) => (
  <div className="grid grid-cols-12 items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/30 border border-transparent hover:border-border/40 transition-colors">
    <div className="col-span-5 flex items-center gap-2 min-w-0">
      <span className="text-lg leading-none" title={p.country.code}>{p.country.flag}</span>
      <span className="font-medium truncate">{p.name}</span>
      {p.isOverseas && (
        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-primary/40 text-primary/80">OS</Badge>
      )}
    </div>
    <div className="col-span-3">
      <Badge variant="outline" className={cn("text-[10px] px-1.5", ROLE_COLOR[p.role])}>
        {p.role}
      </Badge>
    </div>
    <div className="col-span-1 text-xs text-center tabular-nums text-amber-300/90">{p.batSkill}</div>
    <div className="col-span-1 text-xs text-center tabular-nums text-rose-300/90">{p.bowlSkill}</div>
    <div className="col-span-2 flex items-center justify-end gap-1">
      <Star className="h-3 w-3 fill-primary text-primary" />
      <span className="text-sm font-bold tabular-nums">{p.overall}</span>
    </div>
  </div>
);

const SquadCard = ({ team }: { team: typeof IPL_TEAMS_2025[number] }) => {
  const abbr = TEAM_ABBR[team.name] ?? "IPL";
  const players = useMemo(() => team.squad.map(enrich), [team]);
  const overseas = players.filter((p) => p.isOverseas).length;
  const indian = players.length - overseas;
  const avg = Math.round(players.reduce((s, p) => s + p.overall, 0) / players.length);

  return (
    <Card className={cn("overflow-hidden bg-gradient-to-br border", TEAM_COLOR[abbr])}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-background/40 border border-border/40">{abbr}</span>
              {team.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {players.length} players · {indian} 🇮🇳 · {overseas} Overseas · Avg {avg}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-12 px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/40">
          <div className="col-span-5">Player</div>
          <div className="col-span-3">Role</div>
          <div className="col-span-1 text-center">BAT</div>
          <div className="col-span-1 text-center">BOWL</div>
          <div className="col-span-2 text-right">OVR</div>
        </div>
        <div className="max-h-[480px] overflow-y-auto divide-y divide-border/20">
          {players
            .slice()
            .sort((a, b) => b.overall - a.overall)
            .map((p) => (
              <PlayerRow key={p.name} p={p} />
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

const IPLSquadsTab = () => {
  const [query, setQuery] = useState("");
  const teams = IPL_TEAMS_2025;

  const filtered = useMemo(() => {
    if (!query.trim()) return teams;
    const q = query.toLowerCase();
    return teams
      .map((t) => ({
        ...t,
        squad: t.squad.filter((n) => n.toLowerCase().includes(q)),
      }))
      .filter((t) => t.squad.length > 0);
  }, [query, teams]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">IPL 2026 Squads</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            All 10 franchises · overseas flags · in-game player ratings
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search player..."
            className="pl-8"
          />
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-card/60">
          <TabsTrigger value="all">All Teams</TabsTrigger>
          {teams.map((t) => (
            <TabsTrigger key={t.name} value={t.name}>
              {TEAM_ABBR[t.name] ?? t.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filtered.map((team) => (
              <SquadCard key={team.name} team={team} />
            ))}
          </div>
        </TabsContent>

        {teams.map((team) => (
          <TabsContent key={team.name} value={team.name} className="mt-5">
            <div className="max-w-2xl mx-auto">
              <SquadCard team={team} />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default IPLSquadsTab;
