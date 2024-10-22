// content-delivery-service/src/routes/contentRoutes.js
const express = require('express');
const contentController = require('../controllers/contentController');
const validateUpload = require('../middlewares/validateUpload');
const router = express.Router();

router.post('/upload', validateUpload, contentController.uploadVideo);
router.get('/:videoId', contentController.fetchVideo);
router.get('/:videoId/stream', contentController.streamVideo);
router.post('/:videoId/transcode', contentController.transcodeVideo);
router.delete('/:videoId/delete', contentController.deleteVideo);
router.get('/:courseId/videos', contentController.getCourseVideos); // New route

module.exports = router;
