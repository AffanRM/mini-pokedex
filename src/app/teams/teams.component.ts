import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  Subject,
  catchError,
  combineLatest,
  distinctUntilChanged,
  exhaustMap,
  finalize,
  map,
  mergeMap,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { AsyncStateModel } from '../common/models/async-state.model';
import { NotificationModel } from '../common/models/notification.model';
import { ToastComponent } from '../common/components/toast/toast.component';
import { StorageService } from '../common/services/storage.service';
import { errorMessage } from '../common/utils/error-message.util';
import { PokemonModel } from '../pokedex/models/pokemon.model';
import { PokemonStore } from '../pokedex/state/pokemon.store';
import { TeamBuilderComponent } from './components/team-builder/team-builder.component';
import { TeamListComponent } from './components/team-list/team-list.component';
import { TeamMembersComponent } from './components/team-members/team-members.component';
import { SELECTED_TEAM_STORAGE_KEY } from './constants/team.constants';
import { CreateTeamModel } from './models/team.model';
import { TeamStore } from './state/team.store';

const INITIAL_MEMBERS: AsyncStateModel<readonly PokemonModel[]> = {
  status: 'idle',
  data: [],
  error: null,
};

@Component({
  selector: 'app-teams-page',
  standalone: true,
  imports: [TeamBuilderComponent, TeamListComponent, TeamMembersComponent, ToastComponent],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamsPage {
  readonly store = inject(TeamStore);
  private readonly pokemonStore = inject(PokemonStore);
  private readonly storage = inject(StorageService);
  readonly state = toSignal(this.store.state$, { requireSync: true });
  readonly selectedId = signal(this.storage.get(SELECTED_TEAM_STORAGE_KEY));
  readonly selectedTeam = computed(
    () => this.state().data.find((team) => team.id === this.selectedId()) ?? null,
  );
  readonly submitting = signal(false);
  readonly createError = signal<string | null>(null);
  readonly savedVersion = signal(0);
  readonly notification = signal<NotificationModel | null>(null);
  private readonly loads = new Subject<boolean>();
  private readonly creates = new Subject<CreateTeamModel>();
  private readonly deletes = new Subject<string>();
  private readonly memberRetries = new Subject<void>();
  private readonly loadAction = toSignal(
    this.loads.pipe(
      startWith(false),
      switchMap((force) => this.store.load$(force).pipe(catchError(() => of(null)))),
    ),
  );
  readonly members = toSignal(
    combineLatest([
      toObservable(this.selectedTeam).pipe(
        distinctUntilChanged(
          (previous, next) =>
            previous?.id === next?.id &&
            previous?.pokemonIds.join(',') === next?.pokemonIds.join(','),
        ),
      ),
      this.memberRetries.pipe(startWith(undefined)),
    ]).pipe(
      switchMap(([team]) =>
        !team
          ? of(INITIAL_MEMBERS)
          : this.pokemonStore.getMembers$(team.pokemonIds).pipe(
              map((data) => ({ status: 'success' as const, data, error: null })),
              startWith({
                status: 'loading' as const,
                data: [] as readonly PokemonModel[],
                error: null,
              }),
              catchError((error: unknown) =>
                of({
                  status: 'error' as const,
                  data: [] as readonly PokemonModel[],
                  error: errorMessage(error),
                }),
              ),
            ),
      ),
    ),
    { initialValue: INITIAL_MEMBERS },
  );
  private readonly createAction = toSignal(
    this.creates.pipe(
      exhaustMap((input) => {
        this.submitting.set(true);
        this.createError.set(null);
        this.notification.set(null);
        return this.store.create$(input).pipe(
          tap((team) => {
            this.selectedId.set(team.id);
            this.savedVersion.update((version) => version + 1);
            this.notification.set({ message: `${team.name} was created.`, kind: 'success' });
          }),
          catchError((error: unknown) => {
            this.createError.set(errorMessage(error));
            this.notification.set({
              message: 'Your team could not be saved. Your choices are kept in the form.',
              kind: 'error',
            });
            return of(null);
          }),
          finalize(() => this.submitting.set(false)),
        );
      }),
    ),
  );
  private readonly deleteAction = toSignal(
    this.deletes.pipe(
      mergeMap((id) => {
        const name = this.state().data.find((team) => team.id === id)?.name ?? 'Team';
        this.notification.set(null);
        return this.store.delete$(id).pipe(
          tap(() => this.notification.set({ message: `${name} was deleted.`, kind: 'success' })),
          catchError(() => {
            this.notification.set({
              message: `${name} could not be deleted. The team has been restored.`,
              kind: 'error',
            });
            return of(null);
          }),
        );
      }),
    ),
  );

  constructor() {
    effect(() => {
      const state = this.state();
      if (state.status !== 'success') return;
      const selected = state.data.find((team) => team.id === this.selectedId());
      if (!selected) this.selectedId.set(state.data.find((team) => !team.pending)?.id ?? null);
    });
    effect(() => {
      if (this.state().status !== 'success') return;
      const team = this.selectedTeam();
      // Temporary IDs never replace a durable preference; reconcile after saving.
      if (!team?.pending) this.storage.set(SELECTED_TEAM_STORAGE_KEY, team?.id ?? null);
    });
  }
  refresh(): void {
    this.loads.next(true);
  }
  create(input: CreateTeamModel): void {
    if (!this.submitting()) this.creates.next(input);
  }
  delete(id: string): void {
    if (!this.state().pendingIds.includes(id)) this.deletes.next(id);
  }
  retryMembers(): void {
    this.memberRetries.next();
  }
  retryDelete(): void {
    const error = this.state().mutationError;
    if (error?.operation === 'delete') this.delete(error.teamId);
  }
}
