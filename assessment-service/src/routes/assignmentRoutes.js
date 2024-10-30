const express = require('express');
const {
    createAssignment,
    submitAssignment,
    getAssignmentResult,
    gradeAssignment,
} = require('../controllers/assignmentController');
const {
    validateRequest,
    validateAssignmentCreation,
    validateAssignmentSubmission,
    validateGrading,
} = require('../middlewares/validation');
const submissionLimiter = require('../middlewares/rateLimiter');
const router = express.Router();

/**
 * @swagger
 * /api/v1/assessments/{courseId}/assignment/create:
 *   post:
 *     summary: Create a new assignment
 *     tags: [Assignment]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Assignment'
 *     responses:
 *       201:
 *         description: Assignment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 assignmentId:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
    '/api/v1/assessments/:courseId/assignment/create',
    validateAssignmentCreation,
    validateRequest,
    createAssignment
);

/**
 * @swagger
 * /api/v1/assessments/{courseId}/assignment/{assignmentId}/submit:
 *   post:
 *     summary: Submit an assignment
 *     tags: [Submissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignmentSubmission'
 *     responses:
 *       201:
 *         description: Assignment submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 submissionId:
 *                   type: string
 *       429:
 *         description: Too many submissions
 */
router.post(
    '/api/v1/assessments/:courseId/assignment/:assignmentId/submit',
    submissionLimiter,
    validateAssignmentSubmission,
    validateRequest,
    submitAssignment
);

/**
 * @swagger
 * /api/v1/assessments/{courseId}/assignment/{assignmentId}/result:
 *   get:
 *     summary: Get assignment result
 *     tags: [Submissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assignment result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 grade:
 *                   type: number
 *                 submittedAt:
 *                   type: string
 *                   format: date-time
 */
router.get(
    '/api/v1/assessments/:courseId/assignment/:assignmentId/result',
    validateRequest,
    getAssignmentResult
);

/**
 * @swagger
 * /api/v1/assessments/{courseId}/assignment/{assignmentId}/grade:
 *   post:
 *     summary: Grade an assignment submission
 *     tags: [Grading]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - submissionId
 *               - grade
 *             properties:
 *               submissionId:
 *                 type: string
 *               grade:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Assignment graded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
    '/api/v1/assessments/:courseId/assignment/:assignmentId/grade',
    validateGrading,
    validateRequest,
    gradeAssignment
);

// Error handling
router.use(errorHandler);

module.exports = router;
