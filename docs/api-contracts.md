# Verified API contracts

Verified on 2026-10-01 with the provided fixture and json-graphql-server 3.3.2.

## Public Pokemon API

Endpoint: `https://beta.pokeapi.co/graphql/v1beta`.

An ordered query with `limit: 1` returned Bulbasaur, height/weight, two types,
all six stats and sprite data. `sprites` is currently a JSON object; the mapper
should accept a serialized JSON string as well and tolerate missing sprites.
Order by ID explicitly when requesting pages. Network failures and GraphQL
`errors` must propagate to UI error state rather than becoming an empty success.

## Local mock

Endpoint: `http://localhost:4000/`.

```graphql
query GetTeams {
  allTeams {
    id
    trainer_id
    name
    pokemon_ids
    created_at
  }
}

mutation CreateTeam($trainerId: ID!, $name: String!, $pokemonIds: [Int]!, $createdAt: String!) {
  createTeam(
    trainer_id: $trainerId
    name: $name
    pokemon_ids: $pokemonIds
    created_at: $createdAt
  ) {
    id
    trainer_id
    name
    pokemon_ids
    created_at
  }
}

mutation RemoveTeam($id: ID!) {
  removeTeam(id: $id) {
    id
  }
}
```

The query returned all three supplied teams. `id` and `trainer_id` serialize
as strings even though the fixture uses numbers. `pokemon_ids` remains an
array of integers. Creation's required arguments and removal's ID argument
were verified through schema introspection; the mutation flow still needs
implementation and end-to-end verification.

The server also exposes `deleteTeam`. Use `removeTeam` consistently. Its
in-memory database resets when the process restarts.
