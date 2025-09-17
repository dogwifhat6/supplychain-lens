import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { getPrismaClient } from '../services/database';

const router = express.Router();

// Get monitoring zones
router.get('/zones', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrismaClient();
  const userId = req.user!.id;

  const userOrg = await prisma.organizationUser.findFirst({
    where: { userId },
    include: { organization: true }
  });

  if (!userOrg) {
    return res.json({
      success: true,
      data: []
    });
  }

  const zones = await prisma.monitoringZone.findMany({
    where: { organizationId: userOrg.organizationId },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: zones
  });
}));

// Get detections
router.get('/detections', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrismaClient();
  const { page = 1, limit = 10, type } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const where = type ? { type: type as string } : {};

  const [detections, total] = await Promise.all([
    prisma.detection.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.detection.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      detections,
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
