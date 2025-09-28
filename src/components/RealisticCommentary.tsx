import { Player, BallEvent } from "@/types/cricket";

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
  ballsRemaining?: number
): string => {
  const overBall = `${over}.${ball}`;
  
  if (isWicket) {
    const wicketCommentaries = [
      `OUT! ${batsman.name} ${dismissalType}! ${bowler.name} strikes! What a delivery!`,
      `WICKET! ${batsman.name} departs for ${batsman.runs}! ${bowler.name} gets the breakthrough!`,
      `Gone! ${batsman.name} ${dismissalType}! ${bowler.name} punches the air in delight!`,
      `Bowled him! What a beauty from ${bowler.name}! ${batsman.name} had no answer to that one!`,
      `Caught! ${batsman.name} ${dismissalType}! The fielder takes a sharp catch!`,
      `LBW! Up goes the finger! ${batsman.name} ${dismissalType}! ${bowler.name} is ecstatic!`
    ];
    return `${overBall} - ${wicketCommentaries[Math.floor(Math.random() * wicketCommentaries.length)]}`;
  }

  let commentary = "";
  
  switch (runs) {
    case 0:
      const dotCommentaries = [
        `Dot ball! ${bowler.name} keeps it tight`,
        `Good length delivery, ${batsman.name} defends`,
        `${batsman.name} gets behind the line, no run`,
        `Played back to the bowler, no run there`,
        `Good bowling from ${bowler.name}, dot ball`,
        `${batsman.name} watchfully leaves that one alone`,
        `Defended into the off-side, no run`
      ];
      commentary = dotCommentaries[Math.floor(Math.random() * dotCommentaries.length)];
      break;
      
    case 1:
      const singleCommentaries = [
        `${batsman.name} nudges it for a single`,
        `Quick single taken! Good running between the wickets`,
        `${batsman.name} works it away for one`,
        `Single taken to rotate the strike`,
        `${batsman.name} taps and runs, easy single`,
        `Good placement, single taken`,
        `${batsman.name} milks a single off ${bowler.name}`
      ];
      commentary = singleCommentaries[Math.floor(Math.random() * singleCommentaries.length)];
      break;
      
    case 2:
      const doubleCommentaries = [
        `${batsman.name} places it in the gap, comes back for two!`,
        `Excellent running! Two runs taken`,
        `${batsman.name} finds the gap, comfortable two`,
        `Good shot! ${batsman.name} picks up a couple`,
        `In the gap! Two runs added to the total`,
        `${batsman.name} times it well, gets two for his effort`,
        `Nicely placed by ${batsman.name}, two runs taken`
      ];
      commentary = doubleCommentaries[Math.floor(Math.random() * doubleCommentaries.length)];
      break;
      
    case 3:
      const tripleCommentaries = [
        `${batsman.name} finds the gap! Three runs taken`,
        `Excellent placement! ${batsman.name} gets three`,
        `Good shot! Three runs to ${batsman.name}`,
        `${batsman.name} times it perfectly, three runs`,
        `In the gap! ${batsman.name} picks up three`,
        `Well played! Three runs added`,
        `${batsman.name} works it away nicely for three`
      ];
      commentary = tripleCommentaries[Math.floor(Math.random() * tripleCommentaries.length)];
      break;
      
    case 4:
      const boundaryCommentaries = [
        `FOUR! ${batsman.name} finds the boundary! What a shot!`,
        `BOUNDARY! ${batsman.name} threads the needle perfectly!`,
        `FOUR! Excellent timing from ${batsman.name}!`,
        `SHOT! ${batsman.name} pierces the field for four!`,
        `FOUR! ${batsman.name} plays a delightful stroke!`,
        `BOUNDARY! ${batsman.name} gets it away to the fence!`,
        `FOUR! ${batsman.name} shows his class with that shot!`,
        `CRACKING SHOT! ${batsman.name} finds the gap for four!`,
        `FOUR! ${batsman.name} cuts it away beautifully!`,
        `BOUNDARY! ${batsman.name} drives it majestically for four!`
      ];
      commentary = boundaryCommentaries[Math.floor(Math.random() * boundaryCommentaries.length)];
      break;
      
    case 6:
      const sixCommentaries = [
        `SIX! ${batsman.name} launches it into the stands! MASSIVE!`,
        `MAXIMUM! ${batsman.name} goes big! What a shot!`,
        `SIX! ${batsman.name} sends it sailing over the boundary!`,
        `HUGE! ${batsman.name} connects and it's gone all the way!`,
        `SIX! ${batsman.name} shows no mercy! Into the crowd!`,
        `MAXIMUM! ${batsman.name} deposits it into the stands!`,
        `SIX! ${batsman.name} goes downtown! What power!`,
        `OUT OF THE PARK! ${batsman.name} smashes it for six!`,
        `SIX! ${batsman.name} gets underneath it and sends it miles!`,
        `MAXIMUM! ${batsman.name} clears the boundary with ease!`
      ];
      commentary = sixCommentaries[Math.floor(Math.random() * sixCommentaries.length)];
      break;
      
    default:
      commentary = `${runs} runs to ${batsman.name}`;
  }
  
  // Add context-based commentary for chase situations
  if (requiredRuns && ballsRemaining) {
    if (ballsRemaining <= 6) {
      commentary += ` | ${requiredRuns} needed off ${ballsRemaining} balls!`;
    } else if (requiredRuns <= 10) {
      commentary += ` | ${requiredRuns} needed from ${Math.ceil(ballsRemaining / 6)} overs!`;
    }
  }
  
  return `${overBall} - ${commentary}`;
};

export const getMatchSituationCommentary = (
  totalRuns: number,
  wickets: number,
  overs: number,
  balls: number,
  requiredRunRate?: number,
  currentRunRate?: number
): string => {
  const situationCommentaries = [];
  
  if (requiredRunRate && currentRunRate) {
    if (requiredRunRate > currentRunRate + 2) {
      situationCommentaries.push("The batting team is falling behind the required rate");
    } else if (currentRunRate > requiredRunRate + 2) {
      situationCommentaries.push("The batting team is ahead of the required rate");
    } else {
      situationCommentaries.push("The match is evenly poised");
    }
  }
  
  if (wickets >= 8) {
    situationCommentaries.push("The batting team is running out of recognized batsmen");
  } else if (wickets <= 2 && overs >= 10) {
    situationCommentaries.push("The batting team has wickets in hand");
  }
  
  if (overs >= 15) {
    situationCommentaries.push("We're in the death overs now");
  } else if (overs >= 6 && overs <= 10) {
    situationCommentaries.push("Middle overs phase");
  } else if (overs <= 6) {
    situationCommentaries.push("Powerplay phase");
  }
  
  return situationCommentaries.join(". ");
};