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
  imageUrl?: string;
}

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
  },
];

export const getRandomVenue = (): Venue => {
  return IPL_VENUES[Math.floor(Math.random() * IPL_VENUES.length)];
};

export const getVenueById = (id: string): Venue | undefined => {
  return IPL_VENUES.find(v => v.id === id);
};
