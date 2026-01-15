import { useState, useCallback, useMemo } from 'react';
import { Venue } from '@/data/venues';
import { 
  MatchConditions, 
  ConditionModifiers, 
  WeatherCondition, 
  PitchCondition 
} from '@/types/weather';

// Generate initial conditions based on venue
export const generateInitialConditions = (venue: Venue): MatchConditions => {
  const timeOfDay = venue.weather.matchTime === 'day' ? 'afternoon' : 
                   venue.weather.matchTime === 'day-night' ? 'evening' : 'night';
  
  // Determine weather based on venue characteristics
  let weather: WeatherCondition = 'sunny';
  if (venue.weather.humidity > 70) {
    weather = timeOfDay === 'night' ? 'dew' : 'humid';
  } else if (venue.weather.windSpeed === 'windy') {
    weather = 'windy';
  } else if (venue.paceFriendliness > 60) {
    weather = Math.random() > 0.5 ? 'overcast' : 'partly-cloudy';
  }
  
  // Determine pitch based on venue
  let pitch: PitchCondition = 'flat';
  if (venue.pitchType === 'spin') {
    pitch = venue.spinFriendliness > 70 ? 'dusty' : 'dry';
  } else if (venue.pitchType === 'pace') {
    pitch = venue.paceFriendliness > 70 ? 'green' : 'damp';
  }
  
  return {
    weather,
    pitch,
    temperature: venue.weather.avgTemperature,
    humidity: venue.weather.humidity,
    windSpeed: venue.weather.windSpeed === 'windy' ? 'gusty' : venue.weather.windSpeed,
    dewFactor: venue.dewFactor,
    pitchDegradation: 0,
    timeOfDay
  };
};

// Calculate how conditions evolve during the match
export const evolveConditions = (
  conditions: MatchConditions, 
  ballsBowled: number,
  isSecondInnings: boolean
): MatchConditions => {
  const totalBalls = 120; // 20 overs
  const matchProgress = Math.min(ballsBowled / (totalBalls * (isSecondInnings ? 2 : 1)), 1);
  
  // Pitch degrades as match progresses
  const newDegradation = Math.min(100, conditions.pitchDegradation + (matchProgress * 30));
  
  // Dew factor increases in evening/night second innings
  let newDewFactor = conditions.dewFactor;
  if (isSecondInnings && (conditions.timeOfDay === 'evening' || conditions.timeOfDay === 'night')) {
    newDewFactor = Math.min(100, conditions.dewFactor + 20);
  }
  
  // Weather might shift
  let newWeather = conditions.weather;
  if (isSecondInnings && newDewFactor > 60) {
    newWeather = 'dew';
  }
  
  // Pitch condition might change
  let newPitch = conditions.pitch;
  if (newDegradation > 50 && conditions.pitch === 'dry') {
    newPitch = 'dusty';
  } else if (newDegradation > 70 && conditions.pitch === 'flat') {
    newPitch = 'cracked';
  }
  
  return {
    ...conditions,
    weather: newWeather,
    pitch: newPitch,
    dewFactor: newDewFactor,
    pitchDegradation: newDegradation
  };
};

// Calculate modifiers based on current conditions
export const calculateModifiers = (
  conditions: MatchConditions,
  venue: Venue
): ConditionModifiers => {
  const notes: string[] = [];
  
  // Base modifiers
  let boundaryMultiplier = 1;
  let sixMultiplier = 1;
  let runScoringMultiplier = 1;
  let paceWicketMultiplier = 1;
  let spinWicketMultiplier = 1;
  let swingMultiplier = 1;
  let seamMultiplier = 1;
  let turnMultiplier = 1;
  let extrasMultiplier = 1;
  let dotBallMultiplier = 1;
  
  // Weather effects
  switch (conditions.weather) {
    case 'sunny':
      boundaryMultiplier *= 1.1;
      sixMultiplier *= 1.15;
      notes.push('Clear conditions favor batsmen');
      break;
    case 'overcast':
      swingMultiplier *= 1.4;
      seamMultiplier *= 1.3;
      paceWicketMultiplier *= 1.25;
      dotBallMultiplier *= 1.15;
      notes.push('Overcast skies - ball swinging!');
      break;
    case 'partly-cloudy':
      swingMultiplier *= 1.15;
      notes.push('Some swing on offer');
      break;
    case 'drizzle':
      extrasMultiplier *= 1.3;
      dotBallMultiplier *= 1.2;
      boundaryMultiplier *= 0.9;
      notes.push('Slippery conditions affecting grip');
      break;
    case 'humid':
      swingMultiplier *= 1.2;
      if (conditions.humidity > 80) {
        notes.push('Reverse swing possible in humid conditions');
      }
      break;
    case 'windy':
      sixMultiplier *= (conditions.windSpeed === 'strong' ? 0.75 : 0.9);
      extrasMultiplier *= 1.15;
      notes.push('Wind affecting ball flight');
      break;
    case 'dew':
      spinWicketMultiplier *= 0.7;
      turnMultiplier *= 0.6;
      boundaryMultiplier *= 1.15;
      extrasMultiplier *= 1.2;
      notes.push('Dew making ball slippery - tough for bowlers');
      break;
  }
  
  // Pitch effects
  switch (conditions.pitch) {
    case 'green':
      seamMultiplier *= 1.4;
      paceWicketMultiplier *= 1.35;
      boundaryMultiplier *= 0.9;
      notes.push('Green top assisting seamers');
      break;
    case 'dry':
      turnMultiplier *= 1.25;
      spinWicketMultiplier *= 1.2;
      notes.push('Dry surface offering turn');
      break;
    case 'dusty':
      turnMultiplier *= 1.5;
      spinWicketMultiplier *= 1.45;
      dotBallMultiplier *= 1.2;
      notes.push('Dusty pitch - spinners in paradise!');
      break;
    case 'flat':
      boundaryMultiplier *= 1.2;
      sixMultiplier *= 1.25;
      runScoringMultiplier *= 1.15;
      dotBallMultiplier *= 0.85;
      notes.push('Flat deck - batting paradise');
      break;
    case 'cracked':
      spinWicketMultiplier *= 1.3;
      paceWicketMultiplier *= 1.15;
      extrasMultiplier *= 1.1;
      notes.push('Cracks appearing - variable bounce!');
      break;
    case 'damp':
      seamMultiplier *= 1.3;
      paceWicketMultiplier *= 1.2;
      boundaryMultiplier *= 0.85;
      notes.push('Damp pitch - seam movement early on');
      break;
  }
  
  // Pitch degradation effects
  if (conditions.pitchDegradation > 50) {
    spinWicketMultiplier *= 1.1;
    turnMultiplier *= 1.15;
    notes.push('Pitch wearing - spin coming into play');
  }
  if (conditions.pitchDegradation > 75) {
    spinWicketMultiplier *= 1.15;
    notes.push('Pitch breaking up significantly');
  }
  
  // Boundary size effects
  if (venue.boundarySize === 'small') {
    boundaryMultiplier *= 1.2;
    sixMultiplier *= 1.3;
    notes.push('Short boundaries in play');
  } else if (venue.boundarySize === 'large') {
    boundaryMultiplier *= 0.85;
    sixMultiplier *= 0.8;
    dotBallMultiplier *= 1.1;
    notes.push('Large boundaries testing batsmen');
  }
  
  // Determine advantages
  const battingAdvantage: 'low' | 'medium' | 'high' = 
    runScoringMultiplier > 1.1 || boundaryMultiplier > 1.15 ? 'high' :
    (paceWicketMultiplier > 1.2 || spinWicketMultiplier > 1.2) ? 'low' : 'medium';
    
  const bowlingAdvantage: 'pace' | 'spin' | 'balanced' =
    paceWicketMultiplier > spinWicketMultiplier + 0.15 ? 'pace' :
    spinWicketMultiplier > paceWicketMultiplier + 0.15 ? 'spin' : 'balanced';
  
  return {
    boundaryMultiplier,
    sixMultiplier,
    runScoringMultiplier,
    paceWicketMultiplier,
    spinWicketMultiplier,
    swingMultiplier,
    seamMultiplier,
    turnMultiplier,
    extrasMultiplier,
    dotBallMultiplier,
    battingAdvantage,
    bowlingAdvantage,
    conditionNotes: notes.slice(0, 3) // Limit to 3 most relevant notes
  };
};

// Custom hook for managing match conditions
export const useMatchConditions = (venue: Venue | null) => {
  const [conditions, setConditions] = useState<MatchConditions | null>(null);
  
  const initializeConditions = useCallback(() => {
    if (venue) {
      setConditions(generateInitialConditions(venue));
    }
  }, [venue]);
  
  const updateConditions = useCallback((ballsBowled: number, isSecondInnings: boolean) => {
    if (conditions) {
      setConditions(evolveConditions(conditions, ballsBowled, isSecondInnings));
    }
  }, [conditions]);
  
  const modifiers = useMemo(() => {
    if (conditions && venue) {
      return calculateModifiers(conditions, venue);
    }
    return null;
  }, [conditions, venue]);
  
  return {
    conditions,
    modifiers,
    initializeConditions,
    updateConditions,
    setConditions
  };
};
