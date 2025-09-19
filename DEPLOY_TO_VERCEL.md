# 🚀 Deploy LearnHub to Vercel - Step by Step Guide

## ✅ GitHub Repository Ready!
Your complete self-taught learning platform has been pushed to GitHub:
**https://github.com/tc7clean-wq/Online_Courses93**

## 🔧 Prerequisites
- Vercel account (free tier works) - [Sign up here](https://vercel.com)
- GitHub account (already have this)

## 📋 Deployment Steps

### Option 1: Automatic Deployment via GitHub (Recommended)

#### **Step 1: Deploy Backend**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repo: `tc7clean-wq/Online_Courses93`
4. Select the **`backend`** folder
5. Set Framework Preset to "Other"
6. Add Environment Variables:
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secure-secret-key-here
   FRONTEND_URL=https://your-frontend-will-be-here.vercel.app
   ```
7. Click "Deploy"
8. **Note the backend URL** (e.g., `https://online-courses93-backend.vercel.app`)

#### **Step 2: Deploy Frontend**
1. Create another new Vercel project
2. Import the same GitHub repo: `tc7clean-wq/Online_Courses93`
3. Select the **`frontend`** folder
4. Framework Preset will auto-detect "Create React App"
5. Add Environment Variables:
   ```
   REACT_APP_API_URL=https://your-backend-url.vercel.app/api
   REACT_APP_ENVIRONMENT=production
   ```
6. Click "Deploy"
7. **Note the frontend URL** (e.g., `https://online-courses93-frontend.vercel.app`)

#### **Step 3: Update CORS**
1. Go back to your backend project in Vercel
2. Go to Settings → Environment Variables
3. Add/Update:
   ```
   FRONTEND_URL=https://your-actual-frontend-url.vercel.app
   ```
4. Redeploy the backend (it will auto-redeploy when you update env vars)

### Option 2: Manual CLI Deployment

```bash
# Login to Vercel
npx vercel login

# Deploy Backend
cd backend
npx vercel --prod
# Follow prompts, set environment variables in dashboard

# Deploy Frontend
cd ../frontend
npx vercel --prod
# Follow prompts, set environment variables in dashboard
```

## 🎯 Environment Variables Reference

### Backend Environment Variables:
```
NODE_ENV=production
JWT_SECRET=your-super-secure-secret-key-here
FRONTEND_URL=https://your-frontend-domain.vercel.app
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/courses (optional)
```

### Frontend Environment Variables:
```
REACT_APP_API_URL=https://your-backend-domain.vercel.app/api
REACT_APP_ENVIRONMENT=production
```

## 🎉 Platform Features Ready for Production

✅ **Self-Taught Learning Platform**
- No instructor features (removed as requested)
- Comprehensive help center
- 5 sample courses with video lessons
- User authentication and progress tracking
- Demo mode (works without database!)

✅ **Production Optimized**
- Security headers and CORS configured
- Rate limiting enabled
- Optimized builds
- Environment-specific configurations

## 🔍 Testing Your Deployment

1. **Backend Health Check**: Visit `https://your-backend-url.vercel.app/health`
2. **Frontend**: Visit `https://your-frontend-url.vercel.app`
3. **Demo Mode**: Platform works immediately with sample data
4. **Authentication**: Try the demo login credentials from the help center

## 📞 Important Notes

- **Demo Mode**: Your platform works perfectly without a database! All features are functional with sample data.
- **Auto-Deploy**: Any future commits to your GitHub repo will automatically redeploy
- **Environment Variables**: Set these in the Vercel dashboard under Project Settings → Environment Variables
- **Domain**: You can add a custom domain later in Vercel dashboard

## 🎯 One-Click Deploy Buttons

Click these buttons to deploy directly from GitHub:

**Backend:**
[![Deploy Backend to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tc7clean-wq/Online_Courses93/tree/main/backend)

**Frontend:**
[![Deploy Frontend to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tc7clean-wq/Online_Courses93/tree/main/frontend)

## ✅ Success!
Once deployed, you'll have a fully functional self-taught learning platform live on the internet!

Your platform includes:
- Course catalog with 5 sample courses
- Video lessons and downloadable resources
- User registration and authentication
- Progress tracking and dashboards
- Comprehensive help center for self-service support
- Mobile-responsive design
- Demo mode that works immediately

**🎉 Your self-taught learning platform is ready for the world!**