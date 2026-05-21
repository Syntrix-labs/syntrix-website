# Syntrix Website

Official website and client/admin platform for Syntrix Labs.

## Apps

- `frontend` - Next.js, React, Tailwind CSS, and Framer Motion.
- `backend` - Express, MongoDB/Mongoose, JWT auth, notifications, tasks, and Google Drive uploads.

## Local Setup

1. Install frontend dependencies:

```bash
cd frontend
npm ci
```

2. Install backend dependencies:

```bash
cd backend
npm ci
```

3. Copy the example environment files:

```bash
copy frontend\.env.example frontend\.env.local
copy backend\.env.example backend\.env
```

4. Fill in the backend secrets in `backend\.env`.

5. Start the API and web app in separate terminals:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

The frontend runs at `http://localhost:3000` and proxies `/api/*` requests to `http://localhost:5000` by default.
