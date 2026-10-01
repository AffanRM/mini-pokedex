import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { pokemonFixture } from '../../../common/testing/fixtures';
import { ApiError } from '../../../core/graphql.service';
import { PokemonDetailModel } from '../../models/pokemon.model';
import { PokemonStore } from '../../state/pokemon.store';
import { PokemonDetailComponent } from './pokemon-detail.component';

const chartState = vi.hoisted(() => ({ dialogOpenAtCreation: [] as boolean[] }));
vi.mock('chart.js', () => ({
  Chart: class {
    static register = vi.fn();
    data: { datasets: { data: number[]; label: string }[] };
    update = vi.fn();
    destroy = vi.fn();
    constructor(
      canvas: HTMLCanvasElement,
      config: { data: { datasets: { data: number[]; label: string }[] } },
    ) {
      this.data = config.data;
      chartState.dialogOpenAtCreation.push(canvas.closest('dialog')?.open ?? false);
    }
  },
  Filler: {},
  LineElement: {},
  PointElement: {},
  RadarController: {},
  RadialLinearScale: {},
  Tooltip: {},
}));

describe('PokemonDetailComponent', () => {
  let fixture: ComponentFixture<PokemonDetailComponent>;
  let response: Subject<PokemonDetailModel | null>;
  const getDetail = vi.fn();

  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({ matches: false })),
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value() {
        this.open = true;
      },
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value() {
        this.open = false;
        this.dispatchEvent(new Event('close'));
      },
    });
  });
  afterAll(() => {
    Reflect.deleteProperty(window, 'matchMedia');
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  });
  beforeEach(async () => {
    chartState.dialogOpenAtCreation.length = 0;
    getDetail.mockReset();
    response = new Subject<PokemonDetailModel | null>();
    getDetail.mockReturnValue(response);
    TestBed.configureTestingModule({
      imports: [PokemonDetailComponent],
      providers: [{ provide: PokemonStore, useValue: { getDetail$: getDetail } }],
    });
    fixture = TestBed.createComponent(PokemonDetailComponent);
    fixture.componentRef.setInput('pokemonId', 1);
    fixture.componentRef.setInput('pokemonName', 'bulbasaur');
    fixture.detectChanges();
    await fixture.whenStable();
  });
  afterEach(() => fixture.destroy());

  it('opens the dialog before Chart.js measures the canvas, including cached profile reopening', async () => {
    expect(chartState.dialogOpenAtCreation).toEqual([true]);
    fixture.destroy();
    getDetail.mockReturnValueOnce(of({ ...pokemonFixture(1, 'bulbasaur'), abilities: [] }));
    fixture = TestBed.createComponent(PokemonDetailComponent);
    fixture.componentRef.setInput('pokemonId', 1);
    fixture.componentRef.setInput('pokemonName', 'bulbasaur');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.displayStatus()).toBe('success');
    expect(chartState.dialogOpenAtCreation).toEqual([true, true]);
  });

  it('renders loading/empty/error/success and retries a failed profile without closing the panel', async () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance.displayStatus()).toBe('loading');
    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();
    response.next(null);
    response.complete();
    await fixture.whenStable();
    expect(element.textContent).toContain('Pokémon not found');
    const failed = new Subject<PokemonDetailModel | null>();
    getDetail.mockReturnValueOnce(failed);
    fixture.componentRef.setInput('pokemonId', 2);
    await fixture.whenStable();
    failed.error(new ApiError('Check your connection and try again.'));
    await fixture.whenStable();
    expect(element.textContent).toContain('Details couldn’t load');
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Check your connection');
    const retry = new Subject<PokemonDetailModel | null>();
    getDetail.mockReturnValueOnce(retry);
    [...element.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.includes('Try again'))
      ?.click();
    expect(getDetail).toHaveBeenCalledTimes(3);
    retry.next({
      ...pokemonFixture(2, 'ivysaur'),
      abilities: [{ name: 'overgrow', effect: 'Boosts Grass moves.', hidden: false }],
    });
    retry.complete();
    await fixture.whenStable();
    expect(element.textContent).toContain('Overgrow');
    expect(fixture.componentInstance.displayStatus()).toBe('success');
  });

  it('discards stale details on selection changes while retaining the existing radar component', async () => {
    response.next({ ...pokemonFixture(1, 'bulbasaur'), abilities: [] });
    await fixture.whenStable();
    const radar = fixture.nativeElement.querySelector('app-stat-radar');
    const next = new Subject<PokemonDetailModel | null>();
    getDetail.mockReturnValueOnce(next);
    fixture.componentRef.setInput('pokemonId', 2);
    fixture.componentRef.setInput('pokemonName', 'ivysaur');
    await fixture.whenStable();
    expect(fixture.componentInstance.state().status).toBe('loading');
    expect(fixture.componentInstance.state().data?.id).toBe(1);
    response.next({ ...pokemonFixture(999, 'stale'), abilities: [] });
    expect(fixture.componentInstance.state().data?.id).toBe(1);
    next.next({ ...pokemonFixture(2, 'ivysaur'), abilities: [] });
    next.complete();
    await fixture.whenStable();
    expect(fixture.componentInstance.state().data?.id).toBe(2);
    expect(fixture.nativeElement.querySelector('app-stat-radar')).toBe(radar);
  });

  it('uses the native dialog close event to inform the parent', () => {
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    (
      fixture.nativeElement.querySelector(
        'button[aria-label="Close Pokémon details"]',
      ) as HTMLButtonElement
    ).click();
    expect(closed).toHaveBeenCalledOnce();
  });
});
