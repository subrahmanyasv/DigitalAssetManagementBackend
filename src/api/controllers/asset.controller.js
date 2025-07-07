import { AssetService } from '../../services/asset.service.js';
import TransactionService from '../../services/transaction.service.js';
import { ErrorHandler } from '../../utils/errorHandler.js';

export class AssetController {
    
    // Controller for POST /api/asset/ (upload asset)
    async createAssetController(req, res) {
        try {
            const result = await TransactionService.executeTransaction(async (session) => {
                // Build payload from req.body and req.file
                const { owner_id, description, tags } = req.body;
                const { originalname, filename, mimetype, path: file_path, size } = req.file || {};
                const payload = {
                    title: originalname, // Use original file name as title
                    description: description || '',
                    file_path: file_path || '',
                    file_type: mimetype || '',
                    owner_id,
                    tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
                    created_at: new Date(),
                };

                const assetResult = await AssetService.createAsset(payload);
                //TODO: create a bullMQ workflow to generate thumbnail.
                return assetResult && assetResult.success ? assetResult : null;
            });
            if (result) {
                return res.status(201).json({ message: 'Asset created successfully', asset: result.data });
            }
        } catch (error) {
            return ErrorHandler.handleDatabaseError(error, res, 'Asset Creation');
        }
    }
} 