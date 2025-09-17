# SupplyChainLens

A comprehensive satellite-powered ESG monitoring platform for supply chains, built with React, Node.js, PostgreSQL, and advanced ML capabilities.

## Overview

SupplyChainLens is an enterprise-grade platform that uses satellite imagery and machine learning to monitor environmental, social, and governance (ESG) risks in global supply chains. The platform provides real-time monitoring, risk assessment, and compliance reporting for organizations managing complex supply networks.

## Features

- **Satellite Image Processing**: Advanced ML models for deforestation and mining detection
- **Real-time Risk Assessment**: Comprehensive ESG risk scoring and monitoring
- **Supply Chain Monitoring**: Track suppliers and their environmental impact
- **Geospatial Analysis**: Location-based risk analysis and protected area monitoring
- **Dashboard & Analytics**: Interactive dashboards with real-time data visualization
- **Alert System**: Automated notifications for high-risk activities
- **Multi-tenant Architecture**: Organization-based data isolation and management

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- shadcn/ui component library
- React Query for data fetching
- Recharts for data visualization

### Backend
- Node.js with Express and TypeScript
- PostgreSQL with Prisma ORM
- Redis for caching and job queues
- JWT authentication
- WebSocket support with Socket.IO

### ML Pipeline
- Python with FastAPI
- PyTorch for deep learning models
- Computer vision and geospatial analysis
- CUDA support for GPU acceleration

## Quick Start

### Prerequisites
- Docker 20.10+ and Docker Compose 2.0+ (Recommended)
- OR Node.js 18+, Python 3.9+, PostgreSQL 15+, Redis 7+

### One-Command Deployment (Recommended)

```bash
# Clone and deploy in one command
git clone <repository-url>
cd supplychain-lens
chmod +x scripts/*.sh
./scripts/quick-deploy.sh
```

### Manual Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd supplychain-lens
   ```

2. **Run the setup script:**
   ```bash
   ./setup.sh
   ```

3. **Or use Docker:**
   ```bash
   docker-compose up -d
   ```

### Production Deployment

```bash
# Deploy to production
./scripts/quick-deploy.sh production

# Or use the full deployment script
./scripts/deploy.sh
```

### Online Deployment (Make it Live!)

```bash
# Interactive deployment to cloud platforms
./scripts/deploy-online.sh

# Quick deployment options:
# - Railway (easiest)
# - Render (free tier)
# - DigitalOcean (VPS)
# - AWS EC2 (enterprise)
# - Google Cloud Run (serverless)
```

**📖 [Quick Deploy Guide](QUICK-DEPLOY.md) - Get online in 10 minutes!**

### Development

1. **Frontend development:**
   ```bash
   npm install
   npm run dev
   ```

2. **Backend development:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **ML service development:**
   ```bash
   cd ml-service
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python -m uvicorn app.main:app --reload
   ```

## Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **ML Service**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Default Credentials

After running the seed script:
- **Admin**: admin@supplychainlens.com / admin123
- **Demo User**: demo@supplychainlens.com / demo123

## Project Structure

```
supplychain-lens/
├── src/                    # Frontend React application
├── backend/                # Backend Node.js API
├── ml-service/             # ML pipeline service
├── docker-compose.yml      # Docker services
├── nginx.conf             # Nginx configuration
└── setup.sh               # Setup script
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details