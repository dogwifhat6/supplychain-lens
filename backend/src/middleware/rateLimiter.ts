import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redisClient } from '../services/redis';
import { logger } from '../utils/logger';

// Create rate limiter instances
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl',
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
  blockDuration: 60, // Block for 60 seconds if limit exceeded
});

const strictRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl_strict',
  points: 10, // Number of requests
  duration: 60, // Per 60 seconds
  blockDuration: 300, // Block for 5 minutes if limit exceeded
});

const authRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl_auth',
  points: 5, // Number of requests
  duration: 60, // Per 60 seconds
  blockDuration: 900, // Block for 15 minutes if limit exceeded
});

export const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip || 'unknown';
  
  rateLimiter.consume(key)
    .then(() => {
      next();
    })
    .catch(() => {
      logger.warn(`Rate limit exceeded for IP: ${key}`);
      res.status(429).json({
        success: false,
        error: {
          message: 'Too many requests',
          retryAfter: 60
        }
      });
    });
};

export const strictRateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip || 'unknown';
  
  strictRateLimiter.consume(key)
    .then(() => {
      next();
    })
    .catch(() => {
      logger.warn(`Strict rate limit exceeded for IP: ${key}`);
      res.status(429).json({
        success: false,
        error: {
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: 300
        }
      });
    });
};

export const authRateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip || 'unknown';
  
  authRateLimiter.consume(key)
    .then(() => {
      next();
    })
    .catch(() => {
      logger.warn(`Auth rate limit exceeded for IP: ${key}`);
      res.status(429).json({
        success: false,
        error: {
          message: 'Too many authentication attempts. Please try again later.',
          retryAfter: 900
        }
      });
    });
};

// Export default rate limiter
export { rateLimiterMiddleware as rateLimiter };
