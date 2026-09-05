const mongoose = require('mongoose');

/**
 * ClientMember Junction Model
 * Maps client_id ↔ user_id with granular access flags.
 * Mirrors the PostgreSQL `client_members` table from the RBAC spec.
 */
const ClientMemberSchema = new mongoose.Schema({
  client_id: {
    type: String,
    required: true,
    index: true
  },
  user_id: {
    type: String,
    required: true,
    index: true
  },
  can_manage: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound unique index — one membership row per (client, user) pair
ClientMemberSchema.index({ client_id: 1, user_id: 1 }, { unique: true });

const ClientMember = mongoose.models.ClientMember || mongoose.model('ClientMember', ClientMemberSchema);
module.exports = ClientMember;
module.exports.ClientMember = ClientMember;
