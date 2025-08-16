import thumbnailService from '../../services/thumbnail.service.js';
import { ErrorHandler } from '../../utils/errorHandler.js';

class ThumbnailController {
    async getHealthStatus(req, res) {
        try {
            const healthStatus = await thumbnailService.getHealthStatus();
            return res.status(200).json(healthStatus);
        } catch (error) {
            return ErrorHandler.handleDatabaseError(error, res, 'Get Thumbnail Health');
        }
    }

    async retryFailedThumbnails(req, res) {
        try {
            const retryCount = await thumbnailService.retryFailedThumbnails();
            return res.status(200).json({ 
                message: `Retried ${retryCount} failed thumbnails`,
                retryCount 
            });
        } catch (error) {
            return ErrorHandler.handleDatabaseError(error, res, 'Retry Failed Thumbnails');
        }
    }

    async getFailedThumbnails(req, res) {
        try {
            const failedThumbnails = await thumbnailService.getFailedThumbnails();
            return res.status(200).json({ 
                failedThumbnails,
                count: failedThumbnails.length
            });
        } catch (error) {
            return ErrorHandler.handleDatabaseError(error, res, 'Get Failed Thumbnails');
        }
    }

    async manuallyGenerateThumbnail(req, res) {
        try {
            const { assetId } = req.params;
            const result = await thumbnailService.manuallyGenerateThumbnail(assetId);
            return res.status(200).json(result);
        } catch (error) {
            if (error.message === 'Asset not found') {
                return res.status(404).json({ message: error.message });
            }
            if (error.message === 'Asset has no file path' || error.message === 'Asset is not an image file') {
                return res.status(400).json({ message: error.message });
            }
            return ErrorHandler.handleDatabaseError(error, res, 'Manual Thumbnail Generation');
        }
    }
}

const thumbnailController = new ThumbnailController();
export default thumbnailController; 