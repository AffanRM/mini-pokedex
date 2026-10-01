export const CATALOG_BATCH_SIZE = 100;
export const PAGE_SIZES = [10, 25, 50] as const;
export const STAT_NAMES = [
  'hp',
  'attack',
  'defense',
  'special-attack',
  'special-defense',
  'speed',
] as const;
export type StatName = (typeof STAT_NAMES)[number];
export type SortStat = StatName | 'total';
export const POKEMON_TYPES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const;
