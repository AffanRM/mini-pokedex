# Mini Pokedex

Angular 21 frontend assessment using GraphQL, custom RxJS stores and Angular Signals.

**Current status:** foundation, GraphQL services, RxJS stores and form validators
are implemented and tested. The browsing/detail/team interfaces are next; the
app still displays its foundation screen. Track verified requirements in
[the assessment checklist](docs/assessment-checklist.md) and build stages in
[the implementation plan](docs/implementation-plan.md).

## Prerequisites

- Node.js 24 LTS recommended (Angular 21 also supports ^20.19 or ^22.12).
- npm (initialized with npm 11.6.1).
- Git.

## Local setup

```sh
npm ci
```

Start the mock GraphQL API in one terminal:

```sh
npm run mock
```

It runs at http://localhost:4000 and loads the two trainers and three teams
from `db.js`. Mock mutations are in memory; restarting resets the fixture.
The clipped trainer image URL in the supplied PDF is completed to `.png`.

Start Angular in another terminal:

```sh
npm start
```

Open http://localhost:4200. `npm start` runs `ng serve`; no global Angular CLI
installation is required. The public Pokemon API will require internet access.

## Validation

```sh
npm run lint
npm run format:check
npm run test:ci
npm run build
```

`npm run check` runs all four commands. `npm run format` formats source and
configuration files. Tests cover GraphQL errors/retry/timeout/cancellation,
catalog caching, selectors, optimistic rollback/concurrency and form validators.

## Architecture

Feature folders contain `pokedex` and `teams` models, API services,
components and BehaviorSubject stores. Shared UI/utilities live in `common`;
GraphQL transport lives in `core`. BehaviorSubject stores own domain state.
Selectors compose filtering, stat sorting and clamped client pagination.
The complete catalog is loaded in ordered batches of 100 before global table
filtering/sorting; team members and details can load independently into the cache.
Autocomplete debounces for 300ms and cancels stale requests with `switchMap`.

Read streams share in-flight work with reference counting. Creating/deleting a
team updates the list optimistically; failures roll back only the affected item.
A started mutation finishes even if its initiating component leaves, bounded by
the transport timeout. This prevents component teardown from leaving provisional
teams in the store. Mutations are not automatically retried.

Next, observable selectors will feed templates through `toSignal()`, Signals will
hold UI state, `computed()` will derive summaries, and `effect()` will persist
the selected team. Components are standalone and OnPush,
with separate HTML/SCSS and signal-based inputs/outputs.

No AWS Amplify or authentication is used. Chart.js is installed for the detail
radar chart. Radar rendering and component communication are pending.

## Commits

Husky runs lint and formatting before commits. commitlint validates scoped
Conventional Commit messages, for example:

```text
feat(pokedex): add sortable stats table
fix(teams): roll back failed optimistic creation
```

The repository owner is **AffanRM**. The developer runs all commit and push
commands manually; the coding agent prepares tested changes and supplies commands.
Keep changes focused and commit each verified build stage. Assessment PDFs,
temporary files and local credentials are excluded from Git.

## Improvements with more time

After completing required behavior: durable team storage instead of the
ephemeral mock, generated GraphQL types from pinned schemas, and broader
automated browser coverage for network failures and accessibility. A production
backend should support idempotency keys: the mock cannot guarantee whether a
mutation was applied if its response is lost or times out.
