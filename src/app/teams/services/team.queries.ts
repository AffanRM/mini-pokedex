const TEAM_FIELDS = 'id trainer_id name pokemon_ids created_at';

export const TEAMS_QUERY = `query GetTeams { allTeams { ${TEAM_FIELDS} } }`;
export const CREATE_TEAM_MUTATION = `
  mutation CreateTeam($trainerId: ID!, $name: String!, $pokemonIds: [Int]!, $createdAt: String!) {
    createTeam(trainer_id: $trainerId, name: $name, pokemon_ids: $pokemonIds, created_at: $createdAt) {
      ${TEAM_FIELDS}
    }
  }
`;
export const REMOVE_TEAM_MUTATION = `
  mutation RemoveTeam($id: ID!) { removeTeam(id: $id) { id } }
`;
