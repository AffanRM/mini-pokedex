import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AsyncStateComponent } from '../../../common/components/async-state/async-state.component';
import { TeamStateModel } from '../../models/team-state.model';

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [AsyncStateComponent],
  templateUrl: './team-list.component.html',
  styleUrl: './team-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamListComponent {
  readonly state = input.required<TeamStateModel>();
  readonly selectedId = input<string | null>(null);
  readonly selected = output<string>();
  readonly deleted = output<string>();
  readonly retry = output<void>();
}
