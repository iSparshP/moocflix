const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const validateRequest = require('../middlewares/validateRequest');
const { authenticate, authorize } = require('../middlewares/auth');
const uploadMiddleware = require('../middlewares/videoUpload');
const schemas = require('../validations/schemas');

/**
 * @swagger
 * /videos/{courseId}/upload:
 *   post:
 *     summary: Upload a new video
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/VideoUpload'
 */
router.post(
    '/:courseId/upload',
    authenticate,
    authorize('instructor', 'admin'),
    uploadMiddleware,
    validateRequest(schemas.uploadVideo),
    videoController.uploadVideo
);

/**
 * @swagger
 * /videos/{courseId}/list:
 *   get:
 *     summary: Get all videos for a course
 */
router.get(
    '/:courseId/list',
    authenticate,
    validateRequest(schemas.courseId, 'params'),
    videoController.getCourseVideos
);

/**
 * @swagger
 * /videos/{videoId}/stream:
 *   get:
 *     summary: Get video streaming URL
 */
router.get(
    '/:videoId/stream',
    authenticate,
    validateRequest(schemas.videoId, 'params'),
    videoController.getVideo
);

/**
 * @swagger
 * /videos/{videoId}/status:
 *   get:
 *     summary: Get video processing status
 */
router.get(
    '/:videoId/status',
    authenticate,
    validateRequest(schemas.videoId, 'params'),
    videoController.getVideoStatus
);

/**
 * @swagger
 * /videos/{videoId}:
 *   delete:
 *     summary: Delete a video
 */
router.delete(
    '/:videoId',
    authenticate,
    authorize('instructor', 'admin'),
    validateRequest(schemas.videoId, 'params'),
    videoController.deleteVideo
);

/**
 * @swagger
 * /videos/{videoId}/thumbnails:
 *   get:
 *     summary: Get video thumbnails
 */
router.get(
    '/:videoId/thumbnails',
    authenticate,
    validateRequest(schemas.videoId, 'params'),
    videoController.getThumbnails
);

/**
 * @swagger
 * /videos/course/{courseId}/enroll:
 *   post:
 *     summary: Enroll a student in a course
 */
router.post(
    '/course/:courseId/enroll',
    authenticate,
    validateRequest(schemas.courseId, 'params'),
    validateRequest(schemas.enrollment),
    videoController.enrollStudent
);

module.exports = router;
