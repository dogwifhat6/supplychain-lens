#!/bin/bash

# SupplyChainLens Online Deployment Script
# This script helps deploy the application to various cloud platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Show deployment options
show_options() {
    echo "🌐 SupplyChainLens Online Deployment Options"
    echo ""
    echo "1. Railway (Easiest - Recommended for testing)"
    echo "2. Render (Free tier available)"
    echo "3. DigitalOcean (VPS - Full control)"
    echo "4. AWS EC2 (VPS - Enterprise)"
    echo "5. Google Cloud Run (Serverless)"
    echo "6. Vercel + Railway (Frontend + Backend)"
    echo "7. Custom VPS deployment"
    echo ""
    read -p "Choose deployment option (1-7): " choice
}

# Deploy to Railway
deploy_railway() {
    print_status "Deploying to Railway..."
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        print_status "Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    # Login to Railway
    print_status "Logging in to Railway..."
    railway login
    
    # Initialize Railway project
    print_status "Initializing Railway project..."
    railway init
    
    # Deploy
    print_status "Deploying application..."
    railway up
    
    print_success "Deployed to Railway!"
    print_status "Your app will be available at: https://your-app-name.railway.app"
    print_warning "Don't forget to add environment variables in Railway dashboard!"
}

# Deploy to Render
deploy_render() {
    print_status "Preparing for Render deployment..."
    
    # Create render.yaml
    cat > render.yaml << EOF
services:
  - type: web
    name: supplychain-lens
    env: docker
    dockerfilePath: ./Dockerfile.production
    plan: starter
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: supplychain-postgres
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: supplychain-redis
          property: connectionString

databases:
  - name: supplychain-postgres
    plan: starter

  - name: supplychain-redis
    type: redis
    plan: starter
EOF
    
    print_success "Render configuration created!"
    print_status "Next steps:"
    echo "1. Push this code to GitHub"
    echo "2. Connect your GitHub repo to Render"
    echo "3. Render will automatically deploy using render.yaml"
    echo "4. Your app will be available at: https://your-app-name.onrender.com"
}

# Deploy to DigitalOcean
deploy_digitalocean() {
    print_status "Preparing DigitalOcean deployment..."
    
    # Create deployment script
    cat > deploy-do.sh << 'EOF'
#!/bin/bash
# DigitalOcean deployment script

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install git -y

# Clone repository
git clone <your-repo-url>
cd supplychain-lens

# Make scripts executable
chmod +x scripts/*.sh

# Deploy
./scripts/deploy.sh
EOF
    
    print_success "DigitalOcean deployment script created!"
    print_status "Next steps:"
    echo "1. Create a DigitalOcean droplet (Ubuntu 20.04+)"
    echo "2. Update the git clone URL in deploy-do.sh"
    echo "3. Upload deploy-do.sh to your droplet"
    echo "4. Run: chmod +x deploy-do.sh && ./deploy-do.sh"
    echo "5. Your app will be available at: http://your-droplet-ip"
}

# Deploy to AWS EC2
deploy_aws() {
    print_status "Preparing AWS EC2 deployment..."
    
    # Create AWS deployment guide
    cat > aws-deployment-guide.md << 'EOF'
# AWS EC2 Deployment Guide

## 1. Launch EC2 Instance
- Choose Ubuntu 20.04 LTS
- Instance type: t3.medium or larger
- Storage: 20GB+ SSD
- Security Group: Allow ports 22, 80, 443

## 2. Connect to Instance
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

## 3. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install git -y
```

## 4. Deploy Application
```bash
# Clone repository
git clone <your-repo-url>
cd supplychain-lens

# Make scripts executable
chmod +x scripts/*.sh

# Deploy
./scripts/deploy.sh
```

## 5. Configure Domain (Optional)
- Point your domain to EC2 public IP
- Update CORS_ORIGIN in environment variables
- Configure SSL with Let's Encrypt
EOF
    
    print_success "AWS deployment guide created!"
    print_status "Follow the steps in aws-deployment-guide.md"
}

# Deploy to Google Cloud Run
deploy_gcloud() {
    print_status "Preparing Google Cloud Run deployment..."
    
    # Create cloudbuild.yaml
    cat > cloudbuild.yaml << EOF
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/\$PROJECT_ID/supplychain-lens', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/\$PROJECT_ID/supplychain-lens']
  - name: 'gcr.io/cloud-builders/gcloud'
    args: ['run', 'deploy', 'supplychain-lens', '--image', 'gcr.io/\$PROJECT_ID/supplychain-lens', '--platform', 'managed', '--region', 'us-central1', '--allow-unauthenticated']
EOF
    
    print_success "Google Cloud Run configuration created!"
    print_status "Next steps:"
    echo "1. Install Google Cloud CLI"
    echo "2. Set up project: gcloud init"
    echo "3. Enable APIs: gcloud services enable cloudbuild.googleapis.com run.googleapis.com"
    echo "4. Deploy: gcloud builds submit --config cloudbuild.yaml"
    echo "5. Your app will be available at the provided URL"
}

# Deploy to Vercel + Railway
deploy_vercel_railway() {
    print_status "Preparing Vercel + Railway deployment..."
    
    # Create vercel.json
    cat > vercel.json << EOF
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_URL": "@api_url",
    "VITE_ML_API_URL": "@ml_api_url"
  }
}
EOF
    
    print_success "Vercel + Railway configuration created!"
    print_status "Next steps:"
    echo "1. Deploy backend to Railway first"
    echo "2. Get Railway URLs for API and ML service"
    echo "3. Deploy frontend to Vercel"
    echo "4. Add environment variables in Vercel dashboard"
    echo "5. Your app will be available at: https://your-app.vercel.app"
}

# Custom VPS deployment
deploy_custom() {
    print_status "Preparing custom VPS deployment..."
    
    cat > custom-deployment-guide.md << 'EOF'
# Custom VPS Deployment Guide

## Prerequisites
- Ubuntu 20.04+ or CentOS 8+
- Root or sudo access
- Domain name (optional)

## 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install git -y
```

## 2. Deploy Application
```bash
# Clone repository
git clone <your-repo-url>
cd supplychain-lens

# Make scripts executable
chmod +x scripts/*.sh

# Deploy
./scripts/deploy.sh
```

## 3. Configure Firewall
```bash
# Allow necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## 4. Configure Domain (Optional)
- Point your domain to server IP
- Update CORS_ORIGIN in environment variables
- Configure SSL with Let's Encrypt
EOF
    
    print_success "Custom VPS deployment guide created!"
    print_status "Follow the steps in custom-deployment-guide.md"
}

# Main execution
main() {
    print_status "🌐 SupplyChainLens Online Deployment"
    echo ""
    
    show_options
    
    case $choice in
        1)
            deploy_railway
            ;;
        2)
            deploy_render
            ;;
        3)
            deploy_digitalocean
            ;;
        4)
            deploy_aws
            ;;
        5)
            deploy_gcloud
            ;;
        6)
            deploy_vercel_railway
            ;;
        7)
            deploy_custom
            ;;
        *)
            print_error "Invalid option. Please choose 1-7."
            exit 1
            ;;
    esac
    
    echo ""
    print_success "Deployment preparation completed!"
    print_status "Follow the instructions above to complete your deployment."
}

# Run main function
main "$@"
