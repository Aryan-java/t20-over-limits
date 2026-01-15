// Dynamic weather and pitch conditions that affect gameplay

export type WeatherCondition = 
  | 'sunny'
  | 'partly-cloudy'
  | 'overcast'
  | 'drizzle'
  | 'humid'
  | 'windy'
  | 'dew';

export type PitchCondition = 
  | 'green'      // Fresh pitch, helps pacers
  | 'dry'        // Spin-friendly
  | 'dusty'      // Heavily spin-friendly, variable bounce
  | 'flat'       // Batting paradise
  | 'cracked'    // Unpredictable, helps spinners
  | 'damp';      // Seam movement

export interface MatchConditions {
  weather: WeatherCondition;
  pitch: PitchCondition;
  temperature: number;
  humidity: number;
  windSpeed: 'calm' | 'moderate' | 'gusty' | 'strong';
  dewFactor: number; // 0-100
  pitchDegradation: number; // 0-100, increases as match progresses
  timeOfDay: 'afternoon' | 'evening' | 'night';
}

export interface ConditionModifiers {
  // Batting modifiers
  boundaryMultiplier: number;
  sixMultiplier: number;
  runScoringMultiplier: number;
  
  // Bowling modifiers  
  paceWicketMultiplier: number;
  spinWicketMultiplier: number;
  swingMultiplier: number;
  seamMultiplier: number;
  turnMultiplier: number;
  
  // General modifiers
  extrasMultiplier: number;
  dotBallMultiplier: number;
  
  // Descriptions for UI
  battingAdvantage: 'low' | 'medium' | 'high';
  bowlingAdvantage: 'pace' | 'spin' | 'balanced';
  conditionNotes: string[];
}

export const WEATHER_ICONS: Record<WeatherCondition, string> = {
  'sunny': '☀️',
  'partly-cloudy': '⛅',
  'overcast': '☁️',
  'drizzle': '🌧️',
  'humid': '💧',
  'windy': '💨',
  'dew': '🌙'
};

export const PITCH_ICONS: Record<PitchCondition, string> = {
  'green': '🟢',
  'dry': '🟤',
  'dusty': '🏜️',
  'flat': '📏',
  'cracked': '⚡',
  'damp': '💦'
};

export const WEATHER_DESCRIPTIONS: Record<WeatherCondition, string> = {
  'sunny': 'Clear skies, good visibility',
  'partly-cloudy': 'Some cloud cover, mild swing',
  'overcast': 'Overcast conditions, ball swings',
  'drizzle': 'Light rain, slippery conditions',
  'humid': 'High humidity, reverse swing possible',
  'windy': 'Gusty winds, affects flight',
  'dew': 'Dew settling, ball gets wet'
};

export const PITCH_DESCRIPTIONS: Record<PitchCondition, string> = {
  'green': 'Fresh pitch with grass cover, helps seamers',
  'dry': 'Hard and dry, assists spin bowlers',
  'dusty': 'Rough and dusty, sharp turn expected',
  'flat': 'True surface, good for batting',
  'cracked': 'Cracks developing, variable bounce',
  'damp': 'Moisture present, early seam movement'
};
