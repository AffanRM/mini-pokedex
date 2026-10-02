import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Subject, of } from 'rxjs';
import { StorageService } from '../common/services/storage.service';
import { CREATE_TEAM_FIXTURE, pokemonFixture, teamFixture } from '../common/testing/fixtures';
import { ApiError } from '../core/graphql.service';
import { PokemonModel } from '../pokedex/models/pokemon.model';
import { PokemonApiService } from '../pokedex/services/pokemon-api.service';
import { TeamBuilderComponent } from './components/team-builder/team-builder.component';
import { TeamModel } from './models/team.model';
import { TeamApiService } from './services/team-api.service';
import { TeamsPage } from './teams.component';

describe('TeamsPage integration', () => {
  let fixture: ComponentFixture<TeamsPage>;
  let teams: Subject<readonly TeamModel[]>;
  const getTeams = vi.fn();
  const createTeam = vi.fn();
  const deleteTeam = vi.fn();
  const getByIds = vi.fn();
  const storage = { get: vi.fn(), set: vi.fn() };
  beforeEach(async () => {
    teams = new Subject();
    getTeams.mockReset().mockReturnValue(teams);
    createTeam.mockReset();
    deleteTeam.mockReset();
    getByIds
      .mockReset()
      .mockImplementation((ids: number[]) => of(ids.map((id) => pokemonFixture(id))));
    storage.get.mockReset().mockReturnValue('2');
    storage.set.mockReset();
    TestBed.configureTestingModule({
      imports: [TeamsPage],
      providers: [
        {
          provide: TeamApiService,
          useValue: { getTeams$: getTeams, createTeam$: createTeam, deleteTeam$: deleteTeam },
        },
        { provide: PokemonApiService, useValue: { getByIds$: getByIds, search$: () => of([]) } },
        { provide: StorageService, useValue: storage },
      ],
    });
    fixture = TestBed.createComponent(TeamsPage);
    fixture.detectChanges();
    await fixture.whenStable();
  });
  afterEach(() => fixture.destroy());
  async function loaded(): Promise<void> {
    teams.next([teamFixture(), { ...teamFixture('2', 'Other team'), pokemonIds: [2] }]);
    teams.complete();
    await fixture.whenStable();
  }
  it('shows a meaningful empty list and clears an obsolete stored selection', async () => {
    expect(fixture.nativeElement.textContent).toContain('Loading your teams');
    teams.next([]);
    teams.complete();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Your first team starts here');
    expect(fixture.componentInstance.selectedId()).toBeNull();
    expect(storage.set).toHaveBeenLastCalledWith('mini-pokedex.selected-team', null);
  });
  it('restores/persists selection, falls back after deletion and reports rollback with a working retry', async () => {
    await loaded();
    expect(fixture.componentInstance.selectedTeam()?.id).toBe('2');
    expect(storage.set).toHaveBeenLastCalledWith('mini-pokedex.selected-team', '2');
    const failed = new Subject<void>();
    deleteTeam.mockReturnValueOnce(failed);
    fixture.componentInstance.delete('2');
    await fixture.whenStable();
    expect(fixture.componentInstance.state().data.map((team) => team.id)).toEqual(['1']);
    expect(fixture.componentInstance.selectedTeam()?.id).toBe('1');
    failed.error(new ApiError('Please try again.'));
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('The team has been restored.');
    expect(fixture.componentInstance.state().data).toHaveLength(2);
    deleteTeam.mockReturnValueOnce(of(undefined));
    fixture.componentInstance.retryDelete();
    await fixture.whenStable();
    expect(deleteTeam).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('Other team was deleted.');
  });
  it('shows optimistic creation immediately, rolls back and keeps form picks, then resets only after successful retry', async () => {
    await loaded();
    const builder = fixture.debugElement.query(By.directive(TeamBuilderComponent))
      .componentInstance as TeamBuilderComponent;
    builder.form.controls.name.setValue(CREATE_TEAM_FIXTURE.name);
    builder.changePicks([pokemonFixture(1), pokemonFixture(4)]);
    const failed = new Subject<TeamModel>();
    createTeam.mockReturnValueOnce(failed);
    fixture.componentInstance.create(CREATE_TEAM_FIXTURE);
    fixture.componentInstance.create(CREATE_TEAM_FIXTURE);
    await fixture.whenStable();
    expect(createTeam).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.textContent).toContain('New team');
    const pending = fixture.componentInstance.state().data.find((team) => team.pending)!;
    fixture.componentInstance.selectedId.set(pending.id);
    await fixture.whenStable();
    expect(storage.set.mock.calls.some((call) => String(call[1]).startsWith('pending-'))).toBe(
      false,
    );
    failed.error(new ApiError('Check your connection and try again.'));
    await fixture.whenStable();
    expect(fixture.componentInstance.state().data).toHaveLength(2);
    expect(builder.selected()).toHaveLength(2);
    expect(builder.form.controls.name.value).toBe('New team');
    expect(fixture.nativeElement.textContent).toContain('Your choices are kept');
    createTeam.mockReturnValueOnce(of({ ...CREATE_TEAM_FIXTURE, id: '3' }));
    fixture.componentInstance.create(CREATE_TEAM_FIXTURE);
    await fixture.whenStable();
    expect(fixture.componentInstance.selectedTeam()?.id).toBe('3');
    expect(storage.set).toHaveBeenLastCalledWith('mini-pokedex.selected-team', '3');
    expect(builder.selected()).toHaveLength(0);
    expect(builder.form.controls.name.value).toBe('');
  });
  it('offers retry after list failure and cancels stale member reads on selection changes and teardown', async () => {
    teams.error(new ApiError('Start the mock server and try again.'));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Start the mock server',
    );
    getTeams.mockReturnValueOnce(of([teamFixture(), { ...teamFixture('2'), pokemonIds: [2] }]));
    const first = new Subject<readonly PokemonModel[]>();
    const second = new Subject<readonly PokemonModel[]>();
    getByIds.mockReturnValueOnce(first).mockReturnValueOnce(second);
    fixture.componentInstance.refresh();
    await fixture.whenStable();
    expect(first.observed).toBe(true);
    fixture.componentInstance.selectedId.set('1');
    await fixture.whenStable();
    expect(first.observed).toBe(false);
    expect(second.observed).toBe(true);
    second.error(new ApiError('Please try again.'));
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Team members couldn’t load');
    const retry = new Subject<readonly PokemonModel[]>();
    getByIds.mockReturnValueOnce(retry);
    fixture.componentInstance.retryMembers();
    await fixture.whenStable();
    expect(retry.observed).toBe(true);
    fixture.destroy();
    expect(retry.observed).toBe(false);
  });
  it('does not strand optimistic writes if the page leaves during a save', async () => {
    await loaded();
    const response = new Subject<TeamModel>();
    createTeam.mockReturnValueOnce(response);
    fixture.componentInstance.create(CREATE_TEAM_FIXTURE);
    const store = fixture.componentInstance.store;
    fixture.destroy();
    expect(response.observed).toBe(true);
    response.next({ ...CREATE_TEAM_FIXTURE, id: '3' });
    response.complete();
    let ids: readonly string[] = [];
    const subscription = store.state$.subscribe((state) => {
      ids = state.data.map((team) => team.id);
    });
    expect(ids).toEqual(['1', '2', '3']);
    subscription.unsubscribe();
  });
  it('keeps the selected lineup mounted during list refresh and failed refresh recovery', async () => {
    await loaded();
    const memberPanel = fixture.nativeElement.querySelector('app-team-members');
    const refresh = new Subject<readonly TeamModel[]>();
    getTeams.mockReturnValueOnce(refresh);
    fixture.componentInstance.refresh();
    await fixture.whenStable();
    expect(fixture.componentInstance.state().status).toBe('loading');
    expect(fixture.componentInstance.selectedTeam()?.id).toBe('2');
    expect(fixture.nativeElement.querySelector('app-team-members')).toBe(memberPanel);
    refresh.error(new ApiError('Please try again.'));
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Your teams couldn’t load');
    expect(fixture.nativeElement.querySelector('app-team-members')).toBe(memberPanel);
    getTeams.mockReturnValueOnce(of([teamFixture(), { ...teamFixture('2'), pokemonIds: [2] }]));
    fixture.componentInstance.refresh();
    await fixture.whenStable();
    expect(fixture.componentInstance.state().status).toBe('success');
    expect(fixture.nativeElement.querySelector('app-team-members')).toBe(memberPanel);
  });
});
