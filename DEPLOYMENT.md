# Deployment Guide for LearnHub Platform

## 🚀 Vercel Deployment Instructions

### Prerequisites
1. GitHub account with this repository
2. Vercel account (free tier works)
3. MongoDB Atlas account (optional - demo mode works without)

### Step 1: Deploy Backend to Vercel

1. **Create a new Vercel project for backend:**
   ```bash
   cd backend
   vercel
   ```

2. **Set environment variables in Vercel dashboard:**
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/online-courses
   JWT_SECRET=your-super-secure-jwt-secret-key-here
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-email-password
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   NODE_ENV=production
   ```

3. **Note the backend URL** (e.g., `https://learnhub-backend-abc123.vercel.app`)

### Step 2: Deploy Frontend to Vercel

1. **Update frontend environment variables:**
   - Edit `frontend/.env.production`
   - Replace `https://your-backend-url.vercel.app/api` with your actual backend URL

2. **Create a new Vercel project for frontend:**
   ```bash
   cd frontend
   vercel
   ```

3. **Set environment variables in Vercel dashboard:**
   ```
   REACT_APP_API_URL=https://your-backend-url.vercel.app/api
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
   REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloud-name
   REACT_APP_ENVIRONMENT=production
   ```

### Step 3: Update CORS Configuration

1. **Update backend CORS to include your frontend domain:**
   - Edit `backend/src/server.js`
   - Add your Vercel frontend URL to the `allowedOrigins` array:
   ```javascript
   const allowedOrigins = [
     'http://localhost:3000',
     'http://localhost:3001',
     'https://your-frontend-domain.vercel.app'
   ];
   ```

2. **Redeploy backend** after CORS update

### Alternative: One-Click Deploy

#### Backend Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/online-courses/tree/main/backend)

#### Frontend Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/online-courses/tree/main/frontend)

## 🎯 Demo Mode
The platform works perfectly in demo mode without a database connection. If MongoDB fails to connect, it automatically switches to demo mode with:
- 5 sample courses
- Mock authentication
- Full functionality

## 📋 Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Environment variables configured
- [ ] CORS updated for production domains
- [ ] Demo mode working (if no database)
- [ ] Authentication flow tested
- [ ] Course catalog loading
- [ ] Help center accessible

## 🔧 Environment Variables Reference

### Backend Required:
- `MONGODB_URI` - MongoDB connection (optional for demo mode)
- `JWT_SECRET` - JWT signing secret
- `NODE_ENV` - Set to "production"
- `FRONTEND_URL` - Your frontend domain for CORS

### Frontend Required:
- `REACT_APP_API_URL` - Your backend API URL
- `REACT_APP_ENVIRONMENT` - Set to "production"

### Optional (for full features):
- Stripe keys for payments
- Cloudinary for file uploads
- Email service for notifications

## 🎉 Platform Features

✅ **Self-Taught Learning Platform**
- No instructor features (removed as requested)
- Comprehensive help center for self-service support
- Course catalog with video lessons
- Progress tracking
- User authentication and profiles
- Demo mode for immediate testing

The platform is now ready for production use!