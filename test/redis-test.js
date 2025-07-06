import redisService from '../src/services/redis.service.js';
import { AuthService } from '../src/services/auth.service.js';

/**
 * Test script for Redis-based refresh token implementation
 */
async function testRedisImplementation() {
    console.log('🧪 Testing Redis-based Refresh Token Implementation...\n');

    try {
        // Test 1: Redis Connection
        console.log('1. Testing Redis Connection...');
        const connected = await redisService.connect();
        if (connected) {
            console.log('✅ Redis connection successful');
        } else {
            console.log('❌ Redis connection failed');
            return;
        }

        // Test 2: Token Storage and Retrieval
        console.log('\n2. Testing Token Storage and Retrieval...');
        const testEmail = 'test@example.com';
        const testToken = 'test_refresh_token_123';
        
        const stored = await redisService.storeRefreshToken(testEmail, testToken);
        if (stored) {
            console.log('✅ Token stored successfully');
        } else {
            console.log('❌ Token storage failed');
        }

        const retrievedToken = await redisService.getRefreshToken(testEmail);
        if (retrievedToken === testToken) {
            console.log('✅ Token retrieved successfully');
        } else {
            console.log('❌ Token retrieval failed');
        }

        // Test 3: Token Validation
        console.log('\n3. Testing Token Validation...');
        const isValid = await redisService.validateRefreshToken(testEmail, testToken);
        if (isValid) {
            console.log('✅ Token validation successful');
        } else {
            console.log('❌ Token validation failed');
        }

        // Test 4: Token Invalidation
        console.log('\n4. Testing Token Invalidation...');
        const invalidated = await redisService.invalidateRefreshToken(testEmail);
        if (invalidated) {
            console.log('✅ Token invalidation successful');
        } else {
            console.log('❌ Token invalidation failed');
        }

        // Test 5: AuthService Integration
        console.log('\n5. Testing AuthService Integration...');
        const authService = new AuthService();
        const payload = { email: 'auth@example.com', id: '123' };
        
        const tokens = await authService.generateTokens(payload);
        if (tokens.accessToken && tokens.refreshToken) {
            console.log('✅ Token generation successful');
        } else {
            console.log('❌ Token generation failed');
        }

        // Test 6: Token Refresh
        console.log('\n6. Testing Token Refresh...');
        const newTokens = await authService.refreshTokens(tokens.refreshToken);
        if (newTokens && newTokens.accessToken && newTokens.refreshToken) {
            console.log('✅ Token refresh successful');
        } else {
            console.log('❌ Token refresh failed');
        }

        // Test 7: Cleanup
        console.log('\n7. Testing Cleanup...');
        await authService.invalidateRefreshToken(payload.email);
        console.log('✅ Cleanup completed');

        console.log('\n🎉 All tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        // Disconnect from Redis
        await redisService.disconnect();
        console.log('\n🔌 Redis disconnected');
    }
}

// Run the test
testRedisImplementation(); 