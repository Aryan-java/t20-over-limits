// Deterministic simulation sanity check.
// Run: bun scripts/sim-check.ts
import { simulateBall } from "../src/lib/simulation/outcome";
import { createRng } from "../src/lib/simulation/rng";
import { pickDelivery, defaultBowlingStrategy } from "../src/types/tactics";
import type { Player } from "../src/types/cricket";

const mk = (name: string, bat: number, bowl: number): Player => ({
  id: name, name, isOverseas: false, batSkill: bat, bowlSkill: bowl,
  runs: 0, balls: 0, fours: 0, sixes: 0, dismissed: false, dismissalInfo: "",
  oversBowled: 0, maidens: 0, wickets: 0, runsConceded: 0, isPlaying: true,
  widesConceded: 0, noBallsConceded: 0, dotBalls: 0,
});

const batters = [
  mk("Virat Kohli", 94, 20), mk("Rohit Sharma", 90, 15), mk("Suryakumar Yadav", 92, 10),
  mk("Hardik Pandya", 82, 78), mk("Rishabh Pant", 88, 5), mk("Ravindra Jadeja", 74, 84),
  mk("Axar Patel", 72, 80), mk("Bhuvneshwar Kumar", 30, 84), mk("Jasprit Bumrah", 15, 96),
  mk("Yuzvendra Chahal", 12, 88),
];
const bowlers = [
  mk("Trent Boult", 20, 90), mk("Rashid Khan", 40, 94), mk("Mohammed Shami", 22, 88),
  mk("Arshdeep Singh", 18, 85), mk("Kuldeep Yadav", 15, 87),
];

function simulateInnings(seed: number) {
  const rng = createRng(seed);
  let runs = 0, wickets = 0, balls = 0, extras = 0, fours = 0, sixes = 0, dots = 0;
  let dotStreak = 0, idx = 0;
  while (balls < 120 && wickets < 10) {
    const batter = batters[Math.min(idx, batters.length - 1)];
    const bowler = bowlers[Math.floor(balls / 6) % bowlers.length];
    const phase = balls < 36 ? "powerplay" : balls >= 96 ? "death" : "middle";
    const delivery = pickDelivery(defaultBowlingStrategy);
    const { outcome } = simulateBall({
      batter, bowler, delivery, phase,
      situation: { innings: 1, runs, wickets, ballsBowled: balls, totalOvers: 20, dotStreak },
      rng,
    });
    runs += outcome.runs;
    if (outcome.extras) { extras += outcome.extras.runs; if (outcome.extras.type !== "wide" && outcome.extras.type !== "no-ball") balls++; continue; }
    balls++;
    if (outcome.isWicket) { wickets++; idx++; dotStreak = 0; continue; }
    if (outcome.runs === 0) { dots++; dotStreak++; } else dotStreak = 0;
    if (outcome.runs === 4) fours++;
    if (outcome.runs === 6) sixes++;
  }
  return { runs, wickets, balls, extras, fours, sixes, dots };
}

const N = 200;
let totals = { runs: 0, wickets: 0, extras: 0, fours: 0, sixes: 0, dots: 0 };
let min = Infinity, max = -Infinity;
for (let i = 1; i <= N; i++) {
  const r = simulateInnings(i * 7919);
  totals.runs += r.runs; totals.wickets += r.wickets; totals.extras += r.extras;
  totals.fours += r.fours; totals.sixes += r.sixes; totals.dots += r.dots;
  min = Math.min(min, r.runs); max = Math.max(max, r.runs);
}
const avg = (v: number) => (v / N).toFixed(2);
console.log(`innings simulated : ${N}`);
console.log(`avg score         : ${avg(totals.runs)}  (min ${min}, max ${max})`);
console.log(`avg wickets       : ${avg(totals.wickets)}`);
console.log(`avg extras        : ${avg(totals.extras)}`);
console.log(`avg fours / sixes : ${avg(totals.fours)} / ${avg(totals.sixes)}`);
console.log(`avg dot balls     : ${avg(totals.dots)}`);

// Determinism check
const a = JSON.stringify(simulateInnings(12345));
const b = JSON.stringify(simulateInnings(12345));
console.log(`deterministic     : ${a === b ? "PASS" : "FAIL"}`);
