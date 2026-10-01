import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SEARCH_DEBOUNCE_MS } from '../../../common/constants/api.constants';
import { pokemonFixture } from '../../../common/testing/fixtures';
import { PokemonControlsModel } from '../../models/pokemon.model';
import { PokemonTableComponent } from './pokemon-table.component';

describe('PokemonTableComponent', () => {
  let fixture: ComponentFixture<PokemonTableComponent>;
  const controls: PokemonControlsModel = {
    search: '',
    type: '',
    sort: 'total',
    direction: 'desc',
    page: 0,
    pageSize: 10,
  };
  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [PokemonTableComponent] });
    fixture = TestBed.createComponent(PokemonTableComponent);
    fixture.componentRef.setInput('controls', controls);
    fixture.componentRef.setInput('page', {
      rows: [pokemonFixture(1, 'bulbasaur')],
      total: 12,
      page: 0,
      pageSize: 10,
      pageCount: 2,
    });
    fixture.componentRef.setInput('status', 'success');
    fixture.detectChanges();
    await fixture.whenStable();
  });
  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  it('renders layout-preserving skeleton rows, error/retry, empty and successful rows', async () => {
    const element = fixture.nativeElement as HTMLElement;
    const retry = vi.fn();
    fixture.componentInstance.retry.subscribe(retry);
    fixture.componentRef.setInput('status', 'loading');
    fixture.detectChanges();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(10);
    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();
    fixture.componentRef.setInput('status', 'error');
    fixture.componentRef.setInput('error', 'Check your connection and try again.');
    fixture.detectChanges();
    expect(element.textContent).toContain('The Pokédex couldn’t load');
    const button = [...element.querySelectorAll<HTMLButtonElement>('button')].find((item) =>
      item.textContent?.includes('Try again'),
    );
    button?.click();
    expect(retry).toHaveBeenCalledOnce();
    fixture.componentRef.setInput('status', 'success');
    fixture.componentRef.setInput('page', {
      rows: [],
      total: 0,
      page: 0,
      pageSize: 10,
      pageCount: 1,
    });
    fixture.detectChanges();
    expect(element.textContent).toContain('No Pokémon found');
  });

  it('emits sort direction and exposes it on the column header', () => {
    const changed = vi.fn();
    fixture.componentInstance.controlsChanged.subscribe(changed);
    const button = fixture.nativeElement.querySelector(
      'button[aria-label="Sort by Total"]',
    ) as HTMLButtonElement;
    expect(button.closest('th')?.getAttribute('aria-sort')).toBe('descending');
    button.click();
    expect(changed).toHaveBeenCalledWith({ sort: 'total', direction: 'asc' });
  });

  it('debounces search and does not overwrite typed text when the type changes', () => {
    vi.useFakeTimers();
    const changed = vi.fn();
    fixture.componentInstance.controlsChanged.subscribe(changed);
    fixture.componentInstance.search.setValue('bulba');
    fixture.componentRef.setInput('controls', { ...controls, type: 'grass' });
    fixture.detectChanges();
    expect(fixture.componentInstance.search.value).toBe('bulba');
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
    expect(changed).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(changed).toHaveBeenCalledWith({ search: 'bulba' });
  });

  it('opens details from any cell and focuses its native name button', () => {
    const selected = vi.fn();
    fixture.componentInstance.selected.subscribe(selected);
    const element = fixture.nativeElement as HTMLElement;
    const row = element.querySelector('tbody tr')!;
    (row.querySelector('td:last-child') as HTMLElement).click();
    expect(selected).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    expect(document.activeElement?.getAttribute('aria-label')).toBe('View bulbasaur details');
  });

  it('emits page navigation and accepts only supported page sizes', () => {
    const changed = vi.fn();
    fixture.componentInstance.controlsChanged.subscribe(changed);
    (
      fixture.nativeElement.querySelector('button[aria-label="Next page"]') as HTMLButtonElement
    ).click();
    expect(changed).toHaveBeenCalledWith({ page: 1 });
    fixture.componentInstance.changePageSize('25');
    expect(changed).toHaveBeenCalledWith({ pageSize: 25 });
    fixture.componentInstance.changePageSize('50');
    expect(changed).toHaveBeenCalledWith({ pageSize: 50 });
    fixture.componentInstance.changePageSize('100');
    expect(changed).not.toHaveBeenCalledWith({ pageSize: 100 });
  });
});
