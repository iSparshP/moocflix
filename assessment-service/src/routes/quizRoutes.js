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
const {
    apiLimiter,
    writeLimiter,
    sensitiveOpLimiter,
    submissionLimiter,
} = require('../middlewares/rateLimiter');
const { ROUTES } = require('../config/constants');
const router = express.Router();

/**
 * @swagger
 * {ROUTES.QUIZ.CREATE}:
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
    ROUTES.QUIZ.CREATE,
    writeLimiter,
    validateQuizCreation,
    validateRequest,
    createQuiz
);

/**
 * @swagger
 * {ROUTES.QUIZ.LIST}:
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
router.get(ROUTES.QUIZ.LIST, apiLimiter, validateRequest, getQuizzes);

/**
 * @swagger
 * {ROUTES.QUIZ.SUBMIT}:
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
    ROUTES.QUIZ.SUBMIT,
    submissionLimiter,
    validateRequest,
    validateQuizSubmission,
    submitQuiz
);

/**
 * @swagger
 * {ROUTES.QUIZ.RESULTS}:
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
router.get(ROUTES.QUIZ.RESULTS, apiLimiter, validateRequest, getQuizResults);

/**
 * @swagger
 * {ROUTES.QUIZ.SUBMISSIONS}:
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
    ROUTES.QUIZ.SUBMISSIONS,
    apiLimiter,
    validateRequest,
    getQuizSubmissions
);

/**
 * @swagger
 * {ROUTES.QUIZ.SUBMISSION_DETAIL}:
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
    ROUTES.QUIZ.SUBMISSION_DETAIL,
    apiLimiter,
    validateRequest,
    getSubmissionDetails
);

/**
 * @swagger
 * {ROUTES.QUIZ.BASE}:
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
router.delete(ROUTES.QUIZ.BASE, writeLimiter, validateRequest, deleteQuiz);
router.put(ROUTES.QUIZ.BASE, writeLimiter, validateRequest, updateQuiz);

/**
 * @swagger
 * {ROUTES.QUIZ.GRADE}:
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
    ROUTES.QUIZ.GRADE,
    sensitiveOpLimiter,
    validateRequest,
    validateGrading,
    gradeQuiz
);

module.exports = router;
