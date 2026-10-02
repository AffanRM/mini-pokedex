import { TestBed } from '@angular/core/testing';
import { ToastComponent } from './toast.component';

describe('ToastComponent', () => {
  it('announces success/error outcomes and emits dismissal from a focusable button', () => {
    const fixture = TestBed.createComponent(ToastComponent);
    fixture.componentRef.setInput('notification', {
      message: 'Team was created.',
      kind: 'success',
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      'Team was created.',
    );
    const dismissed = vi.fn();
    fixture.componentInstance.dismissed.subscribe(dismissed);
    const button = fixture.nativeElement.querySelector('button');
    button.focus();
    expect(document.activeElement).toBe(button);
    button.click();
    expect(dismissed).toHaveBeenCalledOnce();
    fixture.componentRef.setInput('notification', {
      message: 'Save failed. Your choices are kept.',
      kind: 'error',
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Save failed',
    );
    fixture.destroy();
  });
});
