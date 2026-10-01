export interface PokemonResponseModel {
  readonly id: number;
  readonly name: string;
  readonly height: number;
  readonly weight: number;
  readonly pokemon_v2_pokemontypes: readonly {
    readonly pokemon_v2_type: { readonly name: string };
  }[];
  readonly pokemon_v2_pokemonstats: readonly {
    readonly base_stat: number;
    readonly pokemon_v2_stat: { readonly name: string };
  }[];
  readonly pokemon_v2_pokemonsprites: readonly { readonly sprites: unknown }[];
}

export interface PokemonQueryModel {
  readonly pokemon_v2_pokemon: readonly PokemonResponseModel[];
}

export interface AbilityQueryModel {
  readonly pokemon_v2_pokemonability: readonly {
    readonly is_hidden: boolean;
    readonly pokemon_v2_ability: {
      readonly name: string;
      readonly pokemon_v2_abilityeffecttexts: readonly { readonly short_effect: string }[];
    };
  }[];
}
