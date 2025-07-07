export const redisConfig = {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    
    connection: {
        socket: {
            reconnectStrategy: (retries) => {
                if (retries > 10) {
                    console.error('Redis connection failed after 10 retries');
                    return false;
                }
                return Math.min(retries * 100, 3000);
            },
            connectTimeout: 10000, // 10 seconds
            lazyConnect: true
        }
    },
    
    // Token expiration times (in seconds)
    tokenExpiration: {
        refreshToken: 7 * 24 * 60 * 60, // 7 days
        accessToken: 15 * 60 // 15 minutes
    },
    
    // Key prefixes for different types of data
    keyPrefixes: {
        refreshToken: 'refresh_token:',
        blacklistedToken: 'blacklisted_token:',
        userSession: 'user_session:'
    },
    
    // Redis operation timeouts
    timeouts: {
        get: 5000, // 5 seconds
        set: 5000, // 5 seconds
        del: 5000  // 5 seconds
    }
};


export const getRedisKey = (prefix, identifier) => {
    return `${prefix}${identifier}`;
};


export const getRefreshTokenKey = (userEmail) => {
    return getRedisKey(redisConfig.keyPrefixes.refreshToken, userEmail);
}; 