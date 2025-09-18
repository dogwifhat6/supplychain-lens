import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { getPrismaClient } from '../services/database';
import { CustomError, asyncHandler } from '../middleware/errorHandler';
import { authRateLimiterMiddleware } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('company').optional().trim()
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

// Register new user
router.post('/register', authRateLimiterMiddleware, registerValidation, asyncHandler(async (req, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', 400);
  }

  const { email, password, firstName, lastName, company } = req.body;
  const prisma = getPrismaClient();

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new CustomError('User already exists with this email', 409);
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      company,
      role: 'USER'
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      company: true,
      createdAt: true
    }
  });

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // Create session
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.userSession.create({
    data: {
      userId: user.id,
      token,
      expiresAt
    }
  });

  logger.info(`New user registered: ${user.email}`);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      token,
      expiresAt
    }
  });
}));

// Login user
router.post('/login', authRateLimiterMiddleware, loginValidation, asyncHandler(async (req, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', 400);
  }

  const { email, password } = req.body;
  const prisma = getPrismaClient();

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      firstName: true,
      lastName: true,
      role: true,
      company: true,
      isActive: true,
      organizations: {
        select: {
          organizationId: true,
          role: true,
          organization: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  if (!user || !user.isActive) {
    throw new CustomError('Invalid credentials', 401);
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new CustomError('Invalid credentials', 401);
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // Create session
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.userSession.create({
    data: {
      userId: user.id,
      token,
      expiresAt
    }
  });

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  logger.info(`User logged in: ${user.email}`);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: userWithoutPassword,
      token,
      expiresAt
    }
  });
}));

// Logout user
router.post('/logout', asyncHandler(async (req, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token) {
    const prisma = getPrismaClient();
    
    // Remove session
    await prisma.userSession.deleteMany({
      where: { token }
    });
  }

  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

// Get current user
router.get('/me', asyncHandler(async (req, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    throw new CustomError('Authentication required', 401);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  const prisma = getPrismaClient();

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      company: true,
      isActive: true,
      createdAt: true,
      organizations: {
        select: {
          organizationId: true,
          role: true,
          organization: {
            select: {
              name: true,
              description: true,
              industry: true
            }
          }
        }
      }
    }
  });

  if (!user || !user.isActive) {
    throw new CustomError('User not found', 404);
  }

  res.json({
    success: true,
    data: { user }
  });
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req, res: Response) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw new CustomError('Refresh token required', 400);
  }

  const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
  const prisma = getPrismaClient();

  // Verify user still exists and is active
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, isActive: true }
  });

  if (!user || !user.isActive) {
    throw new CustomError('Invalid refresh token', 401);
  }

  // Generate new token
  const newToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // Update session
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.userSession.updateMany({
    where: { token: refreshToken },
    data: { token: newToken, expiresAt }
  });

  res.json({
    success: true,
    data: {
      token: newToken,
      expiresAt
    }
  });
}));

// Forgot password
router.post('/forgot-password', authRateLimiterMiddleware, asyncHandler(async (req, res: Response) => {
  const { email } = req.body;
  
  if (!email) {
    throw new CustomError('Email is required', 400);
  }

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    // Don't reveal if user exists or not
    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });
  }

  // TODO: Implement email sending for password reset
  // For now, just log the request
  logger.info(`Password reset requested for: ${email}`);

  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent'
  });
}));

// Reset password
router.post('/reset-password', authRateLimiterMiddleware, asyncHandler(async (req, res: Response) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    throw new CustomError('Token and new password are required', 400);
  }

  if (newPassword.length < 8) {
    throw new CustomError('Password must be at least 8 characters', 400);
  }

  // TODO: Implement token validation and password reset
  // This would typically involve checking a reset token from email
  
  res.json({
    success: true,
    message: 'Password reset successfully'
  });
}));

export default router;
