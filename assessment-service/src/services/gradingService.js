// src/services/gradingService.js
const { Quiz } = require('../models/quizModel');
const { Submission } = require('../models/submissionModel');

exports.autoGradeQuiz = async (quizId, submissionId, answers) => {
    try {
        // Fetch quiz and submission
        const [quiz, submission] = await Promise.all([
            Quiz.findById(quizId),
            Submission.findById(submissionId),
        ]);

        if (!quiz || !submission) {
            throw new Error('Quiz or submission not found');
        }

        // Calculate score
        let score = 0;
        const totalQuestions = quiz.questions.length;

        submission.answers.forEach((answer, index) => {
            if (
                quiz.questions[index] &&
                quiz.questions[index].correctAnswer === answer.answer
            ) {
                score++;
            }
        });

        // Calculate percentage
        const grade = (score / totalQuestions) * 100;

        // Update submission with grade
        await Submission.updateOne({ _id: submissionId }, { $set: { grade } });

        return grade;
    } catch (error) {
        throw new Error(`Auto-grading failed: ${error.message}`);
    }
};

exports.validateAnswers = (questions, answers) => {
    if (!Array.isArray(questions) || !Array.isArray(answers)) {
        return false;
    }

    return answers.every((answer) =>
        questions.some((q) => q.id === answer.questionId)
    );
};
