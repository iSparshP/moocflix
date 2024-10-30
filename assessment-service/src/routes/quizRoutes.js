// src/routes/quizRoutes.js
const express = require('express');
const {
    createQuiz,
    getQuizzes,
    submitQuiz,
    getQuizResults,
    getQuizSubmissions,
    getSubmissionDetails,
    deleteQuiz,
    updateQuiz,
    gradeQuiz,
} = require('../controllers/quizController');
const {
    validateRequest,
    validateQuizCreation,
    validateQuizSubmission,
    validateGrading,
} = require('../middlewares/validation');
const submissionLimiter = require('../middlewares/rateLimiter');
const router = express.Router();

/**
 * @swagger
 * /api/v1/assessments/{courseId}/quiz/create:
 *   post:
 *     summary: Create a new quiz
 *     tags: [Quiz]
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
 *             $ref: '#/components/schemas/Quiz'
 *     responses:
 *       201:
 *         description: Quiz created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 quizId:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
    '/api/v1/assessments/:courseId/quiz/create',
    validateQuizCreation,
    validateRequest,
    createQuiz
);

/**
 * @swagger
 * /api/v1/assessments/{courseId}/quizzes:
 *   get:
 *     summary: Get all quizzes for a course
 *     tags: [Quiz]
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
 *         description: List of quizzes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Quiz'
 */
router.get(
    '/api/v1/assessments/:courseId/quizzes',
    validateRequest,
    getQuizzes
);

/**
 * @swagger
 * /api/v1/assessments/{courseId}/quiz/{quizId}/submit:
 *   post:
 *     summary: Submit a quiz attempt
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
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuizSubmission'
 *     responses:
 *       201:
 *         description: Quiz submitted successfully
 *       429:
 *         description: Too many submissions
 */
router.post(
    '/api/v1/assessments/:courseId/quiz/:quizId/submit',
    submissionLimiter,
    validateRequest,
    validateQuizSubmission,
    submitQuiz
);

/**
 * @swagger
 * /api/v1/assessments/{courseId}/quiz/{quizId}/results:
 *   get:
 *     summary: Get quiz results
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
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz results
 */
router.get(
    '/api/v1/assessments/:courseId/quiz/:quizId/results',
    validateRequest,
    getQuizResults
);

/**
 * @swagger
 * /api/v1/assessments/{courseId}/quiz/{quizId}/submissions:
 *   get:
 *     summary: Get all submissions for a quiz
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
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of submissions
 */
router.get(
    '/api/v1/assessments/:courseId/quiz/:quizId/submissions',
    validateRequest,
    getQuizSubmissions
);

/**
 * @swagger
 * /api/v1/assessments/{courseId}/quiz/{quizId}/submission/{submissionId}:
 *   get:
 *     summary: Get details of a specific submission
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
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Submission details
 */
router.get(
    '/api/v1/assessments/:courseId/quiz/:quizId/submission/:submissionId',
    validateRequest,
    getSubmissionDetails
);

/**
 * @swagger
 * /api/v1/assessments/{courseId}/quiz/{quizId}:
 *   delete:
 *     summary: Delete a quiz
 *     tags: [Quiz]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz deleted successfully
 *   put:
 *     summary: Update a quiz
 *     tags: [Quiz]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Quiz'
 *     responses:
 *       200:
 *         description: Quiz updated successfully
 */
router.delete(
    '/api/v1/assessments/:courseId/quiz/:quizId',
    validateRequest,
    deleteQuiz
);
router.put(
    '/api/v1/assessments/:courseId/quiz/:quizId',
    validateRequest,
    updateQuiz
);

/**
 * @swagger
 * /api/v1/assessments/{courseId}/quiz/{quizId}/grade:
 *   post:
 *     summary: Grade a quiz submission
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
 *         name: quizId
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
 *         description: Quiz graded successfully
 */
router.post(
    '/api/v1/assessments/:courseId/quiz/:quizId/grade',
    validateRequest,
    gradeQuiz
);

// Error handling
router.use(errorHandler);

module.exports = router;
