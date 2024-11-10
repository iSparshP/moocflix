// src/controllers/quizController.js
const { BaseController } = require('./baseController');
const { validateQuiz } = require('../utils/validationSchemas');
const { logger } = require('../config/logger');
const { kafkaProducer } = require('../config/kafka');
const {
    saveQuiz,
    fetchQuizzes,
    submitQuizAnswers,
    fetchQuizResults,
    fetchQuizSubmissions,
    fetchSubmissionDetails,
    removeQuiz,
    modifyQuiz,
    gradeQuizSubmission,
} = require('../services/quizService');
const {
    notifySubmissionCompleted,
    notifyGradingCompleted,
    notifyStudents,
} = require('../services/notificationService');
const { validateCourseId } = require('../services/courseService');
const { ValidationError } = require('../utils/errorHandler');

class QuizController extends BaseController {
    static async createQuiz(req, res) {
        await this.handleRequest(req, res, async (req) => {
            const { courseId } = req.params;
            const quizData = req.body;

            const { error } = validateQuiz(quizData);
            if (error) {
                throw new ValidationError(error.details[0].message);
            }

            await validateCourseId(courseId);
            const quizId = await saveQuiz(courseId, quizData);
            await notifyStudents(courseId, quizId);

            return { quizId };
        });
    }

    static async getQuizzes(req, res) {
        await this.handleRequest(req, res, async (req) => {
            const { courseId } = req.params;

            await validateCourseId(courseId);
            const quizzes = await fetchQuizzes(courseId);

            return quizzes;
        });
    }

    static async submitQuiz(req, res, next) {
        await this.handleRequest(req, res, async (req) => {
            const { courseId, quizId } = req.params;
            const submissionData = req.body;

            const submissionId = await submitQuizAnswers(
                courseId,
                quizId,
                submissionData
            );
            await notifySubmissionCompleted(courseId, quizId, submissionId);

            return { submissionId };
        });
    }

    static async getQuizResults(req, res) {
        await this.handleRequest(req, res, async (req) => {
            const { courseId, quizId } = req.params;

            const results = await fetchQuizResults(courseId, quizId);

            return results;
        });
    }

    static async getQuizSubmissions(req, res) {
        await this.handleRequest(req, res, async (req) => {
            const { courseId, quizId } = req.params;

            const submissions = await fetchQuizSubmissions(courseId, quizId);

            return submissions;
        });
    }

    static async getSubmissionDetails(req, res) {
        await this.handleRequest(req, res, async (req) => {
            const { courseId, quizId, submissionId } = req.params;

            const submission = await fetchSubmissionDetails(
                courseId,
                quizId,
                submissionId
            );

            return submission;
        });
    }

    static async deleteQuiz(req, res) {
        await this.handleRequest(req, res, async (req) => {
            const { courseId, quizId } = req.params;

            await removeQuiz(courseId, quizId);

            return { message: 'Quiz deleted successfully' };
        });
    }

    static async updateQuiz(req, res) {
        await this.handleRequest(req, res, async (req) => {
            const { courseId, quizId } = req.params;
            const quizData = req.body;

            await modifyQuiz(courseId, quizId, quizData);

            return { message: 'Quiz updated successfully' };
        });
    }

    static async gradeQuiz(req, res) {
        await this.handleRequest(req, res, async (req) => {
            const { quizId } = req.params;
            const { submissionId, grade } = req.body;

            await gradeQuizSubmission(quizId, submissionId, grade);
            await notifyGradingCompleted(quizId, submissionId);

            return { message: 'Quiz graded successfully' };
        });
    }
}

module.exports = { QuizController };
