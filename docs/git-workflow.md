# Manual Git workflow

The developer (AffanRM) runs all commits/pushes. The coding agent prepares and
verifies changes but does not commit, push or rewrite history.

## Your previous commands were verified

Local main and public GitHub both point to `cc7e622`, and the working tree was
clean before this final stage. Both Teams commits are correctly published:

- `8256f0a` feat(teams): add reactive builder and persistent team selection
- `cc7e622` docs(readme): record team workflows and resilience checks

The latest checkpoint CI passed:
https://github.com/AffanRM/mini-pokedex/actions/runs/36916316774.
The preceding run had an intermittent radar render-test failure; the fix is
included below. Repository setup and earlier stages are complete.
**Do not repeat the earlier Teams commit commands.**

## Final checkpoint commands

Run these blocks in order in PowerShell:

```powershell
Set-Location 'C:\Users\affan\OneDrive\Desktop\BuzzerFan\Task'
npm run check
git status --short
```

First commit the resilience fixes. Review each staged diff before committing:

```powershell
git add src/app/pokedex/components/stat-radar/stat-radar.component.spec.ts src/app/teams/components/pokemon-picker
git diff --cached --stat
git commit -m "fix(resilience): keep picker retries visible and flush radar rendering"
git push
```

Then commit the compatible build-worker patch and CI action updates:

```powershell
git add package.json package-lock.json .github/workflows/ci.yml
git diff --cached --stat
git commit -m "chore(tooling): patch build worker and refresh ci actions"
git push
```

Commit the **single bonus option 4** (shimmer, card entry and mutation toasts):

```powershell
git add src/app src/styles.scss
git diff --cached --stat
git commit -m "feat(common): add skeleton shimmer and mutation notifications"
git push
```

Finally commit the submission documentation:

```powershell
git add README.md docs
git diff --cached --stat
git commit -m "docs(readme): record final validation and submission steps"
git push
git status
git log -6 --oneline
```

The final working tree should be clean. The assessment PDFs, verification clone,
fault proxy and screenshots in `tmp/` remain ignored.
Husky runs lint/format checks and commitlint checks scoped messages; fix any
failure and keep the hooks enabled.

## Delivery verification

Open https://github.com/AffanRM/mini-pokedex/actions and confirm the newest
run for the final documentation commit passes. New CI results cannot be verified
until these commits are published. The app is locally complete; this is the
remaining publication check before sharing https://github.com/AffanRM/mini-pokedex.

Validation evidence is recorded in [validation.md](validation.md): required
features, controlled slow/outage UI checks, real mock save recovery, final
54-test suite, clean installation, mobile/keyboard review and bonus option 4.
