import { STAT_NAMES, StatName } from '../constants/pokemon.constants';
import { PokemonModel } from '../models/pokemon.model';
import { PokemonResponseModel } from '../models/pokemon-response.model';

function spriteUrl(value: unknown): string | null {
  try {
    const parsed: unknown = typeof value === 'string' ? JSON.parse(value) : value;
    if (!parsed || typeof parsed !== 'object') return null;
    const sprites = parsed as Record<string, unknown>;
    const other = sprites['other'] as Record<string, unknown> | undefined;
    const artwork = other?.['official-artwork'] as Record<string, unknown> | undefined;
    const url = artwork?.['front_default'] ?? sprites['front_default'];
    return typeof url === 'string' && url.startsWith('https://') ? url : null;
  } catch {
    return null;
  }
}

/** Convert API units and nested records to a stable domain model. */
export function mapPokemon(value: PokemonResponseModel): PokemonModel {
  const stats = Object.fromEntries(
    STAT_NAMES.map((name) => [
      name,
      value.pokemon_v2_pokemonstats.find((stat) => stat.pokemon_v2_stat.name === name)?.base_stat ??
        0,
    ]),
  ) as Record<StatName, number>;
  return {
    id: value.id,
    name: value.name,
    height: value.height / 10,
    weight: value.weight / 10,
    types: value.pokemon_v2_pokemontypes.map((type) => type.pokemon_v2_type.name),
    stats,
    total: Object.values(stats).reduce((sum, stat) => sum + stat, 0),
    sprite: spriteUrl(value.pokemon_v2_pokemonsprites[0]?.sprites),
  };
}
