import { TestBed } from '@angular/core/testing';
import { Subject, firstValueFrom, of, throwError } from 'rxjs';
import { SEARCH_DEBOUNCE_MS } from '../../common/constants/api.constants';
import { AsyncStateModel } from '../../common/models/async-state.model';
import { pokemonFixture } from '../../common/testing/fixtures';
import { ApiError } from '../../core/graphql.service';
import { PokemonModel } from '../models/pokemon.model';
import { PokemonApiService } from '../services/pokemon-api.service';
import { PokemonStore } from './pokemon.store';

describe('PokemonStore', () => {
  const api = { getCatalog$: vi.fn(), getByIds$: vi.fn(), getDetail$: vi.fn(), search$: vi.fn() };
  let store: PokemonStore;
  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: PokemonApiService, useValue: api }] });
    store = TestBed.inject(PokemonStore);
  });
  afterEach(() => vi.useRealTimers());

  it('shares catalog requests and serves successful cached loads without another call', async () => {
    const response = new Subject<readonly PokemonModel[]>();
    api.getCatalog$.mockReturnValue(response);
    const first = firstValueFrom(store.loadCatalog$());
    const second = firstValueFrom(store.loadCatalog$());
    expect(api.getCatalog$).toHaveBeenCalledOnce();
    response.next([pokemonFixture(1)]);
    response.complete();
    expect(await first).toEqual(await second);
    await firstValueFrom(store.loadCatalog$());
    expect(api.getCatalog$).toHaveBeenCalledOnce();
  });

  it('recovers after a failed load and preserves team slot order using cached members', async () => {
    api.getCatalog$
      .mockReturnValueOnce(throwError(() => new ApiError('Offline')))
      .mockReturnValueOnce(of([pokemonFixture(1), pokemonFixture(2)]));
    await expect(firstValueFrom(store.loadCatalog$())).rejects.toThrow('Offline');
    expect((await firstValueFrom(store.state$)).status).toBe('error');
    await firstValueFrom(store.loadCatalog$());
    const members = await firstValueFrom(store.getMembers$([2, 1]));
    expect(members.map((pokemon) => pokemon.id)).toEqual([2, 1]);
    expect(api.getByIds$).not.toHaveBeenCalled();
  });

  it('debounces typeahead, cancels stale requests and keeps listening after an error', () => {
    vi.useFakeTimers();
    const queries = new Subject<string>();
    const stale = new Subject<readonly PokemonModel[]>();
    const active = new Subject<readonly PokemonModel[]>();
    api.search$
      .mockReturnValueOnce(stale)
      .mockReturnValueOnce(active)
      .mockReturnValueOnce(of([pokemonFixture(1)]));
    const values: AsyncStateModel<readonly PokemonModel[]>[] = [];
    const subscription = store.search$(queries).subscribe((state) => values.push(state));
    queries.next('b');
    queries.next('bu');
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
    expect(api.search$).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(api.search$).toHaveBeenCalledWith('bu');
    queries.next('bul');
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    stale.next([pokemonFixture(999)]);
    expect(values.at(-1)?.status).toBe('loading');
    active.error(new ApiError('Offline'));
    expect(values.at(-1)?.status).toBe('error');
    queries.next('bulb');
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    expect(values.at(-1)?.data[0]?.id).toBe(1);
    subscription.unsubscribe();
  });

  it('does not cache a failed detail request, but caches successful details', async () => {
    const detail = { ...pokemonFixture(1), abilities: [] };
    api.getDetail$
      .mockReturnValueOnce(throwError(() => new ApiError('Offline')))
      .mockReturnValueOnce(of(detail));
    await expect(firstValueFrom(store.getDetail$(1))).rejects.toThrow();
    expect(await firstValueFrom(store.getDetail$(1))).toEqual(detail);
    await firstValueFrom(store.getDetail$(1));
    expect(api.getDetail$).toHaveBeenCalledTimes(2);
  });

  it('retries the exact failed autocomplete query without requiring a text change', () => {
    vi.useFakeTimers();
    const queries = new Subject<string>();
    const retries = new Subject<void>();
    api.search$
      .mockReturnValueOnce(throwError(() => new ApiError('Offline')))
      .mockReturnValueOnce(of([pokemonFixture(1, 'bulbasaur')]));
    const values: AsyncStateModel<readonly PokemonModel[]>[] = [];
    const subscription = store.search$(queries, retries).subscribe((value) => values.push(value));
    queries.next('bulba');
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    expect(values.at(-1)?.status).toBe('error');
    retries.next();
    expect(values.at(-1)?.status).toBe('success');
    expect(api.search$.mock.calls.map(([query]) => query)).toEqual(['bulba', 'bulba']);
    subscription.unsubscribe();
  });
});
