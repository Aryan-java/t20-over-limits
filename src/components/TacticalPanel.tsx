import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BowlingStrategy, BowlingDelivery } from "@/types/tactics";
import { Zap, Shield, Target, Wind, Activity } from "lucide-react";
import type { Player } from "@/types/cricket";
import {
  BatsmanIntent,
  INTENT_LABEL,
  INTENT_COLOR,
  baseIntentFor,
} from "@/lib/playerIntent";
import { cn } from "@/lib/utils";

interface Props {
  strategy: BowlingStrategy;
  aggression: number;
  bowlerName?: string;
  batsmanName?: string;
  onStrategyChange: (s: BowlingStrategy) => void;
  onAggressionChange: (n: number) => void;
  // Optional batsman-intent control
  striker?: Player | null;
  nonStriker?: Player | null;
  intentOverrides?: Record<string, BatsmanIntent>;
  onIntentChange?: (playerId: string, intent: BatsmanIntent) => void;
}

const DELIVERY_META: Record<BowlingDelivery, { label: string; icon: any; color: string }> = {
  normal: { label: 'Stock', icon: Activity, color: 'text-muted-foreground' },
  yorker: { label: 'Yorker', icon: Target, color: 'text-amber-400' },
  bouncer: { label: 'Bouncer', icon: Zap, color: 'text-red-400' },
  slower: { label: 'Slower', icon: Wind, color: 'text-blue-400' },
  knuckle: { label: 'Knuckle', icon: Shield, color: 'text-purple-400' },
};

const INTENT_OPTIONS: BatsmanIntent[] = ['anchor', 'rotator', 'aggressor', 'finisher'];

const BatsmanIntentRow = ({
  player, overrides, onChange,
}: {
  player: Player;
  overrides: Record<string, BatsmanIntent>;
  onChange: (id: string, i: BatsmanIntent) => void;
}) => {
  const current = overrides[player.id] ?? baseIntentFor(player);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium truncate w-28">{player.name}</span>
      <div className="flex flex-wrap gap-1 flex-1">
        {INTENT_OPTIONS.map(i => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(player.id, i)}
            className={cn(
              "text-[10px] px-2 py-0.5 rounded border transition-colors",
              i === current
                ? INTENT_COLOR[i] + ' font-semibold'
                : 'border-border/40 text-muted-foreground hover:bg-muted/30'
            )}
          >
            {INTENT_LABEL[i]}
          </button>
        ))}
      </div>
    </div>
  );
};

const TacticalPanel = ({ strategy, aggression, bowlerName, batsmanName, onStrategyChange, onAggressionChange, striker, nonStriker, intentOverrides = {}, onIntentChange }: Props) => {
  const total = Object.values(strategy).reduce((a, b) => a + b, 0) || 1;

  const setWeight = (k: BowlingDelivery, v: number) => {
    onStrategyChange({ ...strategy, [k]: v });
  };

  const aggressionLabel =
    aggression < 25 ? 'Block' :
    aggression < 50 ? 'Defensive' :
    aggression < 75 ? 'Positive' : 'Attack';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Tactics</span>
          <div className="flex gap-2 text-xs">
            {bowlerName && <Badge variant="outline">🎯 {bowlerName}</Badge>}
            {batsmanName && <Badge variant="outline">🏏 {batsmanName}</Badge>}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Bowling strategy */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Bowling Plan</p>
            <span className="text-xs text-muted-foreground">% of deliveries</span>
          </div>
          <div className="space-y-2">
            {(Object.keys(DELIVERY_META) as BowlingDelivery[]).map(k => {
              const meta = DELIVERY_META[k];
              const Icon = meta.icon;
              const pct = Math.round((strategy[k] / total) * 100);
              return (
                <div key={k} className="flex items-center gap-3">
                  <div className={`flex items-center gap-1.5 w-24 text-xs ${meta.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                    <span>{meta.label}</span>
                  </div>
                  <Slider
                    value={[strategy[k]]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={v => setWeight(k, v[0])}
                    className="flex-1"
                  />
                  <span className="text-xs font-mono w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end mt-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                onStrategyChange({ normal: 50, yorker: 15, bouncer: 15, slower: 15, knuckle: 5 })
              }
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Batting aggression */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Batting Intent</p>
            <Badge
              variant="outline"
              className={
                aggression < 25 ? 'border-blue-500 text-blue-400' :
                aggression < 50 ? 'border-sky-500 text-sky-400' :
                aggression < 75 ? 'border-amber-500 text-amber-400' :
                'border-red-500 text-red-400'
              }
            >
              {aggressionLabel} ({aggression})
            </Badge>
          </div>
          <Slider
            value={[aggression]}
            min={0}
            max={100}
            step={5}
            onValueChange={v => onAggressionChange(v[0])}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>Defensive</span>
            <span>Balanced</span>
            <span>All-out attack</span>
          </div>
        </div>

        {/* Per-batsman INTENT */}
        {(striker || nonStriker) && onIntentChange && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Batsman Approach</p>
              <span className="text-[10px] text-muted-foreground">
                Auto-adapts to RRR &amp; wickets
              </span>
            </div>
            <div className="space-y-2">
              {striker && (
                <BatsmanIntentRow
                  player={striker}
                  overrides={intentOverrides}
                  onChange={onIntentChange}
                />
              )}
              {nonStriker && (
                <BatsmanIntentRow
                  player={nonStriker}
                  overrides={intentOverrides}
                  onChange={onIntentChange}
                />
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TacticalPanel;
