import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// Rate limiting for API endpoints
export const apiRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
    });
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
    });
  },
});

// Rate limiting for ML endpoints (more restrictive)
export const mlRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 ML requests per windowMs
  message: {
    error: 'Too many ML processing requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`ML rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
    });
    res.status(429).json({
      error: 'Too many ML processing requests from this IP, please try again later.',
    });
  },
});

// Request size limiting
export const requestSizeLimit = (req: Request, res: Response, next: NextFunction) => {
  const maxSize = process.env.MAX_FILE_SIZE || '50MB';
  const sizeInBytes = parseInt(maxSize) * 1024 * 1024; // Convert MB to bytes
  
  if (req.headers['content-length'] && parseInt(req.headers['content-length']) > sizeInBytes) {
    logger.warn(`Request size exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      contentLength: req.headers['content-length'],
      maxSize: maxSize,
    });
    return res.status(413).json({
      error: 'Request entity too large',
      maxSize: maxSize,
    });
  }
  
  next();
};

// IP whitelist middleware (for admin endpoints)
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP)) {
      logger.warn(`Unauthorized IP access attempt: ${clientIP}`, {
        ip: clientIP,
        path: req.path,
        userAgent: req.get('User-Agent'),
      });
      return res.status(403).json({
        error: 'Access denied from this IP address',
      });
    }
    
    next();
  };
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentLength: res.get('Content-Length'),
    };
    
    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });
  
  next();
};

// Error response sanitization
export const sanitizeError = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Don't leak sensitive information in production
  if (process.env.NODE_ENV === 'production') {
    // Log the full error for debugging
    logger.error('Application Error', {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
    });
    
    // Return sanitized error to client
    res.status(err.status || 500).json({
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { details: err.message }),
    });
  } else {
    // In development, show full error details
    res.status(err.status || 500).json({
      error: err.message,
      stack: err.stack,
    });
  }
};
