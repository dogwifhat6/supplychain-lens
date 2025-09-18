import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { getPrismaClient } from '../services/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';

const router = express.Router();

// Create supplier
router.post('/', authenticateToken, [
  body('name').trim().isLength({ min: 1 }).withMessage('Supplier name is required'),
  body('country').trim().isLength({ min: 1 }).withMessage('Country is required'),
  body('industry').optional().trim(),
  body('coordinates').optional().isObject(),
  body('organizationId').isUUID().withMessage('Valid organization ID is required')
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', 400);
  }

  const { name, country, industry, coordinates, organizationId } = req.body;
  const prisma = getPrismaClient();

  const supplier = await prisma.supplier.create({
    data: {
      name,
      country,
      industry,
      coordinates,
      organizationId
    }
  });

  res.status(201).json({
    success: true,
    message: 'Supplier created successfully',
    data: { supplier }
  });
}));

// Get suppliers
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma = getPrismaClient();
  const userId = req.user!.id;
  const { organizationId, page = 1, limit = 10 } = req.query;

  const userOrg = await prisma.organizationUser.findFirst({
    where: { userId },
    include: { organization: true }
  });

  if (!userOrg) {
    return res.json({
      success: true,
      data: { suppliers: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }
    });
  }

  const skip = (Number(page) - 1) * Number(limit);
  const where = {
    organizationId: organizationId || userOrg.organizationId
  };

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            alerts: true,
            riskAssessments: true,
            concessions: true
          }
        }
      }
    }),
    prisma.supplier.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      suppliers,
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
