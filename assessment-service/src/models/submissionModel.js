// src/models/submissionModel.js
const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    courseId: { type: String, required: true },
    quizId: { type: String, required: true },
    studentId: { type: String, required: true },
    answers: [
        {
            questionId: String,
            answer: String,
            isCorrect: Boolean,
            points: Number,
        },
    ],
    grade: Number,
    submittedAt: { type: Date, default: Date.now },
    gradedAt: Date,
});

// Index for faster lookups
submissionSchema.index({ courseId: 1, quizId: 1, studentId: 1 });

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = { Submission };
