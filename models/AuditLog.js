const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'SUSPEND_USER',
        'ACTIVATE_USER',
        'DELETE_BOOK',
        'RESTORE_BOOK',
        'REPORT_RESOLVED',
      ],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // Could refer to User or Book depending on the action
    },
    targetModel: {
      type: String,
      required: true,
      enum: ['User', 'Book'],
    },
    details: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
