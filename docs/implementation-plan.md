# Implementation plan

Build in small, reviewable stages. Each stage ends with appropriate checks and
a scoped Conventional Commit. Do not mark a checklist item complete without
evidence. No score is guaranteed; this plan targets every stated requirement.

GitHub owner: AffanRM; intended repository: mini-pokedex. The user runs all
commit/push commands manually. Prepare changes and provide commands at each
verified checkpoint; do not commit or push on the user's behalf.

Current checkpoint: stages 1–4 are published at
https://github.com/AffanRM/mini-pokedex with passing CI through `3c8ebad`.
Stage 5 is implemented and locally verified, ready for manual commits.
Stage 6 is next; only bonus option 4 is planned afterward if time permits.

1. **Foundation:** inspect the brief, validate tools, scaffold Angular 21,
   install dependencies, enforce style/commits, verify baseline, publish repo.
2. **Data layer:** typed GraphQL transport, bounded retry, mock schema validation,
   Pokemon/ability/team models, API services and tests for failures.
3. **Stores:** BehaviorSubject state, cached paginated catalog, derived selectors,
   cancellation-safe search, optimistic create/delete with targeted rollback.
4. **Pokedex UI:** shared async-state component, type badges, table controls,
   pagination, accessible detail panel and animated radar chart.
5. **Teams UI:** reactive form, async unique-name validation, autocomplete/chips,
   team cards, selection persistence and computed summaries.
6. **Submission review:** required tests plus relevant resilience coverage,
   offline/throttled browser QA, responsive/accessibility review, README,
   clean-install validation and final requirement audit.

## Planned structure

```text
src/app/
  app.component.{ts,html,scss}
  app.config.ts
  app.routes.ts
  core/
    graphql.service.ts
  common/
    components/
      async-state/
      pokemon-sprite/
      type-badge/
    constants/
    models/
    services/
      storage.service.ts
    utils/
  pokedex/
    constants/
    models/
    services/
      pokemon-api.service.ts
    state/
      pokemon.store.ts
      pokemon.selectors.ts
    components/
      pokemon-table/
      pokemon-detail/
      stat-radar/
    pokedex.component.{ts,html,scss}
  teams/
    constants/
    models/
    services/
      team-api.service.ts
    state/
      team.store.ts
    validators/
    components/
      team-builder/
      pokemon-picker/
      team-list/
src/assets/icons/ic_<name>.svg
```

## Architecture decisions

- Angular HttpClient carries explicit GraphQL documents and typed variables.
  RxJS controls request cancellation, retries and error propagation. A heavyweight
  GraphQL client is unnecessary for this assessment's custom store requirement.
- Stores own domain state and cached entities. Signals own component UI state.
  toSignal bridges selectors; computed derives summaries; effect persists selection.
- Upstream pagination and client table pagination are separate responsibilities.
  Confirm a complete, ordered catalog before claiming global client-side sorting.
- Keep error state distinct from empty data. Do not copy the guide's example
  that catches a request error and returns an empty successful result.
- Chart.js provides the required radar animation; destroy charts on teardown.
- Mock data comes from the supplied fixture. json-graphql-server is an ephemeral
  development API; do not claim durable storage unless tested and implemented.
- No auth, AWS services or unrelated dashboard dependencies.
- Add GitHub Actions for lint, format, tests and production build after the
  local commands are stable.

## Commit rules

`<type>(<scope>): <imperative lowercase subject>`; at most 100 characters,
no trailing period. Scopes include core, common, pokedex, teams, deps,
tooling, tests and readme. Complex bodies explain why, wrapped at 72 columns.

Suggested sequence: chore(tooling), docs(assessment), feat(core),
feat(pokedex), feat(teams), test(resilience), docs(readme).
