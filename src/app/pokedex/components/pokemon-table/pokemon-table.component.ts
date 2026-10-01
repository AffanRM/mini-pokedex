import { TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { SEARCH_DEBOUNCE_MS } from '../../../common/constants/api.constants';
import { AsyncStateComponent } from '../../../common/components/async-state/async-state.component';
import { PokemonSpriteComponent } from '../../../common/components/pokemon-sprite/pokemon-sprite.component';
import { TypeBadgeComponent } from '../../../common/components/type-badge/type-badge.component';
import { LoadStatus } from '../../../common/models/async-state.model';
import { PAGE_SIZES, POKEMON_TYPES, SortStat } from '../../constants/pokemon.constants';
import { STAT_COLUMNS } from '../../constants/stat-columns.constants';
import { PokemonControlsModel, PokemonModel, PokemonPageModel } from '../../models/pokemon.model';

@Component({
  selector: 'app-pokemon-table',
  standalone: true,
  imports: [
    TitleCasePipe,
    ReactiveFormsModule,
    AsyncStateComponent,
    PokemonSpriteComponent,
    TypeBadgeComponent,
  ],
  templateUrl: './pokemon-table.component.html',
  styleUrl: './pokemon-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonTableComponent {
  readonly page = input.required<PokemonPageModel>();
  readonly controls = input.required<PokemonControlsModel>();
  readonly status = input<LoadStatus>('loading');
  readonly error = input<string | null>(null);
  readonly selectedId = input<number | null>(null);
  readonly selected = output<PokemonModel>();
  readonly controlsChanged = output<Partial<PokemonControlsModel>>();
  readonly retry = output<void>();
  readonly search = new FormControl('', { nonNullable: true });
  private readonly searchQuery = computed(() => this.controls().search);
  readonly columns = STAT_COLUMNS;
  readonly types = POKEMON_TYPES;
  readonly pageSizes = PAGE_SIZES;
  readonly skeletonRows = computed(() =>
    Array.from({ length: this.controls().pageSize }, (_, index) => index),
  );
  readonly rangeStart = computed(() =>
    this.page().total ? this.page().page * this.page().pageSize + 1 : 0,
  );
  readonly rangeEnd = computed(() =>
    Math.min((this.page().page + 1) * this.page().pageSize, this.page().total),
  );

  constructor() {
    effect(() => {
      const query = this.searchQuery();
      if (query !== this.search.value) this.search.setValue(query, { emitEvent: false });
    });
    this.search.valueChanges
      .pipe(debounceTime(SEARCH_DEBOUNCE_MS), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((search) => this.controlsChanged.emit({ search }));
  }

  sort(key: SortStat): void {
    const controls = this.controls();
    this.controlsChanged.emit({
      sort: key,
      direction: controls.sort === key && controls.direction === 'desc' ? 'asc' : 'desc',
    });
  }

  changeType(value: string): void {
    this.controlsChanged.emit({ type: value });
  }

  clearFilters(): void {
    this.search.setValue('');
    this.controlsChanged.emit({ search: '', type: '' });
  }

  changePageSize(value: string): void {
    const pageSize = Number(value);
    if (pageSize === 10 || pageSize === 25 || pageSize === 50)
      this.controlsChanged.emit({ pageSize });
  }

  /** Focus the native name button before opening the dialog, so closing restores row focus. */
  selectRow(pokemon: PokemonModel, event: MouseEvent): void {
    (event.currentTarget as HTMLElement).querySelector<HTMLButtonElement>('button')?.focus();
    this.selected.emit(pokemon);
  }
}
