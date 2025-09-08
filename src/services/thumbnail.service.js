    import { Queue, Worker } from 'bullmq';
    import sharp from 'sharp';
    import path from 'path';
    import fs from 'fs';
    import Asset from '../models/asset.model.js';

    export class ThumbnailService {
        constructor() {
            this.queue = null;
            this.worker = null;
            this.isInitialized = false;
        }

        async initialize() {
            try {
                // Initialize queue
                this.queue = new Queue('thumbnailQueue', {
                    connection: {
                        host: process.env.REDIS_HOST || '127.0.0.1',
                        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379
                    }
                });

                // Initialize worker
                this.worker = new Worker('thumbnailQueue', this.processThumbnailJob.bind(this), {
                    connection: {
                        host: process.env.REDIS_HOST || '127.0.0.1',
                        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379
                    },
                    concurrency: 3, // Process 3 thumbnails simultaneously
                    removeOnComplete: 100, // Keep last 100 completed jobs
                    removeOnFail: 50 // Keep last 50 failed jobs
                });

                // Set up event handlers
                this.setupWorkerEvents();
                this.isInitialized = true;
                
                console.log('✅ Thumbnail service initialized successfully');
                return true;
            } catch (error) {
                console.error('❌ Failed to initialize thumbnail service:', error);
                this.isInitialized = false;
                return false;
            }
        }

        async processThumbnailJob(job) {
            const { assetId, filePath, fileType } = job.data;
            
            try {
                console.log(`🖼️  Processing thumbnail generation for asset ${assetId}`);
                
                // Validate file exists
                if (!fs.existsSync(filePath)) {
                    throw new Error(`Source file not found: ${filePath}`);
                }

                // Create thumbnails directory
                const thumbnailsDir = path.resolve(process.cwd(), 'uploads', 'thumbnails');
                if (!fs.existsSync(thumbnailsDir)) {
                    fs.mkdirSync(thumbnailsDir, { recursive: true });
                }

                // Generate thumbnail
                const ext = path.extname(filePath);
                const thumbName = `${path.basename(filePath, ext)}-thumb${ext}`;
                const thumbPath = path.join(thumbnailsDir, thumbName);

                await sharp(filePath)
                    .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 80, progressive: true })
                    .toFile(thumbPath);

                // Update asset with thumbnail URL
                await Asset.findByIdAndUpdate(assetId, { 
                    thumbnail_url: `/uploads/thumbnails/${thumbName}`,
                    thumbnail_generated_at: new Date(),
                    thumbnail_generation_failed: false,
                    thumbnail_error: null,
                    thumbnail_error_details: null
                });

                console.log(`✅ Thumbnail generated successfully for asset ${assetId}`);
                return { success: true, thumbnailPath: thumbPath };

            } catch (error) {
                // Enhanced error handling
                const errorDetails = {
                    message: error.message,
                    stack: error.stack,
                    assetId,
                    filePath,
                    fileType,
                    timestamp: new Date()
                };

                // Log detailed error
                console.error('Thumbnail generation error:', errorDetails);

                // Update asset with error information
                await Asset.findByIdAndUpdate(assetId, { 
                    thumbnail_generation_failed: true,
                    thumbnail_error: error.message,
                    thumbnail_error_details: errorDetails,
                    last_thumbnail_attempt: new Date()
                });

                // Determine if job should be retried
                if (job.attemptsMade < job.opts.attempts) {
                    console.log(`🔄 Retrying thumbnail generation for asset ${assetId}, attempt ${job.attemptsMade + 1}`);
                    throw error; // Will trigger retry
                } else {
                    // Max attempts reached, move to failed queue
                    console.error(`❌ Max attempts reached for asset ${assetId}, moving to failed queue`);
                    await this.moveToFailedQueue(job, error);
                }
            }
        }

        async moveToFailedQueue(job, error) {
            try {
                // Move failed job to a separate failed queue for manual review
                const failedQueue = new Queue('thumbnailFailedQueue', {
                    connection: {
                        host: process.env.REDIS_HOST || '127.0.0.1',
                        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379
                    }
                });

                await failedQueue.add('failedThumbnail', {
                    originalJobData: job.data,
                    error: error.message,
                    failedAt: new Date(),
                    attemptsMade: job.attemptsMade
                });

                console.log(`📋 Moved failed job for asset ${job.data.assetId} to failed queue`);
            } catch (moveError) {
                console.error('Failed to move job to failed queue:', moveError);
            }
        }

        setupWorkerEvents() {
            this.worker.on('completed', (job, result) => {
                console.log(`✅ Thumbnail generated successfully for asset ${job.data.assetId}`);
            });

            this.worker.on('failed', (job, error) => {
                console.error(`❌ Thumbnail generation failed for asset ${job.data.assetId}:`, error.message);
            });

            this.worker.on('error', (error) => {
                console.error('❌ Thumbnail worker error:', error);
            });

            this.worker.on('stalled', (jobId) => {
                console.warn(`⚠️  Thumbnail job ${jobId} stalled`);
            });
        }

        async addThumbnailJob(assetId, filePath, fileType) {
            if (!this.isInitialized) {
                throw new Error('Thumbnail service not initialized');
            }

            return await this.queue.add('generateThumbnail', {
                assetId,
                filePath,
                fileType
            }, {
                attempts: 3, // Retry failed jobs up to 3 times
                backoff: {
                    type: 'exponential',
                    delay: 2000 // Start with 2 second delay
                },
                removeOnComplete: true,
                removeOnFail: false
            });
        }

        async shutdown() {
            try {
                if (this.worker) {
                    await this.worker.close();
                    console.log('✅ Thumbnail worker closed');
                }
                if (this.queue) {
                    await this.queue.close();
                    console.log('✅ Thumbnail queue closed');
                }
                this.isInitialized = false;
                console.log('✅ Thumbnail service shutdown complete');
            } catch (error) {
                console.error('❌ Error during thumbnail service shutdown:', error);
            }
        }

        getQueueStatus() {
            if (!this.queue) return null;
            
            return {
                isInitialized: this.isInitialized,
                queueSize: this.queue.getJobCounts()
            };
        }

        async getHealthStatus() {
            if (!this.isInitialized) {
                return { status: 'not_initialized', message: 'Service not initialized' };
            }

            try {
                const queueCounts = await this.queue.getJobCounts();
                const workerStatus = this.worker.isRunning();

                return {
                    status: 'healthy',
                    timestamp: new Date(),
                    queue: {
                        waiting: queueCounts.waiting,
                        active: queueCounts.active,
                        completed: queueCounts.completed,
                        failed: queueCounts.failed
                    },
                    worker: {
                        isRunning: workerStatus,
                        concurrency: this.worker.concurrency
                    }
                };
            } catch (error) {
                return {
                    status: 'unhealthy',
                    error: error.message,
                    timestamp: new Date()
                };
            }
        }

        async retryFailedThumbnails() {
            try {
                const failedQueue = new Queue('thumbnailFailedQueue', {
                    connection: {
                        host: process.env.REDIS_HOST || '127.0.0.1',
                        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379
                    }
                });

                const failedJobs = await failedQueue.getJobs(['failed']);
                
                let retryCount = 0;
                for (const job of failedJobs) {
                    const { originalJobData } = job.data;
                    
                    // Re-queue the original thumbnail job
                    await this.addThumbnailJob(
                        originalJobData.assetId,
                        originalJobData.filePath,
                        originalJobData.fileType
                    );
                    
                    // Remove from failed queue
                    await job.remove();
                    retryCount++;
                }

                console.log(`🔄 Retried ${retryCount} failed thumbnails`);
                return retryCount;
            } catch (error) {
                console.error('❌ Error retrying failed thumbnails:', error);
                throw error;
            }
        }

        async getFailedThumbnails() {
            try {
                const failedQueue = new Queue('thumbnailFailedQueue', {
                    connection: {
                        host: process.env.REDIS_HOST || '127.0.0.1',
                        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379
                    }
                });

                const failedJobs = await failedQueue.getJobs(['failed']);
                
                return failedJobs.map(job => ({
                    id: job.id,
                    assetId: job.data.originalJobData.assetId,
                    filePath: job.data.originalJobData.filePath,
                    fileType: job.data.originalJobData.fileType,
                    error: job.data.error,
                    failedAt: job.data.failedAt,
                    attemptsMade: job.data.attemptsMade
                }));
            } catch (error) {
                console.error('❌ Error getting failed thumbnails:', error);
                throw error;
            }
        }

        async manuallyGenerateThumbnail(assetId) {
            try {
                // Get asset details
                const asset = await Asset.findById(assetId);
                if (!asset) {
                    throw new Error('Asset not found');
                }

                if (!asset.file_path) {
                    throw new Error('Asset has no file path');
                }

                if (!asset.file_type || !asset.file_type.startsWith('image/')) {
                    throw new Error('Asset is not an image file');
                }

                // Add to thumbnail queue
                const job = await this.addThumbnailJob(
                    assetId,
                    asset.file_path,
                    asset.file_type
                );

                return { 
                    success: true, 
                    message: 'Thumbnail generation queued',
                    jobId: job.id 
                };
            } catch (error) {
                console.error(`❌ Error manually generating thumbnail for asset ${assetId}:`, error);
                throw error;
            }
        }
    }

    // Create singleton instance
    const thumbnailService = new ThumbnailService();
    export default thumbnailService; 