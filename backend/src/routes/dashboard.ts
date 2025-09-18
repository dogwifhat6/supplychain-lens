import express, { Response } from 'express';
import { getPrismaClient } from '../services/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = express.Router();

// Get dashboard overview
router.get('/overview', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma = getPrismaClient();
  const userId = req.user!.id;
  const organizationId = req.user!.organizationId;

  // Get user's organization
  const userOrg = await prisma.organizationUser.findFirst({
    where: { userId },
    include: { organization: true }
  });

  if (!userOrg) {
    return res.json({
      success: true,
      data: {
        overview: {
          totalSuppliers: 0,
          activeMonitoringZones: 0,
          highRiskSuppliers: 0,
          recentAlerts: 0,
          riskScore: 0
        },
        recentActivity: [],
        riskTrends: [],
        alerts: []
      }
    });
  }

  const orgId = userOrg.organizationId;

  // Get basic counts
  const [
    totalSuppliers,
    activeMonitoringZones,
    highRiskSuppliers,
    recentAlerts,
    recentDetections
  ] = await Promise.all([
    prisma.supplier.count({
      where: { organizationId: orgId, isActive: true }
    }),
    prisma.monitoringZone.count({
      where: { organizationId: orgId, isActive: true }
    }),
    prisma.supplier.count({
      where: { 
        organizationId: orgId, 
        isActive: true,
        riskLevel: { in: ['HIGH', 'CRITICAL'] }
      }
    }),
    prisma.alert.count({
      where: { 
        organizationId: orgId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    }),
    prisma.detection.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    })
  ]);

  // Calculate average risk score
  const riskAssessments = await prisma.riskAssessment.findMany({
    where: {
      supplier: { organizationId: orgId }
    },
    orderBy: { assessedAt: 'desc' },
    take: 100
  });

  const avgRiskScore = riskAssessments.length > 0 
    ? riskAssessments.reduce((sum, r) => sum + r.score, 0) / riskAssessments.length 
    : 0;

  // Get recent activity
  const recentActivity = await prisma.alert.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      supplier: {
        select: { name: true, country: true }
      }
    }
  });

  // Get risk trends (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const riskTrends = await prisma.riskAssessment.findMany({
    where: {
      supplier: { organizationId: orgId },
      assessedAt: { gte: thirtyDaysAgo }
    },
    orderBy: { assessedAt: 'asc' },
    select: {
      score: true,
      assessedAt: true,
      type: true
    }
  });

  // Group by day and type
  const trendsByDay = riskTrends.reduce((acc, assessment) => {
    const date = assessment.assessedAt.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { date, deforestation: 0, mining: 0, other: 0, count: 0 };
    }
    acc[date].count++;
    if (assessment.type === 'DEFORESTATION') {
      acc[date].deforestation += assessment.score;
    } else if (assessment.type === 'ILLEGAL_MINING') {
      acc[date].mining += assessment.score;
    } else {
      acc[date].other += assessment.score;
    }
    return acc;
  }, {} as Record<string, any>);

  const riskTrendsData = Object.values(trendsByDay).map((day: any) => ({
    date: day.date,
    deforestation: day.count > 0 ? day.deforestation / day.count : 0,
    mining: day.count > 0 ? day.mining / day.count : 0,
    other: day.count > 0 ? day.other / day.count : 0
  }));

  // Get recent alerts
  const alerts = await prisma.alert.findMany({
    where: { 
      organizationId: orgId,
      isRead: false
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      supplier: {
        select: { name: true, country: true }
      }
    }
  });

  res.json({
    success: true,
    data: {
      overview: {
        totalSuppliers,
        activeMonitoringZones,
        highRiskSuppliers,
        recentAlerts,
        recentDetections,
        riskScore: Math.round(avgRiskScore)
      },
      recentActivity: recentActivity.map(alert => ({
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        createdAt: alert.createdAt,
        supplier: alert.supplier
      })),
      riskTrends: riskTrendsData,
      alerts: alerts.map(alert => ({
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        createdAt: alert.createdAt,
        supplier: alert.supplier
      }))
    }
  });
}));

// Get monitoring zones summary
router.get('/monitoring-zones', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
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

// Get suppliers summary
router.get('/suppliers', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
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

  const suppliers = await prisma.supplier.findMany({
    where: { organizationId: userOrg.organizationId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          alerts: true,
          riskAssessments: true
        }
      }
    }
  });

  res.json({
    success: true,
    data: suppliers.map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      country: supplier.country,
      industry: supplier.industry,
      riskLevel: supplier.riskLevel,
      isActive: supplier.isActive,
      alertCount: supplier._count.alerts,
      riskAssessmentCount: supplier._count.riskAssessments,
      createdAt: supplier.createdAt
    }))
  });
}));

// Get risk distribution
router.get('/risk-distribution', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma = getPrismaClient();
  const userId = req.user!.id;

  const userOrg = await prisma.organizationUser.findFirst({
    where: { userId }
  });

  if (!userOrg) {
    return res.json({
      success: true,
      data: {
        byLevel: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
        byType: {},
        byCountry: {}
      }
    });
  }

  const suppliers = await prisma.supplier.findMany({
    where: { organizationId: userOrg.organizationId },
    select: {
      riskLevel: true,
      country: true,
      riskAssessments: {
        select: { type: true }
      }
    }
  });

  // Risk by level
  const byLevel = suppliers.reduce((acc, supplier) => {
    acc[supplier.riskLevel] = (acc[supplier.riskLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Risk by type
  const byType = suppliers.reduce((acc, supplier) => {
    supplier.riskAssessments.forEach(assessment => {
      acc[assessment.type] = (acc[assessment.type] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  // Risk by country
  const byCountry = suppliers.reduce((acc, supplier) => {
    acc[supplier.country] = (acc[supplier.country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  res.json({
    success: true,
    data: {
      byLevel,
      byType,
      byCountry
    }
  });
}));

export default router;
