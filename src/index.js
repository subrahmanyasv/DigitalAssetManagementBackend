import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/database.config.js";
import redisService from "./services/redis.service.js";
import thumbnailService from "./services/thumbnail.service.js";

import authRouter from "./api/routes/auth.router.js";
import assetRouter from "./api/routes/asset.router.js";
import thumbnailRouter from "./api/routes/thumbnail.router.js";
import {authenticate} from "./api/middlewares/auth.middleware.js";

// Load environment variables first
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || (process.platform === 'win32' ? '127.0.0.1' : '0.0.0.0');

// Initialize application
const initializeApp = async () => {
    try {
        console.log('🚀 Starting Digital Asset Management Backend...');
        console.log(`Server path: ${process.cwd()}`);
        await connectDB();
        
        // Initialize Redis connection
        console.log('🔗 Connecting to Redis...');
        const redisConnected = await redisService.connect();
        if (!redisConnected) {
            console.warn('⚠️  Redis connection failed. Refresh token validation will be disabled.');
        } else {
            console.log('✅ Redis connected successfully');
        }
        
        // Initialize thumbnail service
        console.log('🖼️  Initializing thumbnail service...');
        const thumbnailConnected = await thumbnailService.initialize();
        if (!thumbnailConnected) {
            console.warn('⚠️  Thumbnail service initialization failed. Thumbnail generation will be disabled.');
        } else {
            console.log('✅ Thumbnail service initialized successfully');
        }
        
        // Set up Express middleware
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.use(cookieParser());
        
        // Add basic security headers
        app.use((req, res, next) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            next();
        });
        
        // API routes
        app.use('/api/auth', authRouter);

        app.use(authenticate);
        app.use('/api/asset', assetRouter);
        app.use('/api/thumbnail', thumbnailRouter);
        
        // 404 handler
        app.use((req, res) => {
            res.status(404).json({ message: 'Route not found' });
        });
        
        // Global error handler
        app.use((error, req, res, next) => {
            console.error('Global error handler:', error);
            res.status(500).json({ 
                message: 'Internal server error',
                ...(process.env.NODE_ENV === 'development' && { error: error.message })
            });
        });
        
        // Start server only after database is connected
        
        const server = app.listen(PORT, HOST, () => {
            console.log(`✅ Server running on http://${HOST}:${PORT}`);
        });
        
        // Handle server errors
        server.on('error', (error) => {
            console.error('❌ Server error:', error);
            process.exit(1);
        });
        
        // Graceful shutdown handling
        const gracefulShutdown = async (signal) => {
            console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
            
            server.close(async () => {
                console.log('✅ HTTP server closed');
                
                try {
                    await thumbnailService.shutdown();
                    console.log('✅ Thumbnail service shutdown');
                    await redisService.disconnect();
                    console.log('✅ Redis disconnected');
                    process.exit(0);
                } catch (error) {
                    console.error('❌ Error during shutdown:', error);
                    process.exit(1);
                }
            });
        };
        
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        
        console.log('🎉 Application initialized successfully!');
        
    } catch (error) {
        console.error('❌ Failed to initialize application:', error);
        process.exit(1);
    }
};

// Start the application
initializeApp();