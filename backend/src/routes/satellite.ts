import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { getPrismaClient } from '../services/database';

const router = express.Router();

// Get satellite data
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma = getPrismaClient();
  const { supplierId, page = 1, limit = 10 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const where = supplierId ? { supplierId: supplierId as string } : {};

  const [satelliteData, total] = await Promise.all([
    prisma.satelliteData.findMany({
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
    prisma.satelliteData.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      satelliteData,
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
