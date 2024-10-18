// src/services/notificationService.js
const kafka = require('../../configure/kafka');

exports.notifyStudents = async (courseId, quizId) => {
    const message = {
        topic: 'Assessment-Creation',
        messages: [{ value: JSON.stringify({ courseId, quizId }) }],
    };
    await kafka.send(message);
};

exports.notifySubmissionCompleted = async (courseId, quizId, submissionId) => {
    const message = {
        topic: 'Submission-Completed',
        messages: [
            { value: JSON.stringify({ courseId, quizId, submissionId }) },
        ],
    };
    await kafka.send(message);
};

exports.notifyGradingCompleted = async (quizId, submissionId) => {
    const message = {
        topic: 'Grading-Completed',
        messages: [{ value: JSON.stringify({ quizId, submissionId }) }],
    };
    await kafka.send(message);
};

exports.notifyAssignmentSubmissionCompleted = async (
    courseId,
    assignmentId,
    submissionId
) => {
    const message = {
        topic: 'Submission-Completed',
        messages: [
            { value: JSON.stringify({ courseId, assignmentId, submissionId }) },
        ],
    };
    await kafka.send(message);
};

exports.notifyAssignmentGradingCompleted = async (
    assignmentId,
    submissionId
) => {
    const message = {
        topic: 'Grading-Completed',
        messages: [{ value: JSON.stringify({ assignmentId, submissionId }) }],
    };
    await kafka.send(message);
};
