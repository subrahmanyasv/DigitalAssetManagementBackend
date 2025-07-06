import express from "express";
import dotenv from "dotenv";

import { connectDB } from "./config/database.config.js";
import authRouter from "./api/routes/auth.router.js";

// Load environment variables first
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize application
const initializeApp = async () => {
    try {
        console.log('🚀 Starting Digital Asset Management Backend...');
        await connectDB();
        
        // Set up Express middleware
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        
        // Add basic security headers
        app.use((req, res, next) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            next();
        });
        
        // API routes
        app.use('/api/auth', authRouter);
        
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
        const server = app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
        });
        
        // Handle server errors
        server.on('error', (error) => {
            console.error('❌ Server error:', error);
            process.exit(1);
        });
        
        console.log('🎉 Application initialized successfully!');
        
    } catch (error) {
        console.error('❌ Failed to initialize application:', error);
        process.exit(1);
    }
};

// Start the application
initializeApp();