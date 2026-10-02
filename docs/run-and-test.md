# Run and test Mini Pokédex

Use PowerShell for the commands below. Use Chrome for the DevTools checks.
The frontend and local mock must run in separate terminals. Pokémon data also
requires an internet connection.

## 1. Install dependencies

If servers are already running, stop their commands with Ctrl+C before a fresh
dependency installation. Do not launch duplicate servers on the same ports.

```powershell
Set-Location 'C:\Users\affan\OneDrive\Desktop\BuzzerFan\Task'
node --version
npm --version
npm ci
```

Node 24 is recommended; the project was initialized with Node 24.11.0 and npm
11.6.1. `npm ci` installs the exact lockfile and sets up Husky. No global Angular
CLI, authentication, API key, database installation or environment file is needed.
You only need to install again after changing dependencies or obtaining a fresh clone.

## 2. Start the app

**Terminal A — mock GraphQL API:**

```powershell
Set-Location 'C:\Users\affan\OneDrive\Desktop\BuzzerFan\Task'
npm run mock
```

Wait for the message that the GraphQL server is running at
http://localhost:4000. Leave this terminal running. The supplied fixture contains
Kanto Starters, Johto Squad and Water Specialists. Mutations are in memory;
restarting this server resets the fixture.

**Terminal B — Angular:**

```powershell
Set-Location 'C:\Users\affan\OneDrive\Desktop\BuzzerFan\Task'
npm start
```

Wait for the local URL, then open **http://localhost:4200** in Chrome.
Use this same hostname throughout persistence testing: localhost and 127.0.0.1
have separate browser storage. Leave both terminals running.

To stop the app, press Ctrl+C in both terminals. If a command reports that its
port is occupied, use the already-running server or stop its existing terminal
before restarting. Keep the mock on port 4000; the application is configured for it.

## 3. Run automated checks

In **Terminal C**, with or without the servers running:

```powershell
Set-Location 'C:\Users\affan\OneDrive\Desktop\BuzzerFan\Task'
npm run check
```

Expected: lint passes, Prettier passes, **58 tests in 17 files** pass, and the
production build finishes without errors or budget warnings. These tests mock
HTTP/data dependencies, so they do not require the live APIs.

Individual commands are useful when diagnosing a failure:

```powershell
npm run lint
npm run format:check
npm run test:ci
npm run build
npm audit
```

`npm test` starts interactive watch mode; stop it with Ctrl+C.
`npm run format` rewrites formatting, while `format:check` only verifies it.
`npm run build` creates `dist/mini-pokedex`; it does not start a server.
`vitest.config.ts` isolates test suites so their Chart.js mocks cannot interfere.

The required store rollback, selector/computed and validator tests are included.
Additional tests cover GraphQL errors, timeout, retry delay, cancellation,
cache sharing, optimistic concurrency, all view states, storage failures,
chart updates/destruction and retaining the lineup during refresh.

## 4. Test the Pokédex

Start online with Network throttling set to **No throttling**.

| Action                                                  | Expected result                                                                                                       |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Open Pokédex                                            | Loading skeletons followed by sprites, names, colored types, six stats and total                                      |
| Change rows per page to 10, 25, then 50                 | Pagination range/page count changes; use the table's own vertical scrollbar for longer pages                          |
| Click each stat heading twice, including Total          | Both sort directions work; the active heading and arrow reflect the order                                             |
| Type `saur`, then choose Grass                          | Search and type filtering combine; displayed rows satisfy both                                                        |
| Type `zzzz-no-pokemon`                                  | Meaningful no-results message and Clear filters action                                                                |
| Click Clear filters                                     | Search/type clear and page returns to the first page                                                                  |
| Move to a later page, then change search/type/page size | Pagination resets or clamps; there is no invalid blank page                                                           |
| Click a row or focus its name button and press Enter    | A detail panel slides in                                                                                              |
| Search `bulbasaur`, open its profile                    | Height 0.7m, weight 6.9kg, total 318; HP 45, Attack 49, Defense 49, Sp.Atk 65, Sp.Def 65, Speed 45; English abilities |
| Clear filters, open a profile, then use Previous/Next   | The profile and six-stat radar update; the radar animates between different Pokémon                                   |
| Press Escape                                            | Panel closes and focus returns to the row's name button                                                               |

The catalog includes alternate forms. Its count was 1,302 during review but may
change upstream; do not treat the count as a permanent assertion. Previous/Next
follow the current filtered/sorted results and disable at their boundaries.

## 5. Test teams and validation

Open Teams online. The initial list should have the three supplied teams.

1. Select each team. Check slot order, base-stat sums and type distribution.
   Kanto Starters has total **2,984**. Water Specialists has total **3,100** and
   six Water members. Dual-type Pokémon count in both types.
2. Select another team and reload the page. The selected team should be restored
   on the same browser origin. A missing/deleted stored selection should fall back.
3. On a fresh form, check that there are no validation errors before interaction.
   Click Create team with empty fields: required name and at-least-one-member
   errors should appear.
4. Try name `ab`, whitespace only, and the 31-character name
   `abcdefghijklmnopqrstuvwxyz12345`. Each should fail its applicable constraint.
5. Try `Kanto Starters`, then `  kanto   starters  `. Both should fail uniqueness
   after the debounced check. A valid new name should finish checking normally.
6. Search `bulba` in the picker. After the debounce, choose Bulbasaur. Check its
   removable chip. Without clicking away or refocusing, type `ivysaur`, pick it,
   then type `venusaur`. Suggestions must reopen and update each time. Search
   again: an already selected Pokémon should be excluded. Try Escape then type
   another name; typing should reopen suggestions. Repeat a previously successful
   query to check cached results after the 300ms debounce. New queries on a fresh
   Teams-only session can additionally wait for the public API; keep focus in the
   field and confirm loading changes to results without another click.
7. Quickly change a query from `bulba` to `char`. Stale results should not become
   selectable for the newer query. Try `zzzz-no-pokemon` for an empty dropdown.
8. Add six different Pokémon. A seventh pick must be blocked. Remove one chip
   directly with the pointer while the search field has focus; full-slot guidance
   must not cover any removal button. Check that another pick is allowed.
   Use arrow keys, Enter and Escape in
   the picker, and use Tab/Enter to reach and operate removal buttons.
9. Use a disposable name such as `Manual QA Squad`, with one or more members,
   and submit. The team appears immediately with Saving…; success shows a toast,
   clears the form and selects the saved team. Repeated submit attempts while
   pending must not create duplicate teams.
10. Reload. The saved team should still exist while the same mock process runs.
    Delete it: the list updates immediately and a success notification appears.
    If it was selected, selection falls back to an available team.

New teams belong to Ash Ketchum. The mock intentionally does not persist teams
across server restarts. Restarting it and clicking Refresh teams restores the
original three fixtures.

## 6. Test loading, failure and recovery

Load the application and the relevant route **online first**. Then use Chrome
DevTools (F12), open **Network**, and check **Disable cache**. The throttling menu
supports slow presets, custom latency and Offline. See
[Chrome's network reference](https://developer.chrome.com/docs/devtools/network/reference#throttling).

Do not reload the entire site while Offline: that prevents the app's JavaScript
from loading. Trigger an API operation within the already-loaded app instead.
Disabling the browser cache does not erase the app's in-memory entity/detail cache.

### A. Slow responses

Choose a slow preset, or a custom profile with around 1,000ms latency and reasonable
bandwidth. On Pokédex, click Refresh. Skeletons should appear in the reserved
table area. Open a profile that has not previously been opened: detail loading
should appear before data. In a freshly loaded Teams page, search in autocomplete
and select an uncached team to observe dropdown/member loading.

You may also create a disposable team under throttling to observe Saving… and
disabled pending controls. Very restrictive bandwidth can exceed the 15-second
request timeout; this should produce a friendly error rather than indefinite loading.
Return to No throttling and use the relevant retry action to recover.

### B. Catalog outage

With Pokédex already loaded, select Offline and click Refresh. Wait for delayed
read retries to finish. Expect a friendly error and **Try again**, not an empty
success table. Restore No throttling and click Try again; real data should return.

### C. Detail outage

Load the catalog online after a page reload, without opening any profiles. Set
Offline and open a profile. Expect loading followed by the detail error and
Try again. Restore connectivity and retry without closing the panel.
A previously opened cached profile can legitimately continue to work offline.

### D. Autocomplete and member outages

Reload **Teams directly online** and let its list load. Do not visit Pokédex
first: a complete cached catalog would make autocomplete work without a request.
Set Offline, type a new picker query, and wait for its error. Restore No throttling
and click Try again inside the dropdown. Focus should return to the search field;
loading and recovered suggestions should remain visible.

For member failure, select a fixture team you have not selected since the page
reload while Offline. It should show its own error/Retry independently of the
team list. Restore connectivity and retry members.

### E. Local mock unavailable

Keep Angular running. In Terminal A, stop the mock with Ctrl+C.

- If a team was already selected, click Refresh teams. Expect a list error and
  disabled builder; the last selected lineup remains visible. Its position should
  remain stable across refresh, failure and recovery.
- To test a failed initial team list, reload Teams while the mock is stopped.
  Expect friendly list guidance and Try again, with the builder disabled.
- Restart `npm run mock` in Terminal A and click Try again. The fixture returns.

### F. Optimistic save failure and rollback

With the mock running and teams loaded, fill a valid disposable name and select
members. Stop the mock **after filling the form**, then click Create team.
The provisional team must roll back. An error toast and inline Retry saving team
message appear, and name/chips remain. Restart the mock and click Retry saving
team. Expect one saved team and a cleared form. Delete the disposable team afterward.

For deletion rollback, stop the mock after loading teams and delete a fixture
team. It should be restored with a Retry deletion action. Restart the mock and
retry; the deletion should succeed. Restart the mock once more to restore the
fixture, then Refresh teams.

Mutations are not automatically retried. Public read queries retry twice after
750ms and 1,500ms delays; each attempt has a 15-second timeout. A fully timing-out
read can therefore take roughly 47 seconds before showing the final error.

## 7. Empty, keyboard, mobile and bonus checks

- Empty table and dropdown: use the no-match query above.
- Empty team list: delete all teams through the UI in this local mock. Expect
  first-team guidance; the builder should still accept a valid new team.
  Restart the mock and Refresh teams to restore all three fixtures.
- Missing detail IDs/empty member payloads are covered by automated tests; the
  valid UI intentionally prevents creating an empty team or selecting nonexistent IDs.
- Use Chrome's device toolbar (Ctrl+Shift+M) at approximately 390px width and a
  wide desktop viewport. There should be no horizontal page overflow. The stats
  table can scroll horizontally within its region. Check that error actions,
  dropdowns, chips, form buttons and the detail Close control remain accessible.
- Use Tab, Shift+Tab and Enter throughout navigation, sorting, form actions and
  notification dismissal. Escape closes the picker/panel. Focus outlines should show.
- Under slow loading, skeletons shimmer; member cards enter with small delays.
  Create/delete success and failure show dismissible notifications. Dismissal
  must not remove the inline recovery action.
- In DevTools, open the Rendering panel and emulate `prefers-reduced-motion: reduce`.
  Reopen the detail panel so the chart picks up that preference. Shimmer/card/panel/
  toast animations should stop, and radar updates should have zero duration.
  Restore normal motion afterward. See
  [Chrome's CSS emulation guide](https://developer.chrome.com/docs/devtools/rendering/emulate-css).

No raw backend errors, unhandled application exceptions or blank asynchronous
views should occur. Expected failed network requests are visible in DevTools
during deliberate outage testing. Finish with No throttling, request blocking
disabled, the mock running and all disposable QA teams removed.

## 8. Verify publication

Follow only the current commands in [git-workflow.md](git-workflow.md), then open
https://github.com/AffanRM/mini-pokedex/actions. The newest CI run must match your
latest commit and be green. Use `git status` to confirm a clean working tree.
The public URL to share is https://github.com/AffanRM/mini-pokedex.
