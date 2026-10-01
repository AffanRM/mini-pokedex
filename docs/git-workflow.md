# Manual Git workflow

The developer (AffanRM) runs these commands. The coding agent does not commit,
push, or rewrite history on the developer's behalf.

## Published checkpoints verified

The public repository is https://github.com/AffanRM/mini-pokedex. Before the Teams
work started, local main and GitHub both pointed to `3c8ebad`, with a clean working
tree. The two new commits are correctly published:

- `3100d86` feat(pokedex): add sortable catalog and animated detail panel
- `3c8ebad` docs(readme): record pokedex ui validation and progress

All new GitHub Actions runs passed, including
https://github.com/AffanRM/mini-pokedex/actions/runs/36910498306.

Published stages: foundation, API contracts, GraphQL services, stores/validators
and Pokédex UI. Repository creation and remote
setup are complete; do not repeat the earlier setup commands.

## Current checkpoint: Teams UI

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
git commit -m "feat(teams): add reactive builder and persistent team selection"
git push
```

Then commit the updated documentation:

```powershell
git add README.md docs
git diff --cached --stat
git commit -m "docs(readme): record team workflows and resilience checks"
git push
git status
git log -9 --oneline
```

The final state should show a clean working tree. The supplied assessment PDFs
and `tmp/` verification artifacts remain ignored.
Check the two new CI runs at https://github.com/AffanRM/mini-pokedex/actions.

## Validation evidence for this checkpoint

- `npm run check`: lint, formatting, all 53 tests and production build passed.
- Live mock team creation/deletion, reload persistence, keyboard picking and
  duplicate-name validation were verified in the browser.
- A real mock outage caused save rollback while preserving the form; Retry saved
  it after the server restarted. QA teams were removed.
- Desktop/mobile layouts and computed stat/type summaries were reviewed.
- Tests cover list/picker/member async states, retries, pending-submit guards,
  storage failures, optimistic rollback and view teardown.
- Final public-API offline/throttle QA, clean install and convention audit remain.
  Only bonus option 4 is planned after the required review, within the time budget.
  This checkpoint is not the full assessment submission.

Husky checks lint/format before each commit and commitlint checks the message.
Do not bypass these checks; fix failures before proceeding.
