# Final manual Git workflow

The owner runs every commit/push. The coding agent does not stage, commit, push
or rewrite history.

## Verified publication

All three audit commits are correctly published and passed CI:

| Commit    | Subject                                                     | CI     |
| --------- | ----------------------------------------------------------- | ------ |
| `6accdd4` | test(tooling): isolate chart mocks across test suites       | Passed |
| `edf226d` | fix(teams): preserve lineup layout during refresh           | Passed |
| `0dd1a7b` | docs(readme): add run and test guide with publication audit | Passed |

Local main matches public GitHub main. The latest verified run is
https://github.com/AffanRM/mini-pokedex/actions/runs/37004549935.
Do not repeat any previous commit blocks.

## Publish the final documentation record

The final review changed only README/documentation to record verified publication
and fresh local checks. No functional source changes are pending.

```powershell
Set-Location 'C:\Users\affan\OneDrive\Desktop\BuzzerFan\Task'
npm run format:check
git status --short
git add README.md docs
git diff --cached --stat
git commit -m "docs(readme): finalize submission validation record"
git push
git status
```

Check https://github.com/AffanRM/mini-pokedex/actions and wait for the newest run,
matching this documentation commit, to pass. Then reply to the original task
email with https://github.com/AffanRM/mini-pokedex. The repository is public and
already grants read/clone access; write access is unnecessary for assessment.

Husky and commitlint remain enabled. The working tree should be clean after the
commit. Only bonus option 4 is included. Assessment PDFs and temporary QA files
remain ignored. Detailed startup and testing: [run-and-test.md](run-and-test.md).
