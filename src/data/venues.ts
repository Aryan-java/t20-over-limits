export interface Weather {
  matchTime: 'day' | 'day-night' | 'night';
  avgTemperature: number; // in Celsius
  humidity: number; // 0-100
  windSpeed: 'calm' | 'moderate' | 'windy';
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  capacity: number;
  pitchType: 'spin' | 'pace' | 'balanced';
  avgFirstInningsScore: number;
  avgSecondInningsScore: number;
  avgWinBatFirst: number; // percentage
  spinFriendliness: number; // 0-100
  paceFriendliness: number; // 0-100
  dewFactor: number; // 0-100 (higher = more dew in second innings)
  boundarySize: 'small' | 'medium' | 'large';
  weather: Weather;
  imageUrl?: string;
}

// Helper to get bowling recommendation based on venue
export const getBowlingRecommendation = (venue: Venue): { type: 'spin' | 'pace' | 'balanced'; priority: string; description: string } => {
  const spinScore = venue.spinFriendliness;
  const paceScore = venue.paceFriendliness;
  const diff = Math.abs(spinScore - paceScore);
  
  if (diff < 15) {
    return {
      type: 'balanced',
      priority: 'Balanced Attack',
      description: 'Mix of pace and spin recommended. Consider 2 spinners + 3 pacers.'
    };
  } else if (spinScore > paceScore) {
    const intensity = spinScore >= 70 ? 'strongly' : 'slightly';
    return {
      type: 'spin',
      priority: `${intensity === 'strongly' ? 'Spin Priority' : 'Spin Favored'}`,
      description: spinScore >= 70 
        ? 'Load up on spinners! Consider 3 spinners + 2 pacers.'
        : 'Spin has an edge. Consider 2-3 spinners.'
    };
  } else {
    const intensity = paceScore >= 70 ? 'strongly' : 'slightly';
    return {
      type: 'pace',
      priority: `${intensity === 'strongly' ? 'Pace Priority' : 'Pace Favored'}`,
      description: paceScore >= 70 
        ? 'Pacers will dominate! Consider 4 pacers + 1 spinner.'
        : 'Pace has an edge. Consider 3 pacers + 2 spinners.'
    };
  }
};

export const IPL_VENUES: Venue[] = [
  {
    id: 'wankhede',
    name: 'Wankhede Stadium',
    city: 'Mumbai',
    capacity: 33108,
    pitchType: 'balanced',
    avgFirstInningsScore: 175,
    avgSecondInningsScore: 165,
    avgWinBatFirst: 55,
    spinFriendliness: 45,
    paceFriendliness: 65,
    dewFactor: 70,
    boundarySize: 'medium',
    weather: { matchTime: 'night', avgTemperature: 28, humidity: 75, windSpeed: 'moderate' },
  },
  {
    id: 'chinnaswamy',
    name: 'M. Chinnaswamy Stadium',
    city: 'Bengaluru',
    capacity: 40000,
    pitchType: 'pace',
    avgFirstInningsScore: 185,
    avgSecondInningsScore: 175,
    avgWinBatFirst: 48,
    spinFriendliness: 35,
    paceFriendliness: 55,
    dewFactor: 65,
    boundarySize: 'small',
    weather: { matchTime: 'night', avgTemperature: 24, humidity: 55, windSpeed: 'calm' },
  },
  {
    id: 'chepauk',
    name: 'M.A. Chidambaram Stadium',
    city: 'Chennai',
    capacity: 50000,
    pitchType: 'spin',
    avgFirstInningsScore: 165,
    avgSecondInningsScore: 155,
    avgWinBatFirst: 58,
    spinFriendliness: 80,
    paceFriendliness: 35,
    dewFactor: 75,
    boundarySize: 'large',
    weather: { matchTime: 'night', avgTemperature: 32, humidity: 80, windSpeed: 'moderate' },
  },
  {
    id: 'eden',
    name: 'Eden Gardens',
    city: 'Kolkata',
    capacity: 68000,
    pitchType: 'balanced',
    avgFirstInningsScore: 170,
    avgSecondInningsScore: 160,
    avgWinBatFirst: 52,
    spinFriendliness: 55,
    paceFriendliness: 50,
    dewFactor: 80,
    boundarySize: 'medium',
    weather: { matchTime: 'night', avgTemperature: 30, humidity: 70, windSpeed: 'calm' },
  },
  {
    id: 'feroz-shah',
    name: 'Arun Jaitley Stadium',
    city: 'Delhi',
    capacity: 41820,
    pitchType: 'balanced',
    avgFirstInningsScore: 175,
    avgSecondInningsScore: 168,
    avgWinBatFirst: 50,
    spinFriendliness: 50,
    paceFriendliness: 55,
    dewFactor: 60,
    boundarySize: 'medium',
    weather: { matchTime: 'day-night', avgTemperature: 35, humidity: 45, windSpeed: 'windy' },
  },
  {
    id: 'rajiv-gandhi',
    name: 'Rajiv Gandhi Intl. Stadium',
    city: 'Hyderabad',
    capacity: 55000,
    pitchType: 'pace',
    avgFirstInningsScore: 180,
    avgSecondInningsScore: 170,
    avgWinBatFirst: 54,
    spinFriendliness: 40,
    paceFriendliness: 70,
    dewFactor: 55,
    boundarySize: 'large',
    weather: { matchTime: 'night', avgTemperature: 29, humidity: 50, windSpeed: 'calm' },
  },
  {
    id: 'sawai-mansingh',
    name: 'Sawai Mansingh Stadium',
    city: 'Jaipur',
    capacity: 30000,
    pitchType: 'spin',
    avgFirstInningsScore: 168,
    avgSecondInningsScore: 158,
    avgWinBatFirst: 56,
    spinFriendliness: 70,
    paceFriendliness: 40,
    dewFactor: 50,
    boundarySize: 'medium',
    weather: { matchTime: 'night', avgTemperature: 33, humidity: 35, windSpeed: 'moderate' },
  },
  {
    id: 'mohali',
    name: 'Punjab Cricket Assoc. Stadium',
    city: 'Mohali',
    capacity: 26000,
    pitchType: 'pace',
    avgFirstInningsScore: 178,
    avgSecondInningsScore: 165,
    avgWinBatFirst: 52,
    spinFriendliness: 35,
    paceFriendliness: 75,
    dewFactor: 45,
    boundarySize: 'medium',
    weather: { matchTime: 'day-night', avgTemperature: 28, humidity: 40, windSpeed: 'windy' },
  },
  {
    id: 'narendra-modi',
    name: 'Narendra Modi Stadium',
    city: 'Ahmedabad',
    capacity: 132000,
    pitchType: 'balanced',
    avgFirstInningsScore: 172,
    avgSecondInningsScore: 165,
    avgWinBatFirst: 51,
    spinFriendliness: 55,
    paceFriendliness: 55,
    dewFactor: 40,
    boundarySize: 'large',
    weather: { matchTime: 'night', avgTemperature: 31, humidity: 45, windSpeed: 'calm' },
  },
  {
    id: 'brabourne',
    name: 'Brabourne Stadium',
    city: 'Mumbai',
    capacity: 20000,
    pitchType: 'pace',
    avgFirstInningsScore: 172,
    avgSecondInningsScore: 168,
    avgWinBatFirst: 48,
    spinFriendliness: 40,
    paceFriendliness: 65,
    dewFactor: 65,
    boundarySize: 'small',
    weather: { matchTime: 'night', avgTemperature: 27, humidity: 72, windSpeed: 'moderate' },
  },
  {
    id: 'dy-patil',
    name: 'DY Patil Stadium',
    city: 'Navi Mumbai',
    capacity: 55000,
    pitchType: 'balanced',
    avgFirstInningsScore: 170,
    avgSecondInningsScore: 165,
    avgWinBatFirst: 50,
    spinFriendliness: 50,
    paceFriendliness: 55,
    dewFactor: 70,
    boundarySize: 'large',
    weather: { matchTime: 'night', avgTemperature: 26, humidity: 68, windSpeed: 'calm' },
  },
  {
    id: 'greenfield',
    name: 'Greenfield Intl. Stadium',
    city: 'Thiruvananthapuram',
    capacity: 55000,
    pitchType: 'balanced',
    avgFirstInningsScore: 165,
    avgSecondInningsScore: 158,
    avgWinBatFirst: 53,
    spinFriendliness: 50,
    paceFriendliness: 50,
    dewFactor: 75,
    boundarySize: 'medium',
    weather: { matchTime: 'night', avgTemperature: 29, humidity: 85, windSpeed: 'moderate' },
  },
];

export const getRandomVenue = (): Venue => {
  return IPL_VENUES[Math.floor(Math.random() * IPL_VENUES.length)];
};

export const getVenueById = (id: string): Venue | undefined => {
  return IPL_VENUES.find(v => v.id === id);
};
