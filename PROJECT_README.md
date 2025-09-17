# SupplyChainLens

A comprehensive satellite-powered ESG monitoring platform for supply chains, built with React, Node.js, PostgreSQL, and advanced ML capabilities.

## 🌟 Overview

SupplyChainLens is an enterprise-grade platform that uses satellite imagery and machine learning to monitor environmental, social, and governance (ESG) risks in global supply chains. The platform provides real-time monitoring, risk assessment, and compliance reporting for organizations managing complex supply networks.

## 🚀 Key Features

### Frontend (React + TypeScript)
- **Modern UI**: Built with React 18, TypeScript, and Tailwind CSS
- **Component Library**: shadcn/ui components for consistent design
- **Real-time Updates**: WebSocket integration for live data
- **Responsive Design**: Mobile-first approach with modern UX
- **Interactive Dashboards**: Data visualization with Recharts
- **Authentication**: Secure JWT-based auth system

### Backend (Node.js + Express)
- **RESTful API**: Comprehensive REST API with TypeScript
- **Authentication**: JWT-based auth with role-based access control
- **Real-time Communication**: WebSocket support with Socket.IO
- **Background Processing**: Job queues with Bull and Redis
- **Database ORM**: Prisma with PostgreSQL
- **Caching**: Redis for performance optimization
- **Logging**: Winston for comprehensive logging
- **Validation**: Input validation with Joi and express-validator

### Database (PostgreSQL)
- **Multi-tenant Architecture**: Organization-based data isolation
- **Geospatial Support**: PostGIS for location-based queries
- **Comprehensive Schema**: Users, organizations, suppliers, monitoring zones
- **Risk Assessment**: Detailed risk scoring and tracking
- **Audit Trail**: Complete activity logging
- **Scalable Design**: Optimized for high-volume data

### ML Integration
- **Satellite Data Processing**: Sentinel-2, Landsat, Planet imagery
- **Change Detection**: Deforestation and land use change detection
- **Risk Scoring**: ML-powered risk assessment algorithms
- **Real-time Analysis**: Automated monitoring and alerting
- **Geospatial Analysis**: Location-based risk correlation

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
│   Port: 5173    │    │   Port: 3001    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WebSocket     │    │   Redis Cache   │    │   ML Pipeline   │
│   (Socket.IO)   │    │   Port: 6379    │    │   (External)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
supplychain-lens/
├── src/                          # Frontend React application
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── Hero.tsx             # Landing page hero
│   │   ├── Features.tsx         # Features section
│   │   ├── Navigation.tsx       # Navigation bar
│   │   └── ...
│   ├── pages/                    # Page components
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utility functions
│   └── assets/                   # Static assets
├── backend/                      # Backend Node.js application
│   ├── src/
│   │   ├── routes/               # API route handlers
│   │   ├── middleware/           # Express middleware
│   │   ├── services/             # Business logic services
│   │   ├── utils/                # Utility functions
│   │   └── scripts/              # Database scripts
│   ├── prisma/
│   │   └── schema.prisma         # Database schema
│   └── logs/                     # Application logs
├── docker-compose.yml            # Docker services configuration
├── Dockerfile.frontend           # Frontend Docker image
├── nginx.conf                    # Nginx configuration
└── setup.sh                      # Automated setup script
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework
- **shadcn/ui** - Component library
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **Recharts** - Data visualization
- **Socket.IO Client** - Real-time communication

### Backend
- **Node.js 18+** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **PostgreSQL** - Primary database
- **Redis** - Caching and job queues
- **Socket.IO** - WebSocket server
- **Bull** - Job queue processing
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Winston** - Logging
- **Joi** - Data validation

### DevOps & Deployment
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and load balancer
- **PostgreSQL** - Database server
- **Redis** - Cache and message broker

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (optional but recommended)

### Automated Setup (Recommended)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd supplychain-lens
   ```

2. **Run the setup script:**
   ```bash
   ./setup.sh
   ```

3. **Follow the interactive prompts** to configure your environment

### Manual Setup

1. **Frontend Setup:**
   ```bash
   npm install
   npm run build
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   cp env.example .env
   # Edit .env with your configuration
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

3. **Start Development Servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   npm run dev
   ```

### Docker Setup

1. **Start all services:**
   ```bash
   docker-compose up -d
   ```

2. **Run database migrations:**
   ```bash
   docker-compose exec backend npm run db:migrate
   ```

3. **Seed the database:**
   ```bash
   docker-compose exec backend npm run db:seed
   ```

## 🌐 Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health
- **Database**: localhost:5432 (PostgreSQL)
- **Redis**: localhost:6379
- **Prisma Studio**: `cd backend && npm run db:studio`

## 🔐 Default Credentials

After running the seed script, you can use these credentials:

- **Admin User**: admin@supplychainlens.com / admin123
- **Demo User**: demo@supplychainlens.com / demo123

## 📊 Sample Data

The seed script creates:
- 2 users (admin and demo)
- 1 organization (Global Supply Chain Corp)
- 4 sample suppliers with different risk levels
- 2 monitoring zones (Amazon Basin, Congo Basin)
- 3 risk assessments
- 2 detections
- 2 alerts
- 1 satellite data record

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

#### Backend (backend/.env)
```env
# Database
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/supplychain_lens"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:5173"

# Redis
REDIS_URL="redis://localhost:6379"

# Email (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Satellite APIs (optional)
SENTINEL_HUB_CLIENT_ID="your-client-id"
SENTINEL_HUB_CLIENT_SECRET="your-client-secret"
PLANET_API_KEY="your-planet-api-key"

# AWS (optional)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="supplychain-lens-data"
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Dashboard
- `GET /api/dashboard/overview` - Dashboard overview
- `GET /api/dashboard/suppliers` - Suppliers summary
- `GET /api/dashboard/risk-distribution` - Risk distribution

### Organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations` - Get user's organizations
- `GET /api/organizations/:id` - Get organization details

### Suppliers
- `POST /api/suppliers` - Create supplier
- `GET /api/suppliers` - Get suppliers
- `GET /api/suppliers/:id` - Get supplier details

### Monitoring
- `GET /api/monitoring/zones` - Get monitoring zones
- `GET /api/monitoring/detections` - Get detections

### Risk Assessment
- `GET /api/risk/assessments` - Get risk assessments
- `POST /api/risk/assess` - Trigger risk assessment

### Alerts
- `GET /api/alerts` - Get alerts
- `PATCH /api/alerts/:id/read` - Mark alert as read

## 🧪 Development

### Available Scripts

#### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

#### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:seed` - Seed database
- `npm run db:studio` - Open Prisma Studio

### Database Management

1. **Create a new migration:**
   ```bash
   cd backend
   npx prisma migrate dev --name your-migration-name
   ```

2. **Reset database:**
   ```bash
   cd backend
   npx prisma migrate reset
   npm run db:seed
   ```

3. **View database in Prisma Studio:**
   ```bash
   cd backend
   npm run db:studio
   ```

## 🚀 Deployment

### Production Deployment

1. **Build the application:**
   ```bash
   # Frontend
   npm run build
   
   # Backend
   cd backend
   npm run build
   ```

2. **Use Docker Compose:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Configure environment variables** for production

4. **Set up SSL certificates** for HTTPS

5. **Configure reverse proxy** (Nginx)

### Cloud Deployment

The application is designed to be cloud-ready and can be deployed on:
- AWS (EC2, ECS, RDS, ElastiCache)
- Google Cloud Platform
- Azure
- DigitalOcean
- Heroku

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Input validation
- SQL injection prevention (Prisma ORM)
- XSS protection
- CSRF protection
- Secure headers (Helmet.js)

## 📈 Performance Features

- Redis caching
- Database query optimization
- Connection pooling
- Compression middleware
- CDN-ready static assets
- Lazy loading
- Code splitting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the API documentation at `/api/docs`

## 🗺️ Roadmap

- [ ] ML model integration
- [ ] Advanced analytics dashboard
- [ ] Mobile application
- [ ] API rate limiting
- [ ] Advanced reporting features
- [ ] Integration with external ESG platforms
- [ ] Machine learning model training pipeline
- [ ] Advanced geospatial analysis tools

---

**SupplyChainLens** - Transforming supply chain monitoring with satellite intelligence and machine learning.
