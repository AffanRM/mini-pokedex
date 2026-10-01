import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { pokemonFixture } from '../common/testing/fixtures';
import { ApiError } from '../core/graphql.service';
import { PokemonModel } from './models/pokemon.model';
import { PokedexPage } from './pokedex.component';
import { PokemonApiService } from './services/pokemon-api.service';

describe('PokedexPage integration', () => {
  it('surfaces catalog failure through the real store and table, then retries successfully', async () => {
    const first = new Subject<readonly PokemonModel[]>();
    const retry = new Subject<readonly PokemonModel[]>();
    const getCatalog = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(retry);
    TestBed.configureTestingModule({
      imports: [PokedexPage],
      providers: [{ provide: PokemonApiService, useValue: { getCatalog$: getCatalog } }],
    });
    const fixture = TestBed.createComponent(PokedexPage);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.isLoading()).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('.pokemon-table__skeleton')).toHaveLength(10);
    first.error(new ApiError('Check your connection and try again.'));
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Check your connection');
    [...element.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.includes('Try again'))
      ?.click();
    expect(getCatalog).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.isLoading()).toBe(true);
    retry.next([pokemonFixture(1, 'bulbasaur')]);
    retry.complete();
    await fixture.whenStable();
    expect(element.textContent).toContain('Bulbasaur');
    expect(fixture.componentInstance.state().status).toBe('success');
    fixture.destroy();
  });
});
