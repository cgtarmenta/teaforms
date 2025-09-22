# TeaForms Project Execution Plan
## Complete Checklist for Multi-Agent Execution

### ⚠️ CRITICAL RULES - READ FIRST
1. **ALWAYS USE YARN** - Never use npm
3. **VITE + VUE 3 + TYPESCRIPT + TAILWIND 4**
4. **TEST EACH STEP** - Verify success before proceeding
5. **COMMIT AFTER MAJOR MILESTONES**

---

## PHASE 1: Project Initialization
### Prerequisites Check
- [ ] Verify Node.js version: `node --version` (should be 18+ or 20+)
- [ ] Verify Yarn is installed: `yarn --version`
- [ ] Verify git is initialized: `git status`
- [ ] Working directory is `/home/dat30/github/teaforms`

### Step 1.1: Clean Slate
```bash
# Ensure clean directory (keep only CLAUDE.md and this plan)
[ ] ls -la  # Should show only .git, CLAUDE.md, EXECUTION_PLAN.md
```

### Step 1.2: Initialize Vite Project
```bash
[ ] yarn create vite . --template vue-ts
# When prompted:
# - Package name: episode-registry
# - Select: Vue
# - Select: TypeScript
```

### Step 1.3: Install Core Dependencies
```bash
[ ] yarn install
[ ] yarn add vue-router@4 pinia
```

### Step 1.4: Install Development Dependencies
```bash
[ ] yarn add -D @types/node
[ ] yarn add -D @vitejs/plugin-vue @vitejs/plugin-vue-jsx
[ ] yarn add -D @vue/tsconfig
```

### CHECKPOINT 1
```bash
[ ] yarn build  # Should complete without errors
[ ] git add -A && git commit -m "feat: initialize project with Vite + Vue 3 + TS + SSR"
```

---

## PHASE 2: Configure SSR
### Step 2.1: Create Configuration
```typescript
# Create vite.config.ts
[ ] Create file with proper plugin configuration
    - Configure Vue plugin
    - Set up path aliases
```

### Step 2.2: Create Pages Structure
```
[ ] mkdir -p src/pages
[ ] Create src/pages/+Layout.vue  # Root layout
[ ] Create src/pages/index/+Page.vue  # Home page
```

### Step 2.3: Create Server Entry
```
[ ] mkdir -p src/server
[ ] Create src/server/index.ts  # Express/Node server for SSR
```

### CHECKPOINT 2
```bash
[ ] yarn dev  # Should start dev server
[ ] curl http://localhost:3000  # Should return HTML
[ ] git commit
```

---

## PHASE 3: Tailwind CSS v4 Setup
### Step 3.1: Install Tailwind v4
```bash
[ ] yarn add -D tailwindcss@next @tailwindcss/postcss@next postcss autoprefixer
```

### Step 3.2: Configure Tailwind
```bash
[ ] npx tailwindcss init -p  # Creates tailwind.config.js & postcss.config.js
```

### Step 3.3: Create CSS Files
```css
# Create src/styles/main.css
[ ] Add Tailwind directives (@tailwind base/components/utilities)
[ ] Import in main.ts
```

### CHECKPOINT 3
```bash
[ ] yarn build  # Should process CSS
[ ] Verify Tailwind classes work in a test component
[ ] git commit -am "feat: add Tailwind CSS v4"
```

---

## PHASE 4: AWS SDK & Authentication Setup
### Step 4.1: Install AWS Dependencies
```bash
[ ] yarn add aws-amplify @aws-amplify/ui-vue
[ ] yarn add @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
[ ] yarn add @aws-sdk/client-cognito-identity-provider
[ ] yarn add aws-jwt-verify jsonwebtoken
[ ] yarn add -D @types/jsonwebtoken
```

### Step 4.2: Create Auth Module
```
[ ] Create src/server/auth.ts  # JWT verification, role extraction
[ ] Create src/composables/useAuth.ts  # Client-side auth
[ ] Create src/stores/auth.ts  # Pinia auth store
```

### CHECKPOINT 4
```bash
[ ] yarn build  # Should complete with AWS deps
[ ] git commit -am "feat: add AWS SDK and auth modules"
```

---

## PHASE 5: Database Models (DynamoDB)
### Step 5.1: Create Database Client
```
[ ] Create src/server/db/client.ts  # DynamoDB client setup
[ ] Create src/server/db/models/User.ts
[ ] Create src/server/db/models/Form.ts
[ ] Create src/server/db/models/Episode.ts
```

### Step 5.2: Create Repository Layer
```
[ ] Create src/server/repositories/UserRepository.ts
[ ] Create src/server/repositories/FormRepository.ts
[ ] Create src/server/repositories/EpisodeRepository.ts
```

### CHECKPOINT 5
```bash
[ ] yarn build
[ ] git commit -am "feat: add DynamoDB models and repositories"
```

---

## PHASE 6: API Routes
### Step 6.1: Create API Structure
```
[ ] mkdir -p src/server/api
[ ] Create src/server/api/auth.ts    # Login/logout endpoints
[ ] Create src/server/api/users.ts   # User management
[ ] Create src/server/api/forms.ts   # Form CRUD
[ ] Create src/server/api/episodes.ts # Episode CRUD
```

### Step 6.2: Wire API to Server
```
[ ] Update src/server/index.ts to include API routes
[ ] Add middleware: cookie-parser, cors, compression
```

### CHECKPOINT 6
```bash
[ ] yarn add cookie-parser compression cors
[ ] yarn add -D @types/cookie-parser @types/compression @types/cors
[ ] yarn build && yarn dev
[ ] Test API endpoint: curl http://localhost:3000/api/health
[ ] git commit -am "feat: add API routes"
```

---

## PHASE 7: Pages Implementation
### Step 7.1: Authentication Pages
```
[ ] Create src/pages/login/+Page.vue
[ ] Create src/pages/logout/+Page.vue
[ ] Create src/pages/+guard.ts  # Route protection
```

### Step 7.2: Core Application Pages
```
[ ] Create src/pages/dashboard/+Page.vue
[ ] Create src/pages/forms/+Page.vue
[ ] Create src/pages/forms/[id]/+Page.vue
[ ] Create src/pages/episodes/+Page.vue
[ ] Create src/pages/episodes/new/+Page.vue
```

### Step 7.3: Admin Pages
```
[ ] Create src/pages/admin/users/+Page.vue
[ ] Create src/pages/admin/analytics/+Page.vue
```

### CHECKPOINT 7
```bash
[ ] yarn dev
[ ] Navigate through all pages (should not error)
[ ] git commit -am "feat: implement all pages"
```

---

## PHASE 8: Components Library
### Step 8.1: Base Components
```
[ ] Create src/components/base/AppButton.vue
[ ] Create src/components/base/AppInput.vue
[ ] Create src/components/base/AppSelect.vue
[ ] Create src/components/base/AppCard.vue
```

### Step 8.2: Domain Components
```
[ ] Create src/components/forms/FormBuilder.vue
[ ] Create src/components/forms/FormField.vue
[ ] Create src/components/episodes/EpisodeCard.vue
[ ] Create src/components/episodes/EpisodeFilters.vue
```

### CHECKPOINT 8
```bash
[ ] yarn build
[ ] git commit -am "feat: create component library"
```

---

## PHASE 9: Export Functionality
### Step 9.1: Install Export Libraries
```bash
[ ] yarn add jspdf pdf-lib xmlbuilder2
[ ] yarn add -D @types/jspdf
```

### Step 9.2: Create Export Services
```
[ ] Create src/server/services/PdfExporter.ts
[ ] Create src/server/services/XmlExporter.ts
[ ] Add export endpoints to API
```

### CHECKPOINT 9
```bash
[ ] yarn build
[ ] Test PDF export endpoint
[ ] Test XML export endpoint
[ ] git commit -am "feat: add export functionality"
```

---

## PHASE 10: Testing Setup
### Step 10.1: Install Testing Dependencies
```bash
[ ] yarn add -D vitest @vue/test-utils jsdom happy-dom
[ ] yarn add -D @vitest/ui
```

### Step 10.2: Configure Testing
```
[ ] Create vitest.config.ts
[ ] Create tests/unit/ directory
[ ] Create tests/setup.ts
```

### Step 10.3: Write Initial Tests
```
[ ] Create tests/unit/components/AppButton.test.ts
[ ] Create tests/unit/server/auth.test.ts
[ ] Create tests/unit/utils/formatters.test.ts
```

### CHECKPOINT 10
```bash
[ ] yarn test  # All tests should pass
[ ] yarn test:coverage  # Check coverage
[ ] git commit -am "feat: add testing setup"
```

---

## PHASE 11: Environment Configuration
### Step 11.1: Create Environment Files
```
[ ] Create .env.example
[ ] Create .env.local (git ignored)
[ ] Create .env.production (git ignored)
```

### Step 11.2: Environment Variables
```env
# Required variables:
VITE_APP_NAME=episode-registry
VITE_AWS_REGION=eu-west-2
VITE_COGNITO_USER_POOL_ID=xxx
VITE_COGNITO_CLIENT_ID=xxx
DDB_TABLE=app_core
```

### CHECKPOINT 11
```bash
[ ] yarn dev  # Should load env vars
[ ] git commit -am "feat: add environment configuration"
```

---

## PHASE 12: Docker Setup (Local Development)
### Step 12.1: Create Docker Files
```
[ ] Create Dockerfile
[ ] Create docker-compose.yml
[ ] Create .dockerignore
```

### Step 12.2: Local Services
```yaml
# docker-compose.yml should include:
[ ] Node app service
[ ] DynamoDB local
[ ] Redis (optional cache)
```

### CHECKPOINT 12
```bash
[ ] docker-compose up -d
[ ] docker-compose ps  # All services running
[ ] git commit -am "feat: add Docker setup"
```

---

## PHASE 13: AWS Amplify Configuration
### Step 13.1: Create Amplify Config
```yaml
[ ] Create amplify.yml with:
    - Build settings
    - Environment variables
    - Artifacts configuration
```

### Step 13.2: SSR Handler
```
[ ] Create src/server/amplify-handler.ts  # Lambda@Edge handler
[ ] Update build scripts for Amplify
```

### CHECKPOINT 13
```bash
[ ] yarn build:amplify  # Special build for Amplify
[ ] git commit -am "feat: configure AWS Amplify"
```

---

## PHASE 14: Production Build & Optimization
### Step 14.1: Build Optimizations
```
[ ] Configure code splitting in vite.config.ts
[ ] Set up PWA manifest
[ ] Add security headers
```

### Step 14.2: Performance Optimizations
```
[ ] Lazy load routes
[ ] Optimize images
[ ] Enable compression
```

### CHECKPOINT 14
```bash
[ ] yarn build
[ ] yarn preview  # Test production build
[ ] Check bundle size < 200KB initial
[ ] git commit -am "feat: production optimizations"
```

---

## PHASE 15: Final Validation
### Step 15.1: Local Testing
```bash
[ ] yarn install --frozen-lockfile
[ ] yarn build
[ ] yarn test
[ ] yarn preview
```

### Step 15.2: Documentation
```
[ ] Update README.md with setup instructions
[ ] Document API endpoints
[ ] Add JSDoc to key functions
```

### Step 15.3: Pre-deployment Checklist
```
[ ] All tests passing
[ ] Build successful
[ ] No TypeScript errors
[ ] No console errors in browser
[ ] Mobile responsive verified
[ ] WCAG AA compliance checked
```

### FINAL CHECKPOINT
```bash
[ ] git add -A
[ ] git commit -m "feat: complete TeaForms MVP implementation"
[ ] git push origin main
```

---

## Common Issues & Solutions

### Issue: Dependencies not installing
```bash
# Solution:
rm -rf node_modules yarn.lock
yarn cache clean
yarn install
```

### Issue: Tailwind v4 not processing
```bash
# Check postcss.config.js has:
export default {
  plugins: {
    '@tailwindcss/postcss': {}
  }
}
```

### Issue: Build fails with type errors
```bash
# Install missing types:
yarn add -D @types/node @vue/tsconfig
```

---

## Success Criteria
- [ ] App runs locally with `yarn dev`
- [ ] Build completes with `yarn build`
- [ ] All tests pass with `yarn test`
- [ ] SSR works (view source shows rendered HTML)
- [ ] Authentication flow works
- [ ] Forms can be created/edited
- [ ] Episodes can be submitted
- [ ] PDF/XML export works
- [ ] Mobile responsive
- [ ] Deployed to AWS Amplify

---

## Notes for Agents
1. Each checkbox [ ] is a discrete task
2. Complete phases sequentially
3. Run checkpoints before proceeding
4. If a step fails, do not continue - debug first
5. Commit after each successful checkpoint
6. Use the exact commands provided
7. Refer to CLAUDE.md for detailed requirements