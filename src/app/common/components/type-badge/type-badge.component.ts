import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { POKEMON_TYPES } from '../../../pokedex/constants/pokemon.constants';

@Component({
  selector: 'app-type-badge',
  standalone: true,
  templateUrl: './type-badge.component.html',
  styleUrl: './type-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeBadgeComponent {
  readonly type = input.required<string>();
  readonly color = computed(() =>
    POKEMON_TYPES.some((type) => type === this.type())
      ? `var(--type-${this.type()})`
      : 'var(--type-normal)',
  );
}
