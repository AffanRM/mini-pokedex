import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { pokemonFixture, teamFixture } from '../../../common/testing/fixtures';
import { PokemonStore } from '../../../pokedex/state/pokemon.store';
import { TeamStateModel } from '../../models/team-state.model';
import { TeamStore } from '../../state/team.store';
import { TeamBuilderComponent } from './team-builder.component';

describe('TeamBuilderComponent', () => {
  const state = new BehaviorSubject<TeamStateModel>({
    status: 'success',
    data: [teamFixture()],
    error: null,
    pendingIds: [],
    mutationError: null,
  });
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      imports: [TeamBuilderComponent],
      providers: [
        { provide: TeamStore, useValue: { state$: state } },
        {
          provide: PokemonStore,
          useValue: {
            search$: () => new BehaviorSubject({ status: 'success', data: [], error: null }),
          },
        },
      ],
    });
  });
  afterEach(() => vi.useRealTimers());
  it('keeps pristine errors hidden, then checks normalized duplicate names asynchronously', async () => {
    const fixture = TestBed.createComponent(TeamBuilderComponent);
    fixture.componentRef.setInput('available', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Give your team a name.');
    fixture.componentInstance.submit();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Give your team a name.');
    fixture.componentInstance.form.controls.name.setValue(' ORIGINAL   TEAM ');
    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('A team with this name already exists.');
    expect(fixture.componentInstance.formStatus()).toBe('INVALID');
    fixture.destroy();
  });
  it('enforces member constraints, guards pending submits and preserves failed choices until success', async () => {
    const fixture = TestBed.createComponent(TeamBuilderComponent);
    fixture.componentRef.setInput('available', true);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const submitted = vi.fn();
    component.submitTeam.subscribe(submitted);
    component.form.controls.name.setValue('  New   lineup  ');
    component.changePicks([pokemonFixture(1), pokemonFixture(1)]);
    component.submit();
    expect(submitted).not.toHaveBeenCalled();
    expect(component.form.controls.pokemonIds.hasError('duplicatePokemon')).toBe(true);
    component.changePicks(Array.from({ length: 7 }, (_, index) => pokemonFixture(index + 1)));
    expect(component.form.controls.pokemonIds.hasError('maxPokemon')).toBe(true);
    component.changePicks([pokemonFixture(1)]);
    component.submit();
    expect(submitted).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(300);
    component.submit();
    expect(submitted).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New lineup', pokemonIds: [1] }),
    );
    fixture.componentRef.setInput('submitting', true);
    fixture.detectChanges();
    component.submit();
    expect(submitted).toHaveBeenCalledOnce();
    fixture.componentRef.setInput('submitting', false);
    fixture.componentRef.setInput('error', 'Please try again.');
    fixture.detectChanges();

    expect(component.selected()).toHaveLength(1);
    expect(component.form.controls.name.value).toBe('  New   lineup  ');
    fixture.componentRef.setInput('savedVersion', 1);
    fixture.detectChanges();

    expect(component.selected()).toHaveLength(0);
    expect(component.form.controls.name.value).toBe('');
    fixture.destroy();
  });
});
