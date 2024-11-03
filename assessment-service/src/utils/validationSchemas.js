const { body, param } = require('express-validator');

const commonValidations = {
    courseId: param('courseId')
        .isMongoId()
        .withMessage('Invalid course ID format'),
    studentId: body('studentId')
        .notEmpty()
        .isString()
        .withMessage('Student ID is required'),
};

const submissionValidations = {
    submissionId: body('submissionId')
        .isMongoId()
        .withMessage('Invalid submission ID'),
    grade: body('grade')
        .isFloat({ min: 0, max: 100 })
        .withMessage('Grade must be between 0 and 100'),
};

module.exports = {
    commonValidations,
    submissionValidations,
};
