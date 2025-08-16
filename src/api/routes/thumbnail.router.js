import express from 'express';
import thumbnailController from '../controllers/thumbnail.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get thumbnail service health status
router.get('/health', thumbnailController.getHealthStatus);

// Retry failed thumbnails
router.post('/retry-failed', thumbnailController.retryFailedThumbnails);

// Get failed thumbnail jobs
router.get('/failed', thumbnailController.getFailedThumbnails);

// Manually trigger thumbnail generation for an asset
router.post('/generate/:assetId', thumbnailController.manuallyGenerateThumbnail);

export default router; 