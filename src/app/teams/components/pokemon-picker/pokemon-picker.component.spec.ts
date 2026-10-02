import { ComponentFixture, TestBed } from '@angular/core/testing';
import { pokemonFixture } from '../../../common/testing/fixtures';
import { ApiError } from '../../../core/graphql.service';
import { PokemonApiService } from '../../../pokedex/services/pokemon-api.service';
import { Subject, of } from 'rxjs';
import { PokemonModel } from '../../../pokedex/models/pokemon.model';
import { PokemonPickerComponent } from './pokemon-picker.component';

describe('PokemonPickerComponent', () => {
  let fixture: ComponentFixture<PokemonPickerComponent>;
  const search = vi.fn();
  beforeEach(async () => {
    vi.useFakeTimers();
    search.mockReset();
    search.mockReturnValue(of([pokemonFixture(1, 'bulbasaur')]));
    TestBed.configureTestingModule({
      imports: [PokemonPickerComponent],
      providers: [{ provide: PokemonApiService, useValue: { search$: search } }],
    });
    fixture = TestBed.createComponent(PokemonPickerComponent);
    fixture.detectChanges();
  });
  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });
  it('debounces API searches, hides results while typing, and supports keyboard selection/removal without duplicates', async () => {
    const changed = vi.fn();
    fixture.componentInstance.selectedChanged.subscribe(changed);
    fixture.componentInstance.onFocus();
    fixture.componentInstance.search.setValue('bul');
    await vi.advanceTimersByTimeAsync(299);
    expect(search).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    fixture.detectChanges();
    expect(search).toHaveBeenCalledWith('bul');
    expect(fixture.componentInstance.status()).toBe('success');
    fixture.componentInstance.search.setValue('ivy');
    fixture.detectChanges();
    expect(fixture.componentInstance.status()).toBe('loading');
    fixture.componentInstance.search.setValue('bul');
    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();
    fixture.componentInstance.onKeydown(
      new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }),
    );
    expect(changed).toHaveBeenCalledWith([expect.objectContaining({ id: 1 })]);
    fixture.componentRef.setInput('selected', [pokemonFixture(1)]);
    fixture.detectChanges();
    fixture.componentInstance.pick(pokemonFixture(1));
    expect(changed).toHaveBeenCalledOnce();
    fixture.componentInstance.remove(1);
    expect(changed).toHaveBeenLastCalledWith([]);
  });
  it('offers error retry, loading and empty states through the real search store', async () => {
    const response = new Subject<readonly PokemonModel[]>();
    search.mockReturnValueOnce(response);
    fixture.componentInstance.onFocus();
    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Finding Pokémon');
    response.error(new ApiError('Check your connection and try again.'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Check your connection',
    );
    const recovered = new Subject<readonly PokemonModel[]>();
    search.mockReturnValueOnce(recovered);
    const retryButton = fixture.nativeElement.querySelector('.async-state button');
    retryButton.focus();
    retryButton.click();
    fixture.detectChanges();
    expect(search).toHaveBeenCalledTimes(2);
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('input'));
    expect(fixture.componentInstance.open()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Finding Pokémon');
    recovered.next([]);
    recovered.complete();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No available Pokémon');
  });
  it('reopens suggestions when typing the next pick without leaving the focused input', async () => {
    search.mockImplementation((query: string) =>
      of([pokemonFixture(query === 'ivy' ? 2 : 1, query === 'ivy' ? 'ivysaur' : 'bulbasaur')]),
    );
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.focus();
    input.value = 'bul';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.componentRef.setInput('selected', [pokemonFixture(1, 'bulbasaur')]);
    fixture.detectChanges();
    expect(document.activeElement).toBe(input);
    expect(fixture.componentInstance.open()).toBe(false);

    input.value = 'ivy';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain('Finding Pokémon');
    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="option"]')?.textContent).toContain(
      'Ivysaur',
    );
    expect(document.activeElement).toBe(input);
  });
  it('rejects seventh picks and cancels unfinished typeahead on teardown', async () => {
    const response = new Subject<readonly PokemonModel[]>();
    search.mockReturnValueOnce(response);
    await vi.advanceTimersByTimeAsync(300);
    expect(response.observed).toBe(true);
    fixture.componentRef.setInput(
      'selected',
      Array.from({ length: 6 }, (_, index) => pokemonFixture(index + 1)),
    );
    fixture.componentInstance.onFocus();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input')?.getAttribute('aria-expanded')).toBe(
      'false',
    );
    expect(fixture.nativeElement.querySelector('.pokemon-picker__dropdown')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Your six slots are full.');
    const changed = vi.fn();
    fixture.componentInstance.selectedChanged.subscribe(changed);
    fixture.componentInstance.pick(pokemonFixture(7));
    expect(changed).not.toHaveBeenCalled();
    fixture.destroy();
    expect(response.observed).toBe(false);
  });
});
