import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NotificationModel } from '../../models/notification.model';

@Component({
  selector: 'app-toast',
  standalone: true,
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  readonly notification = input.required<NotificationModel>();
  readonly dismissed = output<void>();
}
