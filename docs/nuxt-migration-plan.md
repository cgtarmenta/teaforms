# Nuxt 3 Migration Plan (Amplify SSR-Compatible)

## Goals
- Adopt a recognized SSR framework (Nuxt 3) so Amplify Hosting runs SSR + API seamlessly.
- Preserve current UX, i18n, Tailwind, repos (memory + DynamoDB), and exports.
- Minimize risk by landing in phases; keep existing app working until cutover.

## Phases

1) PR1 — Nuxt scaffold + UI base
- Scaffold Nuxt 3 (initially in `nuxt/` subfolder, later promoted to root).
- Add Tailwind module, Vue i18n plugin (JSON locales, default es, fallback en).
- Port base components (AppButton, AppInput, AppSelect, AppCard).
- Port Landing (/) and Login (/login) pages + app header/footer (mobile‑first).
- Scripts: `yarn dev`, `yarn build`, `yarn start` (inside `nuxt/`).

2) PR2 — Pages migration
- Port: /forms, /forms/[id] (FormBuilder), /episodes, /episodes/new, /episodes/[id], /403.
- Keep UI and i18n consistent with current app.

3) PR3 — API routes (Express → Nitro)
- Move current server routes to Nuxt server routes under `nuxt/server/api`:
  - auth (login/logout/me), forms (CRUD + fields), episodes (CRUD + filters), export (PDF/XML), users (admin).
- Reuse repositories (memory + ddb). Introduce Nuxt runtimeConfig for envs.
- Sessions: JWT cookie `sid` (HttpOnly); SSR middleware attaches `user`.

4) PR4 — Guards, SSR plumbing, and cutover
- Add Nuxt route middleware for `requiresAuth` + `roles`.
- Remove Express/Vite SSR from root; promote `nuxt/` to repo root.
- Amplify: use Nuxt build output (`.output/public` + `.output/server`); update `amplify.yml` accordingly (appRoot now repo root).
- Env vars in Amplify branch: `DDB_TABLE`, `DATA_BACKEND=ddb` (or `USE_DYNAMODB=true`), `SESSION_SECRET`, `BASE=/`. Do not set `AWS_*` variables (reserved in Amplify). The runtime region is provided implicitly; if you need to override it, set `APP_AWS_REGION`.

5) PR5 — Validation & polish
- PDF table gridlines & wrapping, admin pages i18n, episodes pagination/sorting.
- A11y pass (active link, aria-current, color contrast checks).

## Rollback Plan
- If SSR deploy blocks release, deploy SPA from current app + API Gateway/Lambda for `/api/*` as temporary fallback.

## Notes
- Local dev: `AWS_PROFILE=cgtaa AWS_SDK_LOAD_CONFIG=1 yarn dev` from repo root.
- Runtime config source of truth: Amplify env vars (no Doppler in prod).
