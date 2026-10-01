# Manual Git workflow

The developer (AffanRM) runs these commands. The coding agent does not commit,
push, or rewrite history on the developer's behalf.

## Create the repository once

At https://github.com/new, choose owner **AffanRM**, name **mini-pokedex** and
visibility **Public**. Leave README, .gitignore and license initialization
unchecked because this workspace already has Git history.

In PowerShell, from the project directory:

```powershell
Set-Location 'C:\Users\affan\OneDrive\Desktop\BuzzerFan\Task'
git remote add origin https://github.com/AffanRM/mini-pokedex.git
git push -u origin main
```

This first push publishes the two existing foundation commits. New uncommitted
work stays local. Git may open its credential manager to authenticate to GitHub.
The remote-add command is only needed once. If a remote already exists, inspect
`git remote -v` before changing it.

## Checkpoint: GraphQL services

This group includes typed models, transport, API documents, mapping and focused
tests. All imports needed for this commit are included.

```powershell
git add src/app/app.config.ts src/app/common src/app/core
git add src/app/pokedex/constants src/app/pokedex/models src/app/pokedex/services src/app/pokedex/utils
git add src/app/teams/constants src/app/teams/models src/app/teams/services src/app/teams/utils
git diff --cached --stat
git commit -m "feat(core): add typed graphql services and resilient queries"
git push
```

## Checkpoint: stores and form validators

```powershell
git add src/app/pokedex/state src/app/teams/state src/app/teams/validators
git diff --cached --stat
git commit -m "feat(state): add cached selectors and optimistic team mutations"
git push
```

## Checkpoint: documentation

```powershell
git add README.md docs
git diff --cached --stat
git commit -m "docs(readme): document data architecture and manual git workflow"
git push
git status
```

The final state should show a clean working tree. The supplied assessment PDFs
and `tmp/` verification artifacts remain ignored.

## Validation evidence for this checkpoint

- `npm run check`: lint, formatting, all 28 tests and production build passed.
- Actual Pokemon list, ID batch, abilities and autocomplete query documents
  succeeded against the public API.
- Creation/removal succeeded against the local mock, and the temporary team was
  removed after verification.
- Required store, selector and form-validator tests now exist and pass.
- Browser UI states, Signals integration and component features remain pending.

Husky checks lint/format before each commit and commitlint checks the message.
Do not bypass these checks; fix failures before proceeding.
