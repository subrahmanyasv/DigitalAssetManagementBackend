import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const NODE_ENV = process.env.NODE_ENV || 'development';

// Helper to generate a unique filename
function generateUniqueFilename(originalname) {
    const ext = path.extname(originalname);
    const basename = path.basename(originalname, ext);
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    return `${basename}-${uniqueSuffix}${ext}`;
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
            cb(null, path.resolve(process.cwd(), 'uploads/'));
        },
        filename: function (req, file, cb) {
            const uniqueName = generateUniqueFilename(file.originalname);
            cb(null, uniqueName);
        }
    });
}

const fileFilter = (req, file, cb) => {
    // TODO: Restrict file types here (e.g., images, videos, docs)
    // Allow all for now
    cb(null, true);
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