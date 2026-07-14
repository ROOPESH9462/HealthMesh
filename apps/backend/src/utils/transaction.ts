import mongoose, { ClientSession } from 'mongoose';
import logger from './logger';

/**
 * Runs a set of operations in a managed MongoDB transaction.
 * Automatically handles starts, commits, and rollbacks on error.
 * 
 * @param runInTransaction Callback containing database operations using the session.
 */
export async function withTransaction<T>(
  runInTransaction: (session: ClientSession) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    // Execute callback passing transaction session
    const result = await runInTransaction(session);
    
    // Commit transaction
    await session.commitTransaction();
    return result;
  } catch (error) {
    logger.error('Database transaction failed. Rolling back changes...', error);
    
    // Abort transaction on error
    await session.abortTransaction();
    throw error;
  } finally {
    // End session cleanup
    session.endSession();
  }
}
