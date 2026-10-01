import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RETRY_DELAY_MS, REQUEST_TIMEOUT_MS } from '../common/constants/api.constants';
import { GraphqlService } from './graphql.service';

describe('GraphqlService', () => {
  let service: GraphqlService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GraphqlService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  it('sends variables and rejects HTTP 200 GraphQL errors, including partial data', () => {
    const error = vi.fn();
    service
      .request$('/graphql', 'query Test($id: Int!) { pokemon(id: $id) { id } }', { id: 1 })
      .subscribe({ error });
    const request = http.expectOne('/graphql');
    expect(request.request.method).toBe('POST');
    expect(request.request.body.variables).toEqual({ id: 1 });
    request.flush({ data: { pokemon: null }, errors: [{ message: 'secret backend details' }] });
    expect(error.mock.calls[0][0].message).toContain('Please try again');
    expect(error.mock.calls[0][0].message).not.toContain('secret');
  });

  it('retries transient read failures with increasing delay, then surfaces failure', () => {
    vi.useFakeTimers();
    const error = vi.fn();
    service.request$('/graphql', 'query { pokemon { id } }', {}, true).subscribe({ error });
    http.expectOne('/graphql').flush(null, { status: 503, statusText: 'Unavailable' });
    vi.advanceTimersByTime(RETRY_DELAY_MS - 1);
    http.expectNone('/graphql');
    vi.advanceTimersByTime(1);
    http.expectOne('/graphql').flush(null, { status: 503, statusText: 'Unavailable' });
    vi.advanceTimersByTime(RETRY_DELAY_MS * 2);
    http.expectOne('/graphql').flush(null, { status: 503, statusText: 'Unavailable' });
    expect(error).toHaveBeenCalledOnce();
    http.expectNone('/graphql');
  });

  it('does not retry mutations or invalid queries', () => {
    vi.useFakeTimers();
    const error = vi.fn();
    service.request$('/graphql', 'mutation { createTeam { id } }').subscribe({ error });
    http.expectOne('/graphql').flush(null, { status: 503, statusText: 'Unavailable' });
    vi.advanceTimersByTime(10_000);
    expect(error).toHaveBeenCalledOnce();
    http.expectNone('/graphql');
  });

  it('times out a stalled request and cancels its underlying transport', () => {
    vi.useFakeTimers();
    const error = vi.fn();
    service.request$('/graphql', 'query { teams { id } }').subscribe({ error });
    const request = http.expectOne('/graphql');
    vi.advanceTimersByTime(REQUEST_TIMEOUT_MS);
    expect(request.cancelled).toBe(true);
    expect(error.mock.calls[0][0].message).toContain('too long');
  });

  it('aborts a request when its consumer unsubscribes', () => {
    const subscription = service.request$('/graphql', 'query { teams { id } }').subscribe();
    const request = http.expectOne('/graphql');
    subscription.unsubscribe();
    expect(request.cancelled).toBe(true);
  });

  it('does not treat a missing data payload as empty success', () => {
    const next = vi.fn();
    const error = vi.fn();
    service.request$('/graphql', 'query { teams { id } }').subscribe({ next, error });
    http.expectOne('/graphql').flush({});
    expect(next).not.toHaveBeenCalled();
    expect(error.mock.calls[0][0].message).toContain('incomplete');
  });
});
