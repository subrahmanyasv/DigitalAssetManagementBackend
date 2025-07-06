# Redis-Based Refresh Token Implementation

This document describes the Redis-based refresh token validation and invalidation system implemented in the Digital Asset Management Backend.

## Overview

The system uses Redis as a cache to store and validate refresh tokens, providing enhanced security and performance for user authentication.

## Architecture

### Components

1. **RedisService** (`src/services/redis.service.js`)
   - Handles Redis connection and operations
   - Manages refresh token storage, retrieval, and invalidation
   - Provides connection status monitoring

2. **AuthService** (`src/services/auth.service.js`)
   - Enhanced with Redis integration
   - Stores refresh tokens in Redis during generation
   - Validates tokens against Redis during verification
   - Handles token invalidation during logout

3. **Redis Configuration** (`src/config/redis.config.js`)
   - Centralized Redis configuration
   - Token expiration settings
   - Key naming conventions

4. **Token Utilities** (`src/utils/tokenUtils.js`)
   - JWT token generation and verification utilities
   - Token expiration checking
   - User information extraction

5. **Redis Middleware** (`src/api/middlewares/redis.middleware.js`)
   - Connection status checking
   - Fallback handling for Redis unavailability

## Features

### 1. Token Storage
- Refresh tokens are automatically stored in Redis when generated
- Tokens expire automatically based on configuration (default: 7 days)
- Keys follow the pattern: `refresh_token:{userEmail}`

### 2. Token Validation
- Refresh tokens are validated against Redis before use
- Prevents use of revoked or expired tokens
- Graceful fallback when Redis is unavailable

### 3. Token Invalidation
- Tokens are invalidated during logout
- Immediate token revocation for security
- Clean Redis key removal

### 4. Connection Management
- Automatic Redis connection handling
- Reconnection strategy with exponential backoff
- Graceful shutdown handling

## Configuration

### Environment Variables

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Secrets
JWT_ACCESS_TOKEN_SECRET=your_access_token_secret
JWT_REFRESH_TOKEN_SECRET=your_refresh_token_secret
```

### Redis Configuration Options

```javascript
// src/config/redis.config.js
export const redisConfig = {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    tokenExpiration: {
        refreshToken: 7 * 24 * 60 * 60, // 7 days
        accessToken: 15 * 60 // 15 minutes
    },
    // ... other options
};
```

## API Endpoints

### Authentication Flow

1. **Register** (`POST /api/auth/register`)
   - Generates access and refresh tokens
   - Stores refresh token in Redis
   - Returns access token to client

2. **Login** (`POST /api/auth/login`)
   - Validates credentials
   - Generates new tokens
   - Stores refresh token in Redis
   - Returns access token to client

3. **Refresh Token** (`POST /api/auth/refresh`)
   - Validates refresh token against Redis
   - Generates new access and refresh tokens
   - Updates Redis with new refresh token
   - Returns new access token

4. **Logout** (`POST /api/auth/logout`)
   - Invalidates refresh token in Redis
   - Clears refresh token cookie
   - Returns success message

## Security Features

### 1. Token Revocation
- Immediate invalidation of refresh tokens on logout
- Prevents token reuse after logout

### 2. Redis Validation
- All refresh token operations validate against Redis
- Ensures token integrity and validity

### 3. Automatic Expiration
- Tokens expire automatically in Redis
- Configurable expiration times
- Clean memory management

### 4. Fallback Handling
- System continues to work when Redis is unavailable
- Graceful degradation of security features
- Clear logging of Redis status

## Error Handling

### Redis Connection Errors
- Automatic reconnection attempts
- Exponential backoff strategy
- Graceful fallback to JWT-only validation

### Token Validation Errors
- Clear error messages for invalid tokens
- Proper HTTP status codes
- Detailed logging for debugging

## Monitoring and Logging

### Connection Status
- Redis connection status is logged
- Connection failures are reported
- Reconnection attempts are tracked

### Token Operations
- Token storage operations are logged
- Validation failures are reported
- Invalid token attempts are tracked

## Performance Considerations

### Redis Operations
- Fast token storage and retrieval
- Automatic expiration reduces memory usage
- Efficient key-based lookups

### Fallback Performance
- JWT-only validation when Redis is unavailable
- Minimal performance impact during Redis downtime
- Quick recovery when Redis becomes available

## Testing

### Redis Connection Testing
```javascript
// Test Redis connection
const redisService = new RedisService();
const connected = await redisService.connect();
console.log('Redis connected:', connected);
```

### Token Operations Testing
```javascript
// Test token storage and retrieval
await redisService.storeRefreshToken('user@example.com', 'token123');
const token = await redisService.getRefreshToken('user@example.com');
console.log('Stored token:', token);
```

## Deployment Considerations

### Redis Setup
1. Install Redis server
2. Configure Redis URL in environment variables
3. Ensure Redis is accessible from the application
4. Set up Redis persistence if needed

### Environment Configuration
1. Set `REDIS_URL` environment variable
2. Configure JWT secrets
3. Set appropriate token expiration times
4. Configure Redis connection options

### Monitoring
1. Monitor Redis connection status
2. Track token operation metrics
3. Set up alerts for Redis failures
4. Monitor memory usage

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis server status
   - Verify Redis URL configuration
   - Check network connectivity

2. **Token Validation Errors**
   - Verify Redis is storing tokens correctly
   - Check token expiration settings
   - Review token generation logic

3. **Performance Issues**
   - Monitor Redis memory usage
   - Check Redis connection pool
   - Review token expiration settings

### Debug Commands

```bash
# Check Redis connection
redis-cli ping

# Monitor Redis operations
redis-cli monitor

# Check Redis memory usage
redis-cli info memory
``` 