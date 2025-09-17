# 🚀 Quick Online Deployment Guide

Get your SupplyChainLens application online in under 10 minutes!

## Option 1: Railway (Easiest - 5 minutes)

### Step 1: Prepare Your Code
```bash
# Make sure your code is on GitHub
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `supplychain-lens` repository
5. Railway will automatically detect it's a Docker project
6. Add these environment variables in Railway dashboard:
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://postgres:password@postgres:5432/supplychain_lens
   REDIS_URL=redis://redis:6379
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
   CORS_ORIGIN=https://your-app-name.railway.app
   ```
7. Your app will be live at: `https://your-app-name.railway.app`

## Option 2: Render (Free Tier - 10 minutes)

### Step 1: Prepare Your Code
```bash
# Make sure your code is on GitHub
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Deploy to Render
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Build Command**: `./scripts/deploy.sh`
   - **Start Command**: `docker-compose -f docker-compose.prod.yml up -d`
   - **Environment**: Docker
6. Add environment variables (same as Railway)
7. Click "Deploy"
8. Your app will be live at: `https://your-app-name.onrender.com`

## Option 3: DigitalOcean Droplet (Full Control - 15 minutes)

### Step 1: Create Droplet
1. Go to [digitalocean.com](https://digitalocean.com)
2. Create a new Droplet:
   - **Image**: Ubuntu 20.04 LTS
   - **Size**: $12/month (2GB RAM) or larger
   - **Region**: Choose closest to your users
3. Add SSH key or use password

### Step 2: Deploy Application
```bash
# SSH into your droplet
ssh root@your-droplet-ip

# Run the deployment script
curl -fsSL https://raw.githubusercontent.com/your-username/supplychain-lens/main/scripts/deploy.sh | bash

# Or manually:
git clone https://github.com/your-username/supplychain-lens.git
cd supplychain-lens
chmod +x scripts/*.sh
./scripts/deploy.sh
```

### Step 3: Configure Domain (Optional)
1. Point your domain to the droplet IP
2. Update `CORS_ORIGIN` in environment variables
3. Configure SSL with Let's Encrypt

## Option 4: Vercel + Railway (Frontend + Backend - 10 minutes)

### Step 1: Deploy Backend to Railway
Follow Option 1 steps, but only deploy the backend

### Step 2: Deploy Frontend to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variables:
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   VITE_ML_API_URL=https://your-backend.railway.app/ml
   VITE_WS_URL=wss://your-backend.railway.app
   ```
5. Deploy!

## 🔧 Environment Variables Reference

### Required Variables
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://host:port
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters
CORS_ORIGIN=https://your-domain.com
```

### Optional Variables
```bash
LOG_LEVEL=info
ENABLE_METRICS=true
GRAFANA_PASSWORD=your-grafana-password
SENTINEL_HUB_URL=https://services.sentinel-hub.com
PLANET_API_URL=https://api.planet.com
```

## 🌐 After Deployment

### Access Your Application
- **Frontend**: Your deployed URL
- **Backend API**: `https://your-domain.com/api`
- **ML Service**: `https://your-domain.com/ml`
- **Health Check**: `https://your-domain.com/health`

### Default Credentials
After deployment, you can access the application with:
- **Admin**: admin@supplychainlens.com / admin123
- **Demo User**: demo@supplychainlens.com / demo123

### Monitoring
- **Grafana**: `https://your-domain.com:3000` (admin / your-password)
- **Prometheus**: `https://your-domain.com:9090`

## 🚨 Troubleshooting

### Common Issues

#### "Service Unavailable" Error
- Check if all environment variables are set
- Verify database and Redis connections
- Check application logs

#### "CORS Error" in Browser
- Update `CORS_ORIGIN` to include your frontend URL
- Restart the application

#### "Database Connection Failed"
- Verify `DATABASE_URL` is correct
- Check if database service is running
- Ensure database is accessible

#### "ML Service Not Responding"
- Check if ML service is running
- Verify `ML_SERVICE_URL` is correct
- Check ML service logs

### Getting Help
1. Check the logs: `docker-compose logs -f`
2. Verify environment variables
3. Check service health: `curl https://your-domain.com/health`
4. Review the [DEPLOYMENT.md](DEPLOYMENT.md) guide

## 🎉 Success!

Once deployed, your SupplyChainLens application will be accessible online with:
- ✅ Real-time satellite monitoring
- ✅ ML-powered deforestation detection
- ✅ ESG risk assessment
- ✅ Supply chain analytics
- ✅ Professional dashboard

**Your application is now live and ready to monitor supply chains worldwide!** 🌍
