const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
  },
  description: {
    type: String,
  },
  fileName: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
  },
  // File data stored directly in MongoDB so files persist on ephemeral filesystems (e.g. Render)
  fileData: {
    type: Buffer,
  },
  fileType: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
  },
  category: {
    type: String,
    enum: ['image', 'pdf', 'document', 'video', 'audio', 'other'],
    default: 'other',
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Resource', resourceSchema);