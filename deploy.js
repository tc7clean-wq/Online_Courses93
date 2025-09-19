#!/usr/bin/env node

console.log('🚀 LearnHub Platform - Vercel Deployment Helper\n');

console.log('📋 Deployment Steps:');
console.log('1. First, deploy the BACKEND:');
console.log('   cd backend && vercel --prod');
console.log('   Note the backend URL from Vercel output\n');

console.log('2. Update frontend environment:');
console.log('   Edit frontend/.env.production');
console.log('   Replace REACT_APP_API_URL with your backend URL\n');

console.log('3. Then deploy the FRONTEND:');
console.log('   cd frontend && vercel --prod\n');

console.log('4. Update CORS in backend:');
console.log('   Add your frontend domain to backend/src/server.js');
console.log('   Redeploy backend: cd backend && vercel --prod\n');

console.log('🎯 The platform works in demo mode without database!');
console.log('✅ Self-taught learning platform ready for production\n');

console.log('Environment Variables to set in Vercel:');
console.log('Backend:');
console.log('- MONGODB_URI (optional - demo mode works without)');
console.log('- JWT_SECRET=your-secret-key');
console.log('- NODE_ENV=production');
console.log('- FRONTEND_URL=https://your-frontend.vercel.app\n');

console.log('Frontend:');
console.log('- REACT_APP_API_URL=https://your-backend.vercel.app/api');
console.log('- REACT_APP_ENVIRONMENT=production\n');

console.log('🎉 Ready to deploy! Run the commands above step by step.');