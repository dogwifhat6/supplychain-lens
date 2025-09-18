import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { getPrismaClient } from '../services/database';

const router = express.Router();

// Get alerts
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma = getPrismaClient();
  const userId = req.user!.id;
  const { page = 1, limit = 10, isRead } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const where: any = { userId };
  
  if (isRead !== undefined) {
    where.isRead = isRead === 'true';
  }

  const [alerts, total] = await Promise.all([
    prisma.alert.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: {
          select: { name: true, country: true }
        }
      }
    }),
    prisma.alert.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      alerts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }
  });
}));

// Mark alert as read
router.patch('/:alertId/read', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { alertId } = req.params;
  const userId = req.user!.id;
  const prisma = getPrismaClient();

  const alert = await prisma.alert.updateMany({
    where: {
      id: alertId,
      userId
    },
    data: {
      isRead: true
    }
  });

  if (alert.count === 0) {
    throw new Error('Alert not found');
  }

  res.json({
    success: true,
    message: 'Alert marked as read'
  });
}));

export default router;
