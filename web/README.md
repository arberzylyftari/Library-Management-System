# Library Management System — Frontend

React + TypeScript + Vite, Tailwind CSS + shadcn/ui.

## Setup

```bash
npm install
npm run dev
```

Dev server runs on `http://localhost:5173` (or the next free port) and proxies `/api/*`
requests to the backend at `http://localhost:4000` (see `vite.config.ts`). Start the API
first so requests succeed.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — typecheck and build for production
- `npm run preview` — preview the production build locally
- `npm run lint` — run oxlint
