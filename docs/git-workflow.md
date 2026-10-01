# Manual Git workflow

The developer (AffanRM) runs these commands. The coding agent does not commit,
push, or rewrite history on the developer's behalf.

## Published checkpoints verified

The public repository is https://github.com/AffanRM/mini-pokedex. On 2026-10-01,
local main and GitHub both pointed to `6f2532f`, with a clean working tree before
the Pokédex UI work began. All four existing GitHub Actions runs passed.

Published stages: foundation, API contracts, GraphQL services, stores and
validators, and data architecture documentation. Repository creation and remote
setup are complete; do not repeat the earlier setup commands.

## Current checkpoint: Pokédex UI

Run these in PowerShell from the project directory:

```powershell
Set-Location 'C:\Users\affan\OneDrive\Desktop\BuzzerFan\Task'
npm run check
git status --short
```

Review the staged file list before committing:

```powershell
git add src/app src/assets src/styles.scss
git diff --cached --stat
git commit -m "feat(pokedex): add sortable catalog and animated detail panel"
git push
```

Then commit the updated documentation:

```powershell
git add README.md docs
git diff --cached --stat
git commit -m "docs(readme): record pokedex ui validation and progress"
git push
git status
git log -7 --oneline
```

The final state should show a clean working tree. The supplied assessment PDFs
and `tmp/` verification artifacts remain ignored.
Check the two new CI runs at https://github.com/AffanRM/mini-pokedex/actions.

## Validation evidence for this checkpoint

- `npm run check`: lint, formatting, all 39 tests and production build passed.
- Live catalog, search/type filtering, pagination, measurements, English abilities,
  detail navigation and radar rendering verified in the browser.
- Desktop/mobile layouts and Escape/focus restoration reviewed.
- Component tests cover four table/detail states, explicit Retry, stale detail
  cancellation and updates/destruction of the existing chart instance.
- Teams UI, persistence and final offline/throttled browser flows remain pending.
  This checkpoint is not the full assessment submission.

Husky checks lint/format before each commit and commitlint checks the message.
Do not bypass these checks; fix failures before proceeding.
