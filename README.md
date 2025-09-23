# TeaForms — Nuxt 3 SSR

Production-ready Nuxt 3 app with mobile-first UI, i18n (default ES), and DynamoDB persistence. Deployed on AWS Amplify using Nuxt SSR output.

- Dev: `yarn dev`
- Build: `yarn build` → `.output/`
- Start: `yarn start` (Node server from `.output/server`)
- Bootstrap DynamoDB (optional): `yarn bootstrap:ddb`

Amplify uses `appRoot: .` (see `amplify.yml`). Environment variables are sourced from Amplify branch settings (no Doppler in prod). Note: do not define variables prefixed with `AWS_`/`AMPLIFY_` in Amplify — they are reserved. Use `APP_AWS_REGION` if you need to override region (otherwise Amplify’s default region is used). See `docs/nuxt-migration-plan.md` and `docs/PR5.md` for context.
