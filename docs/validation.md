# Submission validation

Review date: 2 October 2026. Public repository:
https://github.com/AffanRM/mini-pokedex.

## Publication verification

At the start of final review, the working tree was clean and local main matched
GitHub at `cc7e6225498049b63e29f5468970b776f1241ab6`.
The Teams feature (`8256f0a`) and documentation (`cc7e622`) were both published.
[The newest checkpoint CI passed](https://github.com/AffanRM/mini-pokedex/actions/runs/36916316774).
The preceding run failed intermittently in the radar lifecycle test. The final
test now calls `TestBed.tick()` to flush `afterNextRender` before inspecting
the chart, and passed targeted and full-suite runs. Final CI still requires a push.

## Reproducibility and conventions

- A fresh clone of the public checkpoint installed with `npm ci` and passed lint,
  formatting, all 53 checkpoint tests and production build.
- Final source/lockfile validation passes lint, formatting, 54 tests in 17 files
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

Reduced-motion rules and the chart's preference check were reviewed in source;
the review did not change the user's OS motion preferences. This is a focused
keyboard/responsive review, not a formal screen-reader or WCAG certification.

## Remaining delivery steps

The repository owner runs the focused commit/push commands in
[git-workflow.md](git-workflow.md), checks the latest CI result, and shares the
public repository URL. No additional feature work or bonus options are planned.
The mock remains intentionally ephemeral: restart resets the supplied fixture.
