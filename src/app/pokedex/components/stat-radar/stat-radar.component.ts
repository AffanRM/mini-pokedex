import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {
  Chart,
  Filler,
  LineElement,
  PointElement,
  RadarController,
  RadialLinearScale,
  Tooltip,
} from 'chart.js';
import { STAT_NAMES } from '../../constants/pokemon.constants';
import { PokemonModel } from '../../models/pokemon.model';

Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

@Component({
  selector: 'app-stat-radar',
  standalone: true,
  templateUrl: './stat-radar.component.html',
  styleUrl: './stat-radar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatRadarComponent {
  readonly pokemon = input<PokemonModel | null>(null);
  readonly busy = input(false);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly destroyRef = inject(DestroyRef);
  private chart?: Chart<'radar'>;

  constructor() {
    afterNextRender(() => this.createChart());
    effect(() => {
      const pokemon = this.pokemon();
      if (this.chart && pokemon) {
        this.chart.data.datasets[0].data = STAT_NAMES.map((stat) => pokemon.stats[stat]);
        this.chart.data.datasets[0].label = pokemon.name;
        this.chart.update();
      }
    });
    this.destroyRef.onDestroy(() => this.chart?.destroy());
  }

  private createChart(): void {
    const canvas = this.canvas()?.nativeElement;
    if (!canvas) return;
    const styles = getComputedStyle(canvas);
    const color = styles.getPropertyValue('--color-primary').trim();
    this.chart = new Chart(canvas, {
      type: 'radar',
      data: {
        labels: ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed'],
        datasets: [
          {
            label: this.pokemon()?.name ?? 'Base stats',
            data: STAT_NAMES.map((stat) => this.pokemon()?.stats[stat] ?? 0),
            fill: true,
            borderColor: color,
            backgroundColor: `${color}20`,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: color,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650,
        },
        plugins: { tooltip: { enabled: true } },
        scales: {
          r: {
            min: 0,
            max: 255,
            ticks: { display: false, stepSize: 51 },
            pointLabels: {
              color: styles.getPropertyValue('--color-muted').trim(),
              font: { size: 11 },
            },
            grid: { color: styles.getPropertyValue('--color-border').trim() },
            angleLines: { color: styles.getPropertyValue('--color-border').trim() },
          },
        },
      },
    });
  }
}
