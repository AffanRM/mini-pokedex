# Manual Git workflow

The developer (AffanRM) runs every commit/push. The coding agent does not commit,
push or rewrite history.

## Your previous commands were correct

All four final checkpoint commits are published, in order:

| Commit    | Subject                                                                | CI                   |
| --------- | ---------------------------------------------------------------------- | -------------------- |
| `b9363fe` | fix(resilience): keep picker retries visible and flush radar rendering | Passed               |
| `62d51c3` | chore(tooling): patch build worker and refresh ci actions              | Passed               |
| `10bc7a5` | feat(common): add skeleton shimmer and mutation notifications          | Passed               |
| `1ce5d53` | docs(readme): record final validation and submission steps             | Failed in radar test |

Local main matches public GitHub at `1ce5d53`; the working tree was clean before
this audit. The failure is not a problem with the commands you entered. Angular
shared the detail/radar suites' different Chart.js mocks between files. The same
failure was reproduced locally with one worker and fixed by enabling test-suite
isolation. The audit also improved layout stability when refreshing teams.

Do not repeat the previous four commit blocks. Run only the new blocks below.

## Publish the audit corrections

```powershell
Set-Location 'C:\Users\affan\OneDrive\Desktop\BuzzerFan\Task'
npm run check
git status --short
```

Review each staged list before committing. First publish the test isolation fix:

```powershell
git add angular.json vitest.config.ts src/app/pokedex/components/stat-radar/stat-radar.component.spec.ts
git diff --cached --stat
git commit -m "test(tooling): isolate chart mocks across test suites"
git push
```

Then publish the team refresh/layout correction and its regression test:

```powershell
git add src/app/teams
git diff --cached --stat
git commit -m "fix(teams): preserve lineup layout during refresh"
git push
```

Finally publish updated validation and the detailed run-and-test guide:

```powershell
git add README.md docs
git diff --cached --stat
git commit -m "docs(readme): add run and test guide with publication audit"
git push
git status
git log -7 --oneline
```

The final working tree should be clean. Husky and commitlint remain enabled;
fix any reported check failure before continuing. PDFs and all `tmp/` QA files
remain ignored. Only bonus option 4 is included.

Open https://github.com/AffanRM/mini-pokedex/actions and confirm that the newest
run matches your final commit and is green. The audit fixes cannot be marked
remotely verified until you publish them. Share https://github.com/AffanRM/mini-pokedex
after that check passes.

Use [run-and-test.md](run-and-test.md) for detailed startup, automated checks,
manual feature tests, offline/throttled testing, rollback, keyboard and mobile QA.
