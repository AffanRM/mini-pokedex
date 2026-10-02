import { ComponentFixture, TestBed } from '@angular/core/testing';
import { pokemonFixture } from '../../../common/testing/fixtures';
import { StatRadarComponent } from './stat-radar.component';

const chartState = vi.hoisted(() => ({
  instances: [] as {
    data: { datasets: { data: number[]; label: string }[] };
    update: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
  }[],
}));
vi.mock('chart.js', () => ({
  Chart: class {
    static register = vi.fn();
    data: { datasets: { data: number[]; label: string }[] };
    update = vi.fn();
    destroy = vi.fn();
    constructor(
      _canvas: unknown,
      config: { data: { datasets: { data: number[]; label: string }[] } },
    ) {
      this.data = config.data;
      chartState.instances.push(this);
    }
  },
  Filler: {},
  LineElement: {},
  PointElement: {},
  RadarController: {},
  RadialLinearScale: {},
  Tooltip: {},
}));

describe('StatRadarComponent', () => {
  let fixture: ComponentFixture<StatRadarComponent>;
  beforeEach(async () => {
    chartState.instances.length = 0;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({ matches: false })),
    });
    TestBed.configureTestingModule({ imports: [StatRadarComponent] });
    fixture = TestBed.createComponent(StatRadarComponent);
    fixture.componentRef.setInput('pokemon', pokemonFixture(1, 'bulbasaur'));
    fixture.detectChanges();
    // Flush render callbacks explicitly; stability alone can precede afterNextRender in CI.
    TestBed.tick();
    await fixture.whenStable();
  });
  afterEach(() => {
    fixture.destroy();
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it('animates an update on the same chart when a different Pokemon is selected and destroys it on teardown', async () => {
    expect(chartState.instances).toHaveLength(1);
    const chart = chartState.instances[0];
    const next = {
      ...pokemonFixture(2, 'ivysaur'),
      stats: {
        hp: 60,
        attack: 62,
        defense: 63,
        'special-attack': 80,
        'special-defense': 80,
        speed: 60,
      },
    };
    fixture.componentRef.setInput('pokemon', next);
    TestBed.tick();
    await fixture.whenStable();
    expect(chartState.instances).toHaveLength(1);
    expect(chart.data.datasets[0].data).toEqual([60, 62, 63, 80, 80, 60]);
    expect(chart.data.datasets[0].label).toBe('ivysaur');
    // The default update mode preserves animation; update('none') would suppress it.
    expect(chart.update).toHaveBeenCalledWith();
    fixture.destroy();
    expect(chart.destroy).toHaveBeenCalledOnce();
  });
});
