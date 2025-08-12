# 🚀 Railway Deployment Guide for Gatenjia

## ✅ **Pre-Deployment Checklist**

### **1. Code Status**
- [x] TypeScript compilation issues resolved
- [x] Enum usage replaced with constants
- [x] Import paths fixed (no .js extensions)
- [x] Type compatibility issues resolved
- [x] Dockerfile optimized for Railway

### **2. Railway Setup**
- [ ] Railway account created
- [ ] New project created
- [ ] GitHub repository connected
- [ ] Environment variables configured

## 🐳 **Docker Build Process**

### **Build Steps in Railway:**
1. **Install Dependencies** - `npm ci --only=production`
2. **Copy Prisma Schema** - Copy from `apps/backend/prisma/`
3. **Generate Prisma Client** - `npx prisma generate`
4. **Copy Source Code** - Copy from `apps/backend/src/`
5. **Build Application** - `npm run build`
6. **Start Service** - `npm start`

### **Key Optimizations:**
- **Multi-stage build** for smaller image size
- **Layer caching** for faster builds
- **Health check endpoint** at `/health`
- **Production dependencies only**

## 🔧 **Environment Variables**

### **Required Variables in Railway:**
```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# JWT
JWT_SECRET="your_super_secure_jwt_secret"
JWT_REFRESH_SECRET="your_super_secure_refresh_secret"

# Email (Resend)
RESEND_API_KEY="re_your_resend_api_key"
FROM_EMAIL="noreply@yourdomain.com"

# Frontend
FRONTEND_URL="https://yourdomain.com"
NEXT_PUBLIC_API_URL="https://yourdomain.com"

# Node
NODE_ENV="production"
PORT="4000"
```

## 📋 **Deployment Steps**

### **1. Connect Repository**
1. Go to [Railway Dashboard](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `gatenjia` repository

### **2. Configure Service**
1. **Service Type**: Backend API
2. **Dockerfile**: `Dockerfile.backend`
3. **Port**: 4000
4. **Health Check**: `/health`

### **3. Set Environment Variables**
1. Go to "Variables" tab
2. Add all required environment variables
3. Ensure `DATABASE_URL` points to your PostgreSQL database

### **4. Deploy**
1. Railway will automatically build and deploy
2. Monitor build logs for any issues
3. Check health endpoint: `https://your-app.railway.app/health`

## 🔍 **Troubleshooting**

### **Build Failures:**
- **Prisma Client Generation**: Ensure Prisma schema is copied before generation
- **TypeScript Compilation**: Check for remaining type errors
- **Dependencies**: Verify package.json and package-lock.json

### **Runtime Issues:**
- **Database Connection**: Verify DATABASE_URL format
- **Environment Variables**: Check all required variables are set
- **Port Binding**: Ensure app listens on PORT environment variable

### **Common Errors:**
```bash
# Prisma Client not found
Error: Cannot find module '@prisma/client'

# Database connection failed
Error: connect ECONNREFUSED

# TypeScript compilation failed
error TS2345: Argument of type...
```

## 📊 **Monitoring & Health Checks**

### **Health Endpoint:**
```bash
GET /health
Response: { "status": "OK", "timestamp": "...", "uptime": 123.45 }
```

### **Railway Metrics:**
- **CPU Usage**: Monitor resource consumption
- **Memory Usage**: Check for memory leaks
- **Response Time**: Track API performance
- **Error Rate**: Monitor for failures

## 🚀 **Post-Deployment**

### **1. Verify Deployment**
```bash
# Check health endpoint
curl https://your-app.railway.app/health

# Test API endpoints
curl https://your-app.railway.app/api/auth/health
```

### **2. Database Migration**
```bash
# Run Prisma migrations if needed
npx prisma migrate deploy
```

### **3. Frontend Configuration**
Update your frontend to use the new Railway backend URL:
```bash
NEXT_PUBLIC_API_URL="https://your-app.railway.app"
```

## 🎯 **Success Indicators**

- ✅ **Build completes** without TypeScript errors
- ✅ **Prisma client generated** successfully
- ✅ **Health endpoint** responds with 200 OK
- ✅ **Database connection** established
- ✅ **API endpoints** responding correctly
- ✅ **Environment variables** properly loaded

## 📞 **Support**

If you encounter issues:
1. Check Railway build logs
2. Verify environment variables
3. Test database connectivity
4. Review TypeScript compilation output

---

**🎉 Your Gatenjia app should now deploy successfully to Railway!**
