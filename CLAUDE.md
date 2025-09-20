
# CALUDE.md (Context And Launch Unified Description & Execution)

> **Project**: Behavioral Episode Registry (mobile‑first)  
> **Purpose**: Clinically useful capture of self‑control/behavioral episodes in school settings for a child with ASD Level 1.  
> **Target**: Teachers input observations; clinician designs forms and reviews/export data; sysadmin governs users and audits.

---

## 1) Executive Summary

This document is the single source of truth for agents to create the project from scratch. It specifies scope, roles, architecture, data model, security, deployment (AWS Amplify), configuration (Doppler), and testing (Vue Test Utils + Vitest). The app is **mobile‑first**, **SSR with Vite + vite‑plugin‑ssr**, uses **Vue 3 + TS + Tailwind v4**, **AWS DynamoDB** as the database, **Cognito (via Amplify Auth)** for auth, and **Doppler** for secure secrets. Exports to **PDF/XML** are included.

---

## 2) Personas & RBAC

### Roles
- **sysadmin** (parent/owner): create/disable users, view global analytics, export all data (PDF/XML), govern configuration.
- **clinician** (medico): create/edit dynamic forms; view/export all episodes; manage teacher access to forms.
- **teacher** (docente): input behavioral episodes using available forms; view only their own submissions.

### User Profile Fields
- **Clinician**: firstName, lastName, email, specialty, hospital, phone (+ optional: professionalId, locale, timezone).
- **Teacher**: firstName, lastName, email, gradeOrSubject, school, phone (+ optional: locale, timezone).

---

## 3) Functional Requirements

1. **Auth & RBAC**
   - Cognito user pool via Amplify; roles asserted in JWT as `custom:role` (one of `sysadmin|clinician|teacher`).
   - SSR must gate routes server‑side (inspect cookies -> exchange for id token -> authorize).

2. **Dynamic Forms (clinician)**
   - CRUD of forms (title + array of fields). Field types: `text|textarea|select|date|time|number|radio|checkbox`.
   - Option sets for select/radio; required flag; default values; validation rules (regex/min/max/len).

3. **Episodes (teacher)**
   - Submit entries linked to a form. Baseline recommended fields:
     - timestamp (date+time), context, trigger, response, duration, resolution, optional free‑text notes.
   - List & filter **own** episodes (date range, formId, context, trigger).

4. **Review & Export (clinician/sysadmin)**
   - Filter/search across users/forms/date ranges.
   - Export to **PDF** (tabular + summary stats) and **XML** (schema below).

5. **Analytics**
   - Aggregate by: time‑of‑day, day‑of‑week, context, trigger.
   - Teacher activity (submissions/day), form usage, missing data rate.

6. **Admin (sysadmin)**
   - Create/disable users, assign roles, reset password (Cognito admin), audit log.

7. **Accessibility & i18n**
   - WCAG 2.2 AA: focus states, proper landmarks, labels, keyboard navigation.
   - i18n-ready (EN/ES), but default UI Spanish (Spain).

---

## 4) Non‑Functional Requirements

- Mobile‑first (min-target: 360px width), responsive up to desktop.
- SSR for fast TTFB and protected pages; hydrate with minimal JS.
- P99 latency < 400 ms for reads in the same region.
- Observability: CloudWatch logs/metrics; trace IDs propagate from server -> client requests.
- Privacy: PIIs encrypted at rest (DynamoDB + KMS), and in transit (TLS). Data partitioned by tenant (single-tenant now, multi-tenant ready).
- Backups: Point‑in‑Time Recovery (PITR) for DynamoDB; weekly export to S3 (optional).

---

## 5) System Architecture

- **Web (SSR)**: Vue 3 + TS + `vite-plugin-ssr` hosted on **Amplify Hosting (SSR)** (Node runtime on Lambda@Edge or regional Lambda depending on Amplify setting).
- **Auth**: AWS Cognito (Amplify Auth), with custom user attributes `custom:role`.
- **API**: Server routes inside SSR server (Node) backed by SDK access to DynamoDB; optional API Gateway + Lambda for pure APIs if needed.
- **DB**: DynamoDB (single-table pattern recommended).
- **Secrets**: Doppler provides env vars at build/runtime via `doppler run`.
- **Exports**: PDF via `pdf-lib` or `jspdf`; XML via `xmlbuilder2`.
- **Logging**: CloudWatch; structured JSON logs.

ASCII (high-level):

Client (mobile/desktop) → Amplify SSR Hosting (Node) → DynamoDB
                               │
                               └→ Cognito (Auth)
                               └→ CloudWatch (logs)
                               └→ S3 (exports, optional)

---

## 6) Data Model (DynamoDB)

### Single-table layout (recommended)
**Table**: `app_core`
- **PK/SK pattern**:
  - User: `PK=USER#{userId}` / `SK=PROFILE`
  - Form: `PK=FORM#{formId}` / `SK=METADATA`
  - Form field: `PK=FORM#{formId}` / `SK=FIELD#{fieldId}`
  - Episode: `PK=EPISODE#{episodeId}` / `SK=METADATA`
  - Episodes by form: GSI1 with `GSI1PK=FORM#{formId}` / `GSI1SK=TS#{timestampISO}`
  - Episodes by teacher: GSI2 with `GSI2PK=TEACHER#{userId}` / `GSI2SK=TS#{timestampISO}`

**User item (PROFILE)**
```json
{
  "PK": "USER#<uuid>",
  "SK": "PROFILE",
  "userId": "<uuid>",
  "role": "sysadmin|clinician|teacher",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "specialty": "string|null",
  "hospital": "string|null",
  "gradeOrSubject": "string|null",
  "school": "string|null",
  "locale": "es-ES",
  "timezone": "Europe/Madrid",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

**Form (METADATA + FIELD)**
```json
{
  "PK": "FORM#<uuid>",
  "SK": "METADATA",
  "formId": "<uuid>",
  "title": "string",
  "createdBy": "USER#<uuid>",
  "version": 1,
  "status": "active|archived",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```
```json
{
  "PK": "FORM#<uuid>",
  "SK": "FIELD#<uuid>",
  "fieldId": "<uuid>",
  "label": "string",
  "type": "text|textarea|select|date|time|number|radio|checkbox",
  "required": true,
  "options": ["optional"],
  "default": null,
  "validation": {
    "regex": null,
    "min": null,
    "max": null,
    "maxLength": 200
  }
}
```

**Episode**
```json
{
  "PK": "EPISODE#<uuid>",
  "SK": "METADATA",
  "episodeId": "<uuid>",
  "formId": "<uuid>",
  "createdBy": "USER#<uuid>",
  "timestamp": "ISO8601",
  "context": "class|recess|lunch|hall|other",
  "trigger": "string",
  "response": "string",
  "duration": "string",
  "resolution": "string",
  "notes": "string|null",
  "GSI1PK": "FORM#<uuid>",
  "GSI1SK": "TS#2025-09-20T12:34:56Z",
  "GSI2PK": "TEACHER#<uuid>",
  "GSI2SK": "TS#2025-09-20T12:34:56Z",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

**Alternative (3-table)**
If single-table is undesired, create tables: `Users`, `Forms`, `Episodes` with similar attributes + GSIs for (formId,timestamp) and (teacherId,timestamp).

---

## 7) Security & Privacy

- JWT role check server-side (SSR) on each request to protected routes.
- DynamoDB condition expressions to enforce **teacher can only read own episodes**.
- Encrypt at rest (KMS), enforce TLS 1.2+.
- Minimal IAM: server role with `dynamodb:GetItem|PutItem|Query|UpdateItem|BatchWriteItem` scoped to table ARN.
- Audit log item (optional): `PK=AUDIT#<yyyy-mm-dd>` / `SK=<ts>#<action>#<actorId>`.

---

## 8) Tech Stack & Tooling

- **UI**: Vue 3, TypeScript, Tailwind v4 (JIT), Headless UI (optional).
- **SSR**: Vite + `vite-plugin-ssr` (Node entry `server/index.ts`).
- **State**: Pinia (optional) or composables-only.
- **Testing**: Vitest + Vue Test Utils (“vuetest” requirement covered).
- **PDF**: `pdf-lib` or `jspdf`.
- **XML**: `xmlbuilder2`.
- **Lint/Format**: ESLint + Prettier.
- **Commit**: Conventional Commits, Husky + lint-staged.
- **Date**: `date-fns` (TZ via `Intl` on server).

---

## 9) Environment & Secrets (Doppler)

**Doppler** supplies envs to both build and runtime. Example (env keys):
```
APP_NAME=episode-registry
NODE_ENV=production
AWS_REGION=eu-west-2
DDB_TABLE=app_core
DDB_GSI1=GSI1
DDB_GSI2=GSI2
AMPLIFY_BRANCH=main
COGNITO_USER_POOL_ID=...
COGNITO_CLIENT_ID=...
COGNITO_DOMAIN=...
JWT_ROLE_CLAIM=custom:role
PDF_HEADER="Behavioral Episodes"
XML_NS="urn:episode-registry:v1"
```

**Local run with Doppler**
```bash
doppler run -- yarn dev
```

**Amplify build with Doppler (build settings)**
```yaml
# amplify.yml
version: 1
applications:
  - appRoot: /
    frontend:
      phases:
        preBuild:
          commands:
            - npm i -g yarn
            - yarn --frozen-lockfile
        build:
          commands:
            - npx doppler run --command "yarn build:ssr"
      artifacts:
        baseDirectory: dist/server
        files:
          - "**/*"
      cache:
        paths:
          - node_modules/**/*
    customHeaders:
      - pattern: "**/*"
        headers:
          - key: Strict-Transport-Security
            value: max-age=63072000; includeSubDomains; preload
```

> **Note**: For SSR on Amplify Hosting with Vite, publish **server** output and configure SSR entry. Use Amplify’s “SSR framework” runtime for Node. If Amplify requires a framework adapter, package SSR as a **Node function** (Lambda) and route traffic there via Amplify Hosting rewrites (see §12).

---

## 10) Project Structure

```
/ (repo root)
├─ amplify/                     # Amplify Hosting app + environments
├─ infra/                       # IaC snippets (optional CDK/Terraform)
├─ src/
│  ├─ server/                   # SSR Node server (vite-plugin-ssr)
│  │  ├─ index.ts               # entry, express/h3 compatible
│  │  ├─ auth.ts                # JWT parse, role guard
│  │  ├─ ddb.ts                 # DynamoDB client
│  │  ├─ routes/
│  │  │  ├─ api/
│  │  │  │  ├─ forms.ts
│  │  │  │  ├─ episodes.ts
│  │  │  │  └─ users.ts
│  │  │  └─ pages.ts            # SSR page handlers
│  ├─ pages/                    # vite-plugin-ssr pages
│  │  ├─ index.page.vue
│  │  ├─ login.page.vue
│  │  ├─ dashboard.page.vue
│  │  ├─ forms.page.vue
│  │  ├─ episodes.page.vue
│  │  ├─ analytics.page.vue
│  │  └─ 403.page.vue
│  ├─ components/
│  ├─ styles/
│  ├─ composables/
│  ├─ stores/
│  └─ types/
├─ tests/
│  ├─ unit/
│  └─ e2e/ (optional Playwright)
├─ public/
├─ tailwind.config.ts
├─ vite.config.ts
├─ package.json
├─ README.md
└─ CALUDE.md
```

---

## 11) Key Commands (scripts)

```json
{
  "scripts": {
    "dev": "vite --ssr src/server/index.ts",
    "build": "vite build && vite build --ssr src/server/index.ts",
    "build:ssr": "yarn build",
    "preview": "node dist/server/index.js",
    "test": "vitest",
    "lint": "eslint ."
  }
}
```

Run locally:
```bash
doppler run -- yarn dev
```

---

## 12) Amplify Hosting (SSR) & Routing

- Connect GitHub repo to Amplify.
- Set build commands in `amplify.yml` (above).
- Rewrites & redirects (example):
```
[/]
  Source address: </^\/api\/.*$/>
  Target: /server   # SSR function endpoint (if separated)
  Type: 200 (Rewrite)

[/]
  Source address: </.*>
  Target: /index    # SSR renderer
  Type: 200
```
- If SSR deployment requires Lambda function, export a handler from `dist/server/index.js`; Amplify will provision Node runtime and attach routes. Validate cold start (< 500 ms typical).

---

## 13) API Contracts

### Auth
- Cookie session contains Cognito tokens. Server verifies & injects `req.user = { sub, email, role }`.

### Forms
- `POST /api/forms` (role: clinician) → create form.
- `PUT /api/forms/:formId` (role: clinician) → update form metadata/fields.
- `GET /api/forms` (role: clinician|teacher) → list available forms (teacher: only active).

### Episodes
- `POST /api/episodes` (role: teacher) → create episode.
- `GET /api/episodes?mine=true` (role: teacher) → list own episodes.
- `GET /api/episodes` (role: clinician|sysadmin) → list with filters.
- `GET /api/episodes/export.(pdf|xml)` (role: clinician|sysadmin) → export.

### Users
- `POST /api/users` (role: sysadmin) → create user; also set Cognito `custom:role`.
- `PUT /api/users/:userId/disable` (role: sysadmin) → disable user.

---

## 14) Export Formats

**PDF**
- Title, date range, filters summary.
- Table: timestamp, teacher, form, context, trigger, response, duration, resolution, notes.
- Footer with page number, generated at.

**XML (namespace: `urn:episode-registry:v1`)**
```xml
<episodes xmlns="urn:episode-registry:v1" generatedAt="2025-09-20T12:34:56Z">
  <episode id="...">
    <timestamp>...</timestamp>
    <teacher id="...">...</teacher>
    <form id="...">Form title</form>
    <context>class</context>
    <trigger>...</trigger>
    <response>...</response>
    <duration>...</duration>
    <resolution>...</resolution>
    <notes>...</notes>
  </episode>
</episodes>
```

---

## 15) Testing Strategy

- **Unit**: components (render, validation), composables (formatters), server utilities.
- **Integration**: SSR route guards, API handlers with in‑memory DDB stub (or `@shelf/jest-dynamodb` alt).
- **E2E (optional)**: Playwright against Amplify preview env.
- Coverage threshold: lines 85%+.

---

## 16) Threat Model (quick)

- Mis‑scoped IAM → use least privilege to a specific table ARN only.
- IDOR on episodes → always filter by `createdBy` for teachers.
- Token theft → short token lifetime, `HttpOnly` secure cookies, CSRF token on POST.
- PII leakage in logs → redact email/phone; structured logs with allowlist.
- Form tampering → server validates field schema; reject unknown fields.

---

## 17) Accessibility Checklist (WCAG 2.2 AA)

- Text alternatives, headings structure, label+`for` on inputs.
- Visible focus; skip‑to‑content; 44px touch targets.
- Color contrast ≥ 4.5:1; prefers‑reduced‑motion respected.

---

## 18) Initial UX Flows

- **Teacher**: Login → “New Episode” → choose form → fill → submit → success → “My Episodes” (filter/range).
- **Clinician**: Login → “Forms” (create/edit) → “Data” (filter/export PDF/XML) → “Analytics” (charts).
- **SysAdmin**: Login → “Users” (create/disable, assign role) → “Analytics (global)” → “Exports All”.

---

## 19) Minimal IAM Policy (attach to SSR role)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query",
        "dynamodb:UpdateItem",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:eu-west-2:<ACCOUNT_ID>:table/app_core",
        "arn:aws:dynamodb:eu-west-2:<ACCOUNT_ID>:table/app_core/index/GSI1",
        "arn:aws:dynamodb:eu-west-2:<ACCOUNT_ID>:table/app_core/index/GSI2"
      ]
    }
  ]
}
```

---

## 20) Setup Steps (from zero)

1. **Repo**
   ```bash
   mkdir episode-registry && cd $_
   git init
   corepack enable && corepack prepare yarn@stable --activate
   yarn create vite
   # Vue + TS; add vite-plugin-ssr
   yarn add vite-plugin-ssr @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
   yarn add jspdf pdf-lib xmlbuilder2 date-fns
   yarn add -D vitest @vue/test-utils jsdom eslint prettier husky lint-staged typescript @types/node
   yarn add -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```
2. **Amplify (console)**
   - Connect GitHub repo; set region `eu-west-2`.
   - Add environment variables (pull from **Doppler** during build, or mirror keys).
3. **Cognito**
   - Create user pool; add custom attribute `custom:role` (String).
   - Create app client; enable Authorization Code flow; set callback/logout URLs.
4. **DynamoDB**
   - Create table `app_core` with `PK` (string) and `SK` (string).
   - Create GSIs `GSI1(GSI1PK,GSI1SK)` and `GSI2(GSI2PK,GSI2SK)`.
5. **Doppler**
   ```bash
   doppler setup
   doppler secrets set AWS_REGION=eu-west-2
   doppler secrets set DDB_TABLE=app_core
   # ... add Cognito IDs, etc.
   ```
6. **Build & Deploy**
   - Commit + push; Amplify builds with `npx doppler run --command "yarn build:ssr"`.
7. **Smoke Test**
   - Create sysadmin user in Cognito; set `custom:role=sysadmin`.
   - Login → create clinician, teacher; create a form; submit an episode; export PDF/XML.

---

## 21) Versioning & Migrations

- Each Form has `version` (int). Episodes store `formId` only; field evolution handled by server mapping.
- Add `schemaVersion` to items when breaking changes occur.
- Backfill scripts (Node) under `scripts/` with checkpoint/batch writes.

---

## 22) Done Definition (MVP)

- Auth + RBAC enforced server‑side.
- Create form, submit episode, list/filter, export PDF/XML.
- DynamoDB PITR enabled; CloudWatch logs; basic analytics.
- Vitest unit coverage ≥ 85% on core components & server utils.
- Deployed on Amplify, region eu‑west‑2, with Doppler‑driven envs.

---

## 23) Appendix — Sample Rewrites (Amplify)

```
[/api/*]  -> SSR function route (node)
[/_*]     -> block direct asset traversal if needed
[/**]     -> SSR renderer
```

---

**End of CALUDE.md**
