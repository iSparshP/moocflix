// src/services/quizService.js
const { Quiz } = require('../models/quizModel');

exports.saveQuiz = async (courseId, quizData) => {
    const quiz = new Quiz({ ...quizData, courseId });
    await quiz.save();
    return quiz._id;
};

exports.fetchQuizzes = async (courseId) => {
    return await Quiz.find({ courseId });
};

exports.submitQuizAnswers = async (courseId, quizId, submissionData) => {
    const submission = new Submission({ ...submissionData, courseId, quizId });
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
    await Submission.updateOne(
        { quizId, _id: submissionId },
        { $set: { grade } }
    );
};
