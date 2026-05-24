# mike-t-302f-test124

Task application monorepo with shared TypeScript schemas, an Express API, and a Vite React
frontend.

## Workspaces

- `shared`: shared task types and Zod schemas.
- `backend`: Express API, SQLite persistence, migrations, and static frontend serving.
- `frontend`: Vite React task UI.

## Setup

Install dependencies from the repository root:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

The default runtime listens on `0.0.0.0:8080`, stores SQLite data at `./data/app.sqlite`, and
serves the built frontend from `../frontend/dist` relative to the backend workspace.

## Development

Run all workspace dev servers:

```bash
npm run dev
```

## Production Build And Start

Build shared types, the frontend bundle, then the backend:

```bash
npm run build
```

Start the backend. It serves the API and the built frontend from `frontend/dist`:

```bash
npm start
```

Useful checks:

```bash
npm run lint
npm run typecheck
npm test
```
