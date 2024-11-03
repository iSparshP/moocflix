const { body, param, validationResult } = require('express-validator');
const {
    commonValidations,
    submissionValidations,
} = require('../utils/validationSchemas');

// Generic request validator
exports.validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Quiz validation rules
exports.validateQuizCreation = [
    body('title')
        .notEmpty()
        .trim()
        .isString()
        .withMessage('Quiz title is required'),
    body('description').optional().isString(),
    body('questions')
        .isArray()
        .notEmpty()
        .withMessage('Quiz must have at least one question'),
    body('questions.*.questionText')
        .notEmpty()
        .isString()
        .withMessage('Question text is required'),
    body('questions.*.options')
        .isArray({ min: 2 })
        .withMessage('Question must have at least 2 options'),
    body('questions.*.correctAnswer')
        .notEmpty()
        .withMessage('Correct answer is required'),
    body('questions.*.points')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Points must be a positive integer'),
    body('dueDate')
        .optional()
        .isISO8601()
        .withMessage('Due date must be a valid date'),
    body('duration')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Duration must be a positive integer'),
];

exports.validateQuizSubmission = [
    commonValidations.courseId,
    commonValidations.studentId,
    body('responses').isArray().withMessage('Responses must be an array'),
    body('responses.*.questionId')
        .isString()
        .withMessage('Question ID is required'),
    body('responses.*.answer').exists().withMessage('Answer is required'),
];

// Assignment validation rules
exports.validateAssignmentCreation = [
    body('title')
        .notEmpty()
        .trim()
        .isString()
        .withMessage('Assignment title is required'),
    body('description')
        .notEmpty()
        .isString()
        .withMessage('Assignment description is required'),
    body('dueDate').isISO8601().withMessage('Due date must be a valid date'),
    param('courseId').isMongoId().withMessage('Invalid course ID format'),
];

exports.validateAssignmentSubmission = [
    param('assignmentId')
        .isMongoId()
        .withMessage('Invalid assignment ID format'),
    param('courseId').isMongoId().withMessage('Invalid course ID format'),
    body('studentId')
        .notEmpty()
        .isString()
        .withMessage('Student ID is required'),
    body('submissionUrl')
        .notEmpty()
        .isURL()
        .withMessage('Valid submission URL is required'),
];

exports.validateGrading = [
    commonValidations.courseId,
    submissionValidations.submissionId,
    submissionValidations.grade,
];
