# Frontend

Next.js web app for the Syntrix Labs marketing site, client dashboard, admin dashboard, and auth screens.

## Setup

```bash
npm ci
cp .env.example .env.local
npm run dev
```

The app runs at `http://localhost:3000`.

By default, `/api/*` requests are proxied to `http://localhost:5000`. Change `BACKEND_URL` in `.env.local` if the API runs somewhere else.

## Checks

```bash
npm run build
```
