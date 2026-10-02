# Submission validation

Review date: 2 October 2026. Public repository:
https://github.com/AffanRM/mini-pokedex.

## Subsequent picker correction — 3 October 2026

The follow-up report of typing requiring a refocus was reproduced against the
server on port 4200. Its Node command line pointed to an older downloaded copy
at `Downloads\test_pokedex\mini-pokedex`, whose picker template lacked the input
handler already present in the published source. The corrected working repository
was served separately with `ng serve --port 4201` to verify it independently.
The additional click-on-an-already-focused-input case failed a new DOM regression.
The input now opens suggestions on click as well as focus and typing; deliberate
closing after selection or Escape is preserved. The full check passed 59 tests
in 17 files, lint, formatting and production build. The README's personal workflow
paragraph was replaced with standard commit-process wording.

The owner published `eccc8e7` and its CI passed. Before submitting, the owner
reported suggestions sometimes required refocusing after a pick. The earlier
review missed typing the next name without leaving the focused search input.
A new DOM regression failed with `aria-expanded="false"` on the old behavior.
The picker now opens on native input events while retaining deliberate closing
after a pick/removal/Escape. No additional focus click is required.

Teams-first searches previously called the public API again for repeated text.
The store now caches successful results, including empty matches, by normalized
query with a 50-entry bound. Failed requests are not cached, and a cached entity
subset is not treated as a complete broader query. Successful catalog refresh
clears the query cache. The required 300ms debounce, cancellation, friendly error
state and explicit Retry remain. New uncached queries can still incur API latency.
The six-slot check also found the full-slots dropdown covered chip removal
buttons. Full-slot guidance now appears below the chips; its regression asserts
the dropdown is absent and the combobox reports collapsed at the limit.

Three new regressions cover retained-focus consecutive picks, normalized/empty
cache reuse, and failed/broader-query correctness: 58 tests in 17 files total.
The full local check passed lint, formatting, all 58 tests and production build.
The browser check used a fresh Teams-only page: typing each next name reopened
loading/results while input focus stayed in place. First-time API queries showed
visible loading; arrival of results did not require another click.
After loading the shared catalog, all six members were picked consecutively
without refocusing. At six picks the dropdown stayed collapsed, hit-testing
confirmed the remove button was uncovered, and a pointer click reduced the count
to five. New suggestions then opened normally. QA choices were never saved and
the page was reloaded afterward; the three backend fixture teams remain intact.
The owner published the correction at `93c22ee`. Local HEAD and actual remote
main matched, and [its GitHub CI](https://github.com/AffanRM/mini-pokedex/actions/runs/37066947767)
passed. A fresh full local check on 3 October passed all 58 tests in 17 files,
lint, formatting and production build.

The final browser review also verified normalized duplicate-name rejection,
mouse selection followed immediately by typing, keyboard selection, duplicate
exclusion, chip removal, successful creation, and saved-team/selection persistence
after reload. Stopping the local mock produced save rollback with retained form
choices; restarting it and explicitly retrying created exactly one team. A failed
deletion restored its team and showed Retry deletion. A subsequent failed list
refresh retained the selected lineup and disabled the builder; restarting the
mock and retrying recovered the original fixtures. Disposable QA teams were
removed or cleared by the documented mock restart. No production source changed
during this final review.

The table review verified both directions of all seven stat sorts, the 10/25/50
page controls, later-page reset after combined name/type filtering, meaningful
empty results and Clear filters recovery. Bulbasaur's live profile showed 0.7m,
6.9kg, total 318 and both English abilities. Next changed the profile to Ivysaur
and the radar's accessible identity and six stats updated; Escape returned focus
to the originating row button. Six consecutive keyboard picks retained search
focus, a seventh pick was blocked, and pointer removal at the limit reduced the
count to five. The final form was reloaded to clear unsaved picks, the mock was
left running with its original three fixtures, and the browser error log was empty.

## Publication verification

The final implementation is now published at
`0dd1a7b064e8a49570ba0376242ba24fb1217420`. Local main matches public GitHub main,
and the working tree was clean at the start of the final submission review.
All three audit commits (`6accdd4`, `edf226d`, `0dd1a7b`) passed CI. The
[latest verified run](https://github.com/AffanRM/mini-pokedex/actions/runs/37004549935)
successfully installed dependencies and ran lint, formatting, tests and build.

Historical issue and correction:

The owner correctly published all four final checkpoint commits: `b9363fe`,
`62d51c3`, `10bc7a5`, and `1ce5d53`. At the start of the publication audit the
working tree was clean and local main matched GitHub at
`1ce5d53cf67a84ea78d7d691ba68bf88f1dbab07`. The repository is public.
The first three runs passed; [the documentation commit's run failed](https://github.com/AffanRM/mini-pokedex/actions/runs/37001916245)
in the radar test. Passing a previous run does not establish that the newest run passed.

The earlier render-flush change did not fix the underlying issue. The detail
and radar suites have different Chart.js mocks, but Angular's runner defaults
to `isolate: false`. A one-worker shuffled run reproduced the exact failure:
the radar suite saw the other suite's mock instead of its own recorded instances.
Enabling `isolate: true` in `vitest.config.ts`, referenced by `angular.json`,
made that same test order pass. All lifecycle assertions remain intact.
The owner has published the correction; its remote CI result is verified above.

## Reproducibility and conventions

- A fresh clone of the public checkpoint installed with `npm ci` and passed lint,
  formatting, all 53 checkpoint tests and production build.
- The final submission review performed `npm ci` in the project, then passed
  lint, formatting, 55 tests in 17 files and production build. Production initial
  bundles total 283.52 kB, below the configured warning budget; no build warnings.
- The first reinstall attempt encountered Windows' esbuild file lock. Stopping
  the verified project servers released it; installation succeeded and both
  `ng serve --host 127.0.0.1` and the port-4000 mock restarted successfully.
- Piscina 5.3.2 replaces Angular build's pinned vulnerable worker version through
  a narrowly scoped npm override. The build, serve and tests work with it; audit
  reports zero vulnerabilities at review time.
- Component file/class naming, feature folders, standalone/OnPush metadata,
  signal inputs/outputs, inject, store/service JSDoc, BEM/tokens and icon assets
  were reviewed. No legacy input/output decorators or unmanaged view subscriptions.
- Husky/commitlint remain enabled. Assessment PDFs, temporary QA tools and local
  configuration are ignored. No commit or push was performed by the coding agent.

## Browser checks

The final review retested the published implementation through the real UI:
normalized duplicate-name rejection, zero-result autocomplete, keyboard picking,
creation and successful notification, failed deletion rollback, failed creation
rollback with retained choices, failed refresh with retained lineup, restarted
mock/list retry, successful retry save, selected-team reload persistence and
successful deletion. Disposable teams were removed; three fixture teams remain.

The public catalog again loaded 1,302 records. All seven stat columns sorted
correctly in both directions; 10/25/50 page sizes, next-page navigation, combined
name/type filtering, empty results and Clear filters passed. Bulbasaur displayed
0.7 m, 6.9 kg, total 318, English abilities and a nonzero-size chart. Escape
returned focus to its row button. At a 390px viewport, both pages had equal
document/client widths (375px), with horizontal scrolling confined to the table.
Six member cards rendered and no runtime errors were captured in the final QA tab.
The viewport override was reset and the mock/server were left running.

| Area                    | Verified behavior                                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Catalog                 | Live API loaded 1,302 records; combined search/type, stat sorting, page sizes, zero matches, profile navigation and keyboard close |
| Catalog/detail failures | Loading shown under delayed responses; injected outages produce friendly messages; explicit Retry recovers actual API data         |
| Team list               | Loading, empty guidance, failed initial fetch, disabled builder before successful fetch, explicit retry and three fixture teams    |
| Members                 | Independent loading/error/retry, restored slot order, Kanto combined total 2,984 and Water total 3,100, dual-type counting         |
| Picker                  | Debounce, empty results, error/Retry, visible delayed recovery, arrow/Enter selection, duplicate exclusion and removable chips     |
| Mutations               | Optimistic save, real stopped-mock failure, rollback with preserved form, restart/retry success, deletion and QA team cleanup      |
| Persistence             | Reload retains selected team; missing/deleted selection falls back; storage denial covered by tests                                |
| Responsive UI           | Desktop 1,280px and mobile 390px; no document horizontal overflow; table scroll stays within its region                            |
| Bonus option 4          | Skeleton gradient/animation, card delays 0–225ms, success/error notifications and Enter-to-dismiss                                 |

The API resilience review used an **ignored, isolated QA copy** whose endpoint
constants routed requests through a local proxy. It forwarded real GraphQL data,
delayed responses by 500–800ms, and returned controlled HTTP 503 errors.
This verifies slow-response and outage UI paths; it is not a bandwidth benchmark
or a claim that the OS/browser network was disabled. Actual connection refusal
was verified by stopping the local mock. Transport tests additionally cover
HTTP/GraphQL errors, bounded timeout, delayed retry and cancellation.
Production endpoint constants are unchanged.

The picker retry check exposed focus loss when its focused Retry button was
removed during loading. Focus now returns to the search field before retry,
keeping the dropdown and recovered suggestions visible. Its regression test
checks this with a pending response instead of a synchronous stub.

The publication audit also found that list refresh removed the selected member
panel and altered reserved layout space. The panel now stays mounted during
loading and failed refresh; list and builder guidance reserve space. A new
integration test covers refresh/failure/retry. At the 390px browser breakpoint,
the six members stayed visible and their document position remained approximately
1326.925px before and after a failed refresh (rounding difference below 0.001px).
The mock was restarted and the fixture restored after verification.

Reduced-motion rules and the chart's preference check were reviewed in source;
the review did not change the user's OS motion preferences. This is a focused
keyboard/responsive review, not a formal screen-reader or WCAG certification.

## Remaining delivery steps

The repository owner publishes only the final documentation record using
[git-workflow.md](git-workflow.md), verifies that commit's CI result, and emails
the public repository URL. No functional source changes are pending. Read access
is already available publicly; the email does not require granting write access.
Detailed startup and testing instructions are in
[run-and-test.md](run-and-test.md). No additional bonus options are planned.
The mock remains intentionally ephemeral: restart resets the supplied fixture.
