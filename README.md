# mike-t-302f-test124

Task application monorepo with shared TypeScript schemas, an Express API, SQLite persistence, and a
Vite React frontend.

## Requirements

- Node.js 20 or newer
- npm

## Workspaces

- `shared`: shared task types and Zod schemas.
- `backend`: Express API, SQLite setup, migrations, and static frontend serving.
- `frontend`: Vite React task UI.

## Install

Install dependencies from the repository root:

```bash
npm install
```

## Environment

The backend loads environment variables with `dotenv` from the backend workspace directory. For
local runs through the root scripts, copy the example file into `backend/.env`:

```bash
cp .env.example backend/.env
```

You can also export the same variables in your shell before running `npm start`.

| Variable              | Default/example     | Description                                                                             |
| --------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `NODE_ENV`            | `development`       | Runtime mode. Use `production` for deployed builds and `test` for test runs.            |
| `HOST`                | `0.0.0.0`           | Address the backend binds to.                                                           |
| `PORT`                | `8080`              | HTTP port for the backend and built frontend.                                           |
| `CORS_ORIGIN`         | `true`              | Dev CORS setting. Use `false`, `true`, one origin, or a comma-separated allowlist.      |
| `SQLITE_PATH`         | `./data/app.sqlite` | SQLite database path, resolved relative to the backend workspace.                       |
| `FRONTEND_STATIC_DIR` | `../frontend/dist`  | Built frontend directory served by Express, resolved relative to the backend workspace. |

With the example settings, the app listens on `0.0.0.0:8080`, stores data at
`backend/data/app.sqlite`, and serves the built frontend from `frontend/dist`.

## Development

Run all workspace dev scripts:

```bash
npm run dev
```

The frontend dev server and backend both default to port `8080`, so for day-to-day development you
may prefer running one workspace at a time:

```bash
npm run dev --workspace @zeroclaw/backend
npm run dev --workspace @zeroclaw/frontend
```

Useful checks:

```bash
npm run lint
npm run format:check
npm run typecheck
npm test
npm run test:e2e
```

## Production Build And Run

Build shared types, the frontend bundle, then the backend:

```bash
npm run build
```

Start the backend from the repository root:

```bash
npm start
```

The backend serves both the REST API and the files in `frontend/dist`. Client-side routes fall back
to `frontend/dist/index.html`; API routes continue to return JSON.

## SQLite Data

`SQLITE_PATH` controls where task data is stored. With the example value, the database and SQLite
sidecar files live under:

```text
backend/data/app.sqlite
backend/data/app.sqlite-wal
backend/data/app.sqlite-shm
```

The backend creates the parent directory and runs migrations on startup.

## Backups

For a stopped app, copy the SQLite database and sidecar files together:

```bash
mkdir -p backups
cp backend/data/app.sqlite* backups/
```

For a running app, prefer SQLite's online backup command so the snapshot is consistent:

```bash
sqlite3 backend/data/app.sqlite ".backup 'backups/app-$(date +%Y%m%d-%H%M%S).sqlite'"
```

To restore, stop the backend, replace `backend/data/app.sqlite` with the backup, remove stale
`backend/data/app.sqlite-wal` and `backend/data/app.sqlite-shm` files if present, then start the
backend again.
