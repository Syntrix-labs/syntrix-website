# Syntrix Website

Official website, client dashboard, and admin control platform for Syntrix Labs.

## Apps

- `frontend` - Next.js, React, Tailwind CSS, and Framer Motion.
- `backend` - Express, MongoDB/Mongoose, JWT auth, project tracking, consultations, meetings, payments, team, ads, and document uploads.

## Platform Features

- Public landing page for Syntrix services, portfolio, and project calls to action.
- Client dashboard for projects, document uploads, consultation messages, meetings, payments, and profile updates.
- Admin panel for clients, projects, consultation messages, meeting approvals, payments, team members, tracking, and advertisement/portfolio uploads.
- Meeting flow: client requests a time, admin confirms it, the meeting moves to upcoming automatically, and completed meetings move to history.
- Document uploads save locally by default and also upload to Google Drive when Drive env values are configured.

## Local Setup

### Easiest Start

```bash
npm run dev
```

Or double-click the launcher for your operating system:

- macOS: `START_HERE.command`
- Windows: `START_HERE.bat`

The launcher installs missing dependencies, refreshes native packages if the folder moved between macOS and Windows, creates missing env files, finds open ports, and starts both apps:

- Frontend: `http://localhost:3000` by default
- Backend: `http://localhost:5000` by default

Stop both apps with `Ctrl+C` in the Terminal window.

### Manual Setup

1. Install all dependencies:

```bash
npm run setup
```

2. If you want login, signup, projects, meetings, payments, uploads, and admin data to save, put a real MongoDB connection string in `backend/.env`:

```bash
MONGO_URI=mongodb+srv://...
```

Without `MONGO_URI`, the backend still starts and `/api/health` works, but database-backed routes return a clear `503` response.

3. Start both apps:

```bash
npm run dev
```

### Separate Terminals

```bash
npm run start:backend
```

```bash
npm run start:frontend
```

The frontend proxies `/api/*` requests to the backend URL from `BACKEND_URL`, defaulting to `http://localhost:5000`.

## Deployment Notes

- Deploy `backend` to Render as a Node service with `npm install` and `npm start`.
- Deploy `frontend` to Vercel with root directory `frontend`.
- Set `BACKEND_URL` in Vercel to your Render backend URL.
- Set `CLIENT_URL` in Render to your Vercel frontend URL.
- Keep real secrets in Render/Vercel environment variables. Do not commit `.env`.
