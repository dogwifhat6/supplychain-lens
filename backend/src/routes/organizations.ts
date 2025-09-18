import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { getPrismaClient } from '../services/database';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';

const router = express.Router();

// Create organization
router.post('/', authenticateToken, [
  body('name').trim().isLength({ min: 1 }).withMessage('Organization name is required'),
  body('description').optional().trim(),
  body('industry').optional().trim()
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', 400);
  }

  const { name, description, industry } = req.body;
  const prisma = getPrismaClient();
  const userId = req.user!.id;

  const organization = await prisma.organization.create({
    data: {
      name,
      description,
      industry
    }
  });

  // Add user as owner
  await prisma.organizationUser.create({
    data: {
      userId,
      organizationId: organization.id,
      role: 'OWNER'
    }
  });

  res.status(201).json({
    success: true,
    message: 'Organization created successfully',
    data: { organization }
  });
}));

// Get user's organizations
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma = getPrismaClient();
  const userId = req.user!.id;

  const organizations = await prisma.organizationUser.findMany({
    where: { userId },
    include: {
      organization: true
    }
  });

  res.json({
    success: true,
    data: organizations.map((org: any) => ({
      ...org.organization,
      role: org.role
    }))
  });
}));

// Get organization details
router.get('/:organizationId', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma = getPrismaClient();
  const { organizationId } = req.params;
  const userId = req.user!.id;

  // Check if user has access to this organization
  const orgUser = await prisma.organizationUser.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId
      }
    },
    include: {
      organization: {
        include: {
          _count: {
            select: {
              users: true,
              suppliers: true,
              monitoringZones: true
            }
          }
        }
      }
    }
  });

  if (!orgUser) {
    throw new CustomError('Organization not found or access denied', 404);
  }

  res.json({
    success: true,
    data: {
      ...orgUser.organization,
      userRole: orgUser.role,
      counts: orgUser.organization._count
    }
  });
}));

// Update organization
router.put('/:organizationId', authenticateToken, [
  body('name').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('industry').optional().trim()
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', 400);
  }

  const { organizationId } = req.params;
  const { name, description, industry } = req.body;
  const userId = req.user!.id;
  const prisma = getPrismaClient();

  // Check if user has permission to update
  const orgUser = await prisma.organizationUser.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId
      }
    }
  });

  if (!orgUser || !['OWNER', 'ADMIN'].includes(orgUser.role)) {
    throw new CustomError('Insufficient permissions', 403);
  }

  const organization = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(industry !== undefined && { industry })
    }
  });

  res.json({
    success: true,
    message: 'Organization updated successfully',
    data: { organization }
  });
}));

// Add user to organization
router.post('/:organizationId/users', authenticateToken, [
  body('email').isEmail().normalizeEmail(),
  body('role').isIn(['MEMBER', 'VIEWER']).withMessage('Invalid role')
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', 400);
  }

  const { organizationId } = req.params;
  const { email, role } = req.body;
  const userId = req.user!.id;
  const prisma = getPrismaClient();

  // Check if user has permission to add users
  const orgUser = await prisma.organizationUser.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId
      }
    }
  });

  if (!orgUser || !['OWNER', 'ADMIN'].includes(orgUser.role)) {
    throw new CustomError('Insufficient permissions', 403);
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new CustomError('User not found', 404);
  }

  // Check if user is already in organization
  const existingOrgUser = await prisma.organizationUser.findUnique({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId
      }
    }
  });

  if (existingOrgUser) {
    throw new CustomError('User already in organization', 409);
  }

  // Add user to organization
  const newOrgUser = await prisma.organizationUser.create({
    data: {
      userId: user.id,
      organizationId,
      role
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    message: 'User added to organization successfully',
    data: { organizationUser: newOrgUser }
  });
}));

// Get organization users
router.get('/:organizationId/users', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.params;
  const userId = req.user!.id;
  const prisma = getPrismaClient();

  // Check if user has access to this organization
  const orgUser = await prisma.organizationUser.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId
      }
    }
  });

  if (!orgUser) {
    throw new CustomError('Organization not found or access denied', 404);
  }

  const users = await prisma.organizationUser.findMany({
    where: { organizationId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          company: true,
          isActive: true,
          createdAt: true
        }
      }
    }
  });

  res.json({
    success: true,
    data: users.map((orgUser: any) => ({
      ...orgUser.user,
      role: orgUser.role,
      joinedAt: orgUser.joinedAt
    }))
  });
}));

export default router;
