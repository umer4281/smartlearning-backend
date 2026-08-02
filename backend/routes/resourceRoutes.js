const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, teacherOrAdmin } = require('../middleware/auth');
const { uploadResource, getResources, deleteResource, downloadResource, previewResource } = require('../controllers/resourceController');

// Configure multer for file uploads - use memory storage so files are stored in MongoDB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

router.post('/', protect, teacherOrAdmin, upload.single('file'), uploadResource);
router.get('/', protect, getResources);
// Preview and download are public so <img> and <iframe> tags can load them
// (browser elements cannot send Authorization headers). Resource IDs are
// unguessable MongoDB ObjectIds, providing implicit security.
router.get('/:id/download', downloadResource);
router.get('/:id/preview', previewResource);
router.delete('/:id', protect, teacherOrAdmin, deleteResource);

module.exports = router;