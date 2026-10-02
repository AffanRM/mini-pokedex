import { TitleCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, startWith, tap } from 'rxjs';
import { AsyncStateComponent } from '../../../common/components/async-state/async-state.component';
import { PokemonSpriteComponent } from '../../../common/components/pokemon-sprite/pokemon-sprite.component';
import { TypeBadgeComponent } from '../../../common/components/type-badge/type-badge.component';
import { PokemonModel } from '../../../pokedex/models/pokemon.model';
import { PokemonStore } from '../../../pokedex/state/pokemon.store';
import { TEAM_MAX_SIZE } from '../../constants/team.constants';

@Component({
  selector: 'app-pokemon-picker',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TitleCasePipe,
    AsyncStateComponent,
    PokemonSpriteComponent,
    TypeBadgeComponent,
  ],
  templateUrl: './pokemon-picker.component.html',
  styleUrl: './pokemon-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonPickerComponent {
  readonly selected = input<readonly PokemonModel[]>([]);
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly selectedChanged = output<readonly PokemonModel[]>();
  readonly touched = output<void>();
  readonly search = new FormControl('', { nonNullable: true });
  readonly open = signal(false);
  readonly activeIndex = signal(0);
  readonly limit = TEAM_MAX_SIZE;
  private readonly store = inject(PokemonStore);
  private readonly popup = viewChild<ElementRef<HTMLElement>>('popup');
  private readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly retries = new Subject<void>();
  private readonly requestedQuery = signal('');
  readonly query = toSignal(this.search.valueChanges.pipe(startWith('')), { initialValue: '' });
  readonly state = toSignal(
    this.store.search$(this.search.valueChanges.pipe(startWith('')), this.retries).pipe(
      tap((state) => {
        if (state.status === 'loading')
          this.requestedQuery.set(this.search.value.trim().toLowerCase());
      }),
    ),
    { initialValue: { status: 'idle' as const, data: [] as readonly PokemonModel[], error: null } },
  );
  readonly available = computed(() =>
    this.state().data.filter((pokemon) => !this.selected().some((pick) => pick.id === pokemon.id)),
  );
  readonly status = computed(() => {
    if (
      this.query().trim().toLowerCase() !== this.requestedQuery() ||
      this.state().status === 'idle'
    )
      return 'loading';
    return this.state().status === 'success' && !this.available().length
      ? 'empty'
      : this.state().status;
  });
  readonly activeId = computed(() =>
    this.selected().length < this.limit &&
    this.status() === 'success' &&
    this.available()[this.activeIndex()]
      ? `pokemon-option-${this.available()[this.activeIndex()].id}`
      : null,
  );

  constructor() {
    effect(() => {
      if (this.disabled()) this.search.disable({ emitEvent: false });
      else this.search.enable({ emitEvent: false });
    });
    effect(() => {
      this.query();
      this.activeIndex.set(0);
    });
  }

  pick(pokemon: PokemonModel): void {
    if (
      this.disabled() ||
      this.selected().length >= this.limit ||
      this.selected().some((pick) => pick.id === pokemon.id)
    )
      return;
    this.selectedChanged.emit([...this.selected(), pokemon]);
    this.search.setValue('');
    this.touched.emit();
    this.inputElement()?.nativeElement.focus();
    this.open.set(false);
  }
  remove(id: number): void {
    if (this.disabled()) return;
    this.selectedChanged.emit(this.selected().filter((pokemon) => pokemon.id !== id));
    this.touched.emit();
    this.inputElement()?.nativeElement.focus();
    this.open.set(false);
  }
  onFocus(): void {
    this.open.set(true);
  }
  onInput(): void {
    // A pick keeps input focus while closing results; typing must reopen them.
    if (!this.disabled()) this.open.set(true);
  }
  onBlur(event: FocusEvent): void {
    if (!this.popup()?.nativeElement.contains(event.relatedTarget as Node | null)) {
      this.open.set(false);
      this.touched.emit();
    }
  }
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.open.set(false);
      event.preventDefault();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.open.set(true);
      const count = this.available().length;
      if (count)
        this.activeIndex.update(
          (index) => (index + (event.key === 'ArrowDown' ? 1 : -1) + count) % count,
        );
      this.popup()
        ?.nativeElement.querySelector('#' + this.activeId())
        ?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter' && this.open()) {
      event.preventDefault();
      if (this.status() === 'success') {
        const pokemon = this.available()[this.activeIndex()];
        if (pokemon) this.pick(pokemon);
      }
    }
  }
  retry(): void {
    // The retry button disappears while loading; keep focus inside the popup.
    this.inputElement()?.nativeElement.focus();
    this.open.set(true);
    this.retries.next();
  }
}
