# 🚀 Quick Deploy Guide - 5 Minutes

## Step 1: Push to GitHub (if not already done)
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

## Step 2: Deploy Database (2 minutes)

1. Go to https://render.com → Sign up/Login
2. Click **"New +"** → **"PostgreSQL"**
3. Name: `kisanconnect-db`
4. Plan: **Free**
5. Click **"Create Database"**
6. **Copy the Internal Database URL** (starts with `postgresql://`)

## Step 3: Deploy Backend (2 minutes)

1. In Render, click **"New +"** → **"Web Service"**
2. Connect your GitHub repo
3. Settings:
   - **Name**: `kisanconnect-api`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Environment Variables:
   ```
   DATABASE_URL=<paste Internal Database URL from Step 2>
   SECRET_KEY=<generate random string>
   CORS_ORIGINS=http://localhost:3000
   ```
5. Click **"Create Web Service"**
6. **Wait for deployment** (2-3 minutes)
7. **Copy your backend URL** (e.g., `https://kisanconnect-api.onrender.com`)

## Step 4: Deploy Frontend (1 minute)

1. Go to https://vercel.com → Sign up/Login
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repo
4. Settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Create React App
5. Environment Variables:
   ```
   REACT_APP_API_URL=<paste your backend URL from Step 3>
   ```
6. Click **"Deploy"**
7. **Copy your frontend URL** (e.g., `https://kisanconnect.vercel.app`)

## Step 5: Update CORS (30 seconds)

1. Go back to Render → Your Web Service → **Environment**
2. Update `CORS_ORIGINS`:
   ```
   CORS_ORIGINS=http://localhost:3000,https://your-frontend-url.vercel.app
   ```
3. Render will auto-redeploy

## ✅ Done!

Your app is live at:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-api.onrender.com`
- **API Docs**: `https://your-api.onrender.com/docs`

---

## 🔑 Generate SECRET_KEY

Run this in Python:
```python
import secrets
print(secrets.token_urlsafe(32))
```

Or use this online: https://randomkeygen.com/

---

## ⚠️ Important Notes

1. **First request may be slow** - Render free tier spins down after 15 min inactivity
2. **Database URL** - Use **Internal Database URL**, not External
3. **CORS** - Must include your frontend URL in CORS_ORIGINS
4. **Environment Variables** - Set in Render/Vercel dashboards, not in code

---

## 🆘 Need Help?

See `DEPLOYMENT_GUIDE.md` for detailed instructions and troubleshooting.
