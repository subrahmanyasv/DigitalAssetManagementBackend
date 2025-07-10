import express from 'express';
import assetController from '../controllers/asset.controller.js';
import multerInstance from '../../config/multer.config.js';

const router = express.Router();

router.get('/:owner_id' , assetController.getAssetsController);
router.get('/:owner_id/:asset_id' , assetController.getAssetController);
router.post('/', multerInstance.single('file'), assetController.createAssetController);
router.delete('/:owner_id/:asset_id' , assetController.deleteAssetController);

export default router;