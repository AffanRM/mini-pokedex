# Mini Pokedex

Angular 21 frontend assessment using GraphQL, custom RxJS stores and Angular Signals.

**Current status:** project foundation only. Pokemon browsing, details and team
management have not been implemented yet. Track verified requirements in
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
configuration files. Foundation smoke tests do not replace the assessment's
required store, selector and validator tests; those will be added with the features.

## Architecture

Feature folders will contain `pokedex` and `teams` models, API services,
components and BehaviorSubject stores. Shared UI/utilities live in `common`;
GraphQL transport lives in `core`. Observable selectors feed templates through
`toSignal()`. Signals hold UI state, `computed()` derives summaries, and
`effect()` persists the selected team. Components are standalone and OnPush,
with separate HTML/SCSS and signal-based inputs/outputs.

No AWS Amplify or authentication is used. Chart.js is installed for the detail
radar chart. The application data layer is still pending.

## Commits

Husky runs lint and formatting before commits. commitlint validates scoped
Conventional Commit messages, for example:

```text
feat(pokedex): add sortable stats table
fix(teams): roll back failed optimistic creation
```

Keep changes focused and commit each verified build stage. Assessment PDFs,
temporary files and local credentials are excluded from Git.

## Improvements with more time

After completing required behavior: durable team storage instead of the
ephemeral mock, generated GraphQL types from pinned schemas, and broader
automated browser coverage for network failures and accessibility.
