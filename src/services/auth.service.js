import jwt from 'jsonwebtoken';
import redisService from './redis.service.js';
import { TokenUtils } from '../utils/tokenUtils.js';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET || 'defaultAccessTokenSecret';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET || 'defaultRefreshTokenSecret';


/**
    AuthService class for handling JWT token generation and verification.
    Provides methods to generate access and refresh tokens, and to verify them.
    Now includes Redis-based refresh token validation and invalidation.
**/
export class AuthService{
    constructor() {
        this.redisService = redisService;
    }

    async generateTokens(payload){
        const accessToken = TokenUtils.generateAccessToken(payload, ACCESS_TOKEN_SECRET);
        const refreshToken = TokenUtils.generateRefreshToken(payload, REFRESH_TOKEN_SECRET);

        // Store refresh token in Redis
        if (this.redisService.isRedisConnected()) {
            await this.redisService.storeRefreshToken(payload.email, refreshToken);
        }

        return { accessToken, refreshToken };
    }


    async verifyRefreshToken(token) {
        try {
            const decoded = TokenUtils.verifyToken(token, REFRESH_TOKEN_SECRET);
            if (!decoded) {
                return null;
            }
            
            // Validate token against Redis if connected
            if (this.redisService.isRedisConnected()) {
                const isValid = await this.redisService.validateRefreshToken(decoded.email, token);
                if (!isValid) {
                    console.error('Refresh token not found in Redis or invalid');
                    return null;
                }
            }
            
            return decoded;
        } catch (error) {
            console.error('Refresh token verification failed:', error);
            return null; 
        }
    }

    generateAccessToken(payload) {
        return TokenUtils.generateAccessToken(payload, ACCESS_TOKEN_SECRET);
    }

    async invalidateRefreshToken(userEmail) {
        try {
            if (this.redisService.isRedisConnected()) {
                return await this.redisService.invalidateRefreshToken(userEmail);
            }
            return false;
        } catch (error) {
            console.error('Error invalidating refresh token:', error);
            return false;
        }
    }

    async refreshTokens(refreshToken) {
        try {
            const decoded = await this.verifyRefreshToken(refreshToken);
            if (!decoded) {
                return null;
            }

            // Generate new tokens
            const newAccessToken = this.generateAccessToken(decoded);
            const newRefreshToken = TokenUtils.generateRefreshToken(decoded, REFRESH_TOKEN_SECRET);

            // Update refresh token in Redis
            if (this.redisService.isRedisConnected()) {
                await this.redisService.storeRefreshToken(decoded.email, newRefreshToken);
            }

            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            };
        } catch (error) {
            console.error('Error refreshing tokens:', error);
            return null;
        }
    }
}

const authService = new AuthService();
export { authService };
