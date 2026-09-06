const mongoose = require('mongoose');

const BackupSnapshotSchema = new mongoose.Schema({
  snapshot_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `snap_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  },
  type: {
    type: String,
    enum: ['FULL_DB', 'COLLECTION', 'JSONL_RESTORE'],
    required: true
  },
  collections: [{
    type: String,
    trim: true
  }],
  size_bytes: {
    type: Number,
    default: 0
  },
  document_count: {
    type: Number,
    default: 0
  },
  created_by: {
    type: String,
    default: 'system'
  },
  download_path: {
    type: String,
    default: ''
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

BackupSnapshotSchema.index({ created_at: -1 });

module.exports = mongoose.models.BackupSnapshot || mongoose.model('BackupSnapshot', BackupSnapshotSchema);
