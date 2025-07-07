import Asset from '../models/asset.model.js';
import mongoose from 'mongoose';
import Joi from 'joi';

// Define Joi schema for asset creation
const assetSchema = Joi.object({
    title: Joi.string().trim().required(),
    description: Joi.string().allow(''),
    file_path: Joi.string().trim().required(),
    file_type: Joi.string().trim().required(),
    thumbnail_url: Joi.string().uri().allow(''),
    owner_id: Joi.string().custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return helpers.error('any.invalid');
        }
        return value;
    }).required(),
    tags: Joi.array().items(Joi.string()),
    status: Joi.string().valid('active', 'deleted').default('active'),
    created_at: Joi.date()
});

export class AssetService {
    async createAsset(payload) {
        // Validate using Joi schema
        const { error, value } = assetSchema.validate(payload, { abortEarly: false, stripUnknown: true });
        if (error) {
            return { success: false, message: "Payload structure dosen't match the required format" };
        }
        try {
            const newAsset = await Asset.create(value);
            return { success: true, data: newAsset };
        } catch (error) {
            console.error('Error creating asset:', error);
            return { success: false, message: 'Error creating asset' };
        }
    }

    async getAssets(userId) {
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return { success: false, message: 'Valid userId is required' };
        }
        try {
            const assets = await Asset.find({ owner_id: userId, status: 'active' });
            return { success: true, data: assets || [] };
        } catch (error) {
            console.error('Error fetching assets:', error);
            return { success: false, message: 'Error fetching assets' };
        }
    }

    async getAsset(assetId, userId) {
        if (!assetId || !mongoose.Types.ObjectId.isValid(assetId)) {
            return { success: false, message: 'Valid assetId is required' };
        }
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return { success: false, message: 'Valid userId is required' };
        }
        try {
            const asset = await Asset.findOne({ _id: assetId, owner_id: userId, status: 'active' });
            if (!asset) {
                return { success: false, message: 'Asset not found' };
            }
            return { success: true, data: asset };
        } catch (error) {
            console.error(`Error fetching asset: ${error.message}`);
            return { success: false, message: 'Error fetching asset' };
        }
    }

    async deleteAsset(assetId, userId) {
        if (!assetId || !mongoose.Types.ObjectId.isValid(assetId)) {
            return { success: false, message: 'Valid assetId is required' };
        }
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return { success: false, message: 'Valid userId is required' };
        }
        try {
            // Soft delete: update status to 'deleted'
            const deletedAsset = await Asset.findOneAndUpdate(
                { _id: assetId, owner_id: userId, status: 'active' },
                { status: 'deleted' },
                { new: true }
            );
            if (!deletedAsset) {
                return { success: false, message: 'Asset not found or already deleted' };
            }
            return { success: true, data: deletedAsset };
        } catch (error) {
            console.error(`Error deleting asset: ${error.message}`);
            return { success: false, message: 'Error deleting asset' };
        }
    }
}
