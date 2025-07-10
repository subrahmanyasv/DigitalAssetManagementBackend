import { Error } from 'mongoose';
import { assetService } from '../../services/asset.service.js';
import TransactionService from '../../services/transaction.service.js';
import { ErrorHandler } from '../../utils/errorHandler.js';

class AssetController {

    constructor() {
        this.assetService = assetService;
    }

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

                const assetResult = await assetService.createAsset(payload);
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

    // Controller for GET /api/asset/:owner_id (Fetch all asset details of a user)
    async getAssetsController(req, res) {
        try {
            const { owner_id } = req.params;
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 10;

            const result = await TransactionService.executeTransaction(async (session) => {
                return await assetService.getAssets(owner_id, page, limit);
            });
            if (result && result.success) {
                // Return assets array (could be empty)
                return res.status(200).json(result.data);
            } else {
                // If userId is invalid or not present, treat as 404 (not found)
                if (result && result.message === 'Valid userId is required') {
                    return res.status(404).json({ message: result.message });
                }
                // Other errors (e.g., DB error)
                return res.status(500).json({ message: result && result.message ? result.message : 'Unknown error' });
            }
        } catch (error) {
            return ErrorHandler.handleDatabaseError(error, res, 'Get Assets');
        }
    }

    // Controller for GET /api/assets/:owner_id/:asset_id (Fetch a perticular asset details)
    async getAssetController(req, res) {
        try {
            const { owner_id, asset_id } = req.params;

            const result = await TransactionService.executeTransaction(async (session) => {
                return await assetService.getAsset(asset_id, owner_id);
            })

            if (result && result?.success) {
                return res.status(200).json(result.data);
            } else {
                if (result && (result.message === 'Valid userId is required' || result.message === 'Valid assetId is required' || result.message === 'Asset not found')) {
                    return res.status(404).json({ message: result.message });
                }

                return res.status(500).json({ message: result && result.message ? result.message : 'Unknown error' });
            }
        } catch (error) {
            return ErrorHandler.handleDatabaseError(error, res, 'Get Asset');
        }
    }


    async deleteAssetController(req, res) {
        try {
            const { owner_id, asset_id } = req.params;

            const result = TransactionService.executeTransaction(async (session) => {
                return await assetService.deleteAsset(asset_id, owner_id);
            })

            if (result && result?.success) {
                return res.status(200).json(result.data);
            } else {
                if (result && (result.message === 'Valid userId is required' || result.message === 'Valid assetId is required' || result.message === 'Asset not found or already deleted')) {
                    return res.status(404).json({ message: result.message });
                }

                return res.status(500).json({ message: result && result.message ? result.message : 'Unknown error' });
            }
        }catch( error ){
            return ErrorHandler.handleDatabaseError( error , res , 'Delete asset');
        }
    }
} 

const assetController = new AssetController();
export default assetController;