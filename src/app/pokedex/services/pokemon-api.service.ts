import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, expand, forkJoin, map, reduce } from 'rxjs';
import { POKEMON_API_URL } from '../../common/constants/api.constants';
import { GraphqlService } from '../../core/graphql.service';
import { CATALOG_BATCH_SIZE } from '../constants/pokemon.constants';
import { PokemonDetailModel, PokemonModel } from '../models/pokemon.model';
import { AbilityQueryModel, PokemonQueryModel } from '../models/pokemon-response.model';
import { mapPokemon } from '../utils/map-pokemon.util';
import {
  POKEMON_ABILITIES_QUERY,
  POKEMON_BY_IDS_QUERY,
  POKEMON_LIST_QUERY,
  POKEMON_SEARCH_QUERY,
} from './pokemon.queries';

@Injectable({ providedIn: 'root' })
export class PokemonApiService {
  private readonly graphql = inject(GraphqlService);

  /** Fetch a stable upstream page, including types, stats and sprites. */
  getPage$(limit: number, offset: number): Observable<readonly PokemonModel[]> {
    return this.graphql
      .request$<PokemonQueryModel>(POKEMON_API_URL, POKEMON_LIST_QUERY, { limit, offset }, true)
      .pipe(map((data) => data.pokemon_v2_pokemon.map(mapPokemon)));
  }

  /** Fetch every upstream page before enabling global client-side sorting/paging. */
  getCatalog$(): Observable<readonly PokemonModel[]> {
    return this.getPage$(CATALOG_BATCH_SIZE, 0).pipe(
      expand((page, index) =>
        page.length === CATALOG_BATCH_SIZE
          ? this.getPage$(CATALOG_BATCH_SIZE, (index + 1) * CATALOG_BATCH_SIZE)
          : EMPTY,
      ),
      reduce((catalog, page) => [...catalog, ...page], [] as readonly PokemonModel[]),
    );
  }

  /** Fetch uncached team members in one query. A missing ID is absent from the result. */
  getByIds$(ids: readonly number[]): Observable<readonly PokemonModel[]> {
    return this.graphql
      .request$<PokemonQueryModel>(POKEMON_API_URL, POKEMON_BY_IDS_QUERY, { ids }, true)
      .pipe(map((data) => data.pokemon_v2_pokemon.map(mapPokemon)));
  }

  /** Search names for autocomplete while the complete catalog is unavailable. */
  search$(name: string): Observable<readonly PokemonModel[]> {
    const escaped = name.replace(/[\\%_]/g, (character) => `\\${character}`);
    return this.graphql
      .request$<PokemonQueryModel>(
        POKEMON_API_URL,
        POKEMON_SEARCH_QUERY,
        { name: `%${escaped}%` },
        true,
      )
      .pipe(map((data) => data.pokemon_v2_pokemon.map(mapPokemon)));
  }

  /** Load one Pokemon plus English ability descriptions; null denotes a missing ID. */
  getDetail$(id: number): Observable<PokemonDetailModel | null> {
    return forkJoin({
      pokemon: this.getByIds$([id]),
      abilities: this.graphql.request$<AbilityQueryModel>(
        POKEMON_API_URL,
        POKEMON_ABILITIES_QUERY,
        { pokemonId: id },
        true,
      ),
    }).pipe(
      map(({ pokemon, abilities }) =>
        pokemon[0]
          ? {
              ...pokemon[0],
              abilities: abilities.pokemon_v2_pokemonability.map((ability) => ({
                name: ability.pokemon_v2_ability.name,
                hidden: ability.is_hidden,
                effect:
                  ability.pokemon_v2_ability.pokemon_v2_abilityeffecttexts[0]?.short_effect ??
                  'No English description is available.',
              })),
            }
          : null,
      ),
    );
  }
}
