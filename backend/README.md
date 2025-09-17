# SupplyChainLens Backend

A comprehensive backend API for the SupplyChainLens platform - a satellite-powered ESG monitoring system for supply chains.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Multi-tenant organization support
- **Supplier Management**: Track suppliers and their risk profiles
- **Satellite Data Processing**: Handle satellite imagery and ML analysis results
- **Risk Assessment**: Automated risk scoring and monitoring
- **Real-time Alerts**: WebSocket-based notifications
- **Monitoring Zones**: Geospatial monitoring areas
- **Report Generation**: Automated ESG and compliance reports
- **Job Queue**: Background processing for heavy operations

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for caching and job queues
- **Authentication**: JWT with bcrypt
- **Real-time**: Socket.IO for WebSocket connections
- **Queue**: Bull for background job processing
- **Validation**: Joi and express-validator
- **Logging**: Winston
- **Documentation**: Swagger/OpenAPI

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Installation

1. **Clone and navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database:**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   
   # Seed with sample data
   npm run db:seed
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

### Using Docker

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

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token

### Dashboard Endpoints

- `GET /api/dashboard/overview` - Get dashboard overview
- `GET /api/dashboard/monitoring-zones` - Get monitoring zones
- `GET /api/dashboard/suppliers` - Get suppliers summary
- `GET /api/dashboard/risk-distribution` - Get risk distribution

### Organization Endpoints

- `POST /api/organizations` - Create organization
- `GET /api/organizations` - Get user's organizations
- `GET /api/organizations/:id` - Get organization details
- `PUT /api/organizations/:id` - Update organization
- `POST /api/organizations/:id/users` - Add user to organization

### Supplier Endpoints

- `POST /api/suppliers` - Create supplier
- `GET /api/suppliers` - Get suppliers
- `GET /api/suppliers/:id` - Get supplier details
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Monitoring Endpoints

- `GET /api/monitoring/zones` - Get monitoring zones
- `GET /api/monitoring/detections` - Get detections
- `POST /api/monitoring/zones` - Create monitoring zone

### Risk Assessment Endpoints

- `GET /api/risk/assessments` - Get risk assessments
- `POST /api/risk/assess` - Trigger risk assessment
- `GET /api/risk/trends` - Get risk trends

### Alert Endpoints

- `GET /api/alerts` - Get alerts
- `PATCH /api/alerts/:id/read` - Mark alert as read
- `POST /api/alerts` - Create alert

## Database Schema

The database uses PostgreSQL with the following main entities:

- **Users**: User accounts and authentication
- **Organizations**: Multi-tenant organizations
- **Suppliers**: Supply chain partners
- **Monitoring Zones**: Geospatial monitoring areas
- **Satellite Data**: Satellite imagery and metadata
- **Risk Assessments**: Risk scoring and analysis
- **Detections**: ML detection results
- **Alerts**: Notifications and warnings
- **Reports**: Generated reports and analytics

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/supplychain_lens"

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

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Satellite APIs
SENTINEL_HUB_CLIENT_ID="your-client-id"
SENTINEL_HUB_CLIENT_SECRET="your-client-secret"
PLANET_API_KEY="your-planet-api-key"

# AWS
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="supplychain-lens-data"
```

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio

### Project Structure

```
backend/
├── src/
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── routes/         # API routes
│   ├── services/       # Business logic services
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript type definitions
│   └── scripts/        # Database scripts
├── prisma/
│   └── schema.prisma   # Database schema
├── logs/               # Application logs
└── dist/               # Compiled JavaScript
```

## Deployment

### Docker Deployment

1. **Build and start services:**
   ```bash
   docker-compose up -d
   ```

2. **Run migrations:**
   ```bash
   docker-compose exec backend npm run db:migrate
   ```

3. **Seed database:**
   ```bash
   docker-compose exec backend npm run db:seed
   ```

### Production Considerations

- Use environment-specific configuration
- Set up proper logging and monitoring
- Configure SSL/TLS certificates
- Set up database backups
- Use a reverse proxy (Nginx)
- Configure rate limiting
- Set up health checks
- Use container orchestration (Kubernetes)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details
