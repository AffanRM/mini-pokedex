import { Injectable, inject } from '@angular/core';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  catchError,
  debounceTime,
  defer,
  distinctUntilChanged,
  finalize,
  map,
  merge,
  of,
  shareReplay,
  startWith,
  switchMap,
  tap,
  throwError,
  withLatestFrom,
} from 'rxjs';
import { SEARCH_DEBOUNCE_MS } from '../../common/constants/api.constants';
import { AsyncStateModel } from '../../common/models/async-state.model';
import { errorMessage } from '../../common/utils/error-message.util';
import { ApiError } from '../../core/graphql.service';
import { SEARCH_CACHE_LIMIT } from '../constants/pokemon.constants';
import { PokemonControlsModel, PokemonDetailModel, PokemonModel } from '../models/pokemon.model';
import { PokemonStateModel } from '../models/pokemon-state.model';
import { PokemonApiService } from '../services/pokemon-api.service';
import { createPokemonSelectors } from './pokemon.selectors';

@Injectable({ providedIn: 'root' })
export class PokemonStore {
  private readonly api = inject(PokemonApiService);
  private readonly stateSubject = new BehaviorSubject<PokemonStateModel>({
    status: 'idle',
    data: [],
    error: null,
    entities: {},
  });
  private readonly controlsSubject = new BehaviorSubject<PokemonControlsModel>({
    search: '',
    type: '',
    sort: 'total',
    direction: 'desc',
    page: 0,
    pageSize: 10,
  });
  private catalogRequest?: Observable<readonly PokemonModel[]>;
  private readonly searchResults = new Map<string, readonly PokemonModel[]>();
  private readonly details = new Map<number, PokemonDetailModel>();
  private readonly detailRequests = new Map<number, Observable<PokemonDetailModel | null>>();

  readonly state$ = this.stateSubject.asObservable();
  readonly controls$ = this.controlsSubject.asObservable();
  readonly selectors = createPokemonSelectors(this.state$, this.controls$);

  /** Load/cache the complete catalog; force refresh retains old data only as stale state. */
  loadCatalog$(force = false): Observable<readonly PokemonModel[]> {
    return defer(() => {
      if (this.catalogRequest) return this.catalogRequest;
      if (!force && this.stateSubject.value.status === 'success')
        return of(this.stateSubject.value.data);
      this.catalogRequest = defer(() => {
        this.patch({ status: 'loading', error: null });
        return this.api.getCatalog$();
      }).pipe(
        tap((data) => {
          this.searchResults.clear();
          this.cache(data);
          this.patch({ status: 'success', data, error: null });
        }),
        catchError((error: unknown) => {
          this.patch({ status: 'error', error: errorMessage(error) });
          return throwError(() => error);
        }),
        finalize(() => {
          this.catalogRequest = undefined;
          if (this.stateSubject.value.status === 'loading') this.patch({ status: 'idle' });
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
      return this.catalogRequest;
    });
  }

  /** Update table controls and reset pagination whenever the result set/order changes. */
  updateControls(patch: Partial<PokemonControlsModel>): void {
    const resetPage =
      patch.search !== undefined ||
      patch.type !== undefined ||
      patch.sort !== undefined ||
      patch.direction !== undefined ||
      patch.pageSize !== undefined;
    this.controlsSubject.next({
      ...this.controlsSubject.value,
      ...patch,
      page: resetPage ? 0 : (patch.page ?? this.controlsSubject.value.page),
    });
  }

  /** Debounce/cancel typeahead, reuse successful queries and keep errors recoverable. */
  search$(
    queries$: Observable<string>,
    retries$: Observable<void> = EMPTY,
  ): Observable<AsyncStateModel<readonly PokemonModel[]>> {
    const debouncedQuery$ = queries$.pipe(
      map((query) => query.trim().toLowerCase()),
      debounceTime(SEARCH_DEBOUNCE_MS),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    return merge(
      debouncedQuery$,
      retries$.pipe(
        withLatestFrom(debouncedQuery$),
        map(([, query]) => query),
      ),
    ).pipe(
      switchMap((query) =>
        defer(() => {
          if (this.stateSubject.value.status === 'success') {
            return of(
              this.stateSubject.value.data
                .filter((pokemon) => pokemon.name.includes(query))
                .slice(0, 20),
            );
          }
          const cached = this.searchResults.get(query);
          if (cached !== undefined) return of(cached);
          return this.api.search$(query);
        }).pipe(
          tap((data) => {
            this.cache(data);
            this.searchResults.delete(query);
            this.searchResults.set(query, data);
            if (this.searchResults.size > SEARCH_CACHE_LIMIT) {
              const oldest = this.searchResults.keys().next().value;
              if (oldest !== undefined) this.searchResults.delete(oldest);
            }
          }),
          map((data): AsyncStateModel<readonly PokemonModel[]> => ({
            status: 'success',
            data,
            error: null,
          })),
          startWith({ status: 'loading', data: [], error: null } as AsyncStateModel<
            readonly PokemonModel[]
          >),
          catchError((error: unknown) =>
            of({ status: 'error' as const, data: [], error: errorMessage(error) }),
          ),
        ),
      ),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  /** Hydrate a team's members in original slot order, requesting only uncached IDs. */
  getMembers$(ids: readonly number[]): Observable<readonly PokemonModel[]> {
    return defer(() => {
      const missing = [...new Set(ids)].filter((id) => !this.stateSubject.value.entities[id]);
      return (missing.length ? this.api.getByIds$(missing) : of([])).pipe(
        tap((data) => this.cache(data)),
        map(() =>
          ids.map((id) => {
            const pokemon = this.stateSubject.value.entities[id];
            if (!pokemon) throw new ApiError('A team member could not be found. Please try again.');
            return pokemon;
          }),
        ),
      );
    });
  }

  /** Cache successful details and share in-flight reads; cancellation never poisons the cache. */
  getDetail$(id: number): Observable<PokemonDetailModel | null> {
    return defer(() => {
      const cached = this.details.get(id);
      if (cached) return of(cached);
      const existing = this.detailRequests.get(id);
      if (existing) return existing;
      const request = this.api.getDetail$(id).pipe(
        tap((detail) => {
          if (detail) {
            this.details.set(id, detail);
            this.cache([detail]);
          }
        }),
        finalize(() => this.detailRequests.delete(id)),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
      this.detailRequests.set(id, request);
      return request;
    });
  }

  private cache(pokemon: readonly PokemonModel[]): void {
    this.patch({
      entities: {
        ...this.stateSubject.value.entities,
        ...Object.fromEntries(pokemon.map((item) => [item.id, item])),
      },
    });
  }

  private patch(patch: Partial<PokemonStateModel>): void {
    this.stateSubject.next({ ...this.stateSubject.value, ...patch });
  }
}
