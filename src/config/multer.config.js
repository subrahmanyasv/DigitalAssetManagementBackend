import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

const NODE_ENV = process.env.NODE_ENV || 'development';

// Helper to generate a unique filename
function generateUniqueFilename(originalname) {
    const ext = path.extname(originalname);
    const basename = path.basename(originalname, ext);
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    return `${basename}-${uniqueSuffix}${ext}`;
}

function getAssetType(mimetype) {
    if (mimetype.startsWith('image/')) return 'images';
    if (mimetype.startsWith('video/')) return 'videos';
    if (
        mimetype === 'application/pdf' ||
        mimetype === 'application/msword' ||
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimetype === 'application/vnd.ms-excel' ||
        mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        mimetype === 'application/vnd.ms-powerpoint' ||
        mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ) return 'documents';
    return 'others';
}

let storage;

if (NODE_ENV === 'production') {
    // TODO: Implement cloud storage (e.g., AWS S3, Google Cloud Storage, etc.)
    // Placeholder for future production storage engine
    storage = multer.memoryStorage(); // Temporary: store in memory until cloud integration
    // You can later replace this with a custom storage engine for your cloud provider
} else {
    // Development: Store files locally in uploads/
    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            const assetType = getAssetType(file.mimetype);
            const year = new Date().getFullYear();
            const uploadPath = path.resolve(process.cwd(), 'uploads', assetType, String(year));
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
        },
        filename: function (req, file, cb) {
            const uniqueName = generateUniqueFilename(file.originalname);
            cb(null, uniqueName);
        }
    });
}

const fileFilter = (req, file, cb) => {
    const allowedImage = file.mimetype.startsWith('image/');
    const allowedVideo = file.mimetype.startsWith('video/');
    const allowedDocs = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    if (allowedImage || allowedVideo || allowedDocs.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file type'), false);
    }
};

const limits = {
    fileSize: 50 * 1024 * 1024 // 50MB max file size (adjust as needed)
};

const multerInstance = multer({
    storage,
    fileFilter,
    limits
});

export default multerInstance; 