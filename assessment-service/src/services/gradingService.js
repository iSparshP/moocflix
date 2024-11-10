// src/services/gradingService.js
const BaseService = require('./baseService');
const { Quiz } = require('../models/quizModel');
const { Submission } = require('../models/submissionModel');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { logger } = require('../config/logger');

class GradingService extends BaseService {
    static async autoGradeQuiz(quizId, submissionId, answers) {
        return await this.handleServiceCall(async () => {
            const [quiz, submission] = await Promise.all([
                Quiz.findById(quizId),
                Submission.findById(submissionId),
            ]);

            if (!quiz || !submission) {
                throw new NotFoundError('Quiz or submission not found');
            }

            let score = 0;
            const totalQuestions = quiz.questions.length;
            const gradedAnswers = submission.answers.map((answer) => {
                const question = quiz.questions.find(
                    (q) => q._id.toString() === answer.questionId
                );
                if (!question) return answer;

                const isCorrect = question.correctAnswer === answer.answer;
                score += isCorrect ? question.points : 0;
                return {
                    ...answer,
                    isCorrect,
                    points: isCorrect ? question.points : 0,
                };
            });

            const grade = (score / quiz.totalPoints) * 100;
            submission.answers = gradedAnswers;
            submission.grade = grade;
            submission.status = 'graded';
            submission.gradedAt = new Date();
            await submission.save();

            logger.info('Quiz auto-graded', { quizId, submissionId, grade });
            return grade;
        }, 'Auto-grading failed');
    }

    static validateAnswers(questions, answers) {
        return this.handleServiceCall(() => {
            if (!Array.isArray(questions) || !Array.isArray(answers)) {
                throw new ValidationError(
                    'Invalid questions or answers format'
                );
            }

            return answers.every((answer) =>
                questions.some((q) => q.id === answer.questionId)
            );
        }, 'Answer validation failed');
    }
}

module.exports = GradingService;
