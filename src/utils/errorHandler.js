/**
 * Error handling utilities for consistent error responses
 */
export class ErrorHandler {
    /**
     * Handle database operation errors
     * @param {Error} error - The error object
     * @param {Object} res - Express response object
     * @param {string} operation - Name of the operation being performed
     */
    static handleDatabaseError(error, res, operation = 'operation') {
        console.error(`${operation} error:`, error);
        
        // Handle specific MongoDB errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Validation failed', 
                errors: Object.values(error.errors).map(err => err.message)
            });
        }
        
        if (error.name === 'MongoError' && error.code === 11000) {
            return res.status(400).json({ message: 'Duplicate entry found' });
        }
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid data format' });
        }
        
        // Handle custom errors
        if (error.message === 'User already exists') {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        if (error.message === 'User not found') {
            return res.status(400).json({ message: 'User not found' });
        }
        
        if (error.message === 'Incorrect password') {
            return res.status(400).json({ message: 'Incorrect password' });
        }
        
        if (error.message === 'Invalid or expired refresh token') {
            return res.status(403).json({ message: 'Invalid or expired refresh token' });
        }
        
        // Default error response
        return res.status(500).json({ message: 'Internal server error! Try again later.' });
    }
    
    /**
     * Create a custom error with specific message
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @returns {Error} - Custom error object
     */
    static createError(message, statusCode = 500) {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
    }
}