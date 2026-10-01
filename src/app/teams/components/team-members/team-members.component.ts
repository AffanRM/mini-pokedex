import { TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AsyncStateComponent } from '../../../common/components/async-state/async-state.component';
import { PokemonSpriteComponent } from '../../../common/components/pokemon-sprite/pokemon-sprite.component';
import { TypeBadgeComponent } from '../../../common/components/type-badge/type-badge.component';
import { AsyncStateModel } from '../../../common/models/async-state.model';
import { STAT_COLUMNS } from '../../../pokedex/constants/stat-columns.constants';
import { PokemonModel } from '../../../pokedex/models/pokemon.model';
import { TeamModel } from '../../models/team.model';

@Component({
  selector: 'app-team-members',
  standalone: true,
  imports: [TitleCasePipe, AsyncStateComponent, PokemonSpriteComponent, TypeBadgeComponent],
  templateUrl: './team-members.component.html',
  styleUrl: './team-members.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamMembersComponent {
  readonly team = input<TeamModel | null>(null);
  readonly state = input.required<AsyncStateModel<readonly PokemonModel[]>>();
  readonly retry = output<void>();
  readonly columns = STAT_COLUMNS.filter((column) => column.key !== 'total');
  readonly rows = computed(() => Math.ceil((this.team()?.pokemonIds.length ?? 0) / 3));
  readonly mobileRows = computed(() => Math.ceil((this.team()?.pokemonIds.length ?? 0) / 2));
  readonly members = computed(() => (this.state().status === 'success' ? this.state().data : []));
  readonly total = computed(() => this.members().reduce((sum, pokemon) => sum + pokemon.total, 0));
  readonly totals = computed(() =>
    this.columns.map((column) => ({
      label: column.label,
      value: this.members().reduce(
        (sum, pokemon) =>
          sum + (column.key === 'total' ? pokemon.total : pokemon.stats[column.key]),
        0,
      ),
    })),
  );
  readonly types = computed(() => {
    const counts = new Map<string, number>();
    for (const pokemon of this.members())
      for (const type of pokemon.types) counts.set(type, (counts.get(type) ?? 0) + 1);
    return [...counts]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([type, count]) => ({ type, count }));
  });
}
