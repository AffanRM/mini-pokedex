const POKEMON_FIELDS = `
  id name height weight
  pokemon_v2_pokemontypes { pokemon_v2_type { name } }
  pokemon_v2_pokemonstats { base_stat pokemon_v2_stat { name } }
  pokemon_v2_pokemonsprites { sprites }
`;

export const POKEMON_LIST_QUERY = `
  query GetPokemon($limit: Int!, $offset: Int!) {
    pokemon_v2_pokemon(limit: $limit, offset: $offset, order_by: { id: asc }) {
      ${POKEMON_FIELDS}
    }
  }
`;

export const POKEMON_BY_IDS_QUERY = `
  query GetPokemonByIds($ids: [Int!]!) {
    pokemon_v2_pokemon(where: { id: { _in: $ids } }, order_by: { id: asc }) {
      ${POKEMON_FIELDS}
    }
  }
`;

export const POKEMON_SEARCH_QUERY = `
  query SearchPokemon($name: String!) {
    pokemon_v2_pokemon(where: { name: { _ilike: $name } }, limit: 20, order_by: { id: asc }) {
      ${POKEMON_FIELDS}
    }
  }
`;

export const POKEMON_ABILITIES_QUERY = `
  query GetAbilities($pokemonId: Int!) {
    pokemon_v2_pokemonability(where: { pokemon_id: { _eq: $pokemonId } }) {
      is_hidden
      pokemon_v2_ability {
        name
        pokemon_v2_abilityeffecttexts(where: { language_id: { _eq: 9 } }) { short_effect }
      }
    }
  }
`;
