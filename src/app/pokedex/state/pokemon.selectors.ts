import { Observable, combineLatest, distinctUntilChanged, map, shareReplay } from 'rxjs';
import { PokemonControlsModel, PokemonModel, PokemonPageModel } from '../models/pokemon.model';
import { PokemonStateModel } from '../models/pokemon-state.model';

function sameRows(left: readonly PokemonModel[], right: readonly PokemonModel[]): boolean {
  return left.length === right.length && left.every((row, index) => row === right[index]);
}

/** Derive global filtering, stable stat sorting and clamped client-side pages. */
export function createPokemonSelectors(
  state$: Observable<PokemonStateModel>,
  controls$: Observable<PokemonControlsModel>,
) {
  const filtered$ = combineLatest([state$, controls$]).pipe(
    map(([state, controls]) => {
      const query = controls.search.trim().toLowerCase();
      return state.data.filter(
        (pokemon) =>
          pokemon.name.includes(query) && (!controls.type || pokemon.types.includes(controls.type)),
      );
    }),
    distinctUntilChanged(sameRows),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  const sorted$ = combineLatest([filtered$, controls$]).pipe(
    map(([rows, controls]) =>
      [...rows].sort((left, right) => {
        const difference =
          controls.sort === 'total'
            ? left.total - right.total
            : left.stats[controls.sort] - right.stats[controls.sort];
        return difference * (controls.direction === 'asc' ? 1 : -1) || left.id - right.id;
      }),
    ),
    distinctUntilChanged(sameRows),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  const page$ = combineLatest([sorted$, controls$]).pipe(
    map(([rows, controls]): PokemonPageModel => {
      const pageCount = Math.max(1, Math.ceil(rows.length / controls.pageSize));
      const page = Math.min(Math.max(0, controls.page), pageCount - 1);
      return {
        rows: rows.slice(page * controls.pageSize, (page + 1) * controls.pageSize),
        total: rows.length,
        page,
        pageSize: controls.pageSize,
        pageCount,
      };
    }),
    distinctUntilChanged(
      (left, right) =>
        left.page === right.page &&
        left.total === right.total &&
        left.pageSize === right.pageSize &&
        sameRows(left.rows, right.rows),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  return { filtered$, sorted$, page$ };
}
