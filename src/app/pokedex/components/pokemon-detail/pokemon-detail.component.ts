import { DecimalPipe, TitleCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Subject, catchError, combineLatest, map, of, scan, startWith, switchMap } from 'rxjs';
import { AsyncStateComponent } from '../../../common/components/async-state/async-state.component';
import { PokemonSpriteComponent } from '../../../common/components/pokemon-sprite/pokemon-sprite.component';
import { TypeBadgeComponent } from '../../../common/components/type-badge/type-badge.component';
import { AsyncStateModel } from '../../../common/models/async-state.model';
import { errorMessage } from '../../../common/utils/error-message.util';
import { STAT_COLUMNS } from '../../constants/stat-columns.constants';
import { PokemonDetailModel } from '../../models/pokemon.model';
import { PokemonStore } from '../../state/pokemon.store';
import { StatRadarComponent } from '../stat-radar/stat-radar.component';

const INITIAL_DETAIL: AsyncStateModel<PokemonDetailModel | null> = {
  status: 'loading',
  data: null,
  error: null,
};

@Component({
  selector: 'app-pokemon-detail',
  standalone: true,
  imports: [
    DecimalPipe,
    TitleCasePipe,
    AsyncStateComponent,
    PokemonSpriteComponent,
    TypeBadgeComponent,
    StatRadarComponent,
  ],
  templateUrl: './pokemon-detail.component.html',
  styleUrl: './pokemon-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonDetailComponent {
  readonly pokemonId = input.required<number>();
  readonly pokemonName = input.required<string>();
  readonly previousId = input<number | null>(null);
  readonly nextId = input<number | null>(null);
  readonly closed = output<void>();
  readonly navigate = output<number>();
  readonly columns = STAT_COLUMNS.filter((column) => column.key !== 'total');
  private readonly store = inject(PokemonStore);
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  private readonly retries = new Subject<void>();

  readonly state = toSignal(
    combineLatest([toObservable(this.pokemonId), this.retries.pipe(startWith(undefined))]).pipe(
      switchMap(([id]) =>
        this.store.getDetail$(id).pipe(
          map((data): AsyncStateModel<PokemonDetailModel | null> => ({
            status: 'success',
            data,
            error: null,
          })),
          startWith(INITIAL_DETAIL),
          catchError((error: unknown) =>
            of({ status: 'error' as const, data: null, error: errorMessage(error) }),
          ),
        ),
      ),
      // Keep the canvas mounted with the previous values while new details load.
      // Its muted loading state prevents stale data from appearing as new success.
      scan(
        (previous, state) =>
          state.status === 'loading' ? { ...state, data: previous.data } : state,
        INITIAL_DETAIL,
      ),
    ),
    { initialValue: INITIAL_DETAIL },
  );
  readonly displayStatus = computed(() =>
    this.state().status === 'success' && !this.state().data ? 'empty' : this.state().status,
  );

  constructor() {
    // Open in the write phase, before the child's chart measures its canvas.
    // Cached detail data can otherwise initialize Chart.js inside a hidden dialog.
    afterNextRender({ write: () => this.dialog()?.nativeElement.showModal() });
  }

  close(): void {
    this.dialog()?.nativeElement.close();
  }
  retry(): void {
    this.retries.next();
  }
}
