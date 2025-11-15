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
  
  // Check for extras first
  if (event.extras) {
    const extrasCommentaries = {
      'wide': [
        `Wide ball! ${bowler.name} sprays it down the leg side`,
        `WIDE! ${bowler.name} loses his line completely`,
        `Wide called! Pressure pe ${bowler.name} thoda loose ho gaya`,
        `Extra run! Wide ball down the leg side`,
        `${bowler.name} strays too wide, umpire signals wide`,
        `Wide delivery! ${bowler.name} needs to find his line`,
        `Wayward delivery, wide called by the umpire`,
        `${bowler.name} bowls it wide, extra run gifted`
      ],
      'no-ball': [
        `NO BALL! ${bowler.name} oversteps! Free hit coming up!`,
        `NO BALL called! ${bowler.name} ne overstepping ki galti kar di`,
        `Front foot no ball! ${runs > 1 ? `Aur ${batsman.name} ne ${runs === 4 ? 'FOUR' : 'SIX'} bhi maar diya!` : 'Free hit next!'}`,
        `Overstepped! No ball, ${bowler.name} under pressure`,
        `${bowler.name} oversteps the crease, no ball called`,
        `NO BALL! ${bowler.name} crosses the line${runs > 1 ? ` and ${batsman.name} cashes in with ${runs} runs!` : ''}`,
        `Umpire signals no ball! ${bowler.name} ne line cross kar li`
      ],
      'bye': [
        `Bye! Wicket-keeper couldn't collect it`,
        `Byes! Ball gaya wicket-keeper se door`,
        `${runs} bye${runs > 1 ? 's' : ''}! Keeper missed it completely`,
        `Misses everyone! ${runs} bye${runs > 1 ? 's' : ''} taken`,
        `${batsman.name} leaves it, byes called`,
        `Keeper couldn't gather, byes given`,
        `Ball beats everyone, ${runs} bye${runs > 1 ? 's' : ''} added`
      ],
      'leg-bye': [
        `Leg bye! Ball thuds into the pads`,
        `${runs} leg bye${runs > 1 ? 's' : ''}! Off the pads and away`,
        `Leg byes! Hit the pad aur daud gaye`,
        `Appeal for LBW but missing, leg bye taken`,
        `Off the pads! ${runs} leg bye${runs > 1 ? 's' : ''}`,
        `Leg bye called! Deflected off the thigh pad`,
        `${batsman.name} misses, but leg byes taken`
      ]
    };
    
    const commentaryArray = extrasCommentaries[event.extras.type];
    const commentary = commentaryArray[Math.floor(Math.random() * commentaryArray.length)];
    return `${overBall} - ${commentary}`;
  }
  
  if (isWicket) {
    const wicketCommentaries = [
      `OUTTTT! ${bowler.name} ne tod diya defence!`,
      `Chaaron taraf stump bikhar gaye! ${batsman.name} OUT!`,
      `Edged aur pakad liya! ${batsman.name} ${dismissalType}!`,
      `Yeh bada wicket hai match ka! ${batsman.name} departs!`,
      `Big appeal! Finger goes up! LBW OUT! ${batsman.name}!`,
      `Mistimed shot... aur easy catch — ${batsman.name} ko wapas jaana padega!`,
      `Ye run out ho sakta hai! Direct hit! ${batsman.name} OUT!`,
      `${bowler.name} strikes! ${batsman.name} ${dismissalType}!`,
      `OUT! ${batsman.name} ne risk liya aur wicket gawa diya!`,
      `${bowler.name} ne yorker daala aur ${batsman.name} clean bowled!`,
      `Caught behind! ${batsman.name} edge de diya!`,
      `Stumped! ${batsman.name} bahar aa gaya aur wicket-keeper ne khatam kar diya!`,
      `${batsman.name} holes out! ${dismissalType}!`,
      `What a catch! ${batsman.name} ${dismissalType}!`,
      `${bowler.name} gets the breakthrough! ${batsman.name} walks back!`,
      `Plumb LBW! ${batsman.name} had no answer!`,
      `Bowled him! ${bowler.name} shatters the stumps!`,
      `Gone! ${batsman.name} ${dismissalType}! Game-changing wicket!`,
      `OUT! ${batsman.name} tries to hit big, loses wicket!`,
      `${bowler.name} strikes gold! ${batsman.name} dismissed!`,
      `Brilliant catch! ${batsman.name} can't believe it!`,
      `Hit wicket! ${batsman.name} disturbs his own stumps!`,
      `Caught and bowled! ${bowler.name} takes a blinder!`,
      `Leg before! ${batsman.name} trapped in front!`,
      `Spectacular catch in the deep! ${batsman.name} OUT!`
    ];
    return `${overBall} - ${wicketCommentaries[Math.floor(Math.random() * wicketCommentaries.length)]}`;
  }

  let commentary = "";
  
  switch (runs) {
    case 0:
      const dotCommentaries = [
        `${bowler.name} ne bada tight ball daala!`,
        `${batsman.name} dikha hi nahi kya kare—dot ball!`,
        `Bouncer tha yeh, ache se sway kiya.`,
        `Aur bilkul run nahi diya boss.`,
        `Oh beaten! ${batsman.name} ko bilkul idea hi nahi laga yaar.`,
        `${bowler.name} aaj line-length lekar aya hai.`,
        `Ek aur dot, pressure cooker ban gaya yeh over.`,
        `Slow ball, nicely disguised.`,
        `Aur ${batsman.name} hawa mein hi swing kar gaya.`,
        `Dot ball! ${bowler.name} keeps it tight`,
        `Good length delivery, ${batsman.name} defends`,
        `${batsman.name} gets behind the line, no run`,
        `Played back to the bowler, no run there`,
        `${bowler.name} ne defense tod ne ki koshish ki, par nahi hua`,
        `${batsman.name} watchfully leaves that one alone`,
        `Defended into the off-side, no run`,
        `Yorker attempt, ${batsman.name} digs it out`,
        `${bowler.name} bowling on point today`,
        `No run there, building pressure`,
        `${batsman.name} respectfully defends`
      ];
      commentary = dotCommentaries[Math.floor(Math.random() * dotCommentaries.length)];
      break;
      
    case 1:
      const singleCommentaries = [
        `${batsman.name} ne bas angle change kiya. Ek aasaan single mil gaya.`,
        `Better running between the wickets! Single complete ho gaya.`,
        `Soft hands, third man ki taraf. Yehi toh smart cricket hai.`,
        `Quick call and quick run! Safe ho gaya.`,
        `${batsman.name} nudges it for a single`,
        `Quick single taken! Good running between the wickets`,
        `${batsman.name} works it away for one`,
        `Single taken to rotate the strike`,
        `${batsman.name} taps and runs, easy single`,
        `Good placement, single taken`,
        `${batsman.name} milks a single off ${bowler.name}`,
        `Ek run liya aur strike rotate kar di`,
        `Smart batting by ${batsman.name}`,
        `Gap mein daal ke single le liya`,
        `Easy run there for ${batsman.name}`,
        `Wrist work se single nikaal liya`,
        `${batsman.name} keeps the scoreboard ticking`,
        `Angled to third man, single taken`,
        `Tucked away for a single`
      ];
      commentary = singleCommentaries[Math.floor(Math.random() * singleCommentaries.length)];
      break;
      
    case 2:
      const doubleCommentaries = [
        `${batsman.name} ne gap mein daala, comes back for two!`,
        `Excellent running! Do runs mil gaye`,
        `Straight drive, fielder rok deta. Phir bhi 2 runs mil gaye.`,
        `${batsman.name} places it in the gap, comes back for two!`,
        `Excellent running! Two runs taken`,
        `${batsman.name} finds the gap, comfortable two`,
        `Good shot! ${batsman.name} picks up a couple`,
        `In the gap! Two runs added to the total`,
        `${batsman.name} times it well, gets two for his effort`,
        `Nicely placed by ${batsman.name}, two runs taken`,
        `Gap mein perfect placement, do run aye`,
        `${batsman.name} pushes it wide of fielder, two taken`,
        `Bisecting the field beautifully for two`,
        `Good running, converted one into two`,
        `Couple of runs there for ${batsman.name}`,
        `Two more added to the score`,
        `${batsman.name} finding gaps nicely`,
        `Excellent placement, two runs`,
        `Good cricket, two runs taken`
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
        `Aye haaye! Kya cover drive maara! Bilkul tasveer jaisa shot — FOUR!`,
        `Paddle sweep... Fine leg ko beat kiya — 4 runs!`,
        `Width mili, aur ${batsman.name} ne kaat diya. Shot of the day!`,
        `Edged aur ball bhaagti hui boundary tak. Lucky but runs toh milenge hi.`,
        `Off-stump pe ball, aur ${batsman.name} ne punch kiya. Boundary, bada khoobsurat.`,
        `FOUR! ${batsman.name} finds the boundary! What a shot!`,
        `BOUNDARY! ${batsman.name} threads the needle perfectly!`,
        `FOUR! Excellent timing from ${batsman.name}!`,
        `SHOT! ${batsman.name} pierces the field for four!`,
        `FOUR! ${batsman.name} plays a delightful stroke!`,
        `BOUNDARY! ${batsman.name} gets it away to the fence!`,
        `FOUR! ${batsman.name} shows his class with that shot!`,
        `CRACKING SHOT! ${batsman.name} finds the gap for four!`,
        `FOUR! ${batsman.name} cuts it away beautifully!`,
        `BOUNDARY! ${batsman.name} drives it majestically for four!`,
        `Kya timing! FOUR runs!`,
        `${batsman.name} unleashes a cracking boundary!`,
        `Square cut, races to the fence!`,
        `Beautiful stroke play! FOUR!`,
        `${batsman.name} in full flow, BOUNDARY!`,
        `Edged but safe, runs away for four!`,
        `Clinical shot, four runs added!`,
        `${batsman.name} finds the gap, FOUR!`,
        `Power and placement, boundary!`,
        `Textbook shot for four runs!`
      ];
      commentary = boundaryCommentaries[Math.floor(Math.random() * boundaryCommentaries.length)];
      break;
      
    case 6:
      const sixCommentaries = [
        `Uffff! Yeh chala gaya bahut door! SIX! Planet se bahar jaake aayi hai ball.`,
        `${batsman.name} goes downtown! Long-on ke upar se seedha crowd mein.`,
        `Pickup shot – effortless timing! Ball toh hawa mein gaayab ho gayi.`,
        `${bowler.name} short dalta hai... Aur yeh gaya helicopter shot! Dhuaan nikal diya.`,
        `Flighted delivery... Maximum! ${batsman.name} ne pura confidence dikhaya.`,
        `SIX! ${batsman.name} launches it into the stands! MASSIVE!`,
        `MAXIMUM! ${batsman.name} goes big! What a shot!`,
        `SIX! ${batsman.name} sends it sailing over the boundary!`,
        `HUGE! ${batsman.name} connects and it's gone all the way!`,
        `SIX! ${batsman.name} shows no mercy! Into the crowd!`,
        `MAXIMUM! ${batsman.name} deposits it into the stands!`,
        `SIX! ${batsman.name} goes downtown! What power!`,
        `OUT OF THE PARK! ${batsman.name} smashes it for six!`,
        `SIX! ${batsman.name} gets underneath it and sends it miles!`,
        `MAXIMUM! ${batsman.name} clears the boundary with ease!`,
        `Boom! That's outta here! SIX!`,
        `${batsman.name} into orbit! MAXIMUM!`,
        `Clean strike! Ball disappeared into the stands!`,
        `Monstrous hit! SIX runs!`,
        `${batsman.name} absolutely clobbers it! SIX!`,
        `High and handsome! MAXIMUM!`,
        `Chakka! ${batsman.name} on fire!`,
        `Out of the ground! Massive SIX!`,
        `${batsman.name} murders that one! SIX!`,
        `Into the top tier! Incredible hitting!`
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