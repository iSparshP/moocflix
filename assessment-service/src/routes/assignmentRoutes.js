// src/routes/assignmentRoutes.js
const express = require('express');
const {
    createAssignment,
    submitAssignment,
    getAssignmentResult,
    gradeAssignment,
} = require('../controllers/assignmentController');
const router = express.Router();

router.post('/api/v1/assignments/:courseId/create', createAssignment);
router.post('/api/v1/assignments/:assignmentId/submit', submitAssignment);
router.get('/api/v1/assignments/:assignmentId/result', getAssignmentResult);
router.post('/api/v1/assignments/:assignmentId/grade', gradeAssignment);

module.exports = router;
