export type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncStateModel<T> {
  readonly status: LoadStatus;
  readonly data: T;
  readonly error: string | null;
}
