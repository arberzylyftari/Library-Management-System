# Library Management System

A full stack web application for managing a personal library. Users can register, log
in, and manage their own collection of books: adding, editing, and deleting entries,
organizing them by genre, and tracking reading status. Administrators get a separate
dashboard to manage every user and every book in the system.

The standout part of the project is the AI layer. Instead of a single chatbot bolted on
as an afterthought, there are three distinct AI features, each backed by its own
Claude powered agent with scoped, read only access to the database: a natural language
query agent for asking questions about the library, a recommendation engine that
suggests new books based on reading history, and an insights panel that summarizes a
user's reading habits.

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [The AI layer, in depth](#the-ai-layer-in-depth)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Running with Docker](#running-with-docker)
- [Environment variables](#environment-variables)
- [API reference](#api-reference)
- [Testing](#testing)
- [Demo accounts](#demo-accounts)
- [Design decisions worth knowing about](#design-decisions-worth-knowing-about)
- [Deployment](#deployment)

## Features

### Core

- User registration and login with JWT based authentication and hashed passwords.
- Full CRUD for books: title, author, genre, reading status, and an optional price.
- Each user only sees and manages their own books. Search and filter by title, author,
  genre, and reading status.
- An admin dashboard for managing every user (edit name, email, role, or delete an
  account) and every book across the whole system, with owner information attached.
- Admins are protected from locking themselves out: an admin can't demote their own
  role or delete their own account.
- A collapsible sidebar (state persists across reloads) and an animated light and dark
  mode toggle: a full screen wipe transition, not just an instant color swap, that
  respects `prefers-reduced-motion` and never flashes the wrong theme on load.

### AI

1. **Ask AI**, a chat style natural language query agent with real, persistent
   conversation history, like a proper chat app rather than a single-shot Q&A box. Ask
   things like "Who owns the most books?", "Which is the most popular book?", or "Show
   the five most expensive books," and get back a written answer plus the underlying
   data rendered as a table. Follow-up questions work too ("What about the least
   expensive?"), because each conversation's recent history is replayed to Claude as
   context. Past conversations are listed in the sidebar (auto-titled from the first
   question), can be reopened or deleted, and the list is capped to the most recent 15
   with a "view all" popover for the rest.
2. **Recommendations**, an engine that reads a user's reading history (genres,
   completed books, currently reading) and suggests five books they don't already own,
   with a short reason for each pick tied back to their history.
3. **Library Insights**, a dashboard that summarizes a user's reading habits in plain
   language ("Fantasy is your most read genre," completion rate, price range) alongside
   the raw stats it was generated from.

### Bonus items completed

- Backend test suite (Vitest and Supertest, 57 tests covering auth, book ownership and
  scoping, admin routes, chat history, and the AI agents' data layer).
- Frontend test suite (Vitest and React Testing Library, 29 tests covering the auth
  context, route guards, forms, and shared UI components).
- Docker and docker-compose: the whole stack (Postgres, API, web) runs with a single
  command.

## Tech stack

**Backend**
- Node.js, Express 5, TypeScript
- Prisma ORM with PostgreSQL
- JWT for authentication, bcrypt for password hashing
- Zod for request validation
- Anthropic's Claude API (`@anthropic-ai/sdk`), using agentic tool calling
- Vitest and Supertest for testing

**Frontend**
- React 19, Vite, TypeScript
- Tailwind CSS v4 with hand written shadcn/ui style components (Radix primitives under
  the hood)
- React Router for client side routing
- Vitest and React Testing Library for testing

**Infrastructure**
- Docker, docker-compose, nginx (as a reverse proxy and static file server in
  production)

## Architecture

This is a fairly conventional client/server setup: a React single page app talks to an
Express REST API over JSON, and the API is the only thing that ever touches the
database.

```
web (React + Vite)  --->  api (Express)  --->  PostgreSQL
                              |
                              v
                        Claude API (Anthropic)
```

In development, Vite proxies requests to `/api/*` through to the Express server on
port 4000, so the browser only ever talks to one origin and there's no CORS
configuration to worry about. In the Docker setup, nginx plays the same role: it serves
the built frontend and reverse proxies `/api/*` to the API container.

Authentication is stateless. On login or registration, the API signs a JWT containing
the user's id and role, and the frontend stores it in `localStorage` and attaches it as
a Bearer token on every request. There are no server side sessions.

Authorization has two layers. Route level middleware (`requireAuth`, `requireAdmin`)
gates access to entire route groups, and controllers additionally check ownership on
individual resources: a regular user who requests, updates, or deletes a book that
isn't theirs gets a 404 (not a 403), so the existence of another user's book is never
revealed.

## The AI layer, in depth

The task allowed either a small LLM API or a rule based parser for the required query
agent. This project went further than either: all three AI features use Anthropic's
Claude with real agentic tool calling, not a single hardcoded prompt and not raw SQL
generation.

The reasoning behind that choice: giving the model a fixed set of narrow, whitelisted
tools (each backed by a specific, safe Prisma query) means the model decides which tool
to call and with what arguments, but it never sees or writes SQL and can never query
outside the shape those tools allow. That's a meaningfully different, and safer,
architecture than "ask an LLM to write SQL and execute whatever it returns," while still
being flexible enough to handle open ended natural language questions.

### How it works

Each of the three AI features has its own agent (a thin wrapper around
`client.beta.messages.toolRunner` from the Anthropic SDK) and its own small set of
tools:

- **Ask AI** (`POST /ai/query`) has four tools: listing books with filters and sorting,
  counting books per owner, ranking titles by popularity, and a general library summary.
  These tools are scoped server side based on the caller's role: a regular user's tools
  only ever see their own books, an admin's see every book. The model cannot widen that
  scope; it's enforced in the tool implementation, not in the prompt.
- **Recommendations** (`POST /ai/recommendations`) has one tool that returns the
  caller's own reading profile (genre and status breakdown, plus every title they
  already own). This tool is always scoped to the caller's own library, even if the
  caller is an admin, because "recommend me a book" is inherently personal. The model
  uses its own general knowledge to suggest real books that aren't already in that
  owned list, and is explicitly instructed to fall back to broad, popular picks (and say
  so) when a user's library is empty or very small.
- **Library Insights** (`POST /ai/insights`) has one tool, also always self scoped, that
  returns the same kind of aggregate stats as the Ask AI summary tool. The system prompt
  for this agent is stricter: it's told never to invent a statistic and to say plainly
  when there isn't enough data for an observation, rather than forcing a generic insight
  out of an empty or near empty library.

All three endpoints return the same shape, `{ answer, results }`: `answer` is the
model's written response and `results` is the raw data returned by whichever tools it
called, which the frontend renders as a table or a set of stat tiles depending on the
shape of the data. If `ANTHROPIC_API_KEY` isn't set, all three endpoints return a clean
503 rather than crashing, so the rest of the app is fully usable without an API key.

### Why not RAG, and why not raw SQL generation

There's no document retrieval involved (no embeddings, no vector search), because the
questions this app needs to answer are structured aggregate questions over a relational
database, not "find the passage that talks about X" style questions over unstructured
text. Tool calling over whitelisted queries is a better fit for that shape of problem
than RAG would be.

Raw SQL generation (having the model write and execute arbitrary SQL) was deliberately
avoided too. It's a much larger attack surface for something like SQL injection or
data exfiltration across users, and it would have made the "regular users only see their
own data" requirement much harder to guarantee. Scoped tool calling gets the same
natural language flexibility with a hard safety boundary that doesn't depend on the
model behaving correctly.

## Project structure

```
.
├── api/                    Express + TypeScript backend
│   ├── prisma/             Schema, migrations, and the demo-data seed script
│   ├── src/
│   │   ├── ai/             Claude agents, their tool definitions, and chat history
│   │   ├── config/         Environment variable loading
│   │   ├── controllers/    Route handlers
│   │   ├── middleware/     Auth, validation, error handling
│   │   ├── routes/         Express routers
│   │   ├── schemas/        Zod request validation schemas
│   │   └── utils/          JWT and password helpers
│   └── tests/               Vitest + Supertest test suite
├── web/                    React + Vite frontend
│   ├── src/
│   │   ├── components/     Reusable UI components, including ui/ (design system)
│   │   ├── context/        Auth and Ask AI chat state
│   │   ├── layouts/        App shell (sidebar, protected layout)
│   │   ├── lib/             API clients and shared utilities
│   │   └── pages/          Top level routed pages
│   └── tests/               Vitest + React Testing Library test suite
├── docker-compose.yml       Runs postgres, api, and web together
└── .env.example             Template for docker-compose's environment variables
```

## Getting started

### Prerequisites

- Node.js 20 or newer
- A local PostgreSQL server (or use the Docker setup below and skip straight to that
  section)
- An Anthropic API key if you want to try the AI features (optional; everything else
  works without one)

### Backend setup

```bash
cd api
npm install
cp .env.example .env
# edit .env: set DATABASE_URL to point at your Postgres instance,
# set JWT_SECRET to any long random string,
# optionally set ANTHROPIC_API_KEY to enable the AI features
npx prisma migrate deploy
npm run db:seed   # optional, adds a few demo accounts with sample libraries
npm run dev
```

The API starts on `http://localhost:4000` by default. `GET /health` is a good first
check. See [Demo accounts](#demo-accounts) for the seeded logins.

### Frontend setup

In a second terminal:

```bash
cd web
npm install
npm run dev
```

The frontend starts on `http://localhost:5173` and proxies `/api/*` requests to the
backend on port 4000, so both need to be running at the same time.

Open `http://localhost:5173`, register an account, and start adding books. To try the
admin dashboard, promote a user to admin directly in the database (there's no self
service admin signup, by design):

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';
```

## Running with Docker

If you'd rather not install Postgres or Node locally, the whole stack can run in
containers with one command:

```bash
cp .env.example .env
# edit .env: set JWT_SECRET, optionally set ANTHROPIC_API_KEY
docker compose up --build
```

This builds three images (the API, the web app served through nginx, and a one off
migration runner) and starts four containers: Postgres, a `migrate` job that applies
the Prisma migrations and exits, the API, and the web app. The API doesn't start until
migrations have finished, and the web app doesn't start proxying until the API reports
healthy.

Once it's up:

- Web app: `http://localhost:8080`
- API: `http://localhost:4001`
- Postgres (for direct access with `psql`, if you want it): `localhost:5433`

Those host ports (8080, 4001, 5433) are deliberately different from the ports the local
dev setup above uses (5173, 4000, 5432), so the Docker stack can run at the same time
as a local `npm run dev` setup without either one fighting over a port.

To stop everything and remove the database volume (a clean slate on the next `up`):

```bash
docker compose down -v
```

## Environment variables

### `api/.env` (local development, not used by Docker)

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | yes | none | PostgreSQL connection string |
| `PORT` | no | `4000` | Port the API listens on |
| `JWT_SECRET` | yes | none | Signing secret for auth tokens |
| `JWT_EXPIRES_IN` | no | `7d` | Token lifetime |
| `ANTHROPIC_API_KEY` | no | empty | Enables the three AI endpoints when set |
| `ANTHROPIC_MODEL` | no | `claude-haiku-4-5` | Which Claude model the agents use |

### `.env` at the repo root (used by docker-compose)

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `POSTGRES_DB` | no | `library_docker` | Database name inside the Postgres container |
| `POSTGRES_USER` | no | `postgres` | Postgres role |
| `POSTGRES_PASSWORD` | no | `postgres` | Postgres password |
| `JWT_SECRET` | yes | none | Same as above |
| `JWT_EXPIRES_IN` | no | `7d` | Same as above |
| `ANTHROPIC_API_KEY` | no | empty | Same as above |
| `ANTHROPIC_MODEL` | no | `claude-haiku-4-5` | Same as above |

## API reference

All routes are relative to the API's base URL (`http://localhost:4000` locally, or
`/api` through the frontend's proxy). Routes marked "auth" require a Bearer token;
routes marked "admin" additionally require the caller's role to be `ADMIN`.

**Auth**
- `POST /auth/register`, create an account and receive a token
- `POST /auth/login`, log in and receive a token
- `GET /auth/me` (auth), return the current user

**Books** (all require auth; regular users are scoped to their own books, admins see
everything)
- `GET /books`, list books, with optional `status`, `genre`, and `search` query params
- `POST /books`, create a book
- `GET /books/:id`, get a single book
- `PATCH /books/:id`, partially update a book
- `DELETE /books/:id`, delete a book

**Admin** (admin only)
- `GET /admin/users`, list every user with their book count
- `PATCH /admin/users/:id`, update a user's name, email, or role
- `DELETE /admin/users/:id`, delete a user (cascades to their books)
- `GET /admin/books`, list every book across every user, with owner details

**AI** (all require auth, all return 503 if `ANTHROPIC_API_KEY` isn't set)
- `POST /ai/query`, ask a natural language question, body:
  `{ "question": string, "conversationId"?: string }`. Omit `conversationId` to start a
  new conversation; the response includes the (new or existing) `conversationId` and
  its `title` so the frontend can track the thread.
- `POST /ai/recommendations`, get five book recommendations based on reading history
- `POST /ai/insights`, get a written summary of reading habits plus the underlying stats

**Conversations** (Ask AI chat history, all require auth, always scoped to the caller)
- `GET /conversations`, list the caller's conversations, newest first
- `GET /conversations/:id`, get a conversation with its full message history
- `DELETE /conversations/:id`, delete a conversation and its messages

## Testing

```bash
# backend, requires a local Postgres database named library_test
cd api
npm test

# frontend, no external services required
cd web
npm test
```

The backend suite spins up against a dedicated `library_test` database (separate from
whatever database you use for `npm run dev`) and clears it between tests. If your local
Postgres uses different credentials than the `postgres:postgres` default, set
`TEST_DATABASE_URL` before running the tests.

Of the 57 backend tests, 15 cover Ask AI's conversation history specifically: replaying
prior turns as context, capping how much history gets sent, and the usual
create/read/delete ownership rules for a conversation.

The AI agents' prompts and Claude's actual answers aren't unit tested (that would mean
either mocking the model's behavior, which doesn't prove much, or making real, billed,
non-deterministic API calls on every test run, which isn't practical). Instead, the
Prisma backed tools each agent calls are tested directly, which is where the actual
safety boundary lives, and the end to end behavior against the real Claude API was
verified manually while building each feature.

## Demo accounts

A seed script fills the database with a handful of demo accounts, each with a real,
varied library, so there's something to look at immediately instead of starting from an
empty account. Every demo account uses the same password:

| Email | Password | Notes |
| --- | --- | --- |
| dean.henderson@gmail.com | `12345678` | 11 books, mixed genres and statuses |
| janice.smith@gmail.com | `12345678` | 14 books, leans technical and sci-fi |
| stephanie.joelington@gmail.com | `12345678` | 14 books, classic literature |
| oliver.dasilva@gmail.com | `12345678` | 12 books, fantasy and drama |
| sarah.elisee@gmail.com | `12345678` | Empty library, for testing the empty state and cold-start AI behavior |

Run the seed script after migrating:

```bash
cd api
npm run db:seed
```

It's safe to run more than once: users are matched by email, and a user's books are
only created the first time (if they already have some, they're left untouched). None
of these accounts are admins; promote one yourself if you want to try the admin
dashboard (see [Getting started](#getting-started)).

## Design decisions worth knowing about

A few choices that might raise questions on a quick read through the code:

- **Cross owner access returns 404, not 403.** If a regular user requests a book that
  belongs to someone else, the API responds as if it doesn't exist at all, rather than
  confirming it exists but denying access. This avoids leaking the existence of other
  users' data through the response code alone.
- **Book price is a nullable `Decimal`, not a `Float`.** Floating point numbers aren't
  safe for currency. Prisma serializes `Decimal` fields as strings in JSON responses,
  which the frontend formats for display.
- **The recommendations and insights agents are always scoped to the caller's own
  library, even for admins.** Unlike the query agent, where an admin legitimately might
  want to ask about the whole library, "recommend a book for me" or "summarize my
  reading habits" only make sense as personal, first person requests.
- **The frontend infers how to render AI tool results from their shape, rather than
  having a hardcoded view per tool.** An array of objects becomes a table, a flat object
  becomes stat tiles, an object containing arrays becomes stat tiles plus sub tables.
  This means a new tool added to an agent later renders reasonably without any frontend
  changes, as long as it returns one of those shapes.

## Deployment

Not deployed yet. The application is fully containerized and ready to deploy to any
platform that can run docker-compose or accept individual container images (Render,
Railway, Fly.io, and similar are all reasonable fits), but a full end to end check of
the system is planned before choosing a host and going live.
