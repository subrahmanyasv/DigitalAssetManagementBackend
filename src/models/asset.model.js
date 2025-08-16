import mongoose from "mongoose";

// Main asset schema without versioning
const assetSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  file_path: { type: String, required: true },
  file_type: { type: String, required: true },
  thumbnail_url: { type: String },
  thumbnail_generated_at: { type: Date },
  thumbnail_generation_failed: { type: Boolean, default: false },
  thumbnail_error: { type: String },
  thumbnail_error_details: { type: mongoose.Schema.Types.Mixed },
  last_thumbnail_attempt: { type: Date },
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tags: [{ type: String }],
  status: { 
    type: String, 
    enum: ['active', 'deleted'], 
    default: 'active' 
  },
  created_at: { type: Date, default: Date.now },
});


const Asset = mongoose.model('Asset', assetSchema);
export default Asset;
