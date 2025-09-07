# Mock Casino Client – Agent Overview

This document explains the project’s purpose, components, flows, and how to use and extend this mock client when working against a casino/Game CRM backend.

## Purpose

- Provide a lightweight web client to:
  - Log in to the backend and obtain an access token
  - Browse available games and start one to obtain a game token
  - Connect to a game socket (playground) via Socket.IO
  - Receive live game configuration and events
  - Send configuration updates and test spin events

## High‑Level Architecture

- Node HTTP server acts as a tiny proxy and static file server.
- Single‑page frontend (`index.html`) provides the UI and Socket.IO client logic.
- Backend URL is configurable; defaults to `http://localhost:5000`.

Data flow:
1) User logs in → proxy forwards credentials to backend → returns `accessToken`.
2) Client fetches `/api/games` (Bearer auth) → user selects a game.
3) Client calls `/api/games/slug/:slug/play` → backend returns a URL containing `?token=...` → extract game token.
4) Client connects to Socket.IO server (e.g. `http://localhost:5000/playground`) with `auth.token = gameToken`.
5) Client listens for `game:config`, other events, can emit `game:config:update` and spin events.

## Repository Layout

- `server.js`: Minimal HTTP server and reverse proxy for selected API routes. Serves `index.html`.
- `index.html`: SPA with login, game select, socket connection, config editor, logs, and spin test.
- `README.md`: Basic setup/usage notes (naming mentions “terminal client”).
- `.env.example`: Example env values (keys differ from those used by `server.js`).
- `package.json`: Start script (`node server.js`) and `dotenv` dependency (not used in code yet).

## Server (`server.js`)

- Starts on `PORT` (default `8080`).
- Uses `BACKEND_URL` (default `http://localhost:5000`).
- CORS enabled for simple local testing.
- Proxies:
  - `POST /api/auth/login` → `${BACKEND_URL}/api/auth/login`
  - `GET /api/games` → `${BACKEND_URL}/api/games`
  - `GET /api/games/slug/:slug/play` → `${BACKEND_URL}/api/games/slug/:slug/play`
- Serves `index.html` at `/` and `/index.html`.
- Returns `404` for other routes.

Notes:
- Implementation uses Node’s built‑in `http`—no Express.
- Errors are returned as `{ success: false, error }` with a `500` when proxying fails.

## Frontend (`index.html`)

UI sections:
- Login: username/password, progress bar, enter‑to‑submit.
- Game selector: search input and dropdown list populated from `/api/games`.
- Game token: displays extracted token from the `play` API.
- Connection: Socket.IO connect/disconnect, status.
- Config editor: pretty‑prints JSON received via `game:config`, sends updates with `game:config:update`.
- Spin test: send arbitrary spin payload with a customizable event name (default `spin:request`).
- Logs: timestamp‑less but type‑colored log stream (info/error/success/received/sent) with auto‑scroll.
- Theme: light/dark toggle, persisted in `localStorage`.

Key behaviors:
- Auth: `POST /api/auth/login` via the local proxy; stores `accessToken` in memory.
- Games list: `GET /api/games` with `Authorization: Bearer <accessToken>`.
- Start game: `GET /api/games/slug/:slug/play`; expects response containing a URL with `?token=...`.
- Socket: connects using `io(serverUrl, { transports: ['websocket'], auth: { token: <gameToken> } })`.
- Events:
  - Receives `game:config` and shows it in the editor.
  - Emits `game:config:update` with edited JSON.
  - Emits a spin event (default id `spin:request`) with JSON payload.
  - Logs any event via `socket.onAny`.

## Configuration

Environment (server side):
- `PORT`: local proxy server port (default `8080`).
- `BACKEND_URL`: base URL of the casino backend (default `http://localhost:5000`).

Caveat:
- `.env.example` lists `API_BASE_URL`, `SOCKET_URL`, `NODE_ENV`, but `server.js` actually reads `BACKEND_URL` (and `PORT`). If you rely on `.env`, either align variable names or load them (e.g., `require('dotenv').config()` in `server.js`).

## Quickstart

- Install: `npm install`
- Run proxy/UI: `npm start`
- Visit: `http://localhost:8080`
- Set backend: export `BACKEND_URL`, e.g. `BACKEND_URL=http://localhost:5000 npm start`
- Default Socket.IO URL input: `http://localhost:5000/playground` (editable in the UI).

## Expected Backend Contract (Mock)

- `POST /api/auth/login` → `{ data: { accessToken: string } }`
- `GET /api/games` (Bearer access token) → `{ data: Array<{ slug: string, name?: string }> }`
- `GET /api/games/slug/:slug/play` (Bearer) → `{ data: { token: stringURLWithQueryParamToken } }`
- Socket.IO playground path accepts `auth.token = <gameToken>` and emits `game:config` on connect.

Adjust naming/shape to your backend. Errors are surfaced in the UI log.

## Limitations & Assumptions

- No refresh/renew for `accessToken`.
- Game token is displayed in the UI and copied to clipboard; use only in non‑prod contexts.
- CORS is permissive (`*`) for dev only.
- No HTTPS/TLS termination.
- Minimal error handling and no retry/reconnect strategy for sockets.
- No persistence of login state beyond runtime.

## Useful Extensions

- Load env with `dotenv` in `server.js`; reconcile `.env.example` keys with code.
- Add `GET /health` on the proxy for readiness checks.
- Add reconnect/backoff and transient error toasts for Socket.IO.
- Persist last used server URL and last selected game in `localStorage`.
- Add timestamps and filtering to logs.
- Support multiple environments via a small config panel or query params.

## Troubleshooting

- Cannot log in: verify `BACKEND_URL` and backend port; inspect proxy console output.
- Empty games list: confirm Bearer token header and backend route `/api/games`.
- No game token: ensure `/play` response contains a URL with `?token=...`.
- Socket fails to connect: check playground URL and that it accepts `auth.token`.
- CORS issues: you’re likely hitting the backend directly; use the proxy (`http://localhost:8080`).

## Glossary

- Access token: Bearer token returned by login, used for REST calls.
- Game token: Per‑game token used for authenticating the Socket.IO connection.
- Playground: Socket.IO namespace/endpoint for interactive game testing.

