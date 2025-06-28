import mongoose, { Schema } from 'mongoose';
import User from './user.model.js';

const assetSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    fileType: {
        type: String,
        required: true,
        enum: ['image', 'video', 'document', 'audio'],
    },
    filePath: {
        type: String,
        required: true,
        trim: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    fileSize: {
        type: Number,
        required: true,
    }
},{
    timestamps: true,
})

const Asset = mongoose.model('Asset', assetSchema);
export default Asset;