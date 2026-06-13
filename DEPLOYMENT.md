# Deploying BugTrack to Vercel

BugTrack deploys as **two separate Vercel projects** from this one repo:

- **Backend** — root directory `server/`, runs as serverless functions
- **Frontend** — root directory `client/`, static Vite build

Both are already configured (`server/vercel.json`, `server/api/index.js`, `client/vercel.json`). You just need to push to GitHub and import the repo twice.

---

## 0. Prerequisites

- **MongoDB Atlas** cluster (done) with a database user.
- Atlas **Network Access** → add `0.0.0.0/0` (Allow from Anywhere). Vercel's serverless IPs are dynamic, so this is required.
- The data is already seeded into Atlas. To re-seed later: set `MONGO_URI` in `server/.env` and run `npm run seed` from `server/`.

## 1. Push to GitHub

From the project root:

```bash
git add .
git commit -m "BugTrack QA management system"
git remote add origin https://github.com/<you>/bugtrack.git
git push -u origin main
```

`.env` is gitignored, so your Atlas credentials are **not** committed — you'll add them as env vars in Vercel instead.

## 2. Deploy the backend

1. Vercel → **Add New → Project** → import the `bugtrack` repo.
2. **Root Directory:** click *Edit* and select **`server`**.
3. **Framework Preset:** Other. (No build command needed.)
4. **Environment Variables** — add:

   | Key | Value |
   |---|---|
   | `MONGO_URI` | your Atlas connection string (the same one in `server/.env`) |
   | `JWT_SECRET` | a long random string |
   | `JWT_EXPIRES_IN` | `7d` |

   Leave `CLIENT_URL` unset for now (CORS will allow any origin until you set it).
5. **Deploy.** Note the URL, e.g. `https://bugtrack-api.vercel.app`.
6. Verify: open `https://bugtrack-api.vercel.app/api/health` → should return `{"status":"ok"}`.

## 3. Deploy the frontend

1. Vercel → **Add New → Project** → import the **same** repo again.
2. **Root Directory:** **`client`**.
3. **Framework Preset:** Vite (auto-detected).
4. **Environment Variables** — add:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://bugtrack-api.vercel.app/api` (your backend URL **+ `/api`**) |

   > Vite inlines env vars at **build time**, so this must be set before the build. If you add it later, trigger a redeploy.
5. **Deploy.** Note the URL, e.g. `https://bugtrack.vercel.app`.

## 4. Lock down CORS (optional but recommended)

1. Backend project → Settings → Environment Variables → add
   `CLIENT_URL = https://bugtrack.vercel.app` (your frontend URL).
2. Redeploy the backend (Deployments → ⋯ → Redeploy).

## 5. Test it

Open the frontend URL and sign in with a demo account:

| Email | Role | Password |
|---|---|---|
| `manager@bugtrack.dev` | Manager | `password123` |
| `qa@bugtrack.dev` | QA | `password123` |
| `dev@bugtrack.dev` | Developer | `password123` |

---

## Notes & troubleshooting

- **CORS errors in the browser:** make sure `VITE_API_URL` ends in `/api` and that `CLIENT_URL` (if set) exactly matches the frontend origin (no trailing slash).
- **500s / DB timeouts on the API:** check Atlas Network Access includes `0.0.0.0/0` and that `MONGO_URI` is correct in the backend project's env vars.
- **Frontend route 404 on refresh:** handled by `client/vercel.json` (SPA rewrite) — no action needed.
- **Cold starts:** the first request after idle may take 1–2s while the serverless function and DB connection warm up. This is normal for Vercel's free tier. If you want an always-on Node server instead, the same `server/` deploys to Render or Railway unchanged (they run `npm start`).
- **Updating `VITE_API_URL` later** requires a redeploy of the frontend, since it's baked into the build.
