// src/controllers/quizController.js
const { validateCourseId } = require('../services/courseService');
const { saveQuiz } = require('../services/quizService');
const { notifyStudents } = require('../services/notificationService');

exports.createQuiz = async (req, res) => {
    const { courseId } = req.params;
    const quizData = req.body;

    try {
        // Validate courseId
        const isValidCourse = await validateCourseId(courseId);
        if (!isValidCourse) {
            return res.status(400).json({ message: 'Invalid course ID' });
        }

        // Save quiz data
        const quizId = await saveQuiz(courseId, quizData);

        // Notify students
        await notifyStudents(courseId, quizId);

        res.status(201).json({ message: 'Quiz created successfully', quizId });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};

exports.getQuizzes = async (req, res) => {
    const { courseId } = req.params;

    try {
        // Validate courseId
        const isValidCourse = await validateCourseId(courseId);
        if (!isValidCourse) {
            return res.status(400).json({ message: 'Invalid course ID' });
        }

        // Fetch quizzes
        const quizzes = await fetchQuizzes(courseId);
        res.status(200).json(quizzes);
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};

exports.submitQuiz = async (req, res) => {
    const { courseId, quizId } = req.params;
    const submissionData = req.body;

    try {
        // Validate courseId
        const isValidCourse = await validateCourseId(courseId);
        if (!isValidCourse) {
            return res.status(400).json({ message: 'Invalid course ID' });
        }

        // Submit quiz answers
        const result = await submitQuizAnswers(
            courseId,
            quizId,
            submissionData
        );

        res.status(200).json({
            message: 'Quiz submitted successfully',
            result,
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};

exports.getQuizResults = async (req, res) => {
    const { courseId, quizId } = req.params;

    try {
        // Validate courseId
        const isValidCourse = await validateCourseId(courseId);
        if (!isValidCourse) {
            return res.status(400).json({ message: 'Invalid course ID' });
        }

        // Fetch quiz results
        const results = await fetchQuizResults(courseId, quizId);
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};

exports.getQuizSubmissions = async (req, res) => {
    const { courseId, quizId } = req.params;

    try {
        // Validate courseId
        const isValidCourse = await validateCourseId(courseId);
        if (!isValidCourse) {
            return res.status(400).json({ message: 'Invalid course ID' });
        }

        // Fetch quiz submissions
        const submissions = await fetchQuizSubmissions(courseId, quizId);
        res.status(200).json(submissions);
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};

exports.getSubmissionDetails = async (req, res) => {
    const { courseId, quizId, submissionId } = req.params;

    try {
        // Validate courseId
        const isValidCourse = await validateCourseId(courseId);
        if (!isValidCourse) {
            return res.status(400).json({ message: 'Invalid course ID' });
        }

        // Fetch submission details
        const submission = await fetchSubmissionDetails(
            courseId,
            quizId,
            submissionId
        );
        res.status(200).json(submission);
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};

exports.deleteQuiz = async (req, res) => {
    const { courseId, quizId } = req.params;

    try {
        // Validate courseId
        const isValidCourse = await validateCourseId(courseId);
        if (!isValidCourse) {
            return res.status(400).json({ message: 'Invalid course ID' });
        }

        // Remove quiz
        await removeQuiz(courseId, quizId);
        res.status(200).json({ message: 'Quiz deleted successfully' });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};

exports.updateQuiz = async (req, res) => {
    const { courseId, quizId } = req.params;
    const quizData = req.body;

    try {
        // Validate courseId
        const isValidCourse = await validateCourseId(courseId);
        if (!isValidCourse) {
            return res.status(400).json({ message: 'Invalid course ID' });
        }

        // Update quiz data
        await modifyQuiz(courseId, quizId, quizData);
        res.status(200).json({ message: 'Quiz updated successfully' });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};

exports.gradeQuiz = async (req, res) => {
    const { quizId } = req.params;
    const { submissionId, grade } = req.body;

    try {
        // Grade quiz submission
        await gradeQuizSubmission(quizId, submissionId, grade);
        res.status(200).json({ message: 'Quiz graded successfully' });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};
