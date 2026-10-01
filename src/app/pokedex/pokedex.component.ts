import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, catchError, of, startWith, switchMap } from 'rxjs';
import { PokemonDetailComponent } from './components/pokemon-detail/pokemon-detail.component';
import { PokemonTableComponent } from './components/pokemon-table/pokemon-table.component';
import { PokemonModel } from './models/pokemon.model';
import { PokemonStore } from './state/pokemon.store';

@Component({
  selector: 'app-pokedex-page',
  standalone: true,
  imports: [PokemonTableComponent, PokemonDetailComponent],
  templateUrl: './pokedex.component.html',
  styleUrl: './pokedex.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokedexPage {
  readonly store = inject(PokemonStore);
  readonly state = toSignal(this.store.state$, { requireSync: true });
  readonly controls = toSignal(this.store.controls$, { requireSync: true });
  readonly page = toSignal(this.store.selectors.page$, { requireSync: true });
  readonly sortedPokemon = toSignal(this.store.selectors.sorted$, { requireSync: true });
  readonly selectedPokemon = signal<PokemonModel | null>(null);
  readonly panelOpen = signal(false);
  readonly isLoading = computed(
    () => this.state().status === 'idle' || this.state().status === 'loading',
  );
  readonly selectedIndex = computed(() =>
    this.sortedPokemon().findIndex((pokemon) => pokemon.id === this.selectedPokemon()?.id),
  );
  readonly previousId = computed(() =>
    this.selectedIndex() > 0 ? this.sortedPokemon()[this.selectedIndex() - 1].id : null,
  );
  readonly nextId = computed(() =>
    this.selectedIndex() >= 0 && this.selectedIndex() + 1 < this.sortedPokemon().length
      ? this.sortedPokemon()[this.selectedIndex() + 1].id
      : null,
  );
  private readonly loadRequests = new Subject<boolean>();
  private readonly loadAction = toSignal(
    this.loadRequests.pipe(
      startWith(false),
      switchMap((force) => this.store.loadCatalog$(force).pipe(catchError(() => of(null)))),
    ),
  );

  select(pokemon: PokemonModel): void {
    this.selectedPokemon.set(pokemon);
    this.panelOpen.set(true);
  }
  navigate(id: number): void {
    const pokemon = this.sortedPokemon().find((item) => item.id === id);
    if (pokemon) this.selectedPokemon.set(pokemon);
  }
  closePanel(): void {
    this.panelOpen.set(false);
    this.selectedPokemon.set(null);
  }
  refresh(): void {
    this.loadRequests.next(true);
  }
}
