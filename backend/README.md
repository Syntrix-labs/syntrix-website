# Backend

Express API for Syntrix authentication, projects, tasks, notifications, password reset, and uploads.

## Setup

```bash
npm ci
cp .env.example .env
npm run dev
```

Required environment variables are listed in `.env.example`.

The server still starts if `MONGO_URI` is empty. Database-backed routes return `503` until a real MongoDB connection string is added.
