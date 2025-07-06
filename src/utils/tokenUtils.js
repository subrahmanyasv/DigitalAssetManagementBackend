import jwt from 'jsonwebtoken';
import { redisConfig } from '../config/redis.config.js';

export class TokenUtils {

    static generateAccessToken(payload, secret, expiresIn = redisConfig.tokenExpiration.accessToken) {
        return jwt.sign(payload, secret, { expiresIn });
    }

    static generateRefreshToken(payload, secret, expiresIn = redisConfig.tokenExpiration.refreshToken) {
        return jwt.sign(payload, secret, { expiresIn });
    }

    
    static verifyToken(token, secret) {
        try {
            return jwt.verify(token, secret);
        } catch (error) {
            console.error('Token verification failed:', error.message);
            return null;
        }
    }

    static extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.split(' ')[1];
    }

    static getTokenExpiration(token) {
        try {
            const decoded = jwt.decode(token);
            if (!decoded || !decoded.exp) {
                return null;
            }
            return decoded.exp - Math.floor(Date.now() / 1000);
        } catch (error) {
            console.error('Error getting token expiration:', error);
            return null;
        }
    }

    static isTokenExpired(token) {
        const expiration = this.getTokenExpiration(token);
        return expiration !== null && expiration <= 0;
    }

    static getUserFromToken(token) {
        try {
            const decoded = jwt.decode(token);
            if (!decoded) {
                return null;
            }
            return {
                email: decoded.email,
                password : decoded.password
            };
        } catch (error) {
            console.error('Error extracting user from token:', error);
            return null;
        }
    }
} 