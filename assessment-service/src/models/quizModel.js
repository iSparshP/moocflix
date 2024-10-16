// src/models/quizModel.js
const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    title: String,
    description: String,
    questions: Array,
    dueDate: Date,
    courseId: String,
});

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = { Quiz };
