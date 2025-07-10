import { createClient } from 'redis';
import { redisConfig, getRefreshTokenKey } from '../config/redis.config.js';

/**
 * RedisService class for handling Redis operations
 * Provides methods to connect to Redis and manage refresh tokens
 */
export class RedisService {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    /**
     * Initialize Redis connection
     */
    async connect() {
        try {
            this.client = createClient({
            url: redisConfig.url,
            socket: redisConfig.connection.socket
        });

            this.client.on('error', (err) => {
                console.error('Redis Client Error:', err);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                console.log('Redis Client Connected');
                this.isConnected = true;
            });

            this.client.on('ready', () => {
                console.log('Redis Client Ready');
                this.isConnected = true;
            });

            await this.client.connect();
            return true;
        } catch (error) {
            console.error('Failed to connect to Redis:', error);
            this.isConnected = false;
            return false;
        }
    }

    /**
     * Disconnect from Redis
     */
    async disconnect() {
        try {
            if (this.client && this.isConnected) {
                await this.client.quit();
                this.isConnected = false;
                console.log('Redis Client Disconnected');
            }
        } catch (error) {
            console.error('Error disconnecting from Redis:', error);
        }
    }

    async storeRefreshToken(userEmail, refreshToken, expiresIn = redisConfig.tokenExpiration.refreshToken) {
        try {
            if (!this.isConnected || !this.client) {
                throw new Error('Redis not connected');
            }

            const key = getRefreshTokenKey(userEmail);
            await this.client.setEx(key, expiresIn, refreshToken);
            return true;
        } catch (error) {
            console.error('Error storing refresh token:', error);
            return false;
        }
    }

    
    async getRefreshToken(userEmail) {
        try {
            if (!this.isConnected || !this.client) {
                throw new Error('Redis not connected');
            }

            const key = getRefreshTokenKey(userEmail);
            const token = await this.client.get(key);
            return token;
        } catch (error) {
            console.error('Error getting refresh token:', error);
            return null;
        }
    }

    
    async validateRefreshToken(userEmail, refreshToken) {
        try {
            if (!this.isConnected || !this.client) {
                throw new Error('Redis not connected');
            }

            const storedToken = await this.getRefreshToken(userEmail);
            return storedToken === refreshToken;
        } catch (error) {
            console.error('Error validating refresh token:', error);
            return false;
        }
    }

    
    async invalidateRefreshToken(userEmail) {
        try {
            if (!this.isConnected || !this.client) {
                throw new Error('Redis not connected');
            }

            const key = getRefreshTokenKey(userEmail);
            const result = await this.client.del(key);
            return result > 0;
        } catch (error) {
            console.error('Error invalidating refresh token:', error);
            return false;
        }
    }

    
    isRedisConnected() {
        return this.isConnected && this.client !== null;
    }

    getClient() {
        return this.isConnected ? this.client : null;
    }
}

// Create singleton instance
const redisService = new RedisService();
export default redisService; 