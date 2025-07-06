import redisService from '../../services/redis.service.js';

/**
 * Middleware to check Redis connection status
 * Provides fallback behavior when Redis is not available
 */
export const checkRedisConnection = (req, res, next) => {
    req.redisAvailable = redisService.isRedisConnected();
    next();
};

/**
 * Middleware to handle Redis-dependent operations with fallback
 * @param {Function} operation - The operation to perform
 * @param {Function} fallback - Fallback operation when Redis is unavailable
 */
export const withRedisFallback = (operation, fallback) => {
    return async (req, res, next) => {
        try {
            if (redisService.isRedisConnected()) {
                await operation(req, res, next);
            } else {
                if (fallback) {
                    await fallback(req, res, next);
                } else {
                    next();
                }
            }
        } catch (error) {
            console.error('Redis operation failed:', error);
            if (fallback) {
                await fallback(req, res, next);
            } else {
                next(error);
            }
        }
    };
}; 