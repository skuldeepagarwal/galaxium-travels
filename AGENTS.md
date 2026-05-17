# AGENTS.md

This file provides guidance to agents when working with code in this repository.

- The repo is split into two independently runnable apps: `booking_system_backend` (Python/FastAPI) and `booking_system_frontend` (Vite/React). Run commands from the respective subdirectory, not the repo root.
- Backend startup always triggers `init_db()` and `seed()` via FastAPI lifespan in `booking_system_backend/server.py`; avoid assuming an empty local DB after `python server.py`.
- The same backend process serves both REST and MCP. `FastMCP` is instantiated before `FastAPI`, then mounted at `/mcp`; preserve that order when refactoring `server.py`.
- Backend service functions return either success schemas or `ErrorResponse`; MCP wrappers convert `ErrorResponse` into thrown exceptions, while REST endpoints return the union directly.
- Backend tests isolate state by monkeypatching both `db.SessionLocal` and `server.SessionLocal` to a shared in-memory SQLite session (`booking_system_backend/tests/conftest.py`). Reuse that pattern for new DB-backed tests.
- Single backend test runs work from `booking_system_backend` with `pytest tests/test_services.py::test_name` or `pytest tests/test_rest.py::test_name`; pytest discovery is restricted to `tests/test_*.py` by `pytest.ini`.
- Frontend API calls must go through `src/services/api.ts`; its axios interceptor normalizes transport failures into the backend-style `ErrorResponse` shape and `isErrorResponse()` is the expected discriminator.
- Frontend user persistence is hard-coded to the `localStorage` key `galaxium_user` in `src/hooks/useUser.tsx`; changing that key breaks persisted sessions.
- Shared UI primitives are re-exported from `src/components/common/index.ts`; prefer importing from that barrel to match existing component usage.
- Frontend linting is only configured for `*.ts`/`*.tsx`, and only `dist` is globally ignored in ESLint config; JS config files are outside the enforced rules.
- Frontend build/lint commands live under `booking_system_frontend` (`npm run build`, `npm run lint`); backend has no lint script/config in-repo, only pytest-based test tooling in `requirements.txt`.