import express, { Response } from 'express';
import { getPrismaClient } from '../services/database';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma = getPrismaClient();
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
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
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              description: true,
              industry: true
            }
          }
        }
      }
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  res.json({
    success: true,
    data: { user }
  });
}));

// Update user profile
router.put('/profile', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma = getPrismaClient();
  const userId = req.user!.id;
  const { firstName, lastName, company } = req.body;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName,
      lastName,
      company
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      company: true,
      isActive: true,
      updatedAt: true
    }
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
}));

// Get all users (admin only)
router.get('/', authenticateToken, requireRole(['ADMIN']), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma = getPrismaClient();
  const { page = 1, limit = 10, search = '' } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const where = search ? {
    OR: [
      { firstName: { contains: search as string, mode: 'insensitive' } },
      { lastName: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } }
    ]
  } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        company: true,
        isActive: true,
        createdAt: true
      }
    }),
    prisma.user.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }
  });
}));

export default router;
