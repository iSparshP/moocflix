// src/services/kafkaHandler.js
const { send: sendMessage, consumeMessages } = require('../config/kafka');
const { Quiz } = require('../models/quizModel');
const { Assignment } = require('../models/assignmentModel');
const { Submission } = require('../models/submissionModel');
const { AssignmentSubmission } = require('../models/assignmentSubmissionModel');
const { validateUser } = require('./userService');
const { validateCourseId } = require('./courseService');
const { logger } = require('../config/logger');

const handleIncomingMessage = async (topic, message) => {
    try {
        switch (topic) {
            case 'User-Creation':
                await handleUserCreation(message);
                break;
            case 'User-Update':
                await handleUserUpdate(message);
                break;
            case 'Course-Creation':
                await handleCourseCreation(message);
                break;
            case 'Course-Update':
                await handleCourseUpdate(message);
                break;
            case 'Course-Deletion':
                await handleCourseDeletion(message);
                break;
            case 'Student-Enrolled':
                await handleStudentEnrollment(message);
                break;
            case 'Assessment-Creation':
                await handleAssessmentCreation(message);
                break;
            case 'Submission-Completed':
                await handleSubmissionCompleted(message);
                break;
            case 'Grading-Completed':
                await handleGradingCompleted(message);
                break;
            case 'Transcoding-Completed':
                await handleTranscodingCompleted(message);
                break;
            case 'AssignmentSubmitted':
                await handleAssignmentSubmission(message);
                break;
            default:
                logger.info(`Unhandled topic: ${topic}`);
        }
    } catch (error) {
        logger.error(`Error handling message for topic ${topic}:`, error);
        await sendMessage('assessment-dlq', {
            topic,
            message,
            error: error.message,
        });
    }
};

const handleUserCreation = async (message) => {
    const { userId, role } = message;
    if (role === 'instructor' || role === 'student') {
        logger.info(`New ${role} created with ID: ${userId}`);
    }
};

const handleUserUpdate = async (message) => {
    const { userId, updates } = message;
    const isValidUser = await validateUser(userId);
    if (isValidUser) {
        logger.info(`User ${userId} updated with:`, updates);
    }
};

const handleCourseCreation = async (message) => {
    const { courseId, instructorId } = message;
    const isValidInstructor = await validateUser(instructorId);
    if (isValidInstructor) {
        logger.info(
            `New course ${courseId} created by instructor ${instructorId}`
        );
    }
};

const handleCourseUpdate = async (message) => {
    const { courseId, updates } = message;
    const isValidCourse = await validateCourseId(courseId);
    if (isValidCourse) {
        logger.info(`Course ${courseId} updated with:`, updates);
    }
};

const handleCourseDeletion = async (message) => {
    const { courseId } = message;
    await Promise.all([
        Quiz.deleteMany({ courseId }),
        Assignment.deleteMany({ courseId }),
        Submission.deleteMany({ courseId }),
        AssignmentSubmission.deleteMany({ courseId }),
    ]);
    logger.info(`Course ${courseId} and all associated data deleted`);
};

const handleStudentEnrollment = async (message) => {
    const { courseId, studentId } = message;
    const [isValidCourse, isValidStudent] = await Promise.all([
        validateCourseId(courseId),
        validateUser(studentId),
    ]);

    if (isValidCourse && isValidStudent) {
        const quizzes = await Quiz.find({ courseId });
        const assignments = await Assignment.find({ courseId });
        await sendMessage('Assessment-Notification', {
            studentId,
            courseId,
            quizzes,
            assignments,
        });
    }
};

const handleAssessmentCreation = async (message) => {
    const { courseId, assessmentId, type } = message;
    logger.info(
        `New ${type} created for course ${courseId} with ID ${assessmentId}`
    );
};

const handleSubmissionCompleted = async (message) => {
    const { courseId, assessmentId, submissionId, studentId } = message;
    logger.info(
        `New submission ${submissionId} received for assessment ${assessmentId}`
    );
};

const handleGradingCompleted = async (message) => {
    const { assessmentId, submissionId, grade } = message;
    logger.info(
        `Grading completed for submission ${submissionId} with grade ${grade}`
    );
};

const handleTranscodingCompleted = async (message) => {
    const { courseId, contentId, url } = message;
    logger.info(
        `Content ${contentId} for course ${courseId} transcoded. URL: ${url}`
    );
};

const handleAssignmentSubmission = async (message) => {
    const { courseId, assignmentId, submissionId, studentId } = message;
    await sendMessage('Instructor-Notification', {
        type: 'new_submission',
        courseId,
        assignmentId,
        submissionId,
        studentId,
    });
};

const initializeKafkaConsumer = async () => {
    try {
        const topics = [
            'User-Creation',
            'User-Update',
            'Course-Creation',
            'Course-Update',
            'Course-Deletion',
            'Student-Enrolled',
            'Assessment-Creation',
            'Submission-Completed',
            'Grading-Completed',
            'Transcoding-Completed',
            'AssignmentSubmitted',
        ];

        await consumeMessages(topics, handleIncomingMessage);
        logger.info('Kafka consumer initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize Kafka consumer:', error);
        process.exit(1);
    }
};

module.exports = {
    initializeKafkaConsumer,
    handleIncomingMessage,
    // Export individual handlers for testing
    handlers: {
        handleUserCreation,
        handleUserUpdate,
        handleCourseCreation,
        handleCourseUpdate,
        handleCourseDeletion,
        handleStudentEnrollment,
        handleAssessmentCreation,
        handleSubmissionCompleted,
        handleGradingCompleted,
        handleTranscodingCompleted,
        handleAssignmentSubmission,
    },
};
