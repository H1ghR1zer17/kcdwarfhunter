# Repository Guidelines

## Project Structure & Module Organization
- Vite + React entry at `src/main.jsx` wiring `App.jsx`.
- Reusable UI lives in `src/components` (grid, analysis panes); domain logic in `src/utils` (pattern and interval helpers); styling in `src/App.css`, `src/index.css`, and `src/styles`.
- Static assets are in `public`; production output lands in `dist`; `vite.config.js` sets the GitHub Pages base at `/kcdwarfhunter/`.
- Keep new utilities small and colocate with the feature or under `src/utils`; prefer one component per file named after the component.

## Build, Test, and Development Commands
- `npm install` — install dependencies.
- `npm run dev` — start the Vite dev server (default http://localhost:5173) with HMR.
- `npm run build` — produce the production bundle in `dist`.
- `npm run preview` — serve the built bundle locally to sanity-check output.
- `npm run deploy` — builds then publishes `dist` to GitHub Pages (requires gh-pages access).

## Coding Style & Naming Conventions
- React 18 functional components with hooks; keep state updates immutable.
- ES modules, single quotes, semicolons, and 2-space indentation; prefer arrow functions for callbacks.
- Components PascalCase; helper functions and variables camelCase; CSS classes kebab-case.
- Validate user input as in existing pattern/interval helpers; avoid silent failures—surface alerts or inline messages.

## Testing Guidelines
- No automated test runner is set up; add Vitest + React Testing Library if you introduce complex logic.
- Colocate tests next to source as `*.test.jsx`/`*.test.js`; mock DOM events for component behavior and seed known positions to validate predictions.
- Minimum expectation: run `npm run build` and `npm run preview` before PRs to catch compile/runtime issues; document manual checks in the PR.

## Commit & Pull Request Guidelines
- Commits: short present-tense summary (<=72 chars) with detail in the body when helpful; group related changes together.
- PRs: describe purpose, list key changes, note manual test results, link issues, and include UI screenshots/gifs for visual updates.
- Keep changesets small and focused; ensure base path or deployment steps remain intact when touching `vite.config.js`.
