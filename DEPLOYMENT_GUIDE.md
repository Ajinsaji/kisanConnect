# 🚀 Free Hosting Deployment Guide for KisanConnect

This guide will help you deploy your KisanConnect application for **FREE** using:
- **Backend**: Render.com (Free tier)
- **Database**: Render.com PostgreSQL (Free tier)
- **Frontend**: Vercel (Free tier)

---

## 📋 Prerequisites

1. GitHub account (your code should be on GitHub)
2. Render.com account (sign up at https://render.com)
3. Vercel account (sign up at https://vercel.com)

---

## 🗄️ Step 1: Deploy PostgreSQL Database (Render)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `kisanconnect-db`
   - **Database**: `kisanconnect`
   - **User**: `kisanconnect_user` (or leave default)
   - **Region**: Choose closest to you
   - **Plan**: **Free**
4. Click **"Create Database"**
5. **IMPORTANT**: Copy the **Internal Database URL** (you'll need this later)
   - Format: `postgresql://user:password@host:5432/database`

---

## 🔧 Step 2: Deploy Backend API (Render)

### 2.1 Prepare Backend Files

The following files are already created for you:
- `render.yaml` - Render configuration
- `.env.example` - Environment variables template

### 2.2 Create Environment Variables

1. Go to Render Dashboard → **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `kisanconnect-api`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `backend`

4. Add Environment Variables:
   ```
   DATABASE_URL=<Your PostgreSQL Internal Database URL from Step 1>
   SECRET_KEY=<Generate a random secret key>
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   ALGORITHM=HS256
   DEBUG=False
   ```

   **To generate SECRET_KEY**, run this in Python:
   ```python
   import secrets
   print(secrets.token_urlsafe(32))
   ```

5. Click **"Create Web Service"**

### 2.3 Important Backend Settings

- **Auto-Deploy**: Enable (deploys on every push to main branch)
- **Health Check Path**: `/docs` (FastAPI docs endpoint)

### 2.4 Get Your Backend URL

After deployment, you'll get a URL like:
```
https://kisanconnect-api.onrender.com
```

**Note**: Free tier services on Render spin down after 15 minutes of inactivity. First request may take 30-60 seconds.

---

## 🎨 Step 3: Deploy Frontend (Vercel)

### 3.1 Prepare Frontend

1. Go to https://vercel.com
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 3.2 Add Environment Variables

Add this environment variable in Vercel:
```
REACT_APP_API_URL=https://kisanconnect-api.onrender.com
```

Replace with your actual Render backend URL.

### 3.3 Deploy

Click **"Deploy"**. Vercel will:
1. Build your React app
2. Deploy it globally
3. Give you a URL like: `https://kisanconnect.vercel.app`

---

## 🔄 Step 4: Update CORS Settings

After getting your frontend URL, update CORS in your backend:

1. Go to Render Dashboard → Your Web Service → **Environment**
2. Add:
   ```
   CORS_ORIGINS=https://your-frontend-url.vercel.app,http://localhost:3000
   ```
3. Redeploy the backend

---

## 📝 Step 5: Update Database Connection

The backend will automatically use the `DATABASE_URL` environment variable. Make sure it's set correctly in Render.

---

## ✅ Step 6: Verify Deployment

1. **Backend**: Visit `https://your-backend-url.onrender.com/docs` - Should show FastAPI docs
2. **Frontend**: Visit your Vercel URL - Should load the app
3. **Test**: Try logging in or creating an account

---

## 🆓 Free Tier Limitations

### Render (Backend + Database)
- ✅ 750 hours/month free (enough for 24/7)
- ⚠️ Services spin down after 15 min inactivity (first request slow)
- ⚠️ 512 MB RAM
- ⚠️ Database: 90 days retention, 1 GB storage

### Vercel (Frontend)
- ✅ Unlimited deployments
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ 100 GB bandwidth/month

---

## 🔧 Alternative Free Hosting Options

### Option 2: Railway (All-in-one)
- **Website**: https://railway.app
- **Free Tier**: $5 credit/month
- Can host backend, database, and frontend
- Better performance than Render free tier

### Option 3: Fly.io
- **Website**: https://fly.io
- **Free Tier**: 3 shared VMs
- Good for backend + database

### Option 4: Supabase (Database) + Vercel (Frontend) + Render (Backend)
- **Supabase**: Free PostgreSQL with better features
- **Website**: https://supabase.com

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: Backend returns 503 or timeout
- **Solution**: First request after inactivity takes time. Wait 30-60 seconds.

**Problem**: Database connection error
- **Solution**: Use **Internal Database URL** from Render, not External URL

**Problem**: CORS errors
- **Solution**: Add your frontend URL to `CORS_ORIGINS` environment variable

### Frontend Issues

**Problem**: API calls fail
- **Solution**: Check `REACT_APP_API_URL` is set correctly in Vercel

**Problem**: Images not loading
- **Solution**: Update image URLs to use backend URL instead of localhost

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

---

## 🎉 Success!

Once deployed, you'll have:
- ✅ Backend API: `https://your-api.onrender.com`
- ✅ Frontend App: `https://your-app.vercel.app`
- ✅ Database: Managed PostgreSQL on Render

**Share your deployed app with the world!** 🌍
