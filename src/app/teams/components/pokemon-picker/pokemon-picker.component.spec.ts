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
    search.mockReturnValueOnce(of([]));
    fixture.nativeElement.querySelector('.async-state button').click();
    fixture.detectChanges();
    expect(search).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('No available Pokémon');
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
    fixture.detectChanges();
    const changed = vi.fn();
    fixture.componentInstance.selectedChanged.subscribe(changed);
    fixture.componentInstance.pick(pokemonFixture(7));
    expect(changed).not.toHaveBeenCalled();
    fixture.destroy();
    expect(response.observed).toBe(false);
  });
});
