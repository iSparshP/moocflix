// src/controllers/assignmentController.js
const {
    saveAssignment,
    submitAssignmentAnswers,
    fetchAssignmentResult,
} = require('../services/assignmentService');
const {
    notifyAssignmentSubmissionCompleted,
    notifyAssignmentGradingCompleted,
} = require('../services/notificationService');

exports.createAssignment = async (req, res) => {
    const { courseId } = req.params;
    const assignmentData = req.body;

    try {
        // Save assignment data
        const assignmentId = await saveAssignment(courseId, assignmentData);
        res.status(201).json({
            message: 'Assignment created successfully',
            assignmentId,
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};

exports.submitAssignment = async (req, res) => {
    const { assignmentId } = req.params;
    const submissionData = req.body;

    try {
        // Submit assignment answers
        const submissionId = await submitAssignmentAnswers(
            assignmentId,
            submissionData
        );

        // Notify submission completed
        await notifyAssignmentSubmissionCompleted(
            req.params.courseId,
            assignmentId,
            submissionId
        );

        res.status(201).json({
            message: 'Assignment submitted successfully',
            submissionId,
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};

exports.getAssignmentResult = async (req, res) => {
    const { assignmentId } = req.params;

    try {
        // Fetch assignment result
        const result = await fetchAssignmentResult(assignmentId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};

exports.gradeAssignment = async (req, res) => {
    const { assignmentId } = req.params;
    const { submissionId, grade } = req.body;

    try {
        // Grade assignment submission
        await gradeAssignmentSubmission(assignmentId, submissionId, grade);

        // Notify grading completed
        await notifyAssignmentGradingCompleted(assignmentId, submissionId);

        res.status(200).json({ message: 'Assignment graded successfully' });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};
