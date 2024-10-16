// src/routes/assignmentRoutes.js
const express = require('express');
const {
    createAssignment,
    submitAssignment,
    getAssignmentResult,
} = require('../controllers/assignmentController');
const router = express.Router();

router.post('/api/v1/assignments/:courseId/create', createAssignment);
router.post('/api/v1/assignments/:assignmentId/submit', submitAssignment);
router.get('/api/v1/assignments/:assignmentId/result', getAssignmentResult);

module.exports = router;
