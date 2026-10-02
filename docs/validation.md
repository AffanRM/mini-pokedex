# Submission validation

Review date: 2 October 2026. Public repository:
https://github.com/AffanRM/mini-pokedex.

## Publication verification

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
The correction is local until the owner commits/pushes it; newest remote CI
still needs verification afterward.

## Reproducibility and conventions

- A fresh clone of the public checkpoint installed with `npm ci` and passed lint,
  formatting, all 53 checkpoint tests and production build.
- Final source/lockfile validation passes lint, formatting, 55 tests in 17 files
  and production build. The final snapshot is also copied into the clean-install
  verification directory for a fresh dependency install and identical checks.
- Piscina 5.3.2 replaces Angular build's pinned vulnerable worker version through
  a narrowly scoped npm override. The build, serve and tests work with it; audit
  reports zero vulnerabilities at review time.
- Component file/class naming, feature folders, standalone/OnPush metadata,
  signal inputs/outputs, inject, store/service JSDoc, BEM/tokens and icon assets
  were reviewed. No legacy input/output decorators or unmanaged view subscriptions.
- Husky/commitlint remain enabled. Assessment PDFs, temporary QA tools and local
  configuration are ignored. No commit or push was performed by the coding agent.

## Browser checks

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

The repository owner runs only the new audit commit/push commands in
[git-workflow.md](git-workflow.md), checks the latest CI result, and shares the
public repository URL. Detailed startup and testing instructions are in
[run-and-test.md](run-and-test.md). No additional bonus options are planned.
The mock remains intentionally ephemeral: restart resets the supplied fixture.
