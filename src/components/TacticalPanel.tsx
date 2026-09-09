import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BowlingStrategy,
  BowlingDelivery,
  BatterTactic,
  BatterMatchupInstruction,
  BatterTacticsState,
  BowlerPlan,
  BOWLER_PLAN_LABEL,
} from "@/types/tactics";
import { Zap, Shield, Target, Wind, Activity } from "lucide-react";

interface Props {
  strategy: BowlingStrategy;
  aggression: number;
  bowlerName?: string;
  batsmanName?: string;
  onStrategyChange: (s: BowlingStrategy) => void;
  onAggressionChange: (n: number) => void;
  /** Optional Phase 2 controls — omitted safely by older callers. */
  batterTactics?: BatterTacticsState;
  onBatterTacticsChange?: (s: BatterTacticsState) => void;
  bowlerPlan?: BowlerPlan;
  onBowlerPlanChange?: (p: BowlerPlan) => void;
}

const DELIVERY_META: Record<BowlingDelivery, { label: string; icon: any; color: string }> = {
  normal: { label: 'Stock', icon: Activity, color: 'text-muted-foreground' },
  yorker: { label: 'Yorker', icon: Target, color: 'text-amber-400' },
  bouncer: { label: 'Bouncer', icon: Zap, color: 'text-red-400' },
  slower: { label: 'Slower', icon: Wind, color: 'text-blue-400' },
  knuckle: { label: 'Knuckle', icon: Shield, color: 'text-purple-400' },
};

const BATTER_TACTICS: { key: BatterTactic; label: string }[] = [
  { key: 'anchor', label: 'Anchor' },
  { key: 'rotate', label: 'Rotate' },
  { key: 'attack', label: 'Attack' },
];

const INSTRUCTIONS: { key: BatterMatchupInstruction; label: string }[] = [
  { key: 'none', label: 'No special plan' },
  { key: 'attack-pace', label: 'Attack pace' },
  { key: 'attack-spin', label: 'Attack spin' },
  { key: 'see-off', label: 'See off spell' },
];

const PLANS: BowlerPlan[] = ['attack', 'balanced', 'defensive', 'yorkers', 'bouncers', 'variations', 'target-weakness'];

const TacticalPanel = ({
  strategy,
  aggression,
  bowlerName,
  batsmanName,
  onStrategyChange,
  onAggressionChange,
  batterTactics,
  onBatterTacticsChange,
  bowlerPlan,
  onBowlerPlanChange,
}: Props) => {
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
        {/* Per-batter tactics */}
        {batterTactics && onBatterTacticsChange && (
          <div>
            <p className="text-sm font-medium mb-2">Batter Instruction</p>
            <div className="flex flex-wrap gap-2">
              {BATTER_TACTICS.map(t => (
                <Button
                  key={t.key}
                  size="sm"
                  variant={batterTactics.tactic === t.key ? 'default' : 'outline'}
                  onClick={() => onBatterTacticsChange({ ...batterTactics, tactic: t.key })}
                >
                  {t.label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {INSTRUCTIONS.map(i => (
                <Button
                  key={i.key}
                  size="sm"
                  variant={batterTactics.instruction === i.key ? 'secondary' : 'ghost'}
                  className="text-xs h-7"
                  onClick={() => onBatterTacticsChange({ ...batterTactics, instruction: i.key })}
                >
                  {i.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Bowler plan */}
        {bowlerPlan && onBowlerPlanChange && (
          <div>
            <p className="text-sm font-medium mb-2">Bowler Plan</p>
            <div className="flex flex-wrap gap-2">
              {PLANS.map(p => (
                <Button
                  key={p}
                  size="sm"
                  variant={bowlerPlan === p ? 'default' : 'outline'}
                  onClick={() => onBowlerPlanChange(p)}
                >
                  {BOWLER_PLAN_LABEL[p]}
                </Button>
              ))}
            </div>
          </div>
        )}

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
      </CardContent>
    </Card>
  );
};

export default TacticalPanel;
