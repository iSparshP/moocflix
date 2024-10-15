const express = require('express');
const router = express.Router();
const {
    uploadVideo,
    fetchVideo,
    streamVideo,
    transcodeVideo,
    deleteVideo,
} = require('../controllers/contentController');
const validateUpload = require('../middlewares/validateUpload.js');

// Define routes
router.post('/upload', validateUpload, uploadVideo);
router.get('/:videoId', fetchVideo);
router.get('/:videoId/stream', streamVideo);
router.post('/:videoId/transcode', transcodeVideo);
router.delete('/:videoId/delete', deleteVideo);

module.exports = router;
