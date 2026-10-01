import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';

@Component({
  selector: 'app-pokemon-sprite',
  standalone: true,
  templateUrl: './pokemon-sprite.component.html',
  styleUrl: './pokemon-sprite.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonSpriteComponent {
  readonly name = input.required<string>();
  readonly url = input<string | null>(null);
  readonly size = input(64);
  readonly priority = input(false);
  readonly failed = signal(false);

  constructor() {
    effect(() => {
      this.url();
      this.failed.set(false);
    });
  }
}
