import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, TimeoutError, catchError, map, retry, throwError, timer, timeout } from 'rxjs';
import {
  POKEMON_RETRY_COUNT,
  REQUEST_TIMEOUT_MS,
  RETRY_DELAY_MS,
} from '../common/constants/api.constants';

interface GraphqlResponseModel<T> {
  readonly data?: T | null;
  readonly errors?: readonly { readonly message: string }[];
}

/** A safe error that the UI can present without exposing backend details. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly retryable = false,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

@Injectable({ providedIn: 'root' })
export class GraphqlService {
  private readonly http = inject(HttpClient);

  /** Execute a cancellable GraphQL request; only opt-in read queries are retried. */
  request$<T>(
    endpoint: string,
    query: string,
    variables: Readonly<Record<string, unknown>> = {},
    retryQuery = false,
  ): Observable<T> {
    return this.http.post<GraphqlResponseModel<T>>(endpoint, { query, variables }).pipe(
      timeout(REQUEST_TIMEOUT_MS),
      map((response) => {
        if (response.errors?.length) {
          throw new ApiError('The server could not complete this request. Please try again.');
        }
        if (response.data == null) {
          throw new ApiError('The server returned an incomplete response. Please try again.');
        }
        return response.data;
      }),
      catchError((error: unknown) => throwError(() => this.toApiError(error))),
      retry({
        count: retryQuery ? POKEMON_RETRY_COUNT : 0,
        delay: (error: ApiError, attempt) =>
          error.retryable ? timer(RETRY_DELAY_MS * attempt) : throwError(() => error),
      }),
    );
  }

  private toApiError(error: unknown): ApiError {
    if (error instanceof ApiError) return error;
    if (error instanceof TimeoutError) {
      return new ApiError('The request took too long. Please try again.', true);
    }
    if (error instanceof HttpErrorResponse) {
      const retryable = error.status === 0 || error.status === 429 || error.status >= 500;
      return new ApiError(
        error.status === 0
          ? 'Unable to connect. Check your connection and try again.'
          : 'The service is unavailable. Please try again.',
        retryable,
      );
    }
    return new ApiError('Something went wrong while loading data. Please try again.');
  }
}
