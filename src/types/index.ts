export interface SkillsetRatings {
  overall: number;
  stream: number;
  jumpstream: number;
  handstream: number;
  stamina: number;
  jacks: number;
  chordjacks: number;
  technical: number;
}

export interface UserData {
  username: string;
  avatar_url: string;
  country_code: string;
  player_rating: number;
  rank: number;
  rating: SkillsetRatings;
}

export interface UserRanks {
  overall: number;
  stream: number;
  jumpstream: number;
  handstream: number;
  stamina: number;
  jacks: number;
  chordjacks: number;
  technical: number;
}

export interface DataSnapshot {
  timestamp: number; // Unix ms
  userData: UserData;
  userRanks: UserRanks;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  rating: number;
  avatar?: string;
  country?: string;
}

export interface PackSong {
  id: number;
  name: string;
  artist?: string;
  chartkey: string;
  msd: number;
  wifeScore?: number; // 0-100, undefined if not played
}

export interface TrackedPack {
  id: number;
  name: string;
  songs: PackSong[];
  packOverall: number; // overall MSD from the API
  addedAt: number;
  lastFetched: number;
}

export type SkillsetKey = keyof SkillsetRatings;
export type TimeRange = '1d' | '7d' | '30d' | '90d' | 'all';

export const SKILLSET_COLORS: Record<SkillsetKey, string> = {
  overall:    '#7C3AED',
  stream:     '#3B82F6',
  jumpstream: '#8B5CF6',
  handstream: '#EC4899',
  stamina:    '#F59E0B',
  jacks:      '#10B981',
  chordjacks: '#EF4444',
  technical:  '#6366F1',
};

export const SKILLSET_LABELS: Record<SkillsetKey, string> = {
  overall:    'Overall',
  stream:     'Stream',
  jumpstream: 'Jumpstream',
  handstream: 'Handstream',
  stamina:    'Stamina',
  jacks:      'Jackspeed',
  chordjacks: 'Chordjacks',
  technical:  'Technical',
};

export const ALL_SKILLSETS: SkillsetKey[] = [
  'overall', 'stream', 'jumpstream', 'handstream',
  'stamina', 'jacks', 'chordjacks', 'technical',
];
