# Manual picker correction workflow

The owner runs every commit/push. The coding agent does not stage, commit, push
or rewrite history. Do not repeat any earlier commit blocks.

## Why a new correction is needed

The published `eccc8e7` passed CI, but a later user check exposed a real picker
bug: picking kept input focus while closing suggestions, and typing another name
did not reopen them. A new DOM regression reproduced this failure. The local fix
opens suggestions on typing and caches successful repeat searches with a 50-query
bound. It preserves the required debounce, cancellation and error/retry behavior.
Full-slot guidance is also inline so it cannot cover the chip removal buttons.

## Publish the verified correction

```powershell
Set-Location 'C:\Users\affan\OneDrive\Desktop\BuzzerFan\Task'
npm run check
git status --short
git add src/app/teams/components/pokemon-picker src/app/pokedex/constants/pokemon.constants.ts src/app/pokedex/state/pokemon.store.ts src/app/pokedex/state/pokemon.store.spec.ts README.md docs
git diff --cached --stat
git commit -m "fix(teams): reopen picker while typing and cache repeat searches"
git push
git status
```

Check https://github.com/AffanRM/mini-pokedex/actions and wait for the newest run,
matching this correction commit, to pass. Then send the assessment email with
https://github.com/AffanRM/mini-pokedex. Use the updated test count of 58 in the
email. Public read/clone access is already available.

Husky and commitlint remain enabled. The working tree should be clean after the
commit. Only bonus option 4 is included. Assessment PDFs and temporary QA files
remain ignored. See [run-and-test.md](run-and-test.md) for consecutive-pick checks.
