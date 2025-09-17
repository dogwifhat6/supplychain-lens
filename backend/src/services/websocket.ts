import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { getPrismaClient } from './database';
import { logger } from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  organizationId?: string;
}

export const initializeWebSocket = (io: SocketIOServer): void => {
  // Authentication middleware for WebSocket
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const prisma = getPrismaClient();
      
      // Verify user exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          isActive: true,
          organizations: {
            select: {
              organizationId: true,
              role: true
            }
          }
        }
      });

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.userId = user.id;
      socket.organizationId = user.organizations[0]?.organizationId;
      
      next();
    } catch (error) {
      logger.error('WebSocket authentication error:', error);
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User connected via WebSocket: ${socket.userId}`);

    // Join user to their personal room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Join user to their organization room
    if (socket.organizationId) {
      socket.join(`org:${socket.organizationId}`);
    }

    // Handle joining specific monitoring zones
    socket.on('join-monitoring-zone', (zoneId: string) => {
      socket.join(`zone:${zoneId}`);
      logger.info(`User ${socket.userId} joined monitoring zone: ${zoneId}`);
    });

    // Handle leaving monitoring zones
    socket.on('leave-monitoring-zone', (zoneId: string) => {
      socket.leave(`zone:${zoneId}`);
      logger.info(`User ${socket.userId} left monitoring zone: ${zoneId}`);
    });

    // Handle real-time risk monitoring
    socket.on('subscribe-risk-updates', (supplierId: string) => {
      socket.join(`supplier:${supplierId}`);
      logger.info(`User ${socket.userId} subscribed to risk updates for supplier: ${supplierId}`);
    });

    // Handle disconnection
    socket.on('disconnect', (reason: string) => {
      logger.info(`User disconnected: ${socket.userId}, reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error: Error) => {
      logger.error(`WebSocket error for user ${socket.userId}:`, error);
    });
  });

  logger.info('WebSocket service initialized');
};

// Utility functions for sending real-time updates
export const sendAlertToUser = (io: SocketIOServer, userId: string, alert: any): void => {
  io.to(`user:${userId}`).emit('new-alert', alert);
  logger.info(`Alert sent to user: ${userId}`);
};

export const sendAlertToOrganization = (io: SocketIOServer, organizationId: string, alert: any): void => {
  io.to(`org:${organizationId}`).emit('new-alert', alert);
  logger.info(`Alert sent to organization: ${organizationId}`);
};

export const sendRiskUpdate = (io: SocketIOServer, supplierId: string, riskData: any): void => {
  io.to(`supplier:${supplierId}`).emit('risk-update', riskData);
  logger.info(`Risk update sent for supplier: ${supplierId}`);
};

export const sendDetectionUpdate = (io: SocketIOServer, zoneId: string, detection: any): void => {
  io.to(`zone:${zoneId}`).emit('new-detection', detection);
  logger.info(`Detection update sent to zone: ${zoneId}`);
};

export const sendSystemNotification = (io: SocketIOServer, message: string, type: 'info' | 'warning' | 'error' = 'info'): void => {
  io.emit('system-notification', { message, type, timestamp: new Date().toISOString() });
  logger.info(`System notification sent: ${message}`);
};
