import { ApiError } from '../../core/graphql.service';

/** Present only errors intended for end users; never expose raw exception text. */
export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
}
