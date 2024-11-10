const Joi = require('joi');
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
        .withMessage('Invalid submission ID format'),
    grade: body('grade')
        .isFloat({ min: 0, max: 100 })
        .withMessage('Grade must be between 0 and 100'),
};

const quizSchema = Joi.object({
    title: Joi.string().required().trim(),
    description: Joi.string().optional(),
    questions: Joi.array()
        .items(
            Joi.object({
                questionText: Joi.string().required(),
                options: Joi.array().min(2).required(),
                correctAnswer: Joi.string().required(),
                points: Joi.number().min(0).default(1),
            })
        )
        .min(1)
        .required(),
    dueDate: Joi.date().greater('now').required(),
    duration: Joi.number().min(1).required(),
    courseId: Joi.string().required(),
});

const assignmentSchema = Joi.object({
    title: Joi.string().required().trim(),
    description: Joi.string().required(),
    dueDate: Joi.date().greater('now').required(),
    maxPoints: Joi.number().min(0).required(),
    submissionType: Joi.string().valid('file', 'url', 'text').required(),
    attachments: Joi.array().items(
        Joi.object({
            name: Joi.string().required(),
            url: Joi.string().uri().required(),
            type: Joi.string().required(),
        })
    ),
});

const submissionSchema = Joi.object({
    studentId: Joi.string().required(),
    answers: Joi.array()
        .items(
            Joi.object({
                questionId: Joi.string().required(),
                answer: Joi.string().required(),
            })
        )
        .required(),
});

const validateQuiz = (quiz) => quizSchema.validate(quiz);
const validateAssignment = (assignment) =>
    assignmentSchema.validate(assignment);
const validateSubmission = (submission) =>
    submissionSchema.validate(submission);

module.exports = {
    validateQuiz,
    validateAssignment,
    validateSubmission,
    commonValidations,
    submissionValidations,
};
