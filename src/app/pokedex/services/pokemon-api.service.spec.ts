import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { pokemonFixture } from '../../common/testing/fixtures';
import { GraphqlService } from '../../core/graphql.service';
import { CATALOG_BATCH_SIZE } from '../constants/pokemon.constants';
import { PokemonResponseModel } from '../models/pokemon-response.model';
import { mapPokemon } from '../utils/map-pokemon.util';
import { PokemonApiService } from './pokemon-api.service';

describe('PokemonApiService', () => {
  it('fetches all pages rather than exposing the first batch as a complete catalog', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: GraphqlService, useValue: {} }] });
    const api = TestBed.inject(PokemonApiService);
    const page = Array.from({ length: CATALOG_BATCH_SIZE }, (_, index) =>
      pokemonFixture(index + 1),
    );
    const getPage = vi
      .spyOn(api, 'getPage$')
      .mockReturnValueOnce(of(page))
      .mockReturnValueOnce(of([pokemonFixture(101)]));
    const catalog = await firstValueFrom(api.getCatalog$());
    expect(catalog).toHaveLength(101);
    expect(getPage.mock.calls).toEqual([
      [100, 0],
      [100, 100],
    ]);
  });

  it('maps physical units, totals and serialized sprites while tolerating invalid sprite JSON', () => {
    const raw: PokemonResponseModel = {
      id: 1,
      name: 'bulbasaur',
      height: 7,
      weight: 69,
      pokemon_v2_pokemontypes: [{ pokemon_v2_type: { name: 'grass' } }],
      pokemon_v2_pokemonstats: [{ base_stat: 45, pokemon_v2_stat: { name: 'hp' } }],
      pokemon_v2_pokemonsprites: [{ sprites: '{"front_default":"https://example.com/1.png"}' }],
    };
    const mapped = mapPokemon(raw);
    expect(mapped.height).toBe(0.7);
    expect(mapped.weight).toBe(6.9);
    expect(mapped.total).toBe(45);
    expect(mapped.sprite).toBe('https://example.com/1.png');
    expect(
      mapPokemon({ ...raw, pokemon_v2_pokemonsprites: [{ sprites: 'broken' }] }).sprite,
    ).toBeNull();
  });
});
