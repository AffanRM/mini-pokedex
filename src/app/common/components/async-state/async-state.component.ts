import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LoadStatus } from '../../models/async-state.model';

@Component({
  selector: 'app-async-state',
  standalone: true,
  templateUrl: './async-state.component.html',
  styleUrl: './async-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsyncStateComponent {
  readonly status = input<LoadStatus | 'empty'>('loading');
  readonly title = input('Loading Pokémon');
  readonly message = input('Getting everything ready.');
  readonly retryLabel = input('Try again');
  readonly retry = output<void>();
}
