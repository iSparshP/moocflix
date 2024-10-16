// src/controllers/assignmentController.js
const { validateCourseId } = require('../services/courseService');
const {
    saveAssignment,
    submitAssignmentAnswers,
    fetchAssignmentResult,
} = require('../services/assignmentService');
const { notifyStudents } = require('../services/notificationService');

exports.createAssignment = async (req, res) => {
    const { courseId } = req.params;
    const assignmentData = req.body;

    try {
        // Validate courseId
        const isValidCourse = await validateCourseId(courseId);
        if (!isValidCourse) {
            return res.status(400).json({ message: 'Invalid course ID' });
        }

        // Save assignment data
        const assignmentId = await saveAssignment(courseId, assignmentData);

        // Notify students
        await notifyStudents(courseId, assignmentId);

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
        const result = await submitAssignmentAnswers(
            assignmentId,
            submissionData
        );

        res.status(200).json({
            message: 'Assignment submitted successfully',
            result,
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
