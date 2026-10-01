import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { PokemonModel } from '../../../pokedex/models/pokemon.model';
import { DEFAULT_TRAINER_ID } from '../../constants/team.constants';
import { CreateTeamModel } from '../../models/team.model';
import { TeamStore } from '../../state/team.store';
import { teamNameValidator, uniqueTeamNameValidator } from '../../validators/team-name.validator';
import { teamSizeValidator } from '../../validators/team-size.validator';
import { normalizeTeamName } from '../../utils/normalize-team-name.util';
import { PokemonPickerComponent } from '../pokemon-picker/pokemon-picker.component';

@Component({
  selector: 'app-team-builder',
  standalone: true,
  imports: [ReactiveFormsModule, PokemonPickerComponent],
  templateUrl: './team-builder.component.html',
  styleUrl: './team-builder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamBuilderComponent {
  readonly available = input(false);
  readonly submitting = input(false);
  readonly error = input<string | null>(null);
  readonly savedVersion = input(0);
  readonly submitTeam = output<CreateTeamModel>();
  readonly selected = signal<readonly PokemonModel[]>([]);
  readonly disabled = computed(() => !this.available() || this.submitting());
  private readonly store = inject(TeamStore);
  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [teamNameValidator],
      asyncValidators: [uniqueTeamNameValidator(this.store.state$)],
    }),
    pokemonIds: new FormControl<readonly number[]>([], {
      nonNullable: true,
      validators: [teamSizeValidator],
    }),
  });
  // Async validator completion must notify OnPush templates in zoneless Angular.
  readonly formStatus = toSignal(this.form.statusChanges.pipe(startWith(this.form.status)), {
    requireSync: true,
  });

  constructor() {
    effect(() => {
      if (this.disabled()) this.form.disable({ emitEvent: false });
      else this.form.enable();
    });
    effect(() => {
      const version = this.savedVersion();
      if (version > 0) {
        this.form.reset({ name: '', pokemonIds: [] });
        this.selected.set([]);
      }
    });
  }
  changePicks(pokemon: readonly PokemonModel[]): void {
    this.selected.set(pokemon);
    this.form.controls.pokemonIds.setValue(pokemon.map((pick) => pick.id));
    this.form.controls.pokemonIds.markAsDirty();
  }
  touchPicks(): void {
    this.form.controls.pokemonIds.markAsTouched();
  }
  submit(): void {
    if (this.disabled()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid || this.form.pending) return;
    this.submitTeam.emit({
      name: normalizeTeamName(this.form.controls.name.value),
      pokemonIds: this.form.controls.pokemonIds.value,
      trainerId: DEFAULT_TRAINER_ID,
      createdAt: new Date().toISOString(),
    });
  }
  retryValidation(): void {
    this.form.controls.name.updateValueAndValidity();
  }
}
