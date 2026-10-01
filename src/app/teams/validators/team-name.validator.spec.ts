import { FormControl } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { SEARCH_DEBOUNCE_MS } from '../../common/constants/api.constants';
import { teamFixture } from '../../common/testing/fixtures';
import { TeamStateModel } from '../models/team-state.model';
import { teamNameValidator, uniqueTeamNameValidator } from './team-name.validator';
import { teamSizeValidator } from './team-size.validator';

describe('Team form validators', () => {
  afterEach(() => vi.useRealTimers());

  it('rejects blank/padded short names and enforces normalized name length', () => {
    expect(teamNameValidator(new FormControl('   '))).toEqual({ required: true });
    expect(teamNameValidator(new FormControl('  ab  '))).toHaveProperty('minlength');
    expect(teamNameValidator(new FormControl('a'.repeat(31)))).toHaveProperty('maxlength');
    expect(teamNameValidator(new FormControl('  Kanto  team  '))).toBeNull();
  });

  it('debounces uniqueness and replaces a cancelled check after the field changes', () => {
    vi.useFakeTimers();
    const state = new BehaviorSubject<TeamStateModel>({
      status: 'success',
      data: [teamFixture('1', 'Kanto team')],
      error: null,
      pendingIds: [],
      mutationError: null,
    });
    const control = new FormControl('  KANTO   TEAM  ', {
      validators: teamNameValidator,
      asyncValidators: uniqueTeamNameValidator(state),
    });
    expect(control.pending).toBe(true);
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
    expect(control.errors).toBeNull();
    vi.advanceTimersByTime(1);
    expect(control.errors).toEqual({ nameTaken: true });
    control.setValue('Kanto team');
    vi.advanceTimersByTime(100);
    control.setValue('Johto team');
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    expect(control.valid).toBe(true);
  });

  it('does not declare a name unique when team loading failed', () => {
    vi.useFakeTimers();
    const state = new BehaviorSubject<TeamStateModel>({
      status: 'error',
      data: [],
      error: 'Offline',
      pendingIds: [],
      mutationError: null,
    });
    const control = new FormControl('New team', {
      asyncValidators: uniqueTeamNameValidator(state),
    });
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    expect(control.errors).toEqual({ validationUnavailable: true });
  });

  it('enforces one to six distinct Pokemon even for programmatic form updates', () => {
    expect(teamSizeValidator(new FormControl([]))).toEqual({ minPokemon: true });
    expect(teamSizeValidator(new FormControl([1, 2, 3, 4, 5, 6, 7]))).toEqual({ maxPokemon: true });
    expect(teamSizeValidator(new FormControl([1, 1]))).toEqual({ duplicatePokemon: true });
    expect(teamSizeValidator(new FormControl([1, 2, 3, 4, 5, 6]))).toBeNull();
  });
});
