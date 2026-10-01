import { TestBed } from '@angular/core/testing';
import { pokemonFixture, teamFixture } from '../../../common/testing/fixtures';
import { TeamMembersComponent } from './team-members.component';

describe('TeamMembersComponent', () => {
  it('reactively calculates totals and counts dual types in both distributions', () => {
    const fixture = TestBed.createComponent(TeamMembersComponent);
    fixture.componentRef.setInput('team', teamFixture());
    fixture.componentRef.setInput('state', {
      status: 'success',
      error: null,
      data: [pokemonFixture(1), { ...pokemonFixture(2), types: ['grass', 'poison'] }],
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.total()).toBe(600);
    expect(fixture.componentInstance.totals().find((stat) => stat.label === 'HP')?.value).toBe(100);
    expect(fixture.componentInstance.types()).toEqual([
      { type: 'grass', count: 2 },
      { type: 'poison', count: 1 },
    ]);
    fixture.componentRef.setInput('state', {
      status: 'success',
      error: null,
      data: [pokemonFixture(3)],
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.total()).toBe(300);
    expect(fixture.componentInstance.types()).toEqual([{ type: 'grass', count: 1 }]);
    fixture.destroy();
  });
  it('hides stale summaries during loading and offers retry after a hydration failure', () => {
    const fixture = TestBed.createComponent(TeamMembersComponent);
    fixture.componentRef.setInput('team', teamFixture());
    fixture.componentRef.setInput('state', {
      status: 'loading',
      error: null,
      data: [pokemonFixture(1)],
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.total()).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('Meeting your team');
    const retry = vi.fn();
    fixture.componentInstance.retry.subscribe(retry);
    fixture.componentRef.setInput('state', {
      status: 'error',
      error: 'Please try again.',
      data: [],
    });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    expect(retry).toHaveBeenCalledOnce();
    fixture.componentRef.setInput('state', { status: 'success', error: null, data: [] });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('This lineup has no members');
    fixture.destroy();
  });
});
