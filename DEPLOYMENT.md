# 🚀 Gatenjia Production Deployment Guide

This guide will help you deploy Gatenjia to production platforms like Railway, Render, or DigitalOcean.

## 🎯 **Quick Start: Railway (Recommended)**

### **Step 1: Prepare Your Repository**
1. Ensure all changes are committed and pushed to GitHub
2. Your repository should have:
   - ✅ `railway.json` configuration
   - ✅ `docker-compose.prod.yml` for production
   - ✅ `.env.production.example` template
   - ✅ `scripts/deploy-prod.sh` script

### **Step 2: Deploy to Railway**
1. **Sign up at [railway.app](https://railway.app)**
2. **Create new project** → "Deploy from GitHub repo"
3. **Select your Gatenjia repository**
4. **Add PostgreSQL service**:
   - Service type: PostgreSQL
   - Name: `gatenjia-db`
   - Wait for it to provision

5. **Add Backend service**:
   - Service type: Web Service
   - Name: `gatenjia-backend`
   - Source: Your GitHub repo
   - Root directory: `apps/backend`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`

6. **Add Frontend service**:
   - Service type: Web Service
   - Name: `gatenjia-frontend`
   - Source: Your GitHub repo
   - Root directory: `apps/frontend`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`

### **Step 3: Configure Environment Variables**
In Railway dashboard, set these environment variables:

```bash
# Database (Railway will auto-generate this)
DATABASE_URL=postgresql://username:password@host:port/database

# JWT Secrets (generate secure random strings)
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_key_here

# Email (Resend)
RESEND_API_KEY=re_your_resend_api_key_here
FROM_EMAIL=noreply@yourdomain.com

# Frontend URLs (use Railway generated URLs)
FRONTEND_URL=https://your-frontend-service.railway.app
NEXT_PUBLIC_API_URL=https://your-backend-service.railway.app

# Environment
NODE_ENV=production
```

### **Step 4: Deploy and Test**
1. **Deploy all services** in Railway
2. **Wait for build completion**
3. **Test your endpoints**:
   - Frontend: `https://your-frontend-service.railway.app`
   - Backend: `https://your-backend-service.railway.app/health`
   - Database: Connected automatically

## 🌐 **Alternative: Render**

### **Step 1: PostgreSQL Database**
1. Create new PostgreSQL service
2. Note the connection string

### **Step 2: Backend Service**
1. Create new Web Service
2. Connect your GitHub repo
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables

### **Step 3: Frontend Service**
1. Create new Static Site
2. Connect your GitHub repo
3. Set build command: `npm install && npm run build`
4. Set publish directory: `.next`

## 🐳 **Local Production Testing**

### **Using Production Script**
```bash
# Copy environment template
cp .env.production.example .env.production

# Edit with your values
nano .env.production

# Run production deployment
./scripts/deploy-prod.sh
```

### **Manual Production Deployment**
```bash
# Build production images
docker build -f apps/backend/Dockerfile -t gatenjia-backend:prod .
docker build -f apps/frontend/Dockerfile -t gatenjia-frontend:prod .

# Deploy with production compose
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

## 🔧 **Production Configuration**

### **Environment Variables**
- **Required**: Database, JWT secrets, email API keys
- **Optional**: Custom domains, SSL certificates
- **Security**: Never commit secrets to Git

### **Database Migrations**
Railway and Render will automatically run:
```bash
npm run db:migrate
npm run db:generate
```

### **Health Checks**
Your services include health check endpoints:
- Backend: `/health`
- Frontend: Root endpoint
- Database: Connection check

## 🚨 **Important Production Notes**

### **Security**
1. **Generate strong JWT secrets** (64+ characters)
2. **Use HTTPS** (Railway/Render provide automatically)
3. **Secure database** (use strong passwords)
4. **Environment variables** (never hardcode secrets)

### **Performance**
1. **Database indexing** (Prisma handles most)
2. **Connection pooling** (configure in DATABASE_URL)
3. **Caching** (implement Redis if needed)
4. **CDN** (for static assets)

### **Monitoring**
1. **Railway/Render dashboards** (built-in)
2. **Application logs** (view in service dashboard)
3. **Database metrics** (connection count, query performance)
4. **Uptime monitoring** (set up alerts)

## 📱 **Demo Preparation**

### **Before Demo**
1. **Test all features**:
   - User registration/login
   - Add funds
   - Send money
   - Notifications (in-app + email)
   - Transaction history

2. **Prepare demo data**:
   - Create test accounts
   - Add sample transactions
   - Test notification system

3. **Check performance**:
   - Page load times
   - API response times
   - Database queries

### **Demo Checklist**
- ✅ **User Registration**: Show signup process
- ✅ **Wallet Management**: Display balance and transactions
- ✅ **Money Transfer**: Demonstrate send/receive
- ✅ **Notifications**: Show both in-app and email
- ✅ **Transaction History**: Display pagination and filtering
- ✅ **Mobile Responsiveness**: Test on different screen sizes

## 🆘 **Troubleshooting**

### **Common Issues**
1. **Database connection failed**: Check DATABASE_URL format
2. **Build errors**: Verify Node.js version compatibility
3. **Environment variables**: Ensure all required vars are set
4. **Port conflicts**: Check if ports 3000/4000 are available

### **Getting Help**
- **Railway**: [Discord community](https://discord.gg/railway)
- **Render**: [Community forum](https://community.render.com)
- **GitHub**: Open an issue in your repository

## 🎉 **Success!**

Once deployed, you'll have:
- 🌐 **Live demo URL** to share
- 📱 **Fully functional** money transfer app
- 🔔 **Complete notification** system
- 📊 **Real-time** transaction updates
- 🎯 **Professional** presentation ready

Your Gatenjia app is now production-ready for demos and presentations! 🚀
