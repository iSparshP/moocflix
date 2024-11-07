// content-delivery-service/src/routes/contentRoutes.js
const express = require('express');
const contentController = require('../controllers/contentController');
const validateUpload = require('../middlewares/validateUpload');
const validateRequest = require('../middlewares/validateRequest');
const schemas = require('../validations/schemas');
const { authorize, checkPermission } = require('../middlewares/roleAuth');
const router = express.Router();

/**
 * @swagger
 * /content/upload:
 *   post:
 *     summary: Upload a new video
 *     description: Upload a video file with metadata for a specific course
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - video
 *               - courseId
 *               - title
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Video file (MP4, MKV, or AVI)
 *               courseId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the course this video belongs to
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *                 description: Title of the video
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Optional description of the video
 *     responses:
 *       201:
 *         description: Video uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VideoUploadResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       413:
 *         description: File too large
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
    '/upload',
    authorize('instructor', 'admin'),
    validateUpload,
    validateRequest(schemas.uploadVideo),
    contentController.uploadVideo
);

/**
 * @swagger
 * /content/{videoId}:
 *   get:
 *     summary: Get video details
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Video details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Video'
 *       404:
 *         description: Video not found
 */
router.get(
    '/:videoId',
    validateRequest(schemas.videoId, 'params'),
    contentController.fetchVideo
);

/**
 * @swagger
 * /content/{videoId}/stream:
 *   get:
 *     summary: Stream video content
 *     description: Stream video content with support for range requests and adaptive bitrate
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the video to stream
 *       - in: header
 *         name: Range
 *         schema:
 *           type: string
 *         description: Range header for partial content requests
 *     responses:
 *       200:
 *         description: Full video content
 *         content:
 *           video/mp4:
 *             schema:
 *               type: string
 *               format: binary
 *       206:
 *         description: Partial video content
 *         headers:
 *           Content-Range:
 *             schema:
 *               type: string
 *             description: Content range information
 *           Accept-Ranges:
 *             schema:
 *               type: string
 *             description: Accepted range types
 *         content:
 *           video/mp4:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
    '/:videoId/stream',
    checkPermission('VIEW_VIDEO'),
    contentController.streamVideo
);

/**
 * @swagger
 * /content/{videoId}/transcode:
 *   post:
 *     summary: Request video transcoding
 *     description: Initiate transcoding process for a video with specified format and quality
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the video to transcode
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TranscodingRequest'
 *     responses:
 *       200:
 *         description: Transcoding requested successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Transcoding job requested successfully
 *                 videoId:
 *                   type: string
 *                   format: uuid
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post(
    '/:videoId/transcode',
    validateRequest(schemas.videoId, 'params'),
    validateRequest(schemas.transcoding),
    contentController.transcodeVideo
);

/**
 * @swagger
 * /content/{videoId}/delete:
 *   delete:
 *     summary: Delete a video
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the video to delete
 *     responses:
 *       200:
 *         description: Video deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Video deleted.
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /content/{courseId}/videos:
 *   get:
 *     summary: Get all videos for a course
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the course
 *     responses:
 *       200:
 *         description: List of course videos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Video'
 *       404:
 *         description: No videos found for this course
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /content/enroll/{courseId}:
 *   post:
 *     summary: Enroll a student in a course
 *     tags: [Enrollment]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the course
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Enrollment successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 courseId:
 *                   type: string
 *                   format: uuid
 *                 studentId:
 *                   type: string
 *                   format: uuid
 *                 videos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Video'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Delete video with param validation
router.delete(
    '/:videoId/delete',
    validateRequest(schemas.videoId, 'params'),
    contentController.deleteVideo
);

// Get course videos with param validation
router.get(
    '/:courseId/videos',
    validateRequest(schemas.courseId, 'params'),
    contentController.getCourseVideos
);

// Enroll student with param and body validation
router.post(
    '/enroll/:courseId',
    validateRequest(schemas.courseId, 'params'),
    validateRequest(schemas.enrollment),
    contentController.enrollStudent
);

router.post(
    '/videos/upload',
    authorize('instructor', 'admin'),
    validateRequest(schemas.videoUpload),
    upload.single('video'),
    async (req, res, next) => {
        try {
            const video = await videoService.uploadVideo(
                req.file,
                req.body.courseId,
                req.user.id
            );

            res.status(201).json({
                status: 'success',
                message: 'Video upload initiated',
                data: {
                    videoId: video.id,
                    status: video.status,
                    estimatedProcessingTime: '5-10 minutes',
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
