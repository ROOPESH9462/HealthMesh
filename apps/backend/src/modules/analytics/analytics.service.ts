import { redisClient } from '../../config/redis';
import { getAdminAnalyticsData } from './admin.analytics';
import { getDoctorAnalyticsData } from './doctor.analytics';
import { getPharmacyAnalyticsData } from './pharmacy.analytics';
import { getLabAnalyticsData } from './laboratory.analytics';
import logger from '../../utils/logger';

export class AnalyticsService {
  private cacheTTL = 300; // 5 minutes cache expiry

  /**
   * Fetch admin dashboard metrics with Redis caching
   */
  async getAdminStats() {
    const cacheKey = 'analytics:admin';
    
    // Attempt cache read
    try {
      if (redisClient.isOpen) {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          logger.info('Returning cached admin analytics data');
          return JSON.parse(cached);
        }
      }
    } catch (e: any) {
      logger.warn(`Redis analytics cache get failed: ${e.message}`);
    }

    // DB Aggregation
    const data = await getAdminAnalyticsData();

    // Attempt cache write
    try {
      if (redisClient.isOpen) {
        await redisClient.setEx(cacheKey, this.cacheTTL, JSON.stringify(data));
      }
    } catch (e: any) {
      logger.warn(`Redis analytics cache set failed: ${e.message}`);
    }

    return data;
  }

  /**
   * Fetch doctor dashboard metrics with Redis caching
   */
  async getDoctorStats(doctorUserId: string) {
    const cacheKey = `analytics:doctor:${doctorUserId}`;
    
    try {
      if (redisClient.isOpen) {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          logger.info(`Returning cached doctor analytics data for ${doctorUserId}`);
          return JSON.parse(cached);
        }
      }
    } catch (e: any) {
      logger.warn(`Redis analytics cache get failed: ${e.message}`);
    }

    const data = await getDoctorAnalyticsData(doctorUserId);

    try {
      if (redisClient.isOpen) {
        await redisClient.setEx(cacheKey, this.cacheTTL, JSON.stringify(data));
      }
    } catch (e: any) {
      logger.warn(`Redis analytics cache set failed: ${e.message}`);
    }

    return data;
  }

  /**
   * Fetch pharmacy analytics
   */
  async getPharmacyStats() {
    const cacheKey = 'analytics:pharmacy';
    
    try {
      if (redisClient.isOpen) {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          logger.info('Returning cached pharmacy analytics data');
          return JSON.parse(cached);
        }
      }
    } catch (e: any) {
      logger.warn(`Redis analytics cache get failed: ${e.message}`);
    }

    const data = await getPharmacyAnalyticsData();

    try {
      if (redisClient.isOpen) {
        await redisClient.setEx(cacheKey, this.cacheTTL, JSON.stringify(data));
      }
    } catch (e: any) {
      logger.warn(`Redis analytics cache set failed: ${e.message}`);
    }

    return data;
  }

  /**
   * Fetch laboratory analytics
   */
  async getLabStats() {
    const cacheKey = 'analytics:laboratory';
    
    try {
      if (redisClient.isOpen) {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          logger.info('Returning cached laboratory analytics data');
          return JSON.parse(cached);
        }
      }
    } catch (e: any) {
      logger.warn(`Redis analytics cache get failed: ${e.message}`);
    }

    const data = await getLabAnalyticsData();

    try {
      if (redisClient.isOpen) {
        await redisClient.setEx(cacheKey, this.cacheTTL, JSON.stringify(data));
      }
    } catch (e: any) {
      logger.warn(`Redis analytics cache set failed: ${e.message}`);
    }

    return data;
  }
}
export default AnalyticsService;
