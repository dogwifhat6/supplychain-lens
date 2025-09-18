import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import organizationRoutes from './routes/organizations';
import supplierRoutes from './routes/suppliers';
import satelliteRoutes from './routes/satellite';
import monitoringRoutes from './routes/monitoring';
import riskRoutes from './routes/risk';
import alertRoutes from './routes/alerts';
import reportRoutes from './routes/reports';
import dashboardRoutes from './routes/dashboard';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';

// Import services
import { initializeDatabase } from './services/database';
import { initializeRedis } from './services/redis';
import { initializeJobQueue } from './services/jobQueue';
import { initializeWebSocket } from './services/websocket';

// Load environment variables
dotenv.config();

// Set default environment variables for Railway
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '3000';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret-change-in-production';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/supplychain_lens';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    logger.info('Health check requested');
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
      pid: process.pid
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple root endpoint for basic connectivity test
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'SupplyChainLens Backend API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/satellite', satelliteRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use(errorHandler);

// Initialize services
async function initializeApp() {
  try {
    logger.info('Initializing SupplyChainLens Backend...');
    
    // Initialize database (optional)
    try {
      await initializeDatabase();
      logger.info('Database initialized successfully');
    } catch (error) {
      logger.warn('Database initialization failed, continuing without database:', error);
    }
    
    // Initialize Redis (optional)
    try {
      await initializeRedis();
      logger.info('Redis initialized successfully');
    } catch (error) {
      logger.warn('Redis initialization failed, continuing without Redis:', error);
    }
    
    // Initialize job queue (optional)
    try {
      await initializeJobQueue();
      logger.info('Job queue initialized successfully');
    } catch (error) {
      logger.warn('Job queue initialization failed, continuing without job queue:', error);
    }
    
    // Initialize WebSocket (optional)
    try {
      initializeWebSocket(io);
      logger.info('WebSocket initialized successfully');
    } catch (error) {
      logger.warn('WebSocket initialization failed, continuing without WebSocket:', error);
    }
    
    // Start server
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 SupplyChainLens Backend running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      logger.info(`🔗 Health check available at: http://0.0.0.0:${PORT}/health`);
    });

    // Handle server errors
    server.on('error', (error) => {
      logger.error('Server error:', error);
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
      }
      process.exit(1);
    });
    
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
logger.info('Starting SupplyChainLens Backend...');
logger.info(`Node version: ${process.version}`);
logger.info(`Platform: ${process.platform}`);
logger.info(`Architecture: ${process.arch}`);
logger.info(`Memory usage: ${JSON.stringify(process.memoryUsage())}`);

initializeApp();

export { app, io };
