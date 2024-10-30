// src/models/quizModel.js
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    questionText: String,
    options: [String],
    correctAnswer: String,
    points: { type: Number, default: 1 },
});

const quizSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    questions: [questionSchema],
    dueDate: Date,
    courseId: { type: String, required: true },
    duration: Number, // in minutes
    totalPoints: Number,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Calculate total points before saving
quizSchema.pre('save', function (next) {
    this.totalPoints = this.questions.reduce((sum, q) => sum + q.points, 0);
    this.updatedAt = Date.now();
    next();
});

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = { Quiz };
