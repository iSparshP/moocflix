// src/services/quizService.js
const { Quiz } = require('../models/quizModel');
const { Submission } = require('../models/submissionModel');
const { NotFoundError, ValidationError } = require('../utils/errors');

exports.saveQuiz = async (courseId, quizData) => {
    const quiz = new Quiz({ ...quizData, courseId });
    await quiz.save();
    return quiz._id;
};

exports.fetchQuizzes = async (courseId) => {
    const quizzes = await Quiz.find({ courseId });
    if (!quizzes.length) {
        throw new NotFoundError('No quizzes found for this course');
    }
    return quizzes;
};

exports.submitQuizAnswers = async (courseId, quizId, submissionData) => {
    const quiz = await Quiz.findOne({ courseId, _id: quizId });
    if (!quiz) {
        throw new NotFoundError('Quiz not found');
    }

    if (!submissionData.responses?.length) {
        throw new ValidationError('Quiz submission must include responses');
    }

    const submission = new Submission({
        ...submissionData,
        courseId,
        quizId,
    });
    await submission.save();
    return submission._id;
};

exports.fetchQuizResults = async (courseId, quizId) => {
    return await Submission.find({ courseId, quizId });
};

exports.fetchQuizSubmissions = async (courseId, quizId) => {
    return await Submission.find({ courseId, quizId });
};

exports.fetchSubmissionDetails = async (courseId, quizId, submissionId) => {
    return await Submission.findOne({ courseId, quizId, _id: submissionId });
};

exports.removeQuiz = async (courseId, quizId) => {
    await Quiz.deleteOne({ courseId, _id: quizId });
};

exports.modifyQuiz = async (courseId, quizId, quizData) => {
    await Quiz.updateOne({ courseId, _id: quizId }, { $set: quizData });
};

exports.gradeQuizSubmission = async (quizId, submissionId, grade) => {
    const submission = await Submission.findById(submissionId);
    if (!submission) {
        throw new NotFoundError('Submission not found');
    }

    if (submission.quizId !== quizId) {
        throw new ValidationError('Submission does not match quiz ID');
    }

    await Submission.updateOne(
        { quizId, _id: submissionId },
        { $set: { grade, gradedAt: new Date() } }
    );
};
