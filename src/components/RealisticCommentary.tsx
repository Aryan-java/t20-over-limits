import { Player, BallEvent } from "@/types/cricket";

// Helper to pick random from array
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Milestone commentary injected after the main line
const getMilestoneComment = (batsman: Player, runs: number): string => {
  const batsmanRuns = batsman.runs;
  const prevRuns = batsmanRuns - runs;

  if (prevRuns < 50 && batsmanRuns >= 50 && batsmanRuns < 100) {
    return pick([
      ` 🎯 FIFTY UP for ${batsman.name}! Kya innings hai boss!`,
      ` 🔥 Half-century! ${batsman.name} raises his bat — crowd goes wild!`,
      ` 💥 50 runs for ${batsman.name}! What an innings so far!`,
      ` 🙌 Pachaas ho gaye! ${batsman.name} on fire!`,
      ` ⭐ ${batsman.name} completes a fantastic fifty! Standing ovation!`,
    ]);
  }
  if (prevRuns < 100 && batsmanRuns >= 100) {
    return pick([
      ` 🏆 CENTURY!! ${batsman.name} ne century maari! Stadium hilaa diya!`,
      ` 👑 HUNDRED UP! ${batsman.name} — what an absolute legend!`,
      ` 💯 SHATAKKKK! ${batsman.name} creates history! Incredible innings!`,
      ` 🎆 100 runs! ${batsman.name} takes off his helmet and the crowd erupts!`,
      ` 🐐 ${batsman.name} slams a magnificent century! One for the ages!`,
    ]);
  }
  return "";
};

// Phase-aware flavor text
const getPhasePrefix = (over: number, matchOvers: number): string => {
  if (over < 6) {
    return pick([
      "Powerplay mein",
      "Field restrictions on —",
      "Powerplay aggression!",
      "PP overs mein",
    ]);
  }
  if (over >= matchOvers - 4) {
    return pick([
      "Death overs!",
      "Slog overs mein",
      "Ab final push hai —",
      "Last few overs —",
      "Crunch time!",
    ]);
  }
  return "";
};

// Pressure commentary for chases
const getChasePressure = (
  requiredRuns?: number,
  ballsRemaining?: number
): string => {
  if (!requiredRuns || !ballsRemaining) return "";

  const rrr = (requiredRuns / ballsRemaining) * 6;

  if (ballsRemaining <= 6) {
    if (requiredRuns <= 1) return ` | Ek run chahiye! Heart in the mouth!`;
    if (requiredRuns <= 6) return ` | Last over drama! ${requiredRuns} off ${ballsRemaining}!`;
    return ` | ${requiredRuns} off ${ballsRemaining} — almost impossible! 😱`;
  }
  if (ballsRemaining <= 12) {
    return ` | ${requiredRuns} off ${ballsRemaining} balls. Nail-biter! 💓`;
  }
  if (rrr > 15) return ` | RRR ${rrr.toFixed(1)} — virtually impossible now!`;
  if (rrr > 12) return ` | ${requiredRuns} needed, RRR ${rrr.toFixed(1)} — ab toh miracle chahiye!`;
  if (rrr > 10) return ` | ${requiredRuns} still needed. Asking rate climbing! 📈`;
  if (requiredRuns <= 15) return ` | Just ${requiredRuns} more needed! 👀`;
  return "";
};

// Bowler spell awareness
const getBowlerSpellNote = (bowler: Player): string => {
  if (bowler.wickets >= 3) {
    return pick([
      ` ${bowler.name} on a hat-trick hunt!`,
      ` ${bowler.name} is on FIRE today — ${bowler.wickets} wickets already!`,
      ` ${bowler.name} tearing through the lineup!`,
    ]);
  }
  if (bowler.runsConceded > 0 && bowler.oversBowled > 0) {
    const econ = bowler.runsConceded / (Math.floor(bowler.oversBowled) + (bowler.oversBowled % 1) * 10 / 6);
    if (econ > 12) {
      return pick([
        ` Expensive spell for ${bowler.name} today.`,
        ` ${bowler.name} leaking runs.`,
      ]);
    }
  }
  return "";
};

export const generateRealisticCommentary = (
  event: BallEvent,
  bowler: Player,
  batsman: Player,
  over: number,
  ball: number,
  runs: number,
  isWicket: boolean,
  dismissalType?: string,
  targetRuns?: number,
  requiredRuns?: number,
  ballsRemaining?: number,
  matchOvers: number = 20
): string => {
  const overBall = `${over}.${ball}`;
  const phase = getPhasePrefix(over, matchOvers);
  const phaseTag = phase ? `${phase} ` : "";

  // ─── EXTRAS ────────────────────────────────────────
  if (event.extras) {
    const extrasCommentaries: Record<string, string[]> = {
      wide: [
        `Wide ball! ${bowler.name} sprays it down the leg side — loose delivery!`,
        `WIDE! ${bowler.name} loses his line. Free run gifted!`,
        `Pressure pe ${bowler.name} thoda loose ho gaya — wide called!`,
        `Wide delivery! Ye extra run dard dega ${bowler.name} ko.`,
        `${bowler.name} strays wide outside off. Umpire stretches his arms!`,
        `Wayward from ${bowler.name}! Wide ball, extras column growing.`,
        `Woh extra run jo kisi ko nahi chahiye tha — wide!`,
        `${bowler.name} struggling with his radar today — WIDE!`,
      ],
      "no-ball": [
        `NO BALL! ${bowler.name} oversteps! FREE HIT aane wala hai! 🎯`,
        `NO BALL! ${bowler.name} ne overstepping ki galti kar di — ye costly hoga!`,
        `Front foot no ball! ${runs > 1 ? `Aur ${batsman.name} ne ${runs === 4 ? "FOUR" : runs === 6 ? "SIX" : runs + " runs"} bhi maar diya!` : "Free hit loading! 🔥"}`,
        `Umpire checks... NO BALL! ${bowler.name} crossed the line!`,
        `${bowler.name} oversteps at the worst time! Free hit coming up!`,
        `NO BALL! Captain ki tension badh gayi — free hit next ball!`,
        `Overstepped! ${bowler.name} gift-wrapping runs today!`,
      ],
      bye: [
        `Bye! Keeper ke upar se nikal gayi — cheeky run!`,
        `${runs} bye${runs > 1 ? "s" : ""}! Keeper ne miss kiya completely.`,
        `Byes taken! Ball deviated off the pitch.`,
        `Misses everyone! ${runs} bye${runs > 1 ? "s" : ""} sneaked through.`,
        `Keeper scrambles but byes are taken!`,
        `Ball beats bat AND keeper — byes given!`,
      ],
      "leg-bye": [
        `Leg bye! Pad pe lagi aur chale gaye — ${runs} run!`,
        `${runs} leg bye${runs > 1 ? "s" : ""}! Off the pads and away.`,
        `Appeal for LBW... turned down! Leg byes taken.`,
        `Deflected off the thigh pad — leg bye!`,
        `${batsman.name} misses but runs taken off the body.`,
        `Umpire says not out, leg byes awarded!`,
      ],
    };

    const arr = extrasCommentaries[event.extras.type] || [`${event.extras.type} — extra runs`];
    return `${overBall} - ${phaseTag}${pick(arr)}`;
  }

  // ─── WICKET ────────────────────────────────────────
  if (isWicket) {
    const wicketBase = [
      `OUTTTT! 🔴 ${bowler.name} ne tod diya defense! ${batsman.name} ${dismissalType}!`,
      `Stumps bikhar gaye! ${batsman.name} OUT! ${bowler.name} celebrates wildly!`,
      `${batsman.name} GONE! ${dismissalType}! Pavilion ki taraf chale padhe.`,
      `Ye BADA wicket hai! ${batsman.name} departs — ${bowler.name} roars!`,
      `BIG APPEAL! Finger goes up! ${batsman.name} has to walk! 👆`,
      `Mistimed shot... aur TAKEN! ${batsman.name} walks back disappointed.`,
      `${bowler.name} STRIKES! ${batsman.name} ${dismissalType}! What a delivery!`,
      `OUT! ${batsman.name} tried to be aggressive but pays the price!`,
      `${bowler.name} ne yorker daala aur CLEAN BOWLED! Stumps flying! 🎯`,
      `Caught! ${batsman.name} edges it and it's taken brilliantly!`,
      `STUMPED! ${batsman.name} came down the track and missed — keeper does the rest!`,
      `${batsman.name} holes out in the deep! ${dismissalType}!`,
      `WHAT A CATCH! ${batsman.name} can't believe his luck — OUT!`,
      `${bowler.name} gets the breakthrough! Game changer! 🔑`,
      `Plumb LBW! ${batsman.name} had absolutely no answer to that one!`,
      `BOWLED HIM! ${bowler.name} shatters the stumps — batsman frozen! ❄️`,
      `Gone! ${batsman.name} ${dismissalType}! Dressing room mein sannata!`,
      `${bowler.name} strikes gold! Huge celebration! 🎉`,
      `Brilliant catch at the boundary! ${batsman.name} OUT! Crowd erupts!`,
      `Trapped in front! Dead plumb! ${batsman.name} has to go!`,
      `RUN OUT! Direct hit! ${batsman.name} was miles short! 🎯`,
      `Caught and bowled! ${bowler.name} takes a screamer off his own bowling!`,
    ];

    // Context-enriched wicket commentary
    const wicketCtx: string[] = [];
    if (batsman.runs >= 50) wicketCtx.push(` Great innings of ${batsman.runs}(${batsman.balls}) comes to an end.`);
    if (batsman.runs === 0 && batsman.balls <= 3) wicketCtx.push(` Golden duck! Zero runs, out early — tough day!`);
    if (batsman.runs === 0) wicketCtx.push(` Duck! ${batsman.name} departs without troubling the scorers. 🦆`);

    const bowlerNote = getBowlerSpellNote(bowler);
    const base = pick(wicketBase);
    const ctx = wicketCtx.length > 0 ? pick(wicketCtx) : "";

    return `${overBall} - ${phaseTag}${base}${ctx}${bowlerNote}`;
  }

  // ─── RUNS ──────────────────────────────────────────
  let commentary = "";

  switch (runs) {
    case 0: {
      const dots = [
        `${bowler.name} ne TIGHT ball daala! Dot! 🔒`,
        `${batsman.name} dikha hi nahi kya kare — DOT ball!`,
        `Bouncer! ${batsman.name} sways away — no run.`,
        `Bilkul run nahi diya! ${bowler.name} in command.`,
        `OH BEATEN! ${batsman.name} ko bilkul idea nahi laga!`,
        `${bowler.name} aaj line-length lekar aya hai — dot!`,
        `Ek aur dot! Pressure cooker ban gaya ye over! 🍳`,
        `Slow ball, beautifully disguised — ${batsman.name} fooled!`,
        `${batsman.name} hawa mein swing kiya — beaten all ends up!`,
        `Good length, defended solidly. No run.`,
        `${batsman.name} gets behind the line — watchful batting.`,
        `Played back to ${bowler.name}, no run there.`,
        `Yorker attempt! ${batsman.name} somehow digs it out — dot.`,
        `${bowler.name} bowling on point today! 🎯`,
        `Pressure building — another dot ball!`,
        `${batsman.name} respectfully leaves that outside off.`,
        `Dead bat defense from ${batsman.name} — textbook!`,
        `In-swinger, tight line — ${batsman.name} defends.`,
        `Back of a length, no room to play — dot ball!`,
        `Maiden territory for ${bowler.name}! Tight stuff.`,
      ];
      commentary = pick(dots);
      break;
    }

    case 1: {
      const singles = [
        `${batsman.name} ne angle change kiya — easy single! 🏃`,
        `Quick call, quick run! Single complete.`,
        `Soft hands, third man ki taraf — SMART cricket!`,
        `${batsman.name} nudges it for a single. Strike rotated.`,
        `Quick single! Good running between wickets.`,
        `${batsman.name} works it away for one — tick over.`,
        `Single to rotate strike — intelligent batting.`,
        `${batsman.name} taps and sprints — one run taken.`,
        `Milked off the pads — single taken easily.`,
        `Gap mein daal ke single — ${batsman.name} reading it well.`,
        `Wrist work se single nikaal liya — sublime touch!`,
        `${batsman.name} keeps scoreboard ticking — one run.`,
        `Angled down to third man — easy single.`,
        `Tucked off the hip for one — busy batting!`,
        `${batsman.name} quick feet, quick single!`,
        `Guided to point for a single.`,
        `Good placement! ${batsman.name} gets off strike.`,
      ];
      commentary = pick(singles);
      break;
    }

    case 2: {
      const doubles = [
        `${batsman.name} ne gap mein daala — comes back for TWO! 🏃🏃`,
        `Excellent running! Do runs mil gaye!`,
        `Straight drive, fielder chases — phir bhi 2 runs!`,
        `${batsman.name} finds the gap — comfortable couple!`,
        `Good shot! ${batsman.name} picks up a brace.`,
        `In the gap! Two runs added to the total.`,
        `${batsman.name} times it well, gets two for the effort.`,
        `Bisecting the field beautifully — two taken!`,
        `Hustled running — converted one into two!`,
        `Couple of runs! ${batsman.name} looking sharp today.`,
        `Perfect placement — two more to the score!`,
        `${batsman.name} pushing and running hard — two!`,
        `Driven into the gap — two runs, well judged!`,
        `Gap mein perfect placement — do run aaye!`,
        `Wide of mid-on — they come back for the second!`,
      ];
      commentary = pick(doubles);
      break;
    }

    case 3: {
      const triples = [
        `THREE RUNS! ${batsman.name} found the big gap — great running! 🏃🏃🏃`,
        `Excellent placement! ${batsman.name} hustles for three!`,
        `Deep in the outfield — they push for THREE!`,
        `${batsman.name} times it well, three runs — rare sight in T20!`,
        `In the gap and they sprint! Three taken on great running!`,
        `${batsman.name} drives it wide — three runs on hustle!`,
        `Misfield in the deep! Three runs, gift and grab!`,
      ];
      commentary = pick(triples);
      break;
    }

    case 4: {
      const fours = [
        `Aye haaye! Kya COVER DRIVE! Tasveer jaisa shot — FOUR! 🖼️`,
        `Paddle sweep... Fine leg ko beat kiya — CHAUKA! 🏏`,
        `Width mili aur ${batsman.name} ne kaat diya! SHOT OF THE DAY! FOUR!`,
        `Edged aur boundary tak race kar gayi — lucky but runs toh milenge!`,
        `Off-stump pe ball, ${batsman.name} ne punch kiya — BEAUTIFUL FOUR! 💫`,
        `FOUR! ${batsman.name} threads the needle! Class act!`,
        `BOUNDARY! Timing so pure it should be illegal! 🔥`,
        `SHOT! ${batsman.name} pierces the gap — racing to the rope!`,
        `FOUR! Delightful placement from ${batsman.name}!`,
        `CRACKING CUT SHOT! ${batsman.name} sends it to the boundary!`,
        `FOUR! Driven through covers like a bullet! 💥`,
        `BOUNDARY! ${batsman.name} picks the gap perfectly!`,
        `Square cut — RACES to the fence! FOUR!`,
        `Kya timing hai! Ball ne boundary rope ko CHOOM liya! 😘`,
        `FOUR! ${batsman.name} in full flow — innings building nicely!`,
        `Lofted but safe! Over the infield — FOUR!`,
        `Pull shot! Top-edges but enough for FOUR!`,
        `Inside-out over covers — classy FOUR from ${batsman.name}!`,
        `${batsman.name} unleashes the sweep — FOUR! 🧹`,
        `Late cut, fine enough — FOUR! Exquisite stuff!`,
        `Front foot punch — middle of the bat — FOUR! 🎯`,
        `${bowler.name} errs in length — ${batsman.name} punishes! FOUR!`,
        `POWERED through mid-wicket! BOUNDARY! 💪`,
        `Flick off the pads — races away for FOUR!`,
      ];
      commentary = pick(fours);
      break;
    }

    case 6: {
      const sixes = [
        `UFFFF! Bahut DOOR chala gaya! SIX! Planet se bahar! 🚀`,
        `${batsman.name} goes DOWNTOWN! Long-on ke upar — CROWD MEIN! 🎆`,
        `Pickup shot — effortless timing! Ball GAYAB ho gayi! SIX!`,
        `${bowler.name} short daalta hai — HELICOPTER SHOT! DHUAAN! 🌪️`,
        `Flighted delivery... MAXIMUM! ${batsman.name} ne pura confidence dikhaya!`,
        `SIX! ${batsman.name} launches it into the STANDS! MASSIVE! 💥`,
        `MAXIMUM! ${batsman.name} — kya POWER hai! Into the crowd!`,
        `SIX! Sailing over the boundary! ${batsman.name} shows NO MERCY!`,
        `HUGE! ${batsman.name} connects perfectly — gone ALL THE WAY!`,
        `OUT OF THE PARK! ${batsman.name} MURDERS that ball! 😱`,
        `MAXIMUM! Deposited into the top tier! Incredible!`,
        `SIX! ${batsman.name} goes downtown — what AUTHORITY! 👊`,
        `BOOM! That's OUTTA HERE! SIX! 💣`,
        `${batsman.name} slog-sweeps it for a flat SIX! Pure violence!`,
        `Clean as a whistle — SIX over long-off! 🎵`,
        `Monstrous hit! Ball disappeared into the night sky! SIX! 🌙`,
        `CHAKKA! ${batsman.name} absolutely ON FIRE today! 🔥`,
        `${batsman.name} steps out and LAUNCHES — SIX! Crowd goes berserk!`,
        `Into orbit! ${batsman.name} clearing boundaries for fun! 🛸`,
        `${bowler.name} ko itni maar — SIX! Bowler ke paas koi jawaab nahi!`,
        `Upper-cut for SIX! ${batsman.name} making it look EASY!`,
        `Reverse sweep for SIX! ${batsman.name} is UNREAL tonight!`,
        `One-handed SIX! ${batsman.name} showing off now! 😤`,
        `Scooped over fine leg — AUDACIOUS SIX from ${batsman.name}!`,
      ];
      commentary = pick(sixes);
      break;
    }

    default:
      commentary = `${runs} runs to ${batsman.name}! Good running.`;
  }

  // Milestone check
  const milestone = getMilestoneComment(batsman, runs);

  // Chase pressure
  const chaseNote = getChasePressure(requiredRuns, ballsRemaining);

  // Free hit reminder
  const freeHitNote = event.extras?.type === "no-ball" ? "" : ""; // handled in extras

  return `${overBall} - ${phaseTag}${commentary}${milestone}${chaseNote}`;
};

export const getMatchSituationCommentary = (
  totalRuns: number,
  wickets: number,
  overs: number,
  balls: number,
  requiredRunRate?: number,
  currentRunRate?: number
): string => {
  const situationCommentaries: string[] = [];

  // Run rate analysis
  if (requiredRunRate && currentRunRate) {
    const diff = requiredRunRate - currentRunRate;
    if (diff > 4) {
      situationCommentaries.push(pick([
        "Batting team BAHUT peeche hai required rate se — need a miracle! 🙏",
        "Asking rate climbing dangerously! Pressure immense!",
        "The equation is getting out of hand for the chasing team!",
      ]));
    } else if (diff > 2) {
      situationCommentaries.push(pick([
        "Batting team falling behind the required rate — need to accelerate!",
        "Run rate gap widening — boundaries zaruri hain ab!",
        "Need to find the fence more often to stay in the hunt!",
      ]));
    } else if (diff < -2) {
      situationCommentaries.push(pick([
        "Batting team cruising ahead of the required rate! 😎",
        "Chase looking comfortable — well ahead of the asking rate!",
        "Batting team in control of this chase!",
      ]));
    } else {
      situationCommentaries.push(pick([
        "Match evenly poised — ANYBODY'S game! ⚖️",
        "Neck and neck! This is going down to the wire!",
        "Perfectly balanced chase — edge of the seat stuff!",
      ]));
    }
  }

  // Wickets situation
  if (wickets >= 8) {
    situationCommentaries.push(pick([
      "Tail enders at the crease now — recognized batsmen khatam! 😬",
      "Running out of batsmen! Last pair territory!",
      "Lower order exposed — every run is gold now!",
    ]));
  } else if (wickets >= 5) {
    situationCommentaries.push(pick([
      "Half the side back — batting team under pressure!",
      "Middle order collapse! Need a partnership desperately!",
    ]));
  } else if (wickets <= 2 && overs >= 10) {
    situationCommentaries.push(pick([
      "Wickets in hand! Platform set for a big finish! 💪",
      "Batting team sitting pretty with wickets to spare!",
      "Solid foundation — time to unleash!",
    ]));
  }

  // Phase
  if (overs >= 16) {
    situationCommentaries.push(pick([
      "DEATH OVERS! Har ball pe drama hoga! 🎭",
      "Slog overs — boundaries or bust!",
      "Last 4 overs — maximum carnage expected!",
    ]));
  } else if (overs >= 6 && overs <= 10) {
    situationCommentaries.push(pick([
      "Middle overs — consolidation ya acceleration? 🤔",
      "Building phase — need to keep wickets and rotate!",
    ]));
  } else if (overs < 6) {
    situationCommentaries.push(pick([
      "POWERPLAY! Field up — time to attack! ⚡",
      "Fielding restrictions on — scoring opportunity!",
    ]));
  }

  return situationCommentaries.join(" | ");
};
