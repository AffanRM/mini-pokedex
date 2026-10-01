import { AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import { Observable, map, switchMap, take, timer } from 'rxjs';
import { SEARCH_DEBOUNCE_MS } from '../../common/constants/api.constants';
import { TEAM_NAME_MAX_LENGTH, TEAM_NAME_MIN_LENGTH } from '../constants/team.constants';
import { TeamStateModel } from '../models/team-state.model';
import { normalizeTeamName } from '../utils/normalize-team-name.util';

/** Validate normalized length, so spaces cannot bypass the required name constraints. */
export const teamNameValidator: ValidatorFn = (control) => {
  const name = normalizeTeamName(String(control.value ?? ''));
  if (!name) return { required: true };
  if (name.length < TEAM_NAME_MIN_LENGTH)
    return { minlength: { requiredLength: TEAM_NAME_MIN_LENGTH } };
  if (name.length > TEAM_NAME_MAX_LENGTH)
    return { maxlength: { requiredLength: TEAM_NAME_MAX_LENGTH } };
  return null;
};

/** Debounce uniqueness checks; unavailable team data must never falsely validate a name. */
export function uniqueTeamNameValidator(state$: Observable<TeamStateModel>): AsyncValidatorFn {
  return (control) =>
    timer(SEARCH_DEBOUNCE_MS).pipe(
      switchMap(() => state$.pipe(take(1))),
      map((state) => {
        if (state.status !== 'success') return { validationUnavailable: true };
        const name = normalizeTeamName(String(control.value ?? '')).toLowerCase();
        return state.data.some((team) => normalizeTeamName(team.name).toLowerCase() === name)
          ? { nameTaken: true }
          : null;
      }),
    );
}
