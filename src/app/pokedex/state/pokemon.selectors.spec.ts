import { BehaviorSubject } from 'rxjs';
import { pokemonFixture } from '../../common/testing/fixtures';
import { PokemonControlsModel, PokemonPageModel } from '../models/pokemon.model';
import { PokemonStateModel } from '../models/pokemon-state.model';
import { createPokemonSelectors } from './pokemon.selectors';

describe('Pokemon selectors', () => {
  it('combines name/type filters, descending total sorting and page clamping without mutating source', () => {
    const rows = [
      pokemonFixture(1, 'bulbasaur', 318),
      pokemonFixture(2, 'ivysaur', 405),
      { ...pokemonFixture(3, 'venusaur', 525), types: ['poison'] },
    ];
    const state = new BehaviorSubject<PokemonStateModel>({
      status: 'success',
      data: rows,
      error: null,
      entities: {},
    });
    const controls = new BehaviorSubject<PokemonControlsModel>({
      search: 'SAUR',
      type: 'grass',
      sort: 'total',
      direction: 'desc',
      page: 99,
      pageSize: 10,
    });
    let page!: PokemonPageModel;
    const subscription = createPokemonSelectors(state, controls).page$.subscribe((value) => {
      page = value;
    });
    expect(page.rows.map((row) => row.id)).toEqual([2, 1]);
    expect(page.page).toBe(0);
    expect(page.total).toBe(2);
    expect(rows.map((row) => row.id)).toEqual([1, 2, 3]);
    controls.next({ ...controls.value, search: 'no-matches' });
    expect(page.rows).toEqual([]);
    expect(page.pageCount).toBe(1);
    subscription.unsubscribe();
  });

  it('sorts a stat ascending with deterministic ID ties across client pages', () => {
    const rows = Array.from({ length: 12 }, (_, index) => pokemonFixture(12 - index));
    const state = new BehaviorSubject<PokemonStateModel>({
      status: 'success',
      data: rows,
      error: null,
      entities: {},
    });
    const controls = new BehaviorSubject<PokemonControlsModel>({
      search: '',
      type: '',
      sort: 'attack',
      direction: 'asc',
      page: 1,
      pageSize: 10,
    });
    let page!: PokemonPageModel;
    const subscription = createPokemonSelectors(state, controls).page$.subscribe((value) => {
      page = value;
    });
    expect(page.rows.map((row) => row.id)).toEqual([11, 12]);
    expect(page.total).toBe(12);
    subscription.unsubscribe();
  });
});
