// src/services/notificationService.js
const { send } = require('../config/kafka');
const { logger } = require('../config/logger');

exports.notifyStudents = async (courseId, assignmentId) => {
    try {
        await send({
            topic: 'Assessment-Creation',
            messages: [{ value: JSON.stringify({ courseId, assignmentId }) }],
        });
        logger.info('Students notified of new assessment', {
            courseId,
            assignmentId,
        });
    } catch (error) {
        logger.error('Failed to notify students', {
            error: error.message,
            courseId,
            assignmentId,
        });
        throw error;
    }
};

exports.notifySubmissionCompleted = async (courseId, quizId, submissionId) => {
    try {
        await send({
            topic: 'Submission-Completed',
            messages: [
                { value: JSON.stringify({ courseId, quizId, submissionId }) },
            ],
        });
        logger.info('Submission completion notification sent', {
            courseId,
            quizId,
            submissionId,
        });
    } catch (error) {
        logger.error('Failed to notify submission completion', {
            error: error.message,
        });
        throw error;
    }
};

exports.notifyGradingCompleted = async (quizId, submissionId) => {
    const message = {
        topic: 'Grading-Completed',
        messages: [{ value: JSON.stringify({ quizId, submissionId }) }],
    };
    try {
        await send(message);
        logger.info('Grading completion notification sent', {
            quizId,
            submissionId,
        });
    } catch (error) {
        logger.error('Failed to notify grading completion', {
            error: error.message,
        });
        throw error;
    }
};

exports.notifyAssignmentSubmissionCompleted = async (
    courseId,
    assignmentId,
    submissionId
) => {
    const message = {
        topic: 'AssignmentSubmitted',
        messages: [
            { value: JSON.stringify({ courseId, assignmentId, submissionId }) },
        ],
    };
    try {
        await send(message);
        logger.info('Assignment submission completion notification sent', {
            courseId,
            assignmentId,
            submissionId,
        });
    } catch (error) {
        logger.error('Failed to notify assignment submission completion', {
            error: error.message,
        });
        throw error;
    }
};

exports.notifyAssignmentGradingCompleted = async (
    assignmentId,
    submissionId
) => {
    const message = {
        topic: 'Grading-Completed',
        messages: [{ value: JSON.stringify({ assignmentId, submissionId }) }],
    };
    try {
        await send(message);
        logger.info('Assignment grading completion notification sent', {
            assignmentId,
            submissionId,
        });
    } catch (error) {
        logger.error('Failed to notify assignment grading completion', {
            error: error.message,
        });
        throw error;
    }
};
