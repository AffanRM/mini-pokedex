import { Injectable, inject } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  defer,
  finalize,
  of,
  shareReplay,
  tap,
  throwError,
} from 'rxjs';
import { errorMessage } from '../../common/utils/error-message.util';
import { ApiError } from '../../core/graphql.service';
import {
  TEAM_MAX_SIZE,
  TEAM_MIN_SIZE,
  TEAM_NAME_MAX_LENGTH,
  TEAM_NAME_MIN_LENGTH,
} from '../constants/team.constants';
import { CreateTeamModel, TeamModel } from '../models/team.model';
import { TeamStateModel } from '../models/team-state.model';
import { TeamApiService } from '../services/team-api.service';
import { normalizeTeamName } from '../utils/normalize-team-name.util';

@Injectable({ providedIn: 'root' })
export class TeamStore {
  private readonly api = inject(TeamApiService);
  private readonly stateSubject = new BehaviorSubject<TeamStateModel>({
    status: 'idle',
    data: [],
    error: null,
    pendingIds: [],
    mutationError: null,
  });
  private loadRequest?: Observable<readonly TeamModel[]>;
  readonly state$ = this.stateSubject.asObservable();

  /** Load teams with shared requests; refresh cannot overwrite pending optimistic operations. */
  load$(force = false): Observable<readonly TeamModel[]> {
    return defer(() => {
      if (this.loadRequest) return this.loadRequest;
      const state = this.stateSubject.value;
      if (state.pendingIds.length || (!force && state.status === 'success')) return of(state.data);
      this.loadRequest = defer(() => {
        this.patch({ status: 'loading', error: null });
        return this.api.getTeams$();
      }).pipe(
        tap((data) => this.patch({ status: 'success', data, error: null })),
        catchError((error: unknown) => {
          this.patch({ status: 'error', error: errorMessage(error) });
          return throwError(() => error);
        }),
        finalize(() => {
          this.loadRequest = undefined;
          if (this.stateSubject.value.status === 'loading') this.patch({ status: 'idle' });
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
      return this.loadRequest;
    });
  }

  /** Insert immediately, reconcile the server ID, or remove only this optimistic team on failure.
   * Once started, finite mutations finish even if the initiating component is destroyed.
   */
  create$(input: CreateTeamModel): Observable<TeamModel> {
    return defer(() => {
      this.requireLoaded();
      const normalized = {
        ...input,
        name: normalizeTeamName(input.name),
        pokemonIds: [...input.pokemonIds],
      };
      this.validateCreate(normalized);
      const id = `pending-${crypto.randomUUID()}`;
      const optimistic: TeamModel = { ...normalized, id, pending: true };
      this.patch({
        data: [...this.stateSubject.value.data, optimistic],
        pendingIds: [...this.stateSubject.value.pendingIds, id],
        mutationError: null,
      });
      return defer(() => this.api.createTeam$(normalized)).pipe(
        tap((saved) =>
          this.patch({
            data: this.stateSubject.value.data.map((team) => (team.id === id ? saved : team)),
          }),
        ),
        catchError((error: unknown) => {
          this.patch({
            data: this.stateSubject.value.data.filter((team) => team.id !== id),
            mutationError: { operation: 'create', input: normalized, message: errorMessage(error) },
          });
          return throwError(() => error);
        }),
        finalize(() => this.finishMutation(id)),
      );
    }).pipe(shareReplay({ bufferSize: 1, refCount: false }));
  }

  /** Remove immediately; restore only the deleted record at its original position on failure. */
  delete$(id: string): Observable<void> {
    return defer(() => {
      this.requireLoaded();
      const state = this.stateSubject.value;
      const index = state.data.findIndex((team) => team.id === id);
      const team = state.data[index];
      if (!team) return of(undefined);
      if (team.pending || state.pendingIds.includes(id)) {
        return throwError(() => new ApiError('Please wait for this team to finish saving.'));
      }
      this.patch({
        data: state.data.filter((item) => item.id !== id),
        pendingIds: [...state.pendingIds, id],
        mutationError: null,
      });
      return defer(() => this.api.deleteTeam$(id)).pipe(
        catchError((error: unknown) => {
          const data = [...this.stateSubject.value.data];
          data.splice(Math.min(index, data.length), 0, team);
          this.patch({
            data,
            mutationError: { operation: 'delete', teamId: id, message: errorMessage(error) },
          });
          return throwError(() => error);
        }),
        finalize(() => this.finishMutation(id)),
      );
    }).pipe(shareReplay({ bufferSize: 1, refCount: false }));
  }

  /** Retry the last failed mutation using the exact saved input/ID. */
  retryMutation$(): Observable<TeamModel | void> {
    const error = this.stateSubject.value.mutationError;
    if (!error) return of(undefined);
    return error.operation === 'create' ? this.create$(error.input) : this.delete$(error.teamId);
  }

  /** Dismiss the last mutation message after the user acknowledges it. */
  dismissMutationError(): void {
    this.patch({ mutationError: null });
  }

  private requireLoaded(): void {
    if (this.stateSubject.value.status !== 'success') {
      throw new ApiError('Load your teams successfully before making changes.');
    }
  }

  private validateCreate(input: CreateTeamModel): void {
    if (input.name.length < TEAM_NAME_MIN_LENGTH || input.name.length > TEAM_NAME_MAX_LENGTH) {
      throw new ApiError('Use a team name between 3 and 30 characters.');
    }
    if (
      input.pokemonIds.length < TEAM_MIN_SIZE ||
      input.pokemonIds.length > TEAM_MAX_SIZE ||
      new Set(input.pokemonIds).size !== input.pokemonIds.length ||
      input.pokemonIds.some((id) => !Number.isInteger(id) || id < 1)
    ) {
      throw new ApiError('Choose between 1 and 6 different Pokémon.');
    }
    if (
      this.stateSubject.value.data.some(
        (team) => normalizeTeamName(team.name).toLowerCase() === input.name.toLowerCase(),
      )
    ) {
      throw new ApiError('A team with this name already exists.');
    }
  }

  private finishMutation(id: string): void {
    this.patch({
      pendingIds: this.stateSubject.value.pendingIds.filter((pendingId) => pendingId !== id),
    });
  }

  private patch(patch: Partial<TeamStateModel>): void {
    this.stateSubject.next({ ...this.stateSubject.value, ...patch });
  }
}
