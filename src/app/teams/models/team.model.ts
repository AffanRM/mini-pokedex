export interface TeamModel {
  readonly id: string;
  readonly trainerId: string;
  readonly name: string;
  readonly pokemonIds: readonly number[];
  readonly createdAt: string;
  readonly pending?: boolean;
}

export interface CreateTeamModel {
  readonly trainerId: string;
  readonly name: string;
  readonly pokemonIds: readonly number[];
  readonly createdAt: string;
}

export interface TeamResponseModel {
  readonly id: string;
  readonly trainer_id: string;
  readonly name: string;
  readonly pokemon_ids: readonly number[];
  readonly created_at: string;
}
