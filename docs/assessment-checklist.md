# Mini Pokedex assessment checklist

Status: required Pokédex/Teams features implemented and locally verified;
published Pokédex commits and CI verified. Teams checkpoint publication, final
submission review and the single optional bonus remain pending. An unchecked
item is not yet verified.

## Evaluation and scope

| Category                     | Weight | Evidence required                                                           |
| ---------------------------- | -----: | --------------------------------------------------------------------------- |
| UI states and error handling |    25% | Four states in every async view; offline/throttled tests; working Retry     |
| Structure and conventions    |    20% | Feature folders, guide naming, standalone OnPush, conventional history      |
| RxJS state management        |    20% | BehaviorSubject stores, selectors, debounce/cancellation, rollback, cleanup |
| Signals                      |    15% | signal, computed, effect, toSignal, input/output                            |
| UI components                |    10% | Complete table, detail chart, reactive form and autocomplete                |
| Tests and README             |    10% | Meaningful passing tests and reproducible setup                             |

The assessment overrides the guide's AWS examples: no AWS Amplify or auth.
Use Angular 21, RxJS 7.8 and compatible TypeScript 5.9. Do not introduce
NgRx, Akita or NgXS. The brief estimates 10 hours with a three-day deadline
from receipt; confirm the actual receipt date separately.

## 1. Foundation

- [x] Verify Node, npm and Git compatibility.
- [x] Create strict Angular 21 standalone project with SCSS and routing.
- [x] Install compatible dependencies and commit the lockfile.
- [x] Configure ESLint, Prettier, Husky and commitlint.
- [x] Verify production build, tests, lint and formatting.
- [x] Initialize Git and create a public GitHub repository.
- [x] Keep assessment PDFs, temporary files and secrets out of public Git.

## 2. GraphQL and state

- [x] PokéAPI paginated queries include types, all six stats and sprites.
- [x] Detail query by ID includes measurements, stats and English ability effects.
- [x] Local mock runs on port 4000 with the three supplied teams and two trainers.
- [x] Verify the generated mock schema before writing mutation signatures.
- [x] Fetch teams; create and delete teams through GraphQL.
- [x] Retry PokéAPI queries with delay and bound request duration.
- [x] Handle HTTP failures and GraphQL errors returned with HTTP 200.
- [x] Every failed operation reaches a friendly UI message and retry path.
- [x] `pokedex/state/pokemon.store.ts`: BehaviorSubject core state and cached Pokemon.
- [x] `pokedex/state/pokemon.selectors.ts`: filter, sort and page using map,
      distinctUntilChanged and combineLatest.
- [x] Search uses debounceTime(300), distinctUntilChanged and switchMap.
- [x] `teams/state/team.store.ts`: BehaviorSubject teams and optimistic mutations.
- [x] Show a new team immediately; replace its temporary ID on success.
- [x] Roll back failed creation and report it; preserve unrelated operations.
- [x] Delete optimistically, with rollback and a retry path on failure.
- [x] Use shareReplay(1) for shared derived streams with deliberate lifecycle handling.
- [x] Clean subscriptions with takeUntilDestroyed/DestroyRef/async pipe/toSignal.

## 3. Components and Signals

- [x] All implemented components standalone, OnPush, with inject() dependency injection.
- [x] Pokédex UI selection/panel state uses signal(); loading derives with computed().
- [x] computed() derives selected-team type distribution and base-stat totals.
- [x] effect() persists selected team to localStorage; tolerate unavailable storage.
- [x] toSignal() bridges store selectors into templates.
- [x] Implemented component inputs/outputs use input()/output(), never legacy decorators.
- [x] Components use separate `.component.ts`, `.component.html`, `.component.scss`.
- [x] Service/model/util names follow `.service.ts`, `.model.ts`, `.util.ts`.
- [x] Public service/store methods have JSDoc.
- [x] SCSS uses BEM and :root CSS custom properties for design tokens.
- [x] SVG icons use `src/assets/icons/ic_<name>.svg`, fixed dimensions,
      decorative alt="" and aria-hidden="true" where appropriate.

## 4. Pokedex table and detail panel

- [x] Columns: sprite, name, colored types, HP, Attack, Defense, Sp.Atk,
      Sp.Def, Speed and total.
- [x] Every stat column, including total, sorts ascending/descending.
- [x] Client pagination offers 10/25/50 rows; reset/clamp pages after filtering.
- [x] Debounced name search and dropdown type filter compose with sorting/paging.
- [x] Fetch upstream data in pages; document catalog completeness and cache strategy.
- [x] Row activation opens a sliding detail side panel; keyboard activation works.
- [x] Full Pokemon info and abilities are shown with meaningful empty cases.
- [x] Chart.js radar displays six stats and animates when Pokemon changes.
- [x] Cancel stale detail requests when selection changes; clean up chart resources.
- [x] Panel supports Escape, focus management and accessible labels.

## 5. Team form and list

- [x] Reactive form; name required and 3-30 characters.
- [x] Debounced async uniqueness validator checks existing teams.
- [x] Normalize whitespace/case consistently when comparing team names.
- [x] Validator handles unavailable team data without falsely declaring uniqueness.
- [x] Debounced autocomplete searches cached Pokemon or the API.
- [x] Selected Pokemon appear as removable chips; prevent duplicate picks.
- [x] Enforce 1-6 picks in form validation, not only button disabling.
- [x] Inline errors respect dirty/touched state; no pristine-field errors or alert().
- [x] Submit uses optimistic mutation; preserve recoverable form values on failure.
- [x] Pending forms and mutations cannot be submitted repeatedly.
- [x] Team list selection, members, type distribution and total stats work.
- [x] Selected-team persistence handles refresh, deletion and temporary IDs.

## 6. Required async-state matrix

| View                           | Loading | Empty | Error + Retry | Success |
| ------------------------------ | ------- | ----- | ------------- | ------- |
| Pokedex table                  | [x]     | [x]   | [x]           | [x]     |
| Detail panel                   | [x]     | [x]   | [x]           | [x]     |
| Team list and member hydration | [x]     | [x]   | [x]           | [x]     |
| Autocomplete dropdown          | [x]     | [x]   | [x]           | [x]     |

Exercise initial load, refresh, zero matches, valid-but-missing IDs, delayed
responses, offline mode, recovery, GraphQL errors and rapid input/selection
changes. Reserve layout space while loading. Cached success is acceptable;
uncached requests must not silently display an empty or stale success state.

## 7. Tests and delivery

- [x] Store test: optimistic create is immediate and rolls back on failure.
- [x] Selector/computed test: combined filtering/sorting/paging or team totals.
- [x] Validator test: asynchronous uniqueness and name normalization.
- [x] Additional focused coverage for transport errors, cancellation and deletion rollback.
- [ ] Browser review: full user flow, narrow screen, keyboard and failure/retry states.
- [x] README documents install, ng serve, mock server, architecture and improvements.
- [x] README accurately states mock persistence and known limitations.
- [ ] Clean checkout succeeds with npm ci and documented checks.
- [x] Public GitHub repository has incremental Conventional Commits.
- [ ] No more than ONE optional bonus; only within the ten-hour effort budget.

The only planned bonus is skeleton shimmer and micro-animations (option 4).
The user confirmed the at-most-one restriction. Implement it only after final
required behavior/review passes and within the ten-hour effort limit. No bonus
is implemented yet.

## Pokédex checkpoint evidence

- 39 tests in 11 files pass, including table controls/four states, page retry,
  detail cancellation/four states and chart instance updates/destruction.
- Live API catalog loaded 1,302 records during review; search/type filtering,
  page sizes, profiles and previous/next navigation were exercised.
- Desktop and 390px mobile layouts reviewed; horizontal scrolling is confined
  to the stats table. Empty/error states sit outside the wide table so their
  actions remain accessible on narrow screens.
- Escape restores focus to the native row button; no console errors observed.
- Complete offline/throttled browser flows and Teams lifecycle cleanup are
  part of final verification; Teams lifecycle cleanup is now covered below.

## Teams checkpoint evidence

- 53 tests in 16 files pass. Added form/picker tests, computed totals/distribution,
  storage denial, list/member retry, selection persistence/fallback, optimistic
  rollback and teardown coverage.
- Browser creation, reload persistence and deletion succeeded against the mock.
  Duplicate-name validation, keyboard picking and empty autocomplete were exercised.
- Stopping the mock caused a friendly save error with retained form values and
  rollback; restarting it allowed the same form to save successfully.
- Desktop and 390px mobile layouts reviewed. Member loading reserves space
  based on known slots; the page does not overflow horizontally.
- QA teams removed and mock restarted. Full public-API offline/throttle review,
  clean-install validation and final convention audit remain for stage 6.
