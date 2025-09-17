import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Metrics collection
const metrics = {
  requests: {
    total: 0,
    success: 0,
    error: 0,
    duration: [] as number[],
  },
  errors: {
    total: 0,
    byType: {} as Record<string, number>,
  },
  performance: {
    averageResponseTime: 0,
    p95ResponseTime: 0,
    p99ResponseTime: 0,
  },
};

// Calculate percentiles
const calculatePercentile = (values: number[], percentile: number): number => {
  const sorted = values.sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index] || 0;
};

// Update performance metrics
const updatePerformanceMetrics = () => {
  if (metrics.requests.duration.length > 0) {
    const durations = metrics.requests.duration;
    metrics.performance.averageResponseTime = durations.reduce((a, b) => a + b, 0) / durations.length;
    metrics.performance.p95ResponseTime = calculatePercentile(durations, 95);
    metrics.performance.p99ResponseTime = calculatePercentile(durations, 99);
  }
};

// Request metrics middleware
export const requestMetrics = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Update metrics
    metrics.requests.total++;
    metrics.requests.duration.push(duration);
    
    if (res.statusCode >= 200 && res.statusCode < 400) {
      metrics.requests.success++;
    } else {
      metrics.requests.error++;
    }
    
    // Keep only last 1000 duration measurements
    if (metrics.requests.duration.length > 1000) {
      metrics.requests.duration = metrics.requests.duration.slice(-1000);
    }
    
    // Update performance metrics
    updatePerformanceMetrics();
    
    // Log metrics every 100 requests
    if (metrics.requests.total % 100 === 0) {
      logger.info('Request Metrics', {
        total: metrics.requests.total,
        success: metrics.requests.success,
        error: metrics.requests.error,
        averageResponseTime: metrics.performance.averageResponseTime,
        p95ResponseTime: metrics.performance.p95ResponseTime,
        p99ResponseTime: metrics.performance.p99ResponseTime,
      });
    }
  });
  
  next();
};

// Error metrics middleware
export const errorMetrics = (err: any, req: Request, res: Response, next: NextFunction) => {
  metrics.errors.total++;
  
  const errorType = err.name || 'UnknownError';
  metrics.errors.byType[errorType] = (metrics.errors.byType[errorType] || 0) + 1;
  
  logger.error('Error Metrics', {
    errorType,
    totalErrors: metrics.errors.total,
    errorCount: metrics.errors.byType[errorType],
    url: req.url,
    method: req.method,
  });
  
  next(err);
};

// Health check endpoint
export const healthCheck = (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    metrics: {
      requests: metrics.requests,
      errors: metrics.errors,
      performance: metrics.performance,
    },
  };
  
  res.status(200).json(health);
};

// Metrics endpoint for Prometheus
export const metricsEndpoint = (req: Request, res: Response) => {
  const prometheusMetrics = [
    '# HELP http_requests_total Total number of HTTP requests',
    '# TYPE http_requests_total counter',
    `http_requests_total ${metrics.requests.total}`,
    '',
    '# HELP http_requests_success_total Total number of successful HTTP requests',
    '# TYPE http_requests_success_total counter',
    `http_requests_success_total ${metrics.requests.success}`,
    '',
    '# HELP http_requests_error_total Total number of failed HTTP requests',
    '# TYPE http_requests_error_total counter',
    `http_requests_error_total ${metrics.requests.error}`,
    '',
    '# HELP http_request_duration_seconds Average HTTP request duration in seconds',
    '# TYPE http_request_duration_seconds gauge',
    `http_request_duration_seconds ${metrics.performance.averageResponseTime / 1000}`,
    '',
    '# HELP http_request_duration_seconds_p95 95th percentile HTTP request duration in seconds',
    '# TYPE http_request_duration_seconds_p95 gauge',
    `http_request_duration_seconds_p95 ${metrics.performance.p95ResponseTime / 1000}`,
    '',
    '# HELP http_request_duration_seconds_p99 99th percentile HTTP request duration in seconds',
    '# TYPE http_request_duration_seconds_p99 gauge',
    `http_request_duration_seconds_p99 ${metrics.performance.p99ResponseTime / 1000}`,
    '',
    '# HELP errors_total Total number of errors',
    '# TYPE errors_total counter',
    `errors_total ${metrics.errors.total}`,
  ];
  
  res.set('Content-Type', 'text/plain');
  res.send(prometheusMetrics.join('\n'));
};

// Database connection health check
export const databaseHealthCheck = async (req: Request, res: Response) => {
  try {
    // This would be implemented based on your database connection
    // For now, return a simple check
    const health = {
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
    
    res.status(200).json(health);
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Redis connection health check
export const redisHealthCheck = async (req: Request, res: Response) => {
  try {
    // This would be implemented based on your Redis connection
    // For now, return a simple check
    const health = {
      status: 'healthy',
      redis: 'connected',
      timestamp: new Date().toISOString(),
    };
    
    res.status(200).json(health);
  } catch (error) {
    logger.error('Redis health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      redis: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};
