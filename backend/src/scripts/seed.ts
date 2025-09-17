import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

async function seed() {
  try {
    logger.info('Starting database seed...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@supplychainlens.com' },
      update: {},
      create: {
        email: 'admin@supplychainlens.com',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        company: 'SupplyChainLens'
      }
    });

    // Create demo user
    const demoPassword = await bcrypt.hash('demo123', 12);
    const demoUser = await prisma.user.upsert({
      where: { email: 'demo@supplychainlens.com' },
      update: {},
      create: {
        email: 'demo@supplychainlens.com',
        password: demoPassword,
        firstName: 'Demo',
        lastName: 'User',
        role: 'USER',
        company: 'Demo Company'
      }
    });

    // Create demo organization
    const organization = await prisma.organization.upsert({
      where: { id: 'demo-org-1' },
      update: {},
      create: {
        id: 'demo-org-1',
        name: 'Global Supply Chain Corp',
        description: 'Leading global supply chain management company',
        industry: 'Manufacturing'
      }
    });

    // Add users to organization
    await prisma.organizationUser.upsert({
      where: {
        userId_organizationId: {
          userId: admin.id,
          organizationId: organization.id
        }
      },
      update: {},
      create: {
        userId: admin.id,
        organizationId: organization.id,
        role: 'OWNER'
      }
    });

    await prisma.organizationUser.upsert({
      where: {
        userId_organizationId: {
          userId: demoUser.id,
          organizationId: organization.id
        }
      },
      update: {},
      create: {
        userId: demoUser.id,
        organizationId: organization.id,
        role: 'MEMBER'
      }
    });

    // Create sample suppliers
    const suppliers = [
      {
        id: 'supplier-1',
        name: 'Tropical Timber Co.',
        country: 'Brazil',
        industry: 'Forestry',
        coordinates: { lat: -3.1190275, lng: -60.0217314 },
        riskLevel: 'HIGH' as const
      },
      {
        id: 'supplier-2',
        name: 'Mining Solutions Ltd.',
        country: 'Congo',
        industry: 'Mining',
        coordinates: { lat: -4.038333, lng: 21.758664 },
        riskLevel: 'CRITICAL' as const
      },
      {
        id: 'supplier-3',
        name: 'Agricultural Partners',
        country: 'Indonesia',
        industry: 'Agriculture',
        coordinates: { lat: -6.2087634, lng: 106.845599 },
        riskLevel: 'MEDIUM' as const
      },
      {
        id: 'supplier-4',
        name: 'Sustainable Materials Inc.',
        country: 'Canada',
        industry: 'Manufacturing',
        coordinates: { lat: 45.5016889, lng: -73.567256 },
        riskLevel: 'LOW' as const
      }
    ];

    for (const supplierData of suppliers) {
      await prisma.supplier.upsert({
        where: { id: supplierData.id },
        update: {},
        create: {
          ...supplierData,
          organizationId: organization.id
        }
      });
    }

    // Create sample monitoring zones
    const monitoringZones = [
      {
        id: 'zone-1',
        name: 'Amazon Basin Monitoring',
        description: 'Primary monitoring zone for Amazon rainforest activities',
        boundaries: {
          type: 'Polygon',
          coordinates: [[
            [-70, -10],
            [-60, -10],
            [-60, 0],
            [-70, 0],
            [-70, -10]
          ]]
        },
        priority: 'HIGH' as const
      },
      {
        id: 'zone-2',
        name: 'Congo Basin Monitoring',
        description: 'Monitoring zone for Central African forest activities',
        boundaries: {
          type: 'Polygon',
          coordinates: [[
            [15, -5],
            [25, -5],
            [25, 5],
            [15, 5],
            [15, -5]
          ]]
        },
        priority: 'CRITICAL' as const
      }
    ];

    for (const zoneData of monitoringZones) {
      await prisma.monitoringZone.upsert({
        where: { id: zoneData.id },
        update: {},
        create: {
          ...zoneData,
          organizationId: organization.id
        }
      });
    }

    // Create sample risk assessments
    const riskAssessments = [
      {
        supplierId: 'supplier-1',
        type: 'DEFORESTATION' as const,
        score: 85.5,
        confidence: 92.3,
        factors: {
          forestLoss: 0.4,
          proximityToProtected: 0.3,
          historicalCompliance: 0.3
        },
        details: {
          forestLossPercentage: 15.2,
          protectedAreaDistance: 2.1,
          complianceScore: 65
        }
      },
      {
        supplierId: 'supplier-2',
        type: 'ILLEGAL_MINING' as const,
        score: 95.8,
        confidence: 88.7,
        factors: {
          miningActivity: 0.5,
          environmentalDamage: 0.3,
          laborViolations: 0.2
        },
        details: {
          newMiningSites: 8,
          environmentalImpact: 'High',
          laborCompliance: 'Poor'
        }
      },
      {
        supplierId: 'supplier-3',
        type: 'LAND_USE_CHANGE' as const,
        score: 45.2,
        confidence: 78.9,
        factors: {
          landConversion: 0.4,
          soilQuality: 0.3,
          waterImpact: 0.3
        },
        details: {
          convertedHectares: 120,
          soilDegradation: 'Moderate',
          waterUsage: 'High'
        }
      }
    ];

    for (const assessmentData of riskAssessments) {
      await prisma.riskAssessment.create({
        data: assessmentData
      });
    }

    // Create sample detections
    const detections = [
      {
        type: 'FOREST_LOSS' as const,
        confidence: 89.5,
        coordinates: { lat: -3.1190275, lng: -60.0217314 },
        area: 45.2,
        metadata: {
          detectionMethod: 'satellite_imagery',
          algorithm: 'deforestation_detector_v2',
          imageDate: '2024-01-15T10:30:00Z'
        }
      },
      {
        type: 'MINING_ACTIVITY' as const,
        confidence: 92.1,
        coordinates: { lat: -4.038333, lng: 21.758664 },
        area: 12.8,
        metadata: {
          detectionMethod: 'satellite_imagery',
          algorithm: 'mining_detector_v1',
          imageDate: '2024-01-16T14:20:00Z'
        }
      }
    ];

    for (const detectionData of detections) {
      await prisma.detection.create({
        data: detectionData
      });
    }

    // Create sample alerts
    const alerts = [
      {
        userId: demoUser.id,
        organizationId: organization.id,
        supplierId: 'supplier-1',
        type: 'RISK_THRESHOLD_EXCEEDED' as const,
        severity: 'HIGH' as const,
        title: 'High Deforestation Risk Detected',
        message: 'Tropical Timber Co. has exceeded deforestation risk threshold (85.5%)',
        data: {
          riskScore: 85.5,
          threshold: 80,
          supplier: 'Tropical Timber Co.',
          location: 'Brazil'
        }
      },
      {
        userId: demoUser.id,
        organizationId: organization.id,
        supplierId: 'supplier-2',
        type: 'NEW_DETECTION' as const,
        severity: 'CRITICAL' as const,
        title: 'Illegal Mining Activity Detected',
        message: 'New mining activity detected in Mining Solutions Ltd. concession area',
        data: {
          detectionType: 'MINING_ACTIVITY',
          confidence: 92.1,
          area: 12.8,
          supplier: 'Mining Solutions Ltd.',
          location: 'Congo'
        }
      }
    ];

    for (const alertData of alerts) {
      await prisma.alert.create({
        data: alertData
      });
    }

    // Create sample satellite data
    const satelliteData = [
      {
        imageId: 'sentinel-2-20240115-001',
        source: 'SENTINEL_2' as const,
        resolution: 10,
        cloudCover: 5.2,
        coordinates: { lat: -3.1190275, lng: -60.0217314 },
        bounds: {
          type: 'Polygon',
          coordinates: [[
            [-60.1, -3.2],
            [-60.0, -3.2],
            [-60.0, -3.0],
            [-60.1, -3.0],
            [-60.1, -3.2]
          ]]
        },
        imageUrl: 'https://example.com/satellite-images/sentinel-2-20240115-001.tif',
        metadata: {
          acquisitionDate: '2024-01-15T10:30:00Z',
          processingLevel: 'L2A',
          bands: ['B02', 'B03', 'B04', 'B08', 'B11', 'B12']
        },
        supplierId: 'supplier-1'
      }
    ];

    for (const data of satelliteData) {
      await prisma.satelliteData.create({
        data
      });
    }

    logger.info('Database seed completed successfully!');
    logger.info('Created users:');
    logger.info('- admin@supplychainlens.com (password: admin123)');
    logger.info('- demo@supplychainlens.com (password: demo123)');
    logger.info('Created organization: Global Supply Chain Corp');
    logger.info('Created 4 sample suppliers');
    logger.info('Created 2 monitoring zones');
    logger.info('Created 3 risk assessments');
    logger.info('Created 2 detections');
    logger.info('Created 2 alerts');
    logger.info('Created 1 satellite data record');

  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => {
      logger.info('Seed script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seed script failed:', error);
      process.exit(1);
    });
}

export default seed;
