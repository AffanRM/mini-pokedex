import { SortStat, StatName } from '../constants/pokemon.constants';

export interface PokemonModel {
  readonly id: number;
  readonly name: string;
  readonly height: number;
  readonly weight: number;
  readonly types: readonly string[];
  readonly stats: Readonly<Record<StatName, number>>;
  readonly total: number;
  readonly sprite: string | null;
}

export interface AbilityModel {
  readonly name: string;
  readonly effect: string;
  readonly hidden: boolean;
}

export interface PokemonDetailModel extends PokemonModel {
  readonly abilities: readonly AbilityModel[];
}

export interface PokemonControlsModel {
  readonly search: string;
  readonly type: string;
  readonly sort: SortStat;
  readonly direction: 'asc' | 'desc';
  readonly page: number;
  readonly pageSize: 10 | 25 | 50;
}

export interface PokemonPageModel {
  readonly rows: readonly PokemonModel[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly pageCount: number;
}
