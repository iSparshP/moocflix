// src/utils/kafkaValidator.js
const { ValidationError } = require('./errors');

// Base validation helpers
const isValidId = (id) => id && typeof id === 'string' && id.trim().length > 0;
const isValidRole = (role) => ['student', 'instructor'].includes(role);
const isValidNumber = (num) =>
    typeof num === 'number' && !isNaN(num) && num >= 0;
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidString = (str) =>
    str && typeof str === 'string' && str.trim().length > 0;
const isValidObject = (obj) =>
    obj && typeof obj === 'object' && !Array.isArray(obj);

// Message validators
const validateBaseMessage = (message) => {
    if (!isValidObject(message)) {
        throw new ValidationError('Invalid message format');
    }
};

const validateCourseMessage = (message) => {
    validateBaseMessage(message);
    if (!isValidId(message.courseId)) {
        throw new ValidationError('Invalid courseId');
    }
};

const validateModuleMessage = (message) => {
    validateCourseMessage(message);
    if (!isValidId(message.moduleId)) {
        throw new ValidationError('Invalid moduleId');
    }
};

const validateAssessmentMessage = (message) => {
    validateModuleMessage(message);
    if (!isValidId(message.assessmentId)) {
        throw new ValidationError('Invalid assessmentId');
    }
};

const validateStudentMessage = (message) => {
    validateAssessmentMessage(message);
    if (!isValidId(message.studentId)) {
        throw new ValidationError('Invalid studentId');
    }
};

// Specific message validators
const validators = {
    userCreation: (message) => {
        validateBaseMessage(message);
        if (!isValidId(message.userId) || !isValidRole(message.role)) {
            throw new ValidationError('Invalid user creation message');
        }
    },

    userUpdate: (message) => {
        validateBaseMessage(message);
        if (
            !isValidId(message.userId) ||
            !isValidRole(message.role) ||
            !isValidString(message.name) ||
            !isValidEmail(message.email)
        ) {
            throw new ValidationError('Invalid user update message');
        }
    },

    assessmentCreation: (message) => {
        validateModuleMessage(message);
        if (
            !isValidId(message.assessmentId) ||
            !isValidObject(message.assessmentData)
        ) {
            throw new ValidationError('Invalid assessment creation message');
        }
    },

    submissionCompleted: (message) => {
        validateStudentMessage(message);
        if (message.metadata && !isValidObject(message.metadata)) {
            throw new ValidationError('Invalid submission metadata');
        }
    },

    gradingCompleted: (message) => {
        validateStudentMessage(message);
        if (
            !isValidId(message.gradedBy) ||
            !isValidNumber(message.score) ||
            message.score > 100
        ) {
            throw new ValidationError('Invalid grading message');
        }
    },

    transcodingCompleted: (message) => {
        validateModuleMessage(message);
        if (
            !isValidString(message.transcodedUrl) ||
            !validateVideoMetadata(message)
        ) {
            throw new ValidationError('Invalid transcoding message');
        }
    },
};

const validateVideoMetadata = (message) => {
    return (
        isValidNumber(message.duration) &&
        isValidString(message.format) &&
        isValidString(message.quality) &&
        isValidNumber(message.size) &&
        message.duration > 0 &&
        message.size > 0
    );
};

const validateKafkaMessage = (type, message) => {
    if (!validators[type]) {
        throw new ValidationError(`Unknown message type: ${type}`);
    }
    return validators[type](message);
};

module.exports = {
    validateKafkaMessage,
    validators,
    validateBaseMessage,
    validateCourseMessage,
    validateModuleMessage,
    validateAssessmentMessage,
    validateStudentMessage,
    validateVideoMetadata,
    // Helper functions
    isValidId,
    isValidRole,
    isValidNumber,
    isValidEmail,
    isValidString,
    isValidObject,
};
