import mongoose from 'mongoose';

/**
 * Transaction service for handling database transactions with rollback
 */
export class TransactionService {
    /**
     * Execute a function within a database transaction
     * @param {Function} callback - Function to execute within transaction
     * @returns {Promise<any>} - Result of the callback function
     */
    static async executeTransaction(callback) {
        const session = await mongoose.startSession();
        
        try {
            session.startTransaction();
            
            // Execute the callback with the session
            const result = await callback(session);
            
            // If we reach here, commit the transaction
            await session.commitTransaction();
            
            return result;
            
        } catch (error) {
            // If any error occurs, abort the transaction
            await session.abortTransaction();
            throw error;
            
        } finally {
            // Always end the session
            await session.endSession();
        }
    }
    
    /**
     * Execute multiple operations in a single transaction
     * @param {Array<Function>} operations - Array of operations to execute
     * @returns {Promise<Array>} - Results of all operations
     */
    static async executeMultipleOperations(operations) {
        return this.executeTransaction(async (session) => {
            const results = [];
            for (const operation of operations) {
                const result = await operation(session);
                results.push(result);
            }
            return results;
        });
    }
}

export default TransactionService;