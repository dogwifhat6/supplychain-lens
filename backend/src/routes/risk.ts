import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { getPrismaClient } from '../services/database';

const router = express.Router();

// Get risk assessments
router.get('/assessments', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrismaClient();
  const { supplierId, page = 1, limit = 10 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const where = supplierId ? { supplierId: supplierId as string } : {};

  const [assessments, total] = await Promise.all([
    prisma.riskAssessment.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { assessedAt: 'desc' },
      include: {
        supplier: {
          select: { name: true, country: true }
        }
      }
    }),
    prisma.riskAssessment.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      assessments,
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
