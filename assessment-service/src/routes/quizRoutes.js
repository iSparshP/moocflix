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
const router = express.Router();

router.post('/api/v1/assessments/:courseId/quiz/create', createQuiz);
router.get('/api/v1/assessments/:courseId/quizzes', getQuizzes);
router.post('/api/v1/assessments/:courseId/quiz/:quizId/submit', submitQuiz);
router.get(
    '/api/v1/assessments/:courseId/quiz/:quizId/results',
    getQuizResults
);
router.get(
    '/api/v1/assessments/:courseId/quiz/:quizId/submissions',
    getQuizSubmissions
);
router.get(
    '/api/v1/assessments/:courseId/quiz/:quizId/submission/:submissionId',
    getSubmissionDetails
);
router.delete('/api/v1/assessments/:courseId/quiz/:quizId', deleteQuiz);
router.put('/api/v1/assessments/:courseId/quiz/:quizId', updateQuiz);
router.post('/api/v1/assessments/:quizId/grade', gradeQuiz);

module.exports = router;
