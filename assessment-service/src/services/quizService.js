// src/services/quizService.js
const BaseService = require('./baseService');
const { Quiz } = require('../models/quizModel');
const { Submission } = require('../models/submissionModel');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { logger } = require('../config/logger');

class QuizService extends BaseService {
    static async saveQuiz(courseId, quizData) {
        return await this.handleServiceCall(async () => {
            const quiz = new Quiz({ ...quizData, courseId });
            await quiz.save();
            logger.info('Quiz created', { courseId, quizId: quiz._id });
            return quiz._id;
        }, 'Failed to create quiz');
    }

    static async fetchQuizzes(courseId) {
        return await this.handleServiceCall(async () => {
            const quizzes = await Quiz.find({ courseId });
            if (!quizzes.length) {
                throw new NotFoundError('No quizzes found for this course');
            }
            return quizzes;
        }, 'Failed to fetch quizzes');
    }

    static async submitQuizAnswers(courseId, quizId, submissionData) {
        return await this.handleServiceCall(async () => {
            const quiz = await Quiz.findOne({ courseId, _id: quizId });
            if (!quiz) {
                throw new NotFoundError('Quiz not found');
            }

            if (!submissionData.responses?.length) {
                throw new ValidationError(
                    'Quiz submission must include responses'
                );
            }

            const submission = new Submission({
                ...submissionData,
                courseId,
                quizId,
            });
            await submission.save();
            logger.info('Quiz submitted', {
                courseId,
                quizId,
                submissionId: submission._id,
            });
            return submission._id;
        }, 'Failed to submit quiz');
    }

    static async fetchQuizResults(courseId, quizId) {
        return await this.handleServiceCall(async () => {
            return await Submission.find({ courseId, quizId });
        }, 'Failed to fetch quiz results');
    }

    static async fetchQuizSubmissions(courseId, quizId) {
        return await this.handleServiceCall(async () => {
            return await Submission.find({ courseId, quizId });
        }, 'Failed to fetch quiz submissions');
    }

    static async fetchSubmissionDetails(courseId, quizId, submissionId) {
        return await this.handleServiceCall(async () => {
            return await Submission.findOne({
                courseId,
                quizId,
                _id: submissionId,
            });
        }, 'Failed to fetch submission details');
    }

    static async removeQuiz(courseId, quizId) {
        return await this.handleServiceCall(async () => {
            await Quiz.deleteOne({ courseId, _id: quizId });
        }, 'Failed to delete quiz');
    }

    static async modifyQuiz(courseId, quizId, quizData) {
        return await this.handleServiceCall(async () => {
            await Quiz.updateOne({ courseId, _id: quizId }, { $set: quizData });
        }, 'Failed to modify quiz');
    }

    static async gradeQuizSubmission(quizId, submissionId, grade) {
        return await this.handleServiceCall(async () => {
            const submission = await Submission.findById(submissionId);
            if (!submission) {
                throw new NotFoundError('Submission not found');
            }

            if (submission.quizId !== quizId) {
                throw new ValidationError('Submission does not match quiz ID');
            }

            submission.grade = grade;
            submission.gradedAt = new Date();
            await submission.save();

            return submission;
        }, 'Failed to grade quiz submission');
    }
}

module.exports = QuizService;
