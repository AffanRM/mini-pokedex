import { TestBed } from '@angular/core/testing';
import { Subject, firstValueFrom, of, throwError } from 'rxjs';
import { CREATE_TEAM_FIXTURE, teamFixture } from '../../common/testing/fixtures';
import { ApiError } from '../../core/graphql.service';
import { TeamModel } from '../models/team.model';
import { TeamApiService } from '../services/team-api.service';
import { TeamStore } from './team.store';

describe('TeamStore optimistic mutations', () => {
  const api = { getTeams$: vi.fn(), createTeam$: vi.fn(), deleteTeam$: vi.fn() };
  let store: TeamStore;

  beforeEach(async () => {
    vi.resetAllMocks();
    api.getTeams$.mockReturnValue(of([teamFixture()]));
    TestBed.configureTestingModule({ providers: [{ provide: TeamApiService, useValue: api }] });
    store = TestBed.inject(TeamStore);
    await firstValueFrom(store.load$());
  });

  it('shows creation before the server responds, then rolls back with recoverable error input', async () => {
    const response = new Subject<TeamModel>();
    api.createTeam$.mockReturnValue(response);
    const error = vi.fn();
    store.create$(CREATE_TEAM_FIXTURE).subscribe({ error });
    let state = await firstValueFrom(store.state$);
    expect(state.data).toHaveLength(2);
    expect(state.data[1].pending).toBe(true);
    expect(state.pendingIds).toHaveLength(1);
    response.error(new ApiError('Could not save. Please try again.'));
    state = await firstValueFrom(store.state$);
    expect(state.data).toEqual([teamFixture()]);
    expect(state.pendingIds).toEqual([]);
    expect(state.mutationError?.operation).toBe('create');
    expect(state.mutationError?.message).toContain('Please try again');
    expect(error).toHaveBeenCalledOnce();
    api.createTeam$.mockReturnValue(of(teamFixture('2', CREATE_TEAM_FIXTURE.name)));
    await firstValueFrom(store.retryMutation$());
    expect((await firstValueFrom(store.state$)).data.map((team) => team.id)).toEqual(['1', '2']);
  });

  it('replaces only its provisional team and shares one mutation between subscribers', async () => {
    const response = new Subject<TeamModel>();
    api.createTeam$.mockReturnValue(response);
    const mutation = store.create$(CREATE_TEAM_FIXTURE);
    const first = firstValueFrom(mutation);
    const second = firstValueFrom(mutation);
    expect(api.createTeam$).toHaveBeenCalledOnce();
    response.next(teamFixture('2', CREATE_TEAM_FIXTURE.name));
    response.complete();
    expect(await first).toEqual(await second);
    expect((await firstValueFrom(store.state$)).data[1].id).toBe('2');
    expect((await firstValueFrom(store.state$)).pendingIds).toEqual([]);
  });

  it('does not erase a concurrent successful creation when another creation fails', async () => {
    const failing = new Subject<TeamModel>();
    const successful = new Subject<TeamModel>();
    api.createTeam$.mockReturnValueOnce(failing).mockReturnValueOnce(successful);
    store.create$(CREATE_TEAM_FIXTURE).subscribe({ error: () => undefined });
    store.create$({ ...CREATE_TEAM_FIXTURE, name: 'Second team' }).subscribe();
    successful.next(teamFixture('3', 'Second team'));
    successful.complete();
    failing.error(new ApiError('Failed'));
    expect((await firstValueFrom(store.state$)).data.map((team) => team.id)).toEqual(['1', '3']);
  });

  it('restores a failed deletion without removing a team created while deletion was pending', async () => {
    const deletion = new Subject<void>();
    api.deleteTeam$.mockReturnValue(deletion);
    store.delete$('1').subscribe({ error: () => undefined });
    expect((await firstValueFrom(store.state$)).data).toEqual([]);
    api.createTeam$.mockReturnValue(of(teamFixture('2', 'New team')));
    await firstValueFrom(store.create$(CREATE_TEAM_FIXTURE));
    deletion.error(new ApiError('Could not delete'));
    expect((await firstValueFrom(store.state$)).data.map((team) => team.id)).toEqual(['1', '2']);
    expect((await firstValueFrom(store.state$)).mutationError?.operation).toBe('delete');
  });

  it('finishes an in-flight mutation when the initiating subscriber leaves', async () => {
    const response = new Subject<TeamModel>();
    api.createTeam$.mockReturnValue(response);
    const subscription = store.create$(CREATE_TEAM_FIXTURE).subscribe();
    subscription.unsubscribe();
    response.next(teamFixture('2', CREATE_TEAM_FIXTURE.name));
    response.complete();
    const state = await firstValueFrom(store.state$);
    expect(state.data[1].id).toBe('2');
    expect(state.pendingIds).toEqual([]);
  });

  it('blocks a refresh from overwriting a pending creation and rejects duplicate names', async () => {
    const response = new Subject<TeamModel>();
    api.createTeam$.mockReturnValue(response);
    store.create$(CREATE_TEAM_FIXTURE).subscribe();
    await firstValueFrom(store.load$(true));
    expect(api.getTeams$).toHaveBeenCalledOnce();
    await expect(
      firstValueFrom(store.create$({ ...CREATE_TEAM_FIXTURE, name: '  NEW TEAM  ' })),
    ).rejects.toThrow('already exists');
    response.next(teamFixture('2', CREATE_TEAM_FIXTURE.name));
    response.complete();
  });

  it('exposes load errors separately from an empty team list and allows a later retry', async () => {
    api.getTeams$
      .mockReturnValueOnce(throwError(() => new ApiError('Offline')))
      .mockReturnValueOnce(of([]));
    await expect(firstValueFrom(store.load$(true))).rejects.toThrow('Offline');
    expect((await firstValueFrom(store.state$)).status).toBe('error');
    await firstValueFrom(store.load$());
    expect((await firstValueFrom(store.state$)).status).toBe('success');
    expect((await firstValueFrom(store.state$)).data).toEqual([]);
  });
});
