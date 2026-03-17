export interface Division {
  name: string;
  color: string;
  textColor: string; // for contrast on dark bg
  rangeMin: number;
  rangeMax: number | null; // null = open ended
  subRankBase: number;     // floor(rating) - subRankBase = 0-indexed sub rank
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V'] as const;

const DIVISIONS: Division[] = [
  { name: 'Chocolate',          color: '#4F3F3B', textColor: '#c4a99e', rangeMin: 0,  rangeMax: 4,  subRankBase: 1  },
  { name: 'Bronze',             color: '#815E2F', textColor: '#d4a96a', rangeMin: 5,  rangeMax: 8,  subRankBase: 5  },
  { name: 'Silver',             color: '#A7A9AB', textColor: '#d4d6d8', rangeMin: 9,  rangeMax: 12, subRankBase: 9  },
  { name: 'Gold',               color: '#BDA360', textColor: '#e8ca85', rangeMin: 13, rangeMax: 16, subRankBase: 13 },
  { name: 'Platinum',           color: '#D8CA9F', textColor: '#ede4c8', rangeMin: 17, rangeMax: 20, subRankBase: 17 },
  { name: 'Emerald',            color: '#009572', textColor: '#00d4a0', rangeMin: 21, rangeMax: 24, subRankBase: 21 },
  { name: 'Diamond',            color: '#A2C8DB', textColor: '#c8e4f0', rangeMin: 25, rangeMax: 28, subRankBase: 25 },
  { name: 'Master',             color: '#0E0E0E', textColor: '#9b7fd4', rangeMin: 29, rangeMax: 32, subRankBase: 29 },
  { name: 'GrandMaster',        color: '#830016', textColor: '#ff4466', rangeMin: 33, rangeMax: 36, subRankBase: 33 },
  { name: 'TrueLastBoss',       color: '#830016', textColor: '#ff6680', rangeMin: 37, rangeMax: 40, subRankBase: 37 },
  { name: 'Undefined Fantastic Object', color: '#292A35', textColor: '#a0a8ff', rangeMin: 40, rangeMax: null, subRankBase: 40 },
];

export interface DivisionResult {
  division: Division;
  subRank: string;      // 'I', 'II', 'III', 'IV'
  fullName: string;     // 'Gold III'
  rating: number;
}

export function getDivision(rating: number): DivisionResult {
  const floor = Math.floor(rating);
  const div = DIVISIONS.find(d =>
    floor >= d.rangeMin && (d.rangeMax === null || floor <= d.rangeMax)
  ) ?? DIVISIONS[0];

  // Open-ended (UFO/Alien) has no sub-rank
  if (div.rangeMax === null) {
    return { division: div, subRank: '', fullName: div.name, rating };
  }

  const idx = Math.max(0, floor - div.subRankBase);
  const subRank = ROMAN[Math.min(idx, ROMAN.length - 1)];
  const fullName = `${div.name} ${subRank}`;

  return { division: div, subRank, fullName, rating };
}
