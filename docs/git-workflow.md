# Final picker and documentation handoff

Run the commands manually. Do not repeat earlier commit blocks or rewrite history.

## Verified implementation

The earlier typing fix and documentation are published through `fe77ece`, with
passing CI. The latest reported typing issue was reproduced in an older downloaded
copy running from `Downloads\test_pokedex\mini-pokedex`; it lacks the input handler.
Run the submission from the working repository below or obtain a fresh clone
after publishing. Clicking the already-focused field also now reopens suggestions.
A DOM regression covers clicks after selection and Escape. The local full check
passed lint, formatting, 59 tests in 17 files and production build.

The README now uses standard commit-process wording without personal workflow
details. The remaining changes are ready for this final commit.

## Publish the changes

```powershell
Set-Location 'C:\Users\affan\OneDrive\Desktop\BuzzerFan\Task'
npm run check
git status --short
git add README.md docs src/app/teams/components/pokemon-picker/pokemon-picker.component.html src/app/teams/components/pokemon-picker/pokemon-picker.component.spec.ts
git diff --cached --stat
git commit -m "fix(teams): reopen picker on click and polish submission docs"
git push
git status
```

Open https://github.com/AffanRM/mini-pokedex/actions and wait for the newest run,
matching this commit, to pass. Then send the assessment email with
https://github.com/AffanRM/mini-pokedex. Public read/clone access is available;
no collaborator invitation is needed for reviewing a public repository.

Husky and commitlint remain enabled. The working tree should be clean after the
commit. Only bonus option 4 is included. Assessment PDFs and temporary QA files
remain ignored. See [run-and-test.md](run-and-test.md) for consecutive-pick checks.
