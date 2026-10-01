import { AsyncStateModel } from '../../common/models/async-state.model';
import { PokemonModel } from './pokemon.model';

export interface PokemonStateModel extends AsyncStateModel<readonly PokemonModel[]> {
  readonly entities: Readonly<Record<number, PokemonModel>>;
}
