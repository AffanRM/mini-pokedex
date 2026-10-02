# Mini Pokedex

Angular 21 frontend assessment using GraphQL, custom RxJS stores and Angular Signals.

**Current status:** all required features and bonus option 4 are implemented.
Local validation and browser resilience review are complete. The owner still
needs to publish the final commits and confirm their GitHub Actions result.
Track verified requirements in
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
catalog caching, selectors, optimistic rollback/concurrency, form validators,
table interactions, detail states, chart lifecycle, team workflows, persistence
and component teardown. Currently 54 tests in 17 files pass.
The published checkpoint was also verified with a fresh clone and `npm ci`.
The final source snapshot is checked separately with the updated lockfile.

The build-worker override pins Piscina 5.3.2 to address
[GHSA-67c8-pqhq-4rmx](https://github.com/advisories/GHSA-67c8-pqhq-4rmx)
while retaining Angular 21. `npm audit` reports zero vulnerabilities at review
time; future advisory results can change. CI uses the current Node 24 actions.

## Browse the Pokédex

Search by name, combine it with a type filter, and sort any of the six stats or
the total in either direction. Choose 10, 25 or 50 rows per page. The catalog
includes alternate forms supplied by the API, so the count can change upstream.
Click a row or activate its name button with the keyboard to open its profile.
The panel shows measurements, English ability effects and an animated radar.
Previous/Next follows the filtered, sorted catalog. Escape closes the panel and
returns focus to the row's button. Reduced-motion preferences disable animations.

Loading preserves table/detail layout. Zero matches offer Clear filters; failed
catalog/detail requests offer a friendly message and explicit Retry. Automated
tests cover these states and cancellation when selection changes. Live browser
checks cover search, filtering, paging, detail navigation, keyboard closing and
desktop/mobile layouts. An isolated QA copy forwarded real GraphQL requests
through a local fault proxy: delayed responses showed loading, injected outages
showed friendly errors, and explicit retries recovered the catalog and details.
The production app continues to call the public API directly. See
[validation evidence](docs/validation.md) for the exact scope of these checks.

## Build and explore teams

Open the Teams tab. The supplied three teams load from the mock API. Select a
team to see its members in slot order, combined base stats and type distribution.
Dual-type members count in both of their types. Selection persists in localStorage;
blocked storage does not prevent using the app. Temporary optimistic IDs are
never persisted, and deleted/missing selections fall back to an available team.

The reactive builder requires a unique name of 3–30 normalized characters and
1–6 different Pokémon. Name checks and autocomplete debounce for 300ms. The
picker supports arrow keys, Enter, Escape and removable chips. Validation appears
after interaction or a submit attempt. New teams use Ash Ketchum's trainer ID.

A new team appears immediately while saving. Failures roll it back and retain
the form values for an explicit retry. Successful saves clear the form and select
the saved team. Deletions are optimistic, with rollback and Retry deletion on
failure. List and member-load failures have independent retry actions. Refresh
is disabled while mutations are pending. Multiple independent deletions can
finish concurrently; repeated form submissions are guarded.

Live browser review verified creation/deletion, selected-team reload persistence,
duplicate-name checks, keyboard picking, empty autocomplete, desktop/mobile
layouts and saving while the mock was stopped, then retrying after restart.
QA teams were removed. Notifications report successful and failed mutations;
dismissing a notification keeps inline recovery controls available.
Restarting the mock resets all teams to the original
fixture; it does not provide durable backend storage.

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

Observable selectors feed templates through `toSignal()`. Signals hold selection
and panel visibility; `computed()` derives loading state and adjacent Pokémon.
Detail selection uses `switchMap` to cancel stale requests. The chart instance
survives profile changes, animates dataset updates and is destroyed on teardown.
Team-member summaries use `computed()`, and `effect()` persists the selected team
through a storage service that tolerates browser privacy/quota restrictions.
Async validator status is bridged with `toSignal()` so completion updates OnPush
templates in zoneless Angular. Requests owned by a view cancel when it leaves;
finite optimistic mutations finish in the store and reconcile their records.
Components are standalone and OnPush,
with separate HTML/SCSS and signal-based inputs/outputs.

No AWS Amplify or authentication is used. Chart.js radar controllers are explicitly
registered; the Pokédex and Teams routes are lazy loaded. Shared sprites, type badges and
async-state components keep presentation consistent. SCSS uses BEM and root CSS
tokens; decorative SVG assets have fixed dimensions and accessible treatment.

## Bonus scope

Only option 4 is implemented: table/detail skeleton shimmer, staggered member-card
entry and dismissible success/error mutation toasts. Notifications remain until
dismissed or replaced by the next mutation. Reduced-motion preferences disable
CSS animations, and the radar uses a zero-duration update. No other bonus is included.

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
