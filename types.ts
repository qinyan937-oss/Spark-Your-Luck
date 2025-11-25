
export interface UserProfile {
  name: string;
  birthDate: string; // YYYY-MM-DD
  mbti?: string; // Optional
}

export interface CelebrityMatch {
  name: string; // Name of the celebrity
  desc: string; // Brief description (e.g. "Gentle Soul", "Pop Icon")
  reason: string; // Romantic/Vibe reason
  romanticVibe: string; // Short keyword e.g. "Soulmate"
}

export interface FortuneResult {
  zodiac: {
    sign: string;
    luckyTrait: string;
    compliment: string;
  };
  astralChart: {
    analysis: string; // Detailed deep analysis paragraph
    planetaryInfluence: string; // e.g. "Venus is shining on you"
    keyAspect: string; // New: e.g. "Sun Trine Jupiter" (太阳拱木星)
    luckyHouse: string; // New: e.g. "5th House" (第五宫-真爱宫)
  };
  chineseZodiac: {
    animal: string;
    secretStrength: string;
    compliment: string;
  };
  tarot: {
    cardName: string;
    meaning: string; // Positive meaning only
    advice: string;
  };
  mbtiAnalysis: {
    type: string;
    superpower: string;
    socialVibe: string;
  };
  constellation: {
    starName: string; // Xingxiu or Western star
    guidance: string;
  };
  luckyItems: {
    color: string;
    number: string;
    item: string;
  };
  celebrityMatch: CelebrityMatch[]; // Array of matches for swiping
  luckyFood: {
    food: string;
    reason: string;
  };
  luckyActivity: {
    action: string;
    benefit: string;
  };
  compatibleAnimal: {
    animal: string;
    trait: string; // e.g. "Chill Capybara"
    reason: string;
  };
  dailyMovie: {
    title: string;
    reason: string;
  };
  dailyMusic: {
    title: string;
    artist: string;
    vibe: string;
  };
  dailyAffirmation: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export enum AppState {
  WELCOME = 'WELCOME',
  VERIFICATION = 'VERIFICATION',
  LOADING = 'LOADING',
  DASHBOARD = 'DASHBOARD',
}
