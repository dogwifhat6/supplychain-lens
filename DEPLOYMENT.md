# Production Deployment Guide

This guide covers deploying SupplyChainLens to production environments.

## Prerequisites

### System Requirements
- **CPU**: 4+ cores recommended
- **RAM**: 8GB+ recommended (16GB+ for ML workloads)
- **Storage**: 100GB+ SSD recommended
- **OS**: Ubuntu 20.04+ or CentOS 8+ (Docker compatible)

### Software Requirements
- Docker 20.10+
- Docker Compose 2.0+
- Git
- OpenSSL (for certificate generation)

## Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd supplychain-lens
chmod +x scripts/*.sh
```

### 2. Configure Environment
```bash
cp env.production .env
# Edit .env with your production values
nano .env
```

### 3. Deploy
```bash
./scripts/deploy.sh
```

## Environment Configuration

### Required Environment Variables

#### Database
```bash
POSTGRES_DB=supplychain_lens
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
```

#### Security
```bash
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_minimum_32_characters
SESSION_SECRET=your_session_secret
```

#### Redis
```bash
REDIS_PASSWORD=your_redis_password
```

#### CORS
```bash
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
CORS_CREDENTIALS=true
```

### Optional Environment Variables

#### Monitoring
```bash
GRAFANA_PASSWORD=your_grafana_password
ENABLE_METRICS=true
LOG_LEVEL=info
```

#### External APIs
```bash
SENTINEL_HUB_URL=https://services.sentinel-hub.com
PLANET_API_URL=https://api.planet.com
GOOGLE_EARTH_ENGINE_URL=https://earthengine.googleapis.com
```

## Deployment Methods

### Method 1: Docker Compose (Recommended)

#### Production Deployment
```bash
# Deploy with production configuration
docker-compose -f docker-compose.prod.yml --env-file env.production up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### Development Deployment
```bash
# Deploy with development configuration
docker-compose up -d

# Check status
docker-compose ps
```

### Method 2: Manual Docker

#### Build Images
```bash
# Build frontend
docker build -f Dockerfile.frontend -t supplychain-frontend .

# Build backend
docker build -f Dockerfile.production -t supplychain-backend .

# Build ML service
docker build -f ml-service/Dockerfile -t supplychain-ml .
```

#### Run Containers
```bash
# Start database
docker run -d --name postgres \
  -e POSTGRES_DB=supplychain_lens \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 postgres:15

# Start Redis
docker run -d --name redis \
  -e REDIS_PASSWORD=your_password \
  -p 6379:6379 redis:7

# Start ML service
docker run -d --name ml-service \
  --link postgres:postgres \
  --link redis:redis \
  -p 8000:8000 supplychain-ml

# Start backend
docker run -d --name backend \
  --link postgres:postgres \
  --link redis:redis \
  --link ml-service:ml-service \
  -p 3001:3001 supplychain-backend

# Start Nginx
docker run -d --name nginx \
  --link backend:backend \
  --link ml-service:ml-service \
  -p 80:80 -p 443:443 \
  -v $(pwd)/nginx.prod.conf:/etc/nginx/nginx.conf:ro \
  nginx:alpine
```

## SSL/TLS Configuration

### Using Let's Encrypt (Recommended)

#### 1. Install Certbot
```bash
# Ubuntu/Debian
sudo apt install certbot

# CentOS/RHEL
sudo yum install certbot
```

#### 2. Generate Certificate
```bash
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

#### 3. Update Nginx Configuration
```bash
# Copy certificates to project
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*.pem
```

#### 4. Enable HTTPS in nginx.prod.conf
Uncomment the HTTPS server block and update domain names.

### Using Custom Certificates

#### 1. Generate Self-Signed Certificate (Development)
```bash
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=yourdomain.com"
```

#### 2. Use Your Certificate
Place your certificate files in the `ssl/` directory:
- `ssl/cert.pem` - Certificate file
- `ssl/key.pem` - Private key file

## Monitoring and Logging

### Access Monitoring Dashboards
- **Grafana**: http://yourdomain.com:3000 (admin / your_grafana_password)
- **Prometheus**: http://yourdomain.com:9090

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f ml-service
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Health Checks
```bash
# Application health
curl http://yourdomain.com/health

# Backend health
curl http://yourdomain.com:3001/health

# ML service health
curl http://yourdomain.com:8000/health

# Database health
docker exec supplychain-postgres-prod pg_isready
```

## Backup and Recovery

### Automated Backup
```bash
# Run backup script
./scripts/backup.sh

# Schedule regular backups (crontab)
0 2 * * * /path/to/supplychain-lens/scripts/backup.sh
```

### Manual Backup
```bash
# Database backup
docker exec supplychain-postgres-prod pg_dump -U postgres supplychain_lens > backup.sql

# Application data backup
docker cp supplychain-ml-prod:/app/models ./backup/models
docker cp supplychain-backend-prod:/app/uploads ./backup/uploads
```

### Recovery
```bash
# Restore database
docker exec -i supplychain-postgres-prod psql -U postgres supplychain_lens < backup.sql

# Restore application data
docker cp ./backup/models supplychain-ml-prod:/app/
docker cp ./backup/uploads supplychain-backend-prod:/app/
```

## Scaling and Performance

### Horizontal Scaling
```bash
# Scale backend services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Scale ML services
docker-compose -f docker-compose.prod.yml up -d --scale ml-service=2
```

### Load Balancer Configuration
Update `nginx.prod.conf` to include multiple backend servers:
```nginx
upstream backend {
    server backend_1:3001;
    server backend_2:3001;
    server backend_3:3001;
    keepalive 32;
}
```

### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX CONCURRENTLY idx_satellite_data_location ON satellite_data USING GIST (location);
CREATE INDEX CONCURRENTLY idx_detections_created_at ON detections (created_at);
CREATE INDEX CONCURRENTLY idx_risk_assessments_supplier_id ON risk_assessments (supplier_id);
```

## Security Considerations

### Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Regular Security Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### Security Headers
The application includes comprehensive security headers:
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Strict-Transport-Security (HSTS)

## Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs service_name

# Check resource usage
docker stats

# Restart service
docker-compose -f docker-compose.prod.yml restart service_name
```

#### Database Connection Issues
```bash
# Check database status
docker exec supplychain-postgres-prod pg_isready

# Check database logs
docker logs supplychain-postgres-prod

# Reset database
docker-compose -f docker-compose.prod.yml down
docker volume rm supplychain-lens_postgres_data
docker-compose -f docker-compose.prod.yml up -d
```

#### ML Service Issues
```bash
# Check ML service logs
docker logs supplychain-ml-prod

# Check resource usage
docker exec supplychain-ml-prod top

# Restart ML service
docker-compose -f docker-compose.prod.yml restart ml-service
```

### Performance Issues

#### High Memory Usage
```bash
# Check memory usage
docker stats

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=2
```

#### Slow Response Times
```bash
# Check logs for errors
docker-compose -f docker-compose.prod.yml logs | grep ERROR

# Check database performance
docker exec supplychain-postgres-prod psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Check Redis performance
docker exec supplychain-redis-prod redis-cli info stats
```

## Maintenance

### Regular Maintenance Tasks

#### Daily
- Monitor application logs
- Check disk space usage
- Verify backup completion

#### Weekly
- Review security logs
- Update dependencies
- Performance analysis

#### Monthly
- Security updates
- Database optimization
- Capacity planning

### Update Procedure
```bash
# 1. Backup current deployment
./scripts/backup.sh

# 2. Pull latest changes
git pull origin main

# 3. Update environment if needed
# Edit env.production

# 4. Rebuild and deploy
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# 5. Verify deployment
./scripts/deploy.sh
```

## Support

For deployment issues:
1. Check the troubleshooting section
2. Review application logs
3. Check system resources
4. Contact support team

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [PostgreSQL Administration](https://www.postgresql.org/docs/)
- [Redis Configuration](https://redis.io/docs/)
