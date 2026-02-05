# ✅ Deployment Checklist

Use this checklist to ensure everything is configured correctly before deploying.

## Pre-Deployment

- [ ] All code is committed and pushed to GitHub
- [ ] `.env` file is NOT committed (should be in `.gitignore`)
- [ ] `requirements.txt` is up to date
- [ ] Frontend builds successfully (`npm run build` in frontend folder)
- [ ] Backend runs locally without errors

## Database Setup (Render)

- [ ] PostgreSQL database created on Render
- [ ] Internal Database URL copied
- [ ] Database name and credentials noted

## Backend Deployment (Render)

- [ ] Web service created on Render
- [ ] GitHub repository connected
- [ ] Root directory set to `backend`
- [ ] Build command: `pip install -r requirements.txt`
- [ ] Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- [ ] Environment variables set:
  - [ ] `DATABASE_URL` (Internal Database URL)
  - [ ] `SECRET_KEY` (random secure string)
  - [ ] `CORS_ORIGINS` (temporary: `http://localhost:3000`)
  - [ ] `DEBUG=False`
- [ ] Service deployed successfully
- [ ] Backend URL copied (e.g., `https://your-api.onrender.com`)
- [ ] API docs accessible at `/docs` endpoint

## Frontend Deployment (Vercel)

- [ ] Project created on Vercel
- [ ] GitHub repository connected
- [ ] Root directory set to `frontend`
- [ ] Framework preset: Create React App
- [ ] Environment variable set:
  - [ ] `REACT_APP_API_URL` (your backend URL from Render)
- [ ] Build successful
- [ ] Frontend URL copied (e.g., `https://your-app.vercel.app`)

## Post-Deployment Configuration

- [ ] CORS updated in Render with frontend URL
- [ ] Backend redeployed after CORS update
- [ ] Test frontend can connect to backend
- [ ] Test user registration
- [ ] Test user login
- [ ] Test API endpoints from frontend

## Testing

- [ ] Frontend loads without errors
- [ ] Can register new user
- [ ] Can login
- [ ] Can view products
- [ ] Can add to cart
- [ ] Can place order
- [ ] Images load correctly
- [ ] File uploads work
- [ ] Admin panel accessible (if applicable)

## Security Checklist

- [ ] `SECRET_KEY` is strong and random
- [ ] `DEBUG=False` in production
- [ ] Database credentials are secure
- [ ] CORS only allows your frontend domain
- [ ] No sensitive data in code
- [ ] Environment variables properly set

## Performance

- [ ] First request works (may be slow on free tier)
- [ ] Subsequent requests are faster
- [ ] Images optimized
- [ ] Frontend assets loading correctly

## Documentation

- [ ] Deployment URLs documented
- [ ] Environment variables documented
- [ ] Team members have access to deployment dashboards

---

## 🐛 Common Issues

### Backend returns 503
- **Solution**: Wait 30-60 seconds for first request (Render free tier spins down)

### CORS errors
- **Solution**: Add frontend URL to `CORS_ORIGINS` in Render

### Database connection fails
- **Solution**: Use Internal Database URL, not External

### Images not loading
- **Solution**: Check `REACT_APP_API_URL` is set correctly

### Environment variables not working
- **Solution**: Restart/redeploy service after adding variables

---

## 📞 Support

If you encounter issues:
1. Check Render/Vercel deployment logs
2. Check browser console for errors
3. Verify environment variables are set
4. See `DEPLOYMENT_GUIDE.md` for detailed troubleshooting
