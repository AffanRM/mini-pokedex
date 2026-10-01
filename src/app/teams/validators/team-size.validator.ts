import { ValidatorFn } from '@angular/forms';
import { TEAM_MAX_SIZE, TEAM_MIN_SIZE } from '../constants/team.constants';

/** Enforce slot limits and uniqueness in the form itself, including programmatic changes. */
export const teamSizeValidator: ValidatorFn = (control) => {
  const ids: unknown = control.value;
  if (!Array.isArray(ids) || ids.length < TEAM_MIN_SIZE) return { minPokemon: true };
  if (ids.length > TEAM_MAX_SIZE) return { maxPokemon: true };
  if (new Set(ids).size !== ids.length) return { duplicatePokemon: true };
  return null;
};
