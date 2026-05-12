# GitHub Pages Deployment

## Why

The project needs an automated GitHub Pages deployment so pushes to `main`
publish the Vite app without manual build steps.

## What

- Add a GitHub Actions workflow that builds the app and deploys `dist/` to
  GitHub Pages.
- Configure Vite asset paths for the repository Pages URL.

## Constraints

- MUST deploy from the `main` branch.
- MUST use GitHub Pages Actions artifact deployment.
- MUST NOT commit generated `dist/` output.
- MUST keep local verification fast.

## Tasks

1. Configure Vite with the repository base path.
   - Verify: `npm run build`.
2. Add the GitHub Pages workflow.
   - Verify: workflow syntax is valid YAML and uses least-needed permissions.
3. Commit and push to `origin/main`.
   - Verify: local branch tracks `origin/main`.

## Validation

- `npm run validate:album-data`
- `npm run build`
- Secret-pattern scan for deploy surfaces

## Outcome

- Added `.github/workflows/deploy-pages.yml` for build and Pages deployment.
- Set Vite `base` to `/barajitas-angela/` for repository Pages asset paths.
