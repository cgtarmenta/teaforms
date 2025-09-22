# Doppler Usage

Doppler centralizes and injects environment variables.

## Prerequisites
- Install Doppler CLI: https://docs.doppler.com/docs/install-cli
- Authenticate: `doppler login`
- Select project and config: `doppler setup`

## Recommended Keys
- App
  - `APP_NAME=TeaForms`
  - `NODE_ENV=development|production`
  - `PORT=5173`
  - `BASE=/`
  - `AWS_REGION=<your-region>`
  - `SESSION_SECRET=change_me`  # enables JWT-based persistent sessions
- Auth / AWS (placeholders OK for now)
  - `JWT_ROLE_CLAIM=custom:role`
  - `AWS_REGION=eu-west-2`
  - `DDB_TABLE=app_core`
  - `USE_DYNAMODB=true` or `DATA_BACKEND=ddb`
  - `DDB_ENDPOINT=http://localhost:8000` (for DynamoDB Local)

## Run with Doppler
- Dev (local, using AWS profile):
  - `AWS_PROFILE=cgtaa AWS_SDK_LOAD_CONFIG=1 yarn dev:doppler`
- Preview (after build): `yarn preview:doppler`

These wrappers use `doppler run --` to inject secrets at runtime.

To use DynamoDB Local (docker-compose):
1. `docker-compose up -d dynamodb`
2. `doppler secrets set USE_DYNAMODB=true`
3. `doppler secrets set DDB_ENDPOINT=http://localhost:8000`
4. `doppler secrets set DDB_TABLE=app_core`
5. `yarn dev:doppler`

## Amplify
Amplify can run builds with Doppler using `amplify.yml`:

```
- npx doppler run --command "yarn build"
```

Ensure the Amplify app is connected to the same Doppler project or env vars are mirrored in Amplify.

## DynamoDB (AWS) Bootstrap
If the table does not exist in your AWS account, you can create it with the provided script using your local AWS CLI profile:

```bash
AWS_PROFILE=cgtaa AWS_SDK_LOAD_CONFIG=1 \
  DDB_TABLE=app_core AWS_REGION=eu-west-2 \
  yarn bootstrap:ddb
```

To let Dynamoose auto-create tables in dev (not recommended in prod), set:

```
DDB_CREATE_TABLES=true
```
