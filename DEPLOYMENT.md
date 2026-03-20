# CADNA Deployment Playbook

## Overview

| Service    | Platform       | URL                                          |
|------------|---------------|----------------------------------------------|
| Backend    | Render        | https://cadna-backend-kpgj.onrender.com      |
| Frontend   | Vercel        | https://exam-genius-cadna-five.vercel.app    |
| Database   | MongoDB Atlas | (see Render environment variables)           |

---

## Prerequisites

- Access to GitHub: https://github.com/Juadebfm/CADNA_BACKEND
- Access to Render dashboard: https://render.com
- Access to Vercel dashboard: https://vercel.com
- Access to MongoDB Atlas: https://cloud.mongodb.com
- Git installed locally
- curl or Postman for verification

---

## Backend Deployment (Render)

### Automatic Deployment
Render auto-deploys whenever code is merged into the `Main` branch.

```bash
# 1. Make your changes locally on main branch
git add .
git commit -m "your commit message"
git push origin main

# 2. Create PR from main → Main on GitHub and merge it
# 3. Render picks up the changes automatically
```

### Manual Deployment
1. Go to https://render.com
2. Click your **CADNA_BACKEND** service
3. Click **Manual Deploy** → **Deploy latest commit**
4. Watch the logs for errors

### Verify Backend is Live
```bash
curl https://cadna-backend-kpgj.onrender.com/health
```
Expected response:
```json
{"status":"ok","database":"connected","timestamp":"..."}
```

---

## Frontend Deployment (Vercel)

### Automatic Deployment
Vercel auto-deploys when code is pushed to the frontend repo's main branch.

```bash
git add .
git commit -m "your commit message"
git push origin main
```

### Verify Frontend is Live
Visit: https://exam-genius-cadna-five.vercel.app

---

## Environment Variables

### Render (Backend)
Set these in Render → your service → **Environment** tab. Never commit actual values to the repo.

| Variable                          | Description                             |
|-----------------------------------|-----------------------------------------|
| `MONGODB_URI`                     | MongoDB Atlas connection string         |
| `JWT_SECRET`                      | Secret key for signing JWT tokens       |
| `NODE_ENV`                        | Set to `production`                     |
| `PORT`                            | Set to `5000`                           |
| `FRONTEND_URL`                    | Vercel frontend URL (no trailing slash) |
| `GROQ_API_KEY`                    | Groq AI API key                         |
| `GROQ_MODEL`                      | e.g. `llama-3.3-70b-versatile`          |
| `AI_PROVIDER`                     | Set to `groq`                           |
| `AI_FALLBACK_PROVIDER`            | Set to `mock`                           |
| `AI_ESSAY_GRADING_ENABLED`        | `true`                                  |
| `AI_CHEATING_DETECTION_ENABLED`   | `true`                                  |
| `AI_QUESTION_GENERATION_ENABLED`  | `true`                                  |

### Vercel (Frontend)
Set these in Vercel → your project → **Settings** → **Environment Variables**:

| Variable        | Description            |
|-----------------|------------------------|
| `VITE_API_URL`  | Render backend URL     |

---

## Seeding Production Data

Run these after a fresh deployment or database wipe.

### Step 1 — Register an instructor
```bash
curl -X POST https://cadna-backend-kpgj.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Instructor","email":"instructor@cadna.com","phone":"08000000000","password":"YOUR_PASSWORD","role":"instructor"}'
```

### Step 2 — Login to get token
```bash
curl -X POST https://cadna-backend-kpgj.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"instructor@cadna.com","password":"YOUR_PASSWORD"}'
```
Copy the `accessToken` from the response.

### Step 3 — Seed 4 subject exams
```bash
curl -X POST https://cadna-backend-kpgj.onrender.com/api/admin/seed-exams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
Expected: 4 exams created (Mathematics, Physics, Chemistry, Biology), all students auto-enrolled.

### Step 4 — Register test students (for load testing)
```bash
for i in {1..10}; do
  curl -s -X POST https://cadna-backend-kpgj.onrender.com/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"firstName":"Test","lastName":"Student'"$i"'","email":"teststudent'"$i"'@test.com","phone":"0800000000'"$i"'","password":"YOUR_PASSWORD","role":"student"}'
  echo "--- Student $i done ---"
done
```

---

## Load Testing

### Prerequisites
- k6 installed at `C:\Program Files\k6\k6.exe`
- Test students registered (Step 4 above)
- `loadtest.js` in CADNA_BACKEND root

### Run Load Test
```bash
"/c/Program Files/k6/k6.exe" run loadtest.js
```

### Expected Results
| Check                  | Expected |
|------------------------|----------|
| login successful       | ✅ 100%  |
| get exams successful   | ✅ 100%  |
| start exam successful  | ✅ 100%  |
| get exam successful    | ✅ 100%  |
| login time < 1000ms    | ❌ Render free tier is slow (~2-3s avg) |
| exams time < 500ms     | ❌ Render free tier is slow            |

> **Note:** Timing failures are expected on Render free tier. Upgrade to a paid plan for production performance.

---

## Rollback Procedure

### Backend Rollback
1. Go to https://render.com → your service
2. Click **Deploys** tab
3. Find the last successful deploy
4. Click the three dots → **Redeploy**

### Frontend Rollback
1. Go to https://vercel.com → your project
2. Click **Deployments** tab
3. Find the last successful deployment
4. Click the three dots → **Promote to Production**

### Database Rollback
1. Go to https://cloud.mongodb.com
2. Click your cluster → **Backup** tab
3. Select a snapshot → **Restore**

---

## Troubleshooting

### Backend returning 404 on all routes
- Check Render deploy logs for startup errors
- Verify the correct branch (`Main`) is being deployed
- Ensure `mongoose` is imported in `app.js`

### Exams not showing for students
- Confirm exams are seeded: `GET /api/exams` with instructor token
- Confirm students are in the `enrolledStudents` array
- Check exam `isActive: true` and `endDate` is in the future

### Render service sleeping (free tier)
- Free tier spins down after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- Set up UptimeRobot to ping `/health` every 5 minutes to keep it awake

### CORS errors on frontend
- Verify `FRONTEND_URL` in Render env vars matches your Vercel URL exactly (no trailing slash)
- Check `allowedOrigins` array in `app.js`

---

## Branch Strategy

| Branch | Purpose                                        |
|--------|------------------------------------------------|
| `main` | Active development                             |
| `Main` | Production (auto-deploys to Render on merge)   |

Always develop on `main`, create a PR to `Main` to deploy to production.
