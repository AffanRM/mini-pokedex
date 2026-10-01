import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  afterEach(() => vi.restoreAllMocks());
  it('reads, persists and removes the selected preference', () => {
    const service = TestBed.inject(StorageService);
    service.set('test-selection', '2');
    expect(service.get('test-selection')).toBe('2');
    service.set('test-selection', null);
    expect(service.get('test-selection')).toBeNull();
  });
  it('keeps the UI usable when browser storage denies access', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('denied');
    });
    const service = TestBed.inject(StorageService);
    expect(service.get('selected')).toBeNull();
    expect(() => service.set('selected', '2')).not.toThrow();
    expect(() => service.set('selected', null)).not.toThrow();
  });
});
