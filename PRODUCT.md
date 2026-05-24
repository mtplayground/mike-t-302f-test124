# Product Snapshot

## What It Is

`mike-t-302f-test124` is a full-stack task manager monorepo. It combines a Vite React frontend,
an Express backend, shared TypeScript/Zod task contracts, and SQLite persistence.

## What It Does

Users can manage tasks through a web UI backed by REST endpoints:

- Add tasks with an optional due date.
- View tasks with loading, empty, and error states.
- Mark tasks complete or active.
- Inline-edit task titles, saving on blur or Enter and canceling with Escape.
- Set or clear due dates per task.
- Highlight overdue active tasks.
- Sort by created date or due date.
- Filter by status and due-date bucket.
- Delete tasks with a short undo window before the delete is committed.

## Architecture

- `shared`: exports the `Task` type and Zod schemas for create, update, and filter payloads.
- `backend`: Express app with JSON parsing, health check, CORS configuration, task routes,
  centralized error mapping, SQLite setup, and ordered SQL migrations.
- `frontend`: Vite React app using React Query for API state and Tailwind CSS for styling.
- The backend serves the built frontend from `frontend/dist` and falls back to `index.html` for
  non-API client routes.

## Runtime And Data

- Root `npm run build` builds shared types, frontend assets, then backend output.
- Root `npm start` starts the backend, which serves both API and frontend.
- Backend runtime configuration is environment-driven: host, port, CORS origin, SQLite path, and
  frontend static directory.
- Local backend env files should live at `backend/.env`.
- The example SQLite path is `backend/data/app.sqlite`; SQLite sidecar files may appear beside it.
- Backups should include the database and sidecar files, or use SQLite's online `.backup` command
  while the app is running.

## Quality Gates

- TypeScript is enabled across workspaces.
- ESLint and Prettier run from the root.
- Vitest covers backend repository/service behavior and frontend UI flows.
- Playwright has one built-app smoke test covering add, edit, due date, complete, and delete.

## Conventions

- Keep task shape changes in `shared` first so frontend and backend stay aligned.
- Backend database paths are read from environment variables; do not hardcode deployment paths.
- API routes return JSON; non-API frontend routes are served by the static fallback.
- Generated artifacts, SQLite files, env files, Playwright reports, and dependency directories stay
  out of git.
