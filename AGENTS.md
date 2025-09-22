# Repository Guidelines

## Project Structure & Module Organization
- `src/` — App code: `main.ts` (SSR factory), `client.ts` (hydrate), `server.ts` (SSR render), `components/`, `assets/`.
- `index.html` — Vite HTML entry (dev) and template for hydration.
- `server.js` — Express host for dev/production SSR.
- `public/` — Static files served at root.
- `vite.config.ts`, `tsconfig*.json` — Build and TS configuration.
- Build outputs: `dist/client/` (browser) and `dist/server/` (SSR bundle).

## Build, Test, and Development Commands
- `yarn dev` — Start SSR dev server (Vite middleware) at `http://localhost:5173`.
- `yarn build` — Build client and server bundles (`dist/client`, `dist/server`).
- `yarn build:client` — Vite client build only.
- `yarn build:server` — Vite SSR build from `src/server.ts`.
- `yarn preview` — Run the production server using built artifacts.
- Type check: `npx vue-tsc --noEmit` (optional but recommended).

## Coding Style & Naming Conventions
- TypeScript + Vue 3 SFCs (`<script setup>`). Use 2‑space indentation.
- Components: PascalCase filenames (e.g., `HelloWorld.vue`). TS files: camelCase (e.g., `main.ts`).
- Keep SSR entry signature stable: `export async function render(url: string) { ... }`.
- ESM codebase (`"type": "module"`). Prefer named exports, avoid default exports in utilities.

## Testing Guidelines
- No test runner is configured yet. Preferred stack: Vitest + Vue Test Utils (jsdom).
- Place tests under `src/**/__tests__/*.spec.ts` or alongside files as `*.test.ts`.
- Aim for ≥80% line coverage on new/changed code. Include minimal SSR smoke tests.
- Run type checks and a local build before opening a PR.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`… (scopes optional).
- PRs must include: summary, rationale, testing notes (commands and results), and screenshots for UI changes.
- Link related issues (e.g., `Closes #123`). Ensure `yarn build` and type checks pass.

## Security & Configuration Tips
- Required envs: `NODE_ENV`, optional `PORT` and `BASE`. Never commit secrets (`.env*` is ignored).
- Target Node.js ≥18. Keep dependencies minimal; avoid server‑only imports in client code.
