import mongoose from "mongoose";

// Get MongoDB URI from environment variables with fallback
const getMongoURI = () => {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
        console.warn('MONGODB_URI not found in environment variables. Using default localhost connection.');
        return 'mongodb://localhost:27017/dam_system';
    }
    return mongoURI;
};

// Database connection options
const getConnectionOptions = () => {
    return {
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        // bufferMaxEntries: 0, // Disable mongoose buffering
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverApi: {
            version: '1',
            strict: true,
            deprecationErrors: true,
        }
    };
};

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
export const connectDB = async () => {
    try {
        const mongoURI = getMongoURI();
        const options = getConnectionOptions();
        
        const conn = await mongoose.connect(mongoURI, options);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        // Set up connection event listeners
        setupConnectionListeners(conn.connection);

        // Set up graceful shutdown handlers
        setupGracefulShutdown();

        return conn;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('🔍 Error details:', error);
    
        // Exit process if database connection fails
        process.exit(1);
    }
};

/**
 * Disconnect from MongoDB database
 * @returns {Promise<void>}
 */
export const disconnectDB = async () => {
    try {
        if (mongoose.connection.readyState !== 0) { // 0 = disconnected
            console.log('🔄 Disconnecting from MongoDB...');
            await mongoose.connection.close();
            console.log('✅ MongoDB disconnected successfully');
        }
    } catch (error) {
        console.error('❌ Error disconnecting from MongoDB:', error.message);
        throw error;
    }
};

const getConnectionState = (readyState) => {
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    return states[readyState] || 'unknown';
};

/**
 * Set up connection event listeners
 * @param {mongoose.Connection} connection - Mongoose connection object
 */
const setupConnectionListeners = (connection) => {
    // Connection events
    connection.on('connected', () => {
        console.log('✅ MongoDB connection established');
    });

    connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
    });

    connection.on('disconnected', () => {
        console.log('⚠️  MongoDB disconnected');
    });

    connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
    });

    connection.on('close', () => {
        console.log('🔒 MongoDB connection closed');
    });

    // Monitor connection health
    //This is just a demo on how can we manually monitor the connection health
    //This adds a lot of load on the server, so we are not using it

    // setInterval(() => {
    //     const state = getConnectionState(connection.readyState);
    //     if (state === 'disconnected') {
    //         console.warn('⚠️  MongoDB connection lost, attempting to reconnect...');
    //     }
    // }, 30000); // Check every 30 seconds
};


const setupGracefulShutdown = () => {
    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', async () => {
        console.log('\n🛑 SIGINT received, shutting down gracefully...');
        await gracefulShutdown();
    });

    // Handle SIGTERM (termination signal)
    process.on('SIGTERM', async () => {
        console.log('\n🛑 SIGTERM received, shutting down gracefully...');
        await gracefulShutdown();
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
        console.error('💥 Uncaught Exception:', error);
        await gracefulShutdown();
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
        console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
        await gracefulShutdown();
    });
};

/**
 * Graceful shutdown function
 * @returns {Promise<void>}
 */
const gracefulShutdown = async () => {
    try {
        console.log('🔄 Closing database connections...');
        await disconnectDB();
        
        console.log('✅ Shutdown completed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
    }
};

/**
 * Get current database connection status
 * @returns {Object} Connection status information
 */
export const getDBStatus = () => {
    const connection = mongoose.connection;
    return {
        readyState: connection.readyState,
        state: getConnectionState(connection.readyState),
        host: connection.host,
        port: connection.port,
        name: connection.name,
        isConnected: connection.readyState === 1
    };
};

/**
 * Check if database is connected
 * @returns {boolean} True if connected, false otherwise
 */
export const isDBConnected = () => {
    return mongoose.connection.readyState === 1;
};

export default {
    connectDB,
    disconnectDB,
    getDBStatus,
    isDBConnected
};