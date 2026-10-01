import { PokemonModel } from '../../pokedex/models/pokemon.model';
import { CreateTeamModel, TeamModel } from '../../teams/models/team.model';

export function pokemonFixture(id: number, name = `pokemon-${id}`, total = 300): PokemonModel {
  return {
    id,
    name,
    height: 1,
    weight: 10,
    types: ['grass'],
    sprite: null,
    total,
    stats: {
      hp: 50,
      attack: 50,
      defense: 50,
      'special-attack': 50,
      'special-defense': 50,
      speed: 50,
    },
  };
}

export function teamFixture(id = '1', name = 'Original team'): TeamModel {
  return { id, name, trainerId: '1', pokemonIds: [1], createdAt: '2026-10-01T10:00:00Z' };
}

export const CREATE_TEAM_FIXTURE: CreateTeamModel = {
  name: 'New team',
  trainerId: '1',
  pokemonIds: [1, 4],
  createdAt: '2026-10-01T10:00:00Z',
};
