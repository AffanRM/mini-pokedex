import { SortStat } from './pokemon.constants';

export const STAT_COLUMNS: readonly { readonly key: SortStat; readonly label: string }[] = [
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: 'Attack' },
  { key: 'defense', label: 'Defense' },
  { key: 'special-attack', label: 'Sp. Atk' },
  { key: 'special-defense', label: 'Sp. Def' },
  { key: 'speed', label: 'Speed' },
  { key: 'total', label: 'Total' },
];
