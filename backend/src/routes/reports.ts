import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { getPrismaClient } from '../services/database';

const router = express.Router();

// Get reports
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrismaClient();
  const userId = req.user!.id;
  const { page = 1, limit = 10, type } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const where: any = { userId };
  
  if (type) {
    where.type = type;
  }

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.report.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      reports,
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
