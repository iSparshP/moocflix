const express = require('express');
const {
    createAssignment,
    submitAssignment,
    getAssignmentResult,
    gradeAssignment,
    getAssignments,
    updateAssignment,
    deleteAssignment,
} = require('../controllers/assignmentController');

// Add validation to ensure handlers exist
const validateHandlers = () => {
    const handlers = {
        createAssignment,
        submitAssignment,
        getAssignmentResult,
        gradeAssignment,
        getAssignments,
        updateAssignment,
        deleteAssignment,
    };

    Object.entries(handlers).forEach(([name, handler]) => {
        if (!handler) {
            throw new Error(
                `Handler '${name}' is not defined in assignmentController`
            );
        }
    });
};

validateHandlers();

const {
    validateRequest,
    validateAssignmentCreation,
    validateAssignmentSubmission,
    validateGrading,
} = require('../middlewares/validation');
const {
    apiLimiter,
    writeLimiter,
    sensitiveOpLimiter,
    submissionLimiter,
} = require('../middlewares/rateLimiter');
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
    writeLimiter,
    validateAssignmentCreation,
    validateRequest,
    createAssignment ||
        ((req, res) =>
            res.status(500).json({ error: 'Handler not implemented' }))
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
    submitAssignment ||
        ((req, res) =>
            res.status(500).json({ error: 'Handler not implemented' }))
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
    apiLimiter,
    validateRequest,
    getAssignmentResult ||
        ((req, res) =>
            res.status(500).json({ error: 'Handler not implemented' }))
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
    sensitiveOpLimiter,
    validateGrading,
    validateRequest,
    gradeAssignment ||
        ((req, res) =>
            res.status(500).json({ error: 'Handler not implemented' }))
);

/**
 * @swagger
 * /api/v1/assessments/{courseId}/assignments:
 *   get:
 *     summary: Get all assignments for a course
 *     tags: [Assignment]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of assignments
 */
router.get(
    '/api/v1/assessments/:courseId/assignments',
    apiLimiter,
    validateRequest,
    getAssignments ||
        ((req, res) =>
            res.status(500).json({ error: 'Handler not implemented' }))
);

/**
 * @swagger
 * /api/v1/assessments/{courseId}/assignment/{assignmentId}:
 *   put:
 *     summary: Update an assignment
 *     tags: [Assignment]
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
 *             $ref: '#/components/schemas/Assignment'
 *     responses:
 *       200:
 *         description: Assignment updated successfully
 */
router.put(
    '/api/v1/assessments/:courseId/assignment/:assignmentId',
    writeLimiter,
    validateAssignmentCreation,
    validateRequest,
    updateAssignment ||
        ((req, res) =>
            res.status(500).json({ error: 'Handler not implemented' }))
);

/**
 * @swagger
 * /api/v1/assessments/{courseId}/assignment/{assignmentId}:
 *   delete:
 *     summary: Delete an assignment
 *     tags: [Assignment]
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
 *         description: Assignment deleted successfully
 */
router.delete(
    '/api/v1/assessments/:courseId/assignment/:assignmentId',
    writeLimiter,
    validateRequest,
    deleteAssignment ||
        ((req, res) =>
            res.status(500).json({ error: 'Handler not implemented' }))
);

module.exports = router;
