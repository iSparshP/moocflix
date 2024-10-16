// src/models/submissionModel.js
const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    courseId: String,
    quizId: String,
    studentId: String,
    answers: Array,
    submittedAt: { type: Date, default: Date.now },
});

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = { Submission };
